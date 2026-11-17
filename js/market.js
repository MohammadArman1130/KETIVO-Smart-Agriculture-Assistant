import { initAppShell } from './shell.js';

await initAppShell('market', 'market_title');

// Transparent reference dataset modeled on AGMARKNET historical ranges
const MARKET_DATA = [
  { crop: 'Paddy (Common)', state: 'Karnataka', district: 'Mandya', mandi: 'Mandya APMC', min: 2240, max: 2480, modal: 2380, date: 'Reference Sample (Nov 2026)', trend: [2150, 2190, 2260, 2310, 2340, 2380] },
  { crop: 'Paddy (Common)', state: 'Karnataka', district: 'Raichur', mandi: 'Raichur APMC', min: 2280, max: 2540, modal: 2420, date: 'Reference Sample (Nov 2026)', trend: [2180, 2230, 2290, 2350, 2390, 2420] },
  { crop: 'Ragi (Finger Millet)', state: 'Karnataka', district: 'Tumakuru', mandi: 'Tumakuru APMC', min: 3450, max: 3920, modal: 3720, date: 'Reference Sample (Nov 2026)', trend: [3380, 3450, 3520, 3600, 3680, 3720] },
  { crop: 'Maize', state: 'Karnataka', district: 'Davanagere', mandi: 'Davanagere APMC', min: 2050, max: 2290, modal: 2180, date: 'Reference Sample (Nov 2026)', trend: [1980, 2020, 2080, 2120, 2150, 2180] },
  { crop: 'Tur / Red Gram', state: 'Karnataka', district: 'Kalaburagi', mandi: 'Kalaburagi APMC', min: 8200, max: 9450, modal: 8900, date: 'Reference Sample (Nov 2026)', trend: [8100, 8350, 8500, 8680, 8820, 8900] },
  { crop: 'Groundnut', state: 'Karnataka', district: 'Chitradurga', mandi: 'Chitradurga APMC', min: 5600, max: 6450, modal: 6100, date: 'Reference Sample (Nov 2026)', trend: [5750, 5820, 5910, 5980, 6050, 6100] },
  { crop: 'Tomato', state: 'Karnataka', district: 'Kolar', mandi: 'Kolar APMC', min: 1400, max: 2600, modal: 2100, date: 'Reference Sample (Nov 2026)', trend: [1650, 2400, 1900, 1750, 2050, 2100] },
  { crop: 'Onion', state: 'Maharashtra', district: 'Nashik', mandi: 'Lasalgaon APMC', min: 2100, max: 3350, modal: 2850, date: 'Reference Sample (Nov 2026)', trend: [2200, 2450, 2700, 2650, 2790, 2850] }
];

let trendChart = null;
let compareChart = null;

function renderMarket() {
  const q = document.getElementById('marketSearch').value.trim().toLowerCase();
  const stateFilter = document.getElementById('marketState').value;

  const rows = MARKET_DATA.filter(item => {
    const matchText = !q || item.crop.toLowerCase().includes(q) || item.district.toLowerCase().includes(q) || item.mandi.toLowerCase().includes(q);
    const matchState = stateFilter === 'All' || item.state === stateFilter;
    return matchText && matchState;
  });

  const tbody = document.getElementById('marketTableBody');
  tbody.innerHTML = rows.length
    ? rows
        .map(
          r => `<tr>
            <td><strong>${r.crop}</strong></td>
            <td>${r.mandi} (${r.district}, ${r.state})</td>
            <td>₹${r.min}</td>
            <td>₹${r.max}</td>
            <td><span class="badge badge-green">₹${r.modal} / qtl</span></td>
            <td><small>${r.date}</small></td>
          </tr>`
        )
        .join('')
    : `<tr><td colspan="6" class="empty-state">No matching crops found in reference dataset.</td></tr>`;

  if (rows.length && window.Chart) {
    const primary = rows[0];

    if (trendChart) trendChart.destroy();

    trendChart = new Chart(document.getElementById('marketTrendChart'), {
      type: 'line',
      data: {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [
          {
            label: `${primary.crop} — ${primary.mandi} (₹/qtl)`,
            data: primary.trend,
            borderColor: '#1B5E20',
            backgroundColor: 'rgba(46, 125, 50, 0.14)',
            fill: true,
            tension: 0.35
          }
        ]
      }
    });

    if (compareChart) compareChart.destroy();

    compareChart = new Chart(document.getElementById('marketCompareChart'), {
      type: 'bar',
      data: {
        labels: rows.slice(0, 6).map(r => `${r.crop.split(' ')[0]} (${r.district})`),
        datasets: [
          {
            label: 'Modal Price (₹ / Quintal)',
            data: rows.slice(0, 6).map(r => r.modal),
            backgroundColor: '#2E7D32',
            borderRadius: 6
          }
        ]
      }
    });
  }
}

document.getElementById('marketSearch').addEventListener('input', renderMarket);
document.getElementById('marketState').addEventListener('change', renderMarket);

renderMarket();