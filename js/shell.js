import {
auth,
db,
isConfigured,
onAuthStateChanged,
signOut,
doc,
getDoc,
addDoc,
collection,
serverTimestamp
} from './firebase-client.js';
import { applyTranslations, getLang, setLang, t } from './translations.js';

export function showToast(message, type = 'success') {
let container = document.querySelector('.toast-container');
if (!container) {
container = document.createElement('div');
container.className = 'toast-container';
document.body.appendChild(container);
}
const toast = document.createElement('div');
toast.className = `toast ${type}`;
toast.textContent = message;
container.appendChild(toast);
setTimeout(() => toast.remove(), 3800);
}

export async function saveFarmingHistory(uid, entry) {
if (!isConfigured || !db || !uid) {
const local = JSON.parse(localStorage.getItem('farmsathi_local_history') || '[]');
local.unshift({
id: 'local_' + Date.now(),
...entry,
createdAtISO: new Date().toISOString()
});
localStorage.setItem('farmsathi_local_history', JSON.stringify(local.slice(0, 50)));
return true;
}
await addDoc(collection(db, 'FarmingHistory'), {
uid,
...entry,
createdAt: serverTimestamp(),
createdAtISO: new Date().toISOString()
});
return true;
}

export async function initAppShell(activeKey, titleI18nKey) {
const base = document.body.dataset.base || './';
const sidebarEl = document.getElementById('sidebar');
const topbarEl = document.getElementById('topbar');

const navItems = [
{ key: 'dashboard', href: `${base}dashboard.html`, icon: '📊', label: 'sb_dashboard' },
{ key: 'irrigation', href: `${base}pages/irrigation.html`, icon: '💧', label: 'sb_irrigation' },
{ key: 'crop', href: `${base}pages/crop-recommendation.html`, icon: '🌱', label: 'sb_crop' },
{ key: 'weather', href: `${base}pages/weather.html`, icon: '⛅', label: 'sb_weather' },
{ key: 'disease', href: `${base}pages/disease-detection.html`, icon: '🔬', label: 'sb_disease' },
{ key: 'fertilizer', href: `${base}pages/fertilizer.html`, icon: '🧪', label: 'sb_fertilizer' },
{ key: 'market', href: `${base}pages/market-prices.html`, icon: '📈', label: 'sb_market' },
{ key: 'history', href: `${base}pages/history.html`, icon: '📒', label: 'sb_history' },
{ key: 'profile', href: `${base}pages/profile.html`, icon: '👤', label: 'sb_profile' },
{ key: 'settings', href: `${base}pages/settings.html`, icon: '⚙️', label: 'sb_settings' }
];

if (sidebarEl) {
sidebarEl.innerHTML = `      <div class="sidebar-header">         <a href="${base}index.html"><img src="${base}assets/images/kethivo-logo.png" alt="KETHIVO – Smart Agriculture Assistant"></a>         <button class="sidebar-close" id="sidebarCloseBtn" aria-label="Close menu">✕</button>       </div>       <nav class="sidebar-nav">         ${navItems           .map(             item =>`<a href="${item.href}" class="nav-item ${item.key === activeKey ? 'active' : ''}">
<span>${item.icon}</span>
<span data-i18n="${item.label}">${t(item.label)}</span>
</a>`           )           .join('')}         <button class="nav-item nav-item-logout" id="logoutBtn" type="button">           <span>🚪</span>           <span data-i18n="sb_logout">${t('sb_logout')}</span>         </button>       </nav>     `;
}

let overlay = document.getElementById('sidebarOverlay');
if (!overlay) {
overlay = document.createElement('div');
overlay.id = 'sidebarOverlay';
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);
}

if (topbarEl) {
topbarEl.innerHTML = `       <div class="topbar-left">         <button class="sidebar-toggle" id="sidebarToggleBtn" aria-label="Open menu">☰</button>         <div class="topbar-title" data-i18n="${titleI18nKey}">${t(titleI18nKey)}</div>       </div>       <div class="topbar-right">         <select class="lang-select" aria-label="Select Language">           <option value="en">English</option>           <option value="kn">ಕನ್ನಡ</option>         </select>         <a href="${base}pages/profile.html" class="user-pill">           <span class="user-avatar" id="topbarAvatar">F</span>           <span class="user-name" id="topbarUserName">Farmer</span>         </a>       </div>     `;
}

const toggleMenu = open => {
sidebarEl?.classList.toggle('open', open);
overlay.classList.toggle('open', open);
};

document.getElementById('sidebarToggleBtn')?.addEventListener('click', () => toggleMenu(true));
document.getElementById('sidebarCloseBtn')?.addEventListener('click', () => toggleMenu(false));
overlay.addEventListener('click', () => toggleMenu(false));

document.querySelectorAll('.lang-select').forEach(sel => {
sel.value = getLang();
sel.addEventListener('change', e => setLang(e.target.value));
});

applyTranslations();

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
if (isConfigured && auth) {
await signOut(auth);
}
localStorage.removeItem('farmsathi_demo_user');
window.location.href = `${base}login.html`;
});

// Resolve Auth User + Profile
return new Promise(resolve => {
if (!isConfigured || !auth) {
const demo = JSON.parse(localStorage.getItem('farmsathi_demo_user') || 'null') || {
uid: 'preview-farmer',
name: 'Ramesh Gowda (Preview)',
email: '[demo@farmsathi.in](mailto:demo@farmsathi.in)',
state: 'Karnataka',
district: 'Mandya',
primaryCrop: 'Paddy'
};
const nameEl = document.getElementById('topbarUserName');
const avatarEl = document.getElementById('topbarAvatar');
if (nameEl) nameEl.textContent = demo.name;
if (avatarEl) avatarEl.textContent = (demo.name || 'F')[0].toUpperCase();
resolve({ user: demo, profile: demo, isDemoAuth: true });
return;
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = `${base}login.html`;
    return;
  }
  let profile = {
    uid: user.uid,
    name: user.displayName || 'Farmer',
    email: user.email,
    state: 'Karnataka',
    district: 'Mandya',
    primaryCrop: 'Paddy'
  };
  try {
    const snap = await getDoc(doc(db, 'Users', user.uid));
    if (snap.exists()) {
      profile = { ...profile, ...snap.data() };
      if (profile.preferredLanguage && !localStorage.getItem('farmsathi_lang')) {
        setLang(profile.preferredLanguage);
      }
    }
  } catch (err) {
    console.warn('Could not load user profile:', err);
  }

  const nameEl = document.getElementById('topbarUserName');
  const avatarEl = document.getElementById('topbarAvatar');
  if (nameEl) nameEl.textContent = profile.name;
  if (avatarEl) avatarEl.textContent = (profile.name || 'F')[0].toUpperCase();

  resolve({ user, profile, isDemoAuth: false });
});

});
}
