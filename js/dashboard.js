import { initAppShell } from './shell.js';
import { fetchLiveWeatherByCity, describeWeatherCode } from './weather.js';
import { db, isConfigured, collection, query, where, orderBy, limit, getDocs } from './firebase-client.js';
import { getLang, t } from './translations.js';

const ctx = await initAppShell('dashboard', 'sb_dashboard');
const { profile } = ctx;

document.getElementById('welcomeName').textContent = `${t('welcome_prefix')} ${profile.name}`;
document.getElementById('welcomeLoc').textContent = `📍 ${profile.district || 'Mandya'}, ${profile.state || 'Karnataka'} · 🌱 ${profile.primaryCrop || 'Paddy'}`;

// Live Weather Widget
(async () => {
  try {
    const { weather } = await fetchLiveWeatherByCity(profile.district || 'Mandya');
    const cur = weather.current;
    const cond = describeWeatherCode(cur.weather_code);
    const rain = weather.daily.precipitation_sum[0];

    document.getElementById('kpiTemp').textContent = `${cur.temperature_2m} °C`;
    document.getElementById('kpiHumidity').textContent = `${cur.relative_humidity_2m} %`;
    document.getElementById('kpiRain').textContent = `${rain} mm`;
    document.getElementById('bannerWeather').innerHTML = `<strong>${cond.icon} ${cur.temperature_2m}°C</strong><br><small>${cond.label} · Open-Meteo Live</small>`;

    const kn = getLang() === 'kn';
    const recEl = document.getElementById('dashRecommendation');
    if (rain >= 4) {
      recEl.textContent = kn
        ? `ಇಂದು ${rain} mm ಮಳೆ ಮುನ್ಸೂಚನೆ ಇದೆ. ನಿಮ್ಮ ${profile.primaryCrop || 'ಬೆಳೆ'}ಗೆ ಹೆಚ್ಚುವರಿ ನೀರಾವರಿಯನ್ನು ತಾತ್ಕಾಲಿಕವಾಗಿ ನಿಲ್ಲಿಸಿ.`
        : `${rain} mm rainfall forecasted today. Delay irrigation for ${profile.primaryCrop || 'your crop'} and inspect field drainage.`;
    } else {
      recEl.textContent = kn
        ? `ಹವಾಮಾನವು ಅನುಕೂಲಕರವಾಗಿದೆ (${cur.temperature_2m}°C). ಬೆಳಗಿನ ವೇಳೆಯಲ್ಲಿ ನೀರಾವರಿ ಮತ್ತು ನಿಯಮಿತ ಎಲೆ ತಪಾಸಣೆ ನಡೆಸಿ.`
        : `Favorable field conditions (${cur.temperature_2m}°C). Ideal window for early-morning irrigation and routine leaf health inspection.`;
    }
  } catch {
    document.getElementById('bannerWeather').textContent = 'Weather unavailable offline';
  }
})();

// Load Recent Activities
(async () => {
  let items = [];
  if (isConfigured && db) {
    try {
      const q = query(
        collection(db, 'FarmingHistory'),
        where('uid', '==', profile.uid),
        orderBy('createdAtISO', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn(err);
    }
  } else {
    items = JSON.parse(localStorage.getItem('farmsathi_local_history') || '[]').slice(0, 5);
  }

  document.getElementById('kpiRecords').textContent = items.length;
  const listEl = document.getElementById('recentActivityList');
  if (!items.length) {
    listEl.innerHTML = `<div class="empty-state" data-i18n="no_activities">${t('no_activities')}</div>`;
    return;
  }
  listEl.innerHTML = items
    .map(
      item => `<div style="padding:12px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; gap:12px;">
        <div>
          <span class="badge badge-green">${item.category || 'Activity'}</span>
          <strong style="display:block; margin-top:4px;">${item.title}</strong>
          <small style="color:var(--text-muted);">${item.summary || ''}</small>
        </div>
        <small style="color:var(--text-muted); white-space:nowrap;">${(item.createdAtISO || '').slice(0, 10)}</small>
      </div>`
    )
    .join('');
})();

// Quick Mini Chart (Sample Yield / Moisture Trend Reference)
const chartCanvas = document.getElementById('dashChart');
if (chartCanvas && window.Chart) {
  new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
      datasets: [
        {
          label: 'Reference Paddy Price (₹/qtl)',
          data: [2180, 2240, 2290, 2310, 2360, 2410],
          borderColor: '#1B5E20',
          backgroundColor: 'rgba(67, 160, 71, 0.14)',
          fill: true,
          tension: 0.35
        }
      ]
    },
    options: { responsive: true, plugins: { legend: { display: true } } }
  });
}