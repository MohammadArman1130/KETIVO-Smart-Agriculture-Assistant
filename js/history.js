import { initAppShell, saveFarmingHistory, showToast } from './shell.js';
import { db, isConfigured, collection, query, where, orderBy, getDocs, deleteDoc, doc } from './firebase-client.js';
import { t } from './translations.js';

const ctx = await initAppShell('history', 'history_title');
let allRecords = [];

async function loadHistory() {
  const list = document.getElementById('historyTableBody');
  list.innerHTML = `<tr><td colspan="4">${t('loading')}</td></tr>`;
  allRecords = [];

  if (isConfigured && db) {
    try {
      const q = query(
        collection(db, 'FarmingHistory'),
        where('uid', '==', ctx.profile.uid),
        orderBy('createdAtISO', 'desc')
      );
      const snap = await getDocs(q);
      snap.forEach(d => allRecords.push({ id: d.id, ...d.data() }));
    } catch (err) {
      showToast(err.message, 'error');
    }
  } else {
    allRecords = JSON.parse(localStorage.getItem('farmsathi_local_history') || '[]');
  }
  renderTable();
}

function renderTable() {
  const filter = document.getElementById('historyFilter').value;
  const rows = filter === 'All' ? allRecords : allRecords.filter(r => r.category === filter);
  const tbody = document.getElementById('historyTableBody');

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('no_activities')}</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      r => `<tr>
        <td><span class="badge badge-green">${r.category}</span></td>
        <td><strong>${r.title}</strong><br><small style="color:var(--text-muted);">${r.summary || ''}</small></td>
        <td>${(r.createdAtISO || '').slice(0, 10)}</td>
        <td><button class="btn btn-sm btn-outline del-rec-btn" data-id="${r.id}">Delete</button></td>
      </tr>`
    )
    .join('');

  document.querySelectorAll('.del-rec-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (isConfigured && db && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'FarmingHistory', id));
      } else {
        const local = JSON.parse(localStorage.getItem('farmsathi_local_history') || '[]').filter(x => x.id !== id);
        localStorage.setItem('farmsathi_local_history', JSON.stringify(local));
      }
      showToast('Record removed');
      loadHistory();
    });
  });
}

document.getElementById('historyFilter').addEventListener('change', renderTable);

document.getElementById('addNoteForm').addEventListener('submit', async e => {
  e.preventDefault();
  const category = document.getElementById('noteCategory').value;
  const title = document.getElementById('noteTitle').value.trim();
  const summary = document.getElementById('noteSummary').value.trim();
  if (!title) return showToast(t('err_required'), 'error');

  await saveFarmingHistory(ctx.profile.uid, { category, title, summary });
  e.target.reset();
  showToast(t('saved_ok'));
  loadHistory();
});

loadHistory();