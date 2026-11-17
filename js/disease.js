import { initAppShell, saveFarmingHistory, showToast } from './shell.js';
import { db, isConfigured, addDoc, collection, serverTimestamp } from './firebase-client.js';
import { getLang, t } from './translations.js';

const ctx = await initAppShell('disease', 'disease_title');

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('leafFileInput');
const previewImg = document.getElementById('leafPreview');
const analyzeBtn = document.getElementById('analyzeBtn');
const demoBtn = document.getElementById('demoAnalyzeBtn');
const statusBox = document.getElementById('diseaseStatus');
const resultBox = document.getElementById('diseaseResult');

let selectedBase64 = '';
let selectedMime = '';
let lastDiagnosis = null;

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    return showToast('Please upload a valid JPG or PNG image.', 'error');
  }

  selectedMime = file.type;

  const reader = new FileReader();

  reader.onload = e => {
    const dataUrl = e.target.result;

    previewImg.src = dataUrl;
    previewImg.classList.remove('hidden');

    selectedBase64 = dataUrl.split(',')[1];
    analyzeBtn.disabled = false;
  };

  reader.readAsDataURL(file);
}

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
  handleFile(e.target.files[0]);
});

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFile(e.dataTransfer.files[0]);
});

function renderDiagnosis(diag, modeLabel, isDemo) {
  const elements = {
    badge: document.getElementById('diagModeBadge'),
    name: document.getElementById('diagName'),
    confidence: document.getElementById('diagConfidence'),
    symptoms: document.getElementById('diagSymptoms'),
    prevention: document.getElementById('diagPrevention'),
    disclaimer: document.getElementById('diagDisclaimer')
  };

  for (const [name, element] of Object.entries(elements)) {
    if (!element) {
      throw new Error(`Missing HTML element: ${name}`);
    }
  }

  lastDiagnosis = { ...diag, mode: modeLabel };

  elements.badge.textContent = modeLabel;
  elements.badge.className =
    `badge ${isDemo ? 'badge-amber' : 'badge-green'}`;

  elements.name.textContent = diag.diseaseName || 'Unclear Result';

  elements.confidence.textContent =
    `Confidence: ${diag.confidence || 'Low'}`;

  elements.symptoms.replaceChildren(
    ...(diag.symptoms || []).map(s => {
      const li = document.createElement('li');
      li.textContent = s;
      return li;
    })
  );

  elements.prevention.replaceChildren(
    ...(diag.preventiveMeasures || []).map(p => {
      const li = document.createElement('li');
      li.textContent = p;
      return li;
    })
  );

  elements.disclaimer.textContent =
    diag.disclaimer ||
    'Consult a local agricultural expert before applying treatments.';

  resultBox.classList.remove('hidden');
}
analyzeBtn.addEventListener('click', async () => {
  if (!selectedBase64) return;

  const cropName = document.getElementById('diseaseCropInput').value.trim();

  analyzeBtn.disabled = true;

  statusBox.innerHTML = `<span class="spinner"></span> ${t('loading')}`;
  statusBox.className = 'alert alert-info';
  statusBox.classList.remove('hidden');

  demoBtn.classList.add('hidden');

  try {
    const res = await fetch('/api/analyze-disease', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        imageBase64: selectedBase64,
        mimeType: selectedMime,
        cropName,
        language: getLang()
      })
    });

    const data = await res.json();
    console.log("GEMINI AI RESPONSE:", data);

    if (!res.ok || !data.result) {
      throw new Error(data.error || 'AI backend endpoint unavailable.');
    }

    statusBox.classList.add('hidden');

    renderDiagnosis(
      data.result,
      `Live Gemini Vision (${data.model})`,
      false
    );

  } catch (err) {
    statusBox.innerHTML =
      `<strong>Live AI Unavailable:</strong> ${err.message} — You can test the workflow using the clearly labeled Demonstration Mode button below.`;

    statusBox.className = 'alert alert-warning';

    demoBtn.classList.remove('hidden');

  } finally {
    analyzeBtn.disabled = false;
  }
});

demoBtn.addEventListener('click', () => {
  const crop =
    document.getElementById('diseaseCropInput').value.trim() ||
    'Tomato / Paddy';

  const kn = getLang() === 'kn';

  renderDiagnosis(
    {
      diseaseName: kn
        ? `${crop} ಎಲೆ ಚುಕ್ಕೆ ರೋಗ (ಡೆಮೊ ಮಾದರಿ)`
        : `${crop} Early Leaf Blight (Demo Sample)`,

      confidence: 'Demonstration Sample',

      symptoms: kn
        ? [
            'ಎಲೆಗಳ ಮೇಲೆ ಕಂದು ಬಣ್ಣದ ವೃತ್ತಾಕಾರದ ಚುಕ್ಕೆಗಳು',
            'ಚುಕ್ಕೆಗಳ ಸುತ್ತ ಹಳದಿ ಬಣ್ಣದ ಉಂಗುರ ಕಾಣಿಸಿಕೊಳ್ಳುವುದು'
          ]
        : [
            'Dark brown concentric rings on older lower leaves',
            'Yellowing halo around necrotic leaf spots'
          ],

      preventiveMeasures: kn
        ? [
            'ರೋಗಗ್ರಸ್ತ ಕೆಳಗಿನ ಎಲೆಗಳನ್ನು ತೆಗೆದು ನಾಶಪಡಿಸಿ',
            'ಮೇಲ್ಭಾಗದ ನೀರಾವರಿ ತಪ್ಪಿಸಿ, ಬೆಳಿಗ್ಗೆ ಮಾತ್ರ ನೀರು ಹಾಯಿಸಿ',
            'ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರದ ಸಲಹೆಯಂತೆ ಶಿಲೀಂಧ್ರನಾಶಕ ಬಳಸಿ'
          ]
        : [
            'Remove and safely dispose of severely infected lower leaves',
            'Avoid overhead sprinkler irrigation late in the evening',
            'Verify with local KVK agronomist before fungicide application'
          ],

      disclaimer: kn
        ? 'ಗಮನಿಸಿ: ಇದು ಡೆಮೊ ಮೋಡ್ ಮಾದರಿ ಫಲಿತಾಂಶವಾಗಿದೆ. ನಿಜವಾದ AI ರೋಗನಿರ್ಣಯಕ್ಕಾಗಿ ಸರ್ವರ್‌ನಲ್ಲಿ GEMINI_API_KEY ಕಾನ್ಫಿಗರ್ ಮಾಡಿ.'
        : 'DEMONSTRATION MODE: This is sample output for UI demonstration—not an actual AI diagnosis of your image. Configure GEMINI_API_KEY on the server for live Gemini Vision analysis.'
    },

    'DEMONSTRATION MODE (Simulated)',

    true
  );
});

document.getElementById('saveDiseaseBtn').addEventListener('click', async () => {
  if (!lastDiagnosis) return;

  try {
    if (isConfigured && db && ctx.profile.uid) {
      await addDoc(collection(db, 'DiseaseReports'), {
        uid: ctx.profile.uid,

        crop:
          document.getElementById('diseaseCropInput').value.trim() ||
          'Unspecified',

        ...lastDiagnosis,

        createdAt: serverTimestamp()
      });
    }

    await saveFarmingHistory(ctx.profile.uid, {
      category: 'Disease Screening',
      title: lastDiagnosis.diseaseName,
      summary: `${lastDiagnosis.mode} · ${lastDiagnosis.confidence}`
    });

    showToast(t('saved_ok'));

  } catch (err) {
    showToast(err.message, 'error');
  }
});