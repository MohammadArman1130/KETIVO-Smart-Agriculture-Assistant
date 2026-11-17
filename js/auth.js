import {
  auth,
  db,
  isConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  doc,
  setDoc,
  serverTimestamp
} from './firebase-client.js';
import { applyTranslations, getLang, setLang, t } from './translations.js';

applyTranslations();

document.querySelectorAll('.lang-select').forEach(sel => {
  sel.value = getLang();
  sel.addEventListener('change', e => setLang(e.target.value));
});

const configBanner = document.getElementById('firebaseNotice');
if (!isConfigured && configBanner) {
  configBanner.classList.remove('hidden');
}

function showAuthMsg(id, msg, isError = true) {
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = msg;
  box.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
  box.classList.remove('hidden');
}

// LOGIN FORM
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginSubmitBtn');

    if (!email || !password) {
      return showAuthMsg('authAlert', t('err_required'));
    }

    if (!isConfigured) {
      localStorage.setItem(
        'farmsathi_demo_user',
        JSON.stringify({
          uid: 'preview-farmer',
          name: email.split('@')[0],
          email,
          state: 'Karnataka',
          district: 'Mandya',
          primaryCrop: 'Paddy'
        })
      );
      window.location.href = 'dashboard.html';
      return;
    }

    btn.disabled = true;
    btn.textContent = t('loading');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAuthMsg('authAlert', err.message.replace('Firebase: ', ''));
    } finally {
      btn.disabled = false;
      btn.textContent = t('login_btn');
    }
  });

  document.getElementById('forgotPwBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) {
      return showAuthMsg('authAlert', getLang() === 'kn' ? 'ದಯವಿಟ್ಟು ಮೊದಲು ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ.' : 'Please enter your email address first.');
    }
    if (!isConfigured) {
      return showAuthMsg('authAlert', t('firebase_missing_notice'));
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showAuthMsg('authAlert', getLang() === 'kn' ? 'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಇಮೇಲ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.' : 'Password reset email sent! Check your inbox.', false);
    } catch (err) {
      showAuthMsg('authAlert', err.message.replace('Firebase: ', ''));
    }
  });
}

// REGISTER FORM
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const state = document.getElementById('regState').value.trim();
    const district = document.getElementById('regDistrict').value.trim();
    const primaryCrop = document.getElementById('regCrop').value.trim();
    const password = document.getElementById('regPassword').value;
    const btn = document.getElementById('registerSubmitBtn');

    if (!name || !email || !state || !district || password.length < 6) {
      return showAuthMsg(
        'authAlert',
        getLang() === 'kn'
          ? 'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ (ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು).'
          : 'Please complete all required fields (password must be at least 6 characters).'
      );
    }

    if (!isConfigured) {
      localStorage.setItem(
        'farmsathi_demo_user',
        JSON.stringify({ uid: 'preview-farmer', name, phone, email, state, district, primaryCrop })
      );
      window.location.href = 'dashboard.html';
      return;
    }

    btn.disabled = true;
    btn.textContent = t('loading');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, 'Users', cred.user.uid), {
        uid: cred.user.uid,
        name,
        phone,
        email,
        state,
        district,
        primaryCrop: primaryCrop || 'Paddy',
        preferredLanguage: getLang(),
        createdAt: serverTimestamp()
      });
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAuthMsg('authAlert', err.message.replace('Firebase: ', ''));
    } finally {
      btn.disabled = false;
      btn.textContent = t('register_btn');
    }
  });
}