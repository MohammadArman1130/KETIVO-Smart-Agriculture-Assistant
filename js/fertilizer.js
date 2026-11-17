import { initAppShell, saveFarmingHistory, showToast } from './shell.js';
import { getLang, t } from './translations.js';

const ctx = await initAppShell('fertilizer', 'fert_title');

const hasTestSel = document.getElementById('hasSoilTest');
const soilInputs = document.getElementById('soilTestFields');

hasTestSel.addEventListener('change', () => {
  soilInputs.classList.toggle('hidden', hasTestSel.value !== 'yes');
});

let currentAdvice = null;

document.getElementById('fertForm').addEventListener('submit', e => {
  e.preventDefault();
  const crop = document.getElementById('fertCrop').value;
  const stage = document.getElementById('fertStage').value;
  const soil = document.getElementById('fertSoil').value;
  const hasTest = hasTestSel.value === 'yes';

  const kn = getLang() === 'kn';
  const notes = [];

  if (stage === 'Basal / Sowing') {
    notes.push(kn ? 'ಬಿತ್ತನೆ ಸಮಯದಲ್ಲಿ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ/ಕಾಂಪೋಸ್ಟ್ ಮತ್ತು ರಂಜಕ (Phosphorus) ಹಾಗೂ ಪೊಟ್ಯಾಶ್‌ನ ಸಂಪೂರ್ಣ ಪ್ರಮಾಣವನ್ನು ನೀಡುವುದು ಸೂಕ್ತ.' : 'Apply well-decomposed FYM/compost and basal Phosphorus (P) + Potassium (K) near root zone at sowing.');
  } else if (stage === 'Vegetative') {
    notes.push(kn ? 'ಸಸ್ಯ ಬೆಳವಣಿಗೆಯ ಹಂತದಲ್ಲಿ ಸಾರಜನಕ (Nitrogen) ವನ್ನು 2–3 ಕಂತುಗಳಲ್ಲಿ ನೀಡಿ; ನೀರು ನಿಂತಾಗ ಯೂರಿಯಾ ಹಾಕಬೇಡಿ.' : 'Split Nitrogen (N) top-dressing during active vegetative growth; avoid applying urea onto standing water.');
  } else if (stage === 'Flowering / Fruiting') {
    notes.push(kn ? 'ಹೂ ಬಿಡುವ ಮತ್ತು ಕಾಳು ಕಟ್ಟುವ ಹಂತದಲ್ಲಿ ಪೊಟ್ಯಾಶ್ ಮತ್ತು ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶಗಳು (Zn, B) ಇಳುವರಿಗೆ ನೆರವಾಗುತ್ತವೆ.' : 'Ensure adequate Potassium and micronutrients (Zinc/Boron if deficient) to support flowering and grain filling.');
  } else {
    notes.push(kn ? 'ಪಕ್ವತೆ ಹಂತದಲ್ಲಿ ಹೆಚ್ಚುವರಿ ಸಾರಜನಕ ನೀಡಬೇಡಿ.' : 'Avoid late Nitrogen application during maturity to prevent lodging and pest susceptibility.');
  }

  if (hasTest) {
    const ph = parseFloat(document.getElementById('soilPh').value);
    const nVal = parseFloat(document.getElementById('soilN').value);
    const pVal = parseFloat(document.getElementById('soilP').value);
    const kVal = parseFloat(document.getElementById('soilK').value);

    if (!isNaN(ph)) {
      if (ph < 5.5) notes.push(`pH ${ph} (Acidic): Agricultural lime application is generally advised after lab validation.`);
      else if (ph > 8.2) notes.push(`pH ${ph} (Alkaline): Gypsum and organic matter addition helps improve nutrient availability.`);
      else notes.push(`pH ${ph} is within the favorable neutral range (6.0–7.5) for most crops.`);
    }
    if (!isNaN(nVal) && nVal < 280) notes.push(`Available Nitrogen (${nVal} kg/ha) is Low — follow state agricultural university split-N schedule.`);
    if (!isNaN(pVal) && pVal < 11) notes.push(`Available Phosphorus (${pVal} kg/ha) is Low — incorporate phosphate fertilizer into root zone at sowing.`);
    if (!isNaN(kVal) && kVal < 120) notes.push(`Available Potassium (${kVal} kg/ha) is Low — supplement potash to improve drought & disease tolerance.`);
  } else {
    notes.push(kn ? 'ಮಣ್ಣು ಪರೀಕ್ಷಾ ವರದಿ ಇಲ್ಲದಿರುವುದರಿಂದ ನಿಖರ ರಾಸಾಯನಿಕ ಪ್ರಮಾಣವನ್ನು ನೀಡಲಾಗುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಸಮೀಪದ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರದಲ್ಲಿ ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ.' : 'Without laboratory soil test values, exact chemical dosages should not be guessed. Please submit a soil sample to your nearest Soil Health Card / RSK center.');
  }

  currentAdvice = { crop, stage, soil, notes };
  document.getElementById('fertHeadline').textContent = `${crop} · ${stage} (${soil} Soil)`;
  document.getElementById('fertNotesList').innerHTML = notes.map(n => `<li>${n}</li>`).join('');
  document.getElementById('fertResult').classList.remove('hidden');
});

document.getElementById('saveFertBtn').addEventListener('click', async () => {
  if (!currentAdvice) return;
  await saveFarmingHistory(ctx.profile.uid, {
    category: 'Fertilizer Advisory',
    title: `${currentAdvice.crop} (${currentAdvice.stage})`,
    summary: currentAdvice.notes[0]
  });
  showToast(t('saved_ok'));
});