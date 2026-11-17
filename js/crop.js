import { initAppShell, saveFarmingHistory, showToast } from './shell.js';
import { db, isConfigured, addDoc, collection, serverTimestamp } from './firebase-client.js';
import { t } from './translations.js';

const ctx = await initAppShell('crop', 'crop_title');
document.getElementById('cropState').value = ctx.profile.state || 'Karnataka';
document.getElementById('cropDistrict').value = ctx.profile.district || 'Mandya';

const CROP_KNOWLEDGE = [
  { name: 'Paddy (Rice)', seasons: ['Kharif', 'Rabi'], soils: ['Clay', 'Loamy', 'Alluvial'], water: ['Canal / Borewell', 'Abundant Rainfed'], req: 'High (1200–1500 mm)', tips: 'Maintain 2–5 cm standing water during vegetative phase; adopt SRI method to save water.', precaution: 'Avoid water stagnation during ripening; monitor for blast and brown plant hopper.' },
  { name: 'Ragi (Finger Millet)', seasons: ['Kharif', 'Summer'], soils: ['Red', 'Loamy', 'Sandy'], water: ['Rainfed', 'Limited Borewell', 'Canal / Borewell'], req: 'Low–Moderate (450–650 mm)', tips: 'Ideal drought-resilient crop for southern Karnataka; transplant 20-day seedlings for higher yield.', precaution: 'Ensure well-drained field; watch for neck blast during humid spells.' },
  { name: 'Maize', seasons: ['Kharif', 'Rabi', 'Summer'], soils: ['Loamy', 'Red', 'Black', 'Alluvial'], water: ['Rainfed', 'Limited Borewell', 'Canal / Borewell'], req: 'Moderate (500–750 mm)', tips: 'Critical irrigation stages are tasseling and grain filling; maintain 60x20 cm spacing.', precaution: 'Inspect whorl early for Fall Armyworm infestation.' },
  { name: 'Tur / Red Gram (Pigeon Pea)', seasons: ['Kharif'], soils: ['Red', 'Black', 'Loamy'], water: ['Rainfed', 'Limited Borewell'], req: 'Low (400–600 mm)', tips: 'Deep-rooted nitrogen-fixing pulse; works well as intercrop with ragi or groundnut.', precaution: 'Prevent waterlogging; monitor pod borer at flowering.' },
  { name: 'Groundnut', seasons: ['Kharif', 'Rabi', 'Summer'], soils: ['Sandy', 'Red', 'Loamy'], water: ['Rainfed', 'Limited Borewell', 'Canal / Borewell'], req: 'Moderate (450–600 mm)', tips: 'Apply gypsum at pegging stage (40–45 DAS) for better pod filling.', precaution: 'Avoid heavy clay soils which hinder peg penetration and harvesting.' },
  { name: 'Cotton', seasons: ['Kharif'], soils: ['Black', 'Loamy'], water: ['Rainfed', 'Limited Borewell', 'Canal / Borewell'], req: 'Moderate (650–900 mm)', tips: 'Deep black cotton soils retain moisture well; practice border trapping for pests.', precaution: 'Monitor pink bollworm traps regularly; avoid excess nitrogen.' },
  { name: 'Chickpea (Bengal Gram)', seasons: ['Rabi'], soils: ['Black', 'Loamy', 'Clay'], water: ['Rainfed', 'Limited Borewell'], req: 'Low (300–450 mm)', tips: 'Thrives on residual soil moisture in Rabi; treat seeds with Rhizobium before sowing.', precaution: 'Avoid excessive irrigation which triggers wilt.' },
  { name: 'Sugarcane', seasons: ['Kharif', 'Rabi', 'Summer'], soils: ['Alluvial', 'Black', 'Loamy'], water: ['Canal / Borewell', 'Abundant Rainfed'], req: 'Very High (1800–2200 mm)', tips: 'Use drip irrigation and trash mulching to optimize water and fertilizer efficiency.', precaution: 'Only recommended where assured year-round water is available.' }
];

let latestRecs = [];

document.getElementById('cropForm').addEventListener('submit', e => {
  e.preventDefault();
  const state = document.getElementById('cropState').value.trim();
  const district = document.getElementById('cropDistrict').value.trim();
  const soil = document.getElementById('cropSoil').value;
  const water = document.getElementById('cropWater').value;
  const season = document.getElementById('cropSeason').value;
  const area = document.getElementById('cropArea').value || '1';

  const matches = CROP_KNOWLEDGE.filter(c => c.seasons.includes(season) && c.soils.includes(soil) && c.water.includes(water));
  const list = matches.length ? matches : CROP_KNOWLEDGE.filter(c => c.seasons.includes(season)).slice(0, 3);

  latestRecs = list.map(c => c.name);
  const grid = document.getElementById('cropResultsGrid');
  grid.innerHTML = list
    .map(
      c => `<div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h3>🌾 ${c.name}</h3>
          <span class="badge badge-green">${season}</span>
        </div>
        <p><strong>Water Need:</strong> ${c.req}</p>
        <p style="margin-top:8px;"><strong>Cultivation:</strong> ${c.tips}</p>
        <p style="margin-top:8px; color:#92400E;"><strong>Precaution:</strong> ${c.precaution}</p>
      </div>`
    )
    .join('');

  document.getElementById('cropMeta').textContent = `Rules matched for ${district}, ${state} · ${soil} soil · ${water} · ${area} acre(s).`;
  document.getElementById('cropResultWrap').classList.remove('hidden');
});

document.getElementById('saveCropRecBtn').addEventListener('click', async () => {
  if (!latestRecs.length) return;
  const district = document.getElementById('cropDistrict').value.trim();
  const season = document.getElementById('cropSeason').value;
  const soil = document.getElementById('cropSoil').value;
  try {
    if (isConfigured && db && ctx.profile.uid) {
      await addDoc(collection(db, 'CropRecommendations'), {
        uid: ctx.profile.uid,
        district,
        season,
        soil,
        recommendedCrops: latestRecs,
        createdAt: serverTimestamp()
      });
    }
    await saveFarmingHistory(ctx.profile.uid, {
      category: 'Crop Advisory',
      title: `Recommended: ${latestRecs.join(', ')}`,
      summary: `${district} · ${season} · ${soil} soil`
    });
    showToast(t('saved_ok'));
  } catch (err) {
    showToast(err.message, 'error');
  }
});