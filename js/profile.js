import { initAppShell, showToast } from './shell.js';
import { auth, db, isConfigured, doc, updateDoc, updateProfile, sendPasswordResetEmail } from './firebase-client.js';
import { getLang, setLang, t } from './translations.js';

const isSettings = Boolean(document.getElementById('settingsForm'));
const ctx = await initAppShell(isSettings ? 'settings' : 'profile', isSettings ? 'settings_title' : 'profile_title');

if (!isSettings && document.getElementById('profileForm')) {
  document.getElementById('profName').value = ctx.profile.name || '';
  document.getElementById('profPhone').value = ctx.profile.phone || '';
  document.getElementById('profState').value = ctx.profile.state || '';
  document.getElementById('profDistrict').value = ctx.profile.district || '';
  document.getElementById('profCrop').value = ctx.profile.primaryCrop || '';
  document.getElementById('profEmail').value = ctx.profile.email || '';

  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();

    const updates = {
      name: document.getElementById('profName').value.trim(),
      phone: document.getElementById('profPhone').value.trim(),
      state: document.getElementById('profState').value.trim(),
      district: document.getElementById('profDistrict').value.trim(),
      primaryCrop: document.getElementById('profCrop').value.trim()
    };

    try {
      if (isConfigured && db && auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: updates.name });
        await updateDoc(doc(db, 'Users', auth.currentUser.uid), updates);
      } else {
        localStorage.setItem('farmsathi_demo_user', JSON.stringify({ ...ctx.profile, ...updates }));
      }

      document.getElementById('topbarUserName').textContent = updates.name;
      showToast('Profile updated successfully!');

    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

if (isSettings) {
  const langInput = document.getElementById('settingLang');
  langInput.value = getLang();

  document.getElementById('settingsForm').addEventListener('submit', async e => {
    e.preventDefault();

    const chosenLang = langInput.value;
    setLang(chosenLang);

    if (isConfigured && db && auth?.currentUser) {
      await updateDoc(doc(db, 'Users', auth.currentUser.uid), { preferredLanguage: chosenLang });
    }

    showToast('Settings saved!');
  });

  document.getElementById('resetPwSettingsBtn')?.addEventListener('click', async () => {
    if (!isConfigured || !auth?.currentUser?.email) {
      return showToast(t('firebase_missing_notice'), 'error');
    }

    await sendPasswordResetEmail(auth, auth.currentUser.email);
    showToast('Password reset link sent to ' + auth.currentUser.email);
  });
}