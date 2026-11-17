import { initAppShell } from './shell.js';
import { getLang, t } from './translations.js';

export function describeWeatherCode(code) {
  const kn = getLang() === 'kn';
  if (code === 0) return { label: kn ? 'ಸ್ಪಷ್ಟ ಆಕಾಶ' : 'Clear Sky', icon: '☀️' };
  if ([1, 2, 3].includes(code)) return { label: kn ? 'ಭಾಗಶಃ ಮೋಡ' : 'Partly Cloudy', icon: '⛅' };
  if ([45, 48].includes(code)) return { label: kn ? 'ಮಂಜು' : 'Foggy', icon: '🌫️' };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { label: kn ? 'ಮಳೆ' : 'Rain Showers', icon: '🌧️' };
  if ([95, 96, 99].includes(code)) return { label: kn ? 'ಗುಡುಗು ಸಹಿತ ಮಳೆ' : 'Thunderstorm', icon: '⛈️' };
  return { label: kn ? 'ಮೋಡ ಕವಿದ ವಾತಾವರಣ' : 'Overcast', icon: '☁️' };
}

export async function fetchLiveWeatherByCity(cityName) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) throw new Error('Geocoding API failed');
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Location "${cityName}" not found.`);
  }
  const loc = geoData.results[0];
  const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`;
  const wxRes = await fetch(wxUrl);
  if (!wxRes.ok) throw new Error('Weather API failed');
  const wxData = await wxRes.json();
  return { location: loc, weather: wxData };
}

function buildFarmingAdvice(wx) {
  const cur = wx.current;
  const rainToday = wx.daily?.precipitation_sum?.[0] ?? 0;
  const kn = getLang() === 'kn';
  const tips = [];

  if (rainToday >= 5 || cur.precipitation > 0) {
    tips.push(kn ? 'ಇಂದು ಮಳೆ ನಿರೀಕ್ಷೆಯಿರುವುದರಿಂದ ನೀರಾವರಿ ಮುಂದೂಡಿ ಮತ್ತು ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆ ತಪ್ಪಿಸಿ.' : 'Rain expected today — pause scheduled irrigation and avoid foliar spraying.');
  } else {
    tips.push(kn ? 'ಒಣ ಹವಾಮಾನವಿದೆ; ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ನೀರಾವರಿ ಮಾಡುವುದು ಉತ್ತಮ.' : 'Low rainfall expected today — schedule irrigation during early morning or evening to reduce evaporation.');
  }

  if (cur.wind_speed_10m > 18) {
    tips.push(kn ? 'ಗಾಳಿಯ ವೇಗ ಹೆಚ್ಚಾಗಿದೆ; ಸಿಂಪಡಣೆ ಕಾರ್ಯವನ್ನು ಮುಂದೂಡಿ.' : 'High wind speed (>18 km/h) — postpone spraying to prevent drift.');
  }
  if (cur.temperature_2m >= 34) {
    tips.push(kn ? 'ಹೆಚ್ಚಿನ ತಾಪಮಾನ: ತೇವಾಂಶ ಉಳಿಸಲು ಮಲ್ಚಿಂಗ್ (ಹೊದಿಕೆ) ಬಳಸಿ.' : 'High daytime heat — consider organic mulching to conserve root-zone moisture.');
  }
  return tips;
}

// Run page controller only on weather.html
if (document.getElementById('weatherSearchForm')) {
  const ctx = await initAppShell('weather', 'weather_title');
  const input = document.getElementById('weatherCityInput');
  const statusEl = document.getElementById('weatherStatus');
  const resultEl = document.getElementById('weatherResult');

  async function loadCity(city) {
    statusEl.innerHTML = `<span class="spinner"></span> ${t('loading')}`;
    statusEl.className = 'alert alert-info';
    statusEl.classList.remove('hidden');
    resultEl.classList.add('hidden');
    try {
      const { location, weather } = await fetchLiveWeatherByCity(city);
      const cur = weather.current;
      const cond = describeWeatherCode(cur.weather_code);
      const tips = buildFarmingAdvice(weather);

      document.getElementById('wxLocName').textContent = `${location.name}, ${location.admin1 || location.country}`;
      document.getElementById('wxTemp').textContent = `${cur.temperature_2m} °C`;
      document.getElementById('wxCond').textContent = `${cond.icon} ${cond.label}`;
      document.getElementById('wxHumidity').textContent = `${cur.relative_humidity_2m} %`;
      document.getElementById('wxWind').textContent = `${cur.wind_speed_10m} km/h`;
      document.getElementById('wxRain').textContent = `${weather.daily.precipitation_sum[0]} mm`;

      document.getElementById('wxAdviceList').innerHTML = tips.map(item => `<li>${item}</li>`).join('');

      const rows = weather.daily.time
        .map((day, idx) => {
          const dCond = describeWeatherCode(weather.daily.weather_code[idx]);
          return `<tr>
            <td>${day}</td>
            <td>${dCond.icon} ${dCond.label}</td>
            <td>${weather.daily.temperature_2m_min[idx]}°C / <strong>${weather.daily.temperature_2m_max[idx]}°C</strong></td>
            <td>${weather.daily.precipitation_sum[idx]} mm</td>
          </tr>`;
        })
        .join('');
      document.getElementById('wxForecastBody').innerHTML = rows;

      statusEl.classList.add('hidden');
      resultEl.classList.remove('hidden');
    } catch (err) {
      statusEl.textContent = err.message;
      statusEl.className = 'alert alert-error';
    }
  }

  input.value = ctx.profile.district || 'Mandya';
  loadCity(input.value);

  document.getElementById('weatherSearchForm').addEventListener('submit', e => {
    e.preventDefault();
    if (input.value.trim()) loadCity(input.value.trim());
  });
}