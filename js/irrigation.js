import { initAppShell, saveFarmingHistory, showToast } from './shell.js';
import { fetchLiveWeatherByCity } from './weather.js';
import { db, isConfigured, addDoc, collection, serverTimestamp } from './firebase-client.js';
import { getLang, t } from './translations.js';

const ctx = await initAppShell('irrigation', 'irr_title');
const locInput = document.getElementById('irrLocation');
locInput.value = ctx.profile.district || 'Mandya';

let lastEstimate = null;

document.getElementById('irrigationForm').addEventListener('submit', async e => {
  e.preventDefault();
  const crop = document.getElementById('irrCrop').value;
  const soil = document.getElementById('irrSoil').value;
  const lastDate = document.getElementById('irrLastDate').value;
  const condition = document.getElementById('irrCondition').value;
  const location = locInput.value.trim();

  if (!lastDate || !location) return showToast(t('err_required'), 'error');

  const btn = document.getElementById('irrSubmitBtn');
  btn.disabled = true;
  btn.textContent = t('loading');

  try {
    const { weather, location: geo } = await fetchLiveWeatherByCity(location);
    const rain3Days = weather.daily.precipitation_sum.slice(0, 3).reduce((a, b) => a + b, 0);
    const temp = weather.current.temperature_2m;
    const daysSince = Math.max(0, Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000));

    let status = 'Irrigate Within 24 Hours';
    let badgeClass = 'badge-amber';
    let reason = '';
    let nextAction = '';

    const kn = getLang() === 'kn';

    if (condition === 'Wet' || rain3Days >= 15) {
      status = kn ? 'ನೀರಾವರಿ ಮುಂದೂಡಿ (Skip Irrigation)' : 'Delay / Skip Irrigation';
      badgeClass = 'badge-green';
      reason = kn
        ? `ಹೊಲದ ಸ್ಥಿತಿ "${condition}" ಆಗಿದೆ ಮತ್ತು ಮುಂದಿನ 3 ದಿನಗಳಲ್ಲಿ ${rain3Days.toFixed(1)} mm ಮಳೆ ನಿರೀಕ್ಷೆಯಿದೆ.`
        : `Field condition reported as "${condition}" and ${rain3Days.toFixed(1)} mm rain is forecasted over the next 3 days.`;
      nextAction = kn
        ? 'ಹೆಚ್ಚುವರಿ ನೀರು ಹರಿದುಹೋಗಲು ಬಸಿಗಾಲುವೆ ಪರಿಶೀಲಿಸಿ ಮತ್ತು 3 ದಿನಗಳ ನಂತರ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.'
        : 'Ensure proper drainage and re-evaluate field condition after 3 days.';
    } else if (condition === 'Dry' || (daysSince >= 6 && soil === 'Sandy')) {
      status = kn ? 'ತಕ್ಷಣ ನೀರಾವರಿ ಶಿಫಾರಸು (ಹಗುರವಾಗಿ)' : 'Light to Moderate Irrigation Recommended';
      badgeClass = 'badge-red';
      reason = kn
        ? `ಕೊನೆಯ ನೀರಾವರಿಯಾಗಿ ${daysSince} ದಿನಗಳಾಗಿವೆ, ಮಣ್ಣು (${soil}) ಮತ್ತು ತಾಪಮಾನ ${temp}°C ಇದೆ.`
        : `${daysSince} days since last irrigation, "${condition}" surface condition, ${soil} soil, and ${temp}°C temperature.`;
      nextAction = kn
        ? 'ಬೆಳಿಗ್ಗೆ 6-9 ಅಥವಾ ಸಂಜೆ 5-7 ಗಂಟೆಯೊಳಗೆ ಹನಿ ಅಥವಾ ಸಾಲಿನ ನೀರಾವರಿ ನೀಡಿ.'
        : 'Irrigate early morning (6–9 AM) or evening (5–7 PM) using drip or furrow method.';
    } else {
      status = kn ? '2–3 ದಿನಗಳಲ್ಲಿ ನೀರಾವರಿ ಯೋಜಿಸಿ' : 'Schedule Irrigation in 2–3 Days';
      badgeClass = 'badge-blue';
      reason = kn
        ? `ಮಧ್ಯಮ ತೇವಾಂಶ (${condition}), ${daysSince} ದಿನಗಳ ಅಂತರ ಮತ್ತು ${rain3Days.toFixed(1)} mm ಮಳೆ ಮುನ್ಸೂಚನೆ.`
        : `Moderate field state (${condition}), ${daysSince} days interval, and ${rain3Days.toFixed(1)} mm forecast rainfall.`;
      nextAction = kn
        ? 'ಮಣ್ಣಿನ ಮೇಲ್ಮೈ ಒಣಗಿದರೆ ಮಾತ್ರ ನೀರು ಹಾಯಿಸಿ.'
        : 'Monitor top 5 cm soil manually before opening irrigation.';
    }

    const conservation = kn
      ? 'ಬೆಳೆ ತ್ಯಾಜ್ಯದ ಹೊದಿಕೆ (Mulching) ಮತ್ತು ಹನಿ ನೀರಾವರಿ ಬಳಸುವುದರಿಂದ 25–40% ನೀರು ಉಳಿತಾಯವಾಗುತ್ತದೆ.'
      : 'Use crop residue mulching and drip/alternate-furrow irrigation to cut evaporation losses by 25–40%.';

    lastEstimate = { crop, soil, lastDate, condition, location: geo.name, rain3Days: +rain3Days.toFixed(1), status, reason, nextAction };

    document.getElementById('irrStatusBadge').className = `badge ${badgeClass}`;
    document.getElementById('irrStatusBadge').textContent = status;
    document.getElementById('irrReason').textContent = reason;
    document.getElementById('irrRainImpact').textContent = `${rain3Days.toFixed(1)} mm (3-day Open-Meteo forecast for ${geo.name})`;
    document.getElementById('irrNextAction').textContent = nextAction;
    document.getElementById('irrConservation').textContent = conservation;
    document.getElementById('irrResultCard').classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = t('irr_submit');
  }
});

document.getElementById('saveIrrBtn').addEventListener('click', async () => {
  if (!lastEstimate) return;
  try {
    if (isConfigured && db && ctx.profile.uid) {
      await addDoc(collection(db, 'IrrigationRecords'), {
        uid: ctx.profile.uid,
        ...lastEstimate,
        createdAt: serverTimestamp()
      });
    }
    await saveFarmingHistory(ctx.profile.uid, {
      category: 'Irrigation',
      title: `${lastEstimate.crop} — ${lastEstimate.status}`,
      summary: `${lastEstimate.location} · ${lastEstimate.soil} soil · Rain: ${lastEstimate.rain3Days}mm`
    });
    showToast(t('saved_ok'));
  } catch (err) {
    showToast(err.message, 'error');
  }
});