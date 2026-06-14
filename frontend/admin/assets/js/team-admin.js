// ============================================================
// SAMARTH PROPERTIES — Admin Team Management
// File: frontend/admin/assets/js/team-admin.js
// ============================================================

(function teamAdmin() {
  'use strict';

  initAdminShell('Team', [{ label: 'Team' }]);

  const tbody       = document.getElementById('team-tbody');
  const countEl     = document.getElementById('team-count');
  const addBtn      = document.getElementById('add-member-btn');
  const drawerTitle = document.getElementById('team-drawer-title');
  const drawerClose = document.getElementById('team-drawer-close');
  const drawerCancel= document.getElementById('team-drawer-cancel');
  const backdrop    = document.getElementById('team-drawer-backdrop');
  const saveBtn     = document.getElementById('team-save-btn');
  const form        = document.getElementById('team-form');
  const photoInput  = document.getElementById('tm-photo');
  const photoPreview= document.getElementById('tm-photo-preview');
  const photoImg    = document.getElementById('tm-photo-img');

  drawerClose?.addEventListener('click',  () => closeDrawer('team-drawer', 'team-drawer-backdrop'));
  drawerCancel?.addEventListener('click', () => closeDrawer('team-drawer', 'team-drawer-backdrop'));
  backdrop?.addEventListener('click',     () => closeDrawer('team-drawer', 'team-drawer-backdrop'));

  photoInput?.addEventListener('input', () => {
    const url = photoInput.value.trim();
    if (url) { photoImg.src = url; photoPreview.style.display = ''; }
    else     { photoPreview.style.display = 'none'; }
  });

  // ── Load ──────────────────────────────────────────────────
  async function loadTeam() {
    renderAdmSkeletonRows(tbody, 7, 5);
    try {
      const res     = await AdminAPI.team.list();
      const members = res.data || [];

      if (countEl) countEl.textContent = `${members.length} member${members.length !== 1 ? 's' : ''}`;

      if (!members.length) {
        tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="7">
          <div class="adm-empty"><div class="adm-empty__icon">👥</div>
          <p class="adm-empty__title">No team members yet</p>
          <p class="adm-empty__desc">Add your first team member to display them on the About page.</p>
          <button class="adm-btn adm-btn--primary" onclick="document.getElementById('add-member-btn').click()">Add Member</button></div>
        </td></tr>`;
        return;
      }

      const sorted = [...members].sort((a, b) => (a.display_order || 99) - (b.display_order || 99));
      tbody.innerHTML = sorted.map(m => `
        <tr>
          <td>
            ${m.photo_url
              ? `<img class="adm-table__img" src="${m.photo_url}" alt="${m.name}" loading="lazy" style="border-radius:50%;width:44px;height:44px;">`
              : `<div class="adm-table__img-placeholder" style="border-radius:50%;width:44px;height:44px;">${(m.name||'?').slice(0,2).toUpperCase()}</div>`}
          </td>
          <td><p class="adm-table__primary">${m.name}</p></td>
          <td>${m.designation || '—'}</td>
          <td>${m.email ? `<a href="mailto:${m.email}" style="color:var(--adm-text-sm);">${m.email}</a>` : '—'}</td>
          <td>${m.phone ? `<a href="tel:${m.phone}" style="color:var(--adm-text-sm);">${m.phone}</a>` : '—'}</td>
          <td style="text-align:center;">${m.display_order || '—'}</td>
          <td>
            <div class="adm-row-actions">
              <button class="adm-btn adm-btn--ghost adm-btn--sm" onclick="window._team.editMember('${m.id}')" title="Edit">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button class="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon" onclick="window._team.deleteMember('${m.id}','${m.name}')" title="Delete">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          </td>
        </tr>`).join('');
    } catch (err) {
      tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="7">
        <div class="adm-empty"><div class="adm-empty__icon">⚠️</div>
        <p class="adm-empty__title">Failed to load team</p>
        <p class="adm-empty__desc">${err.message}</p></div>
      </td></tr>`;
    }
  }

  // ── Open drawer ───────────────────────────────────────────
  let editingId = null;

  function openAddDrawer() {
    editingId = null;
    form.reset();
    photoPreview.style.display = 'none';
    document.getElementById('tm-order').value = '1';
    if (drawerTitle) drawerTitle.textContent = 'Add Team Member';
    openDrawer('team-drawer', 'team-drawer-backdrop');
  }

  async function editMember(id) {
    editingId = id;
    form.reset();
    photoPreview.style.display = 'none';
    if (drawerTitle) drawerTitle.textContent = 'Edit Team Member';
    openDrawer('team-drawer', 'team-drawer-backdrop');

    try {
      const res  = await AdminAPI.team.list();
      const m    = (res.data || []).find(x => x.id === id);
      if (!m) return;

      document.getElementById('tm-id').value          = m.id;
      document.getElementById('tm-name').value        = m.name || '';
      document.getElementById('tm-designation').value = m.designation || '';
      document.getElementById('tm-email').value       = m.email || '';
      document.getElementById('tm-phone').value       = m.phone || '';
      document.getElementById('tm-bio').value         = m.bio || '';
      document.getElementById('tm-photo').value       = m.photo_url || '';
      document.getElementById('tm-linkedin').value    = m.linkedin_url || '';
      document.getElementById('tm-order').value       = m.display_order || 1;

      if (m.photo_url) { photoImg.src = m.photo_url; photoPreview.style.display = ''; }
    } catch (err) { adminToast('error', 'Load failed', err.message); }
  }

  // ── Save ──────────────────────────────────────────────────
  saveBtn?.addEventListener('click', async () => {
    const nameVal = document.getElementById('tm-name').value.trim();
    const desigVal = document.getElementById('tm-designation').value.trim();
    if (!nameVal)  { adminToast('warning', 'Name required', ''); return; }
    if (!desigVal) { adminToast('warning', 'Designation required', ''); return; }

    const orig = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="adm-spinner"></span> Saving…';

    const payload = {
      name:          nameVal,
      designation:   desigVal,
      email:         document.getElementById('tm-email').value.trim() || undefined,
      phone:         document.getElementById('tm-phone').value.trim() || undefined,
      bio:           document.getElementById('tm-bio').value.trim() || undefined,
      photo_url:     document.getElementById('tm-photo').value.trim() || undefined,
      linkedin_url:  document.getElementById('tm-linkedin').value.trim() || undefined,
      display_order: Number(document.getElementById('tm-order').value) || 1,
    };

    try {
      if (editingId) {
        await AdminAPI.team.update(editingId, payload);
        adminToast('success', 'Member updated', '');
      } else {
        await AdminAPI.team.create(payload);
        adminToast('success', 'Member added', `${nameVal} has been added to the team.`);
      }
      closeDrawer('team-drawer', 'team-drawer-backdrop');
      loadTeam();
    } catch (err) {
      adminToast('error', 'Save failed', err.message);
    } finally {
      saveBtn.disabled  = false;
      saveBtn.innerHTML = orig;
    }
  });

  // ── Delete ────────────────────────────────────────────────
  async function deleteMember(id, name) {
    const ok = await adminConfirm({ title: 'Remove Team Member', desc: `Remove "${name}" from the team?`, icon: '👤', type: 'danger' });
    if (!ok) return;
    try {
      await AdminAPI.team.delete(id);
      adminToast('success', 'Member removed', '');
      loadTeam();
    } catch (err) { adminToast('error', 'Delete failed', err.message); }
  }

  addBtn?.addEventListener('click', openAddDrawer);

  window._team = { editMember, deleteMember };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTeam);
  } else {
    loadTeam();
  }
})();
