/* ===== ResumeElite app.js ===== */

// ---- State ----
const state = {
  template: 'classic',
  accentColor: '#2563eb',
  photo: null,
  personal: { 
    firstName: '', lastName: '', jobTitle: '', email: '', phone: '', 
    city: '', country: '', linkedin: '', website: '', 
    dob: '', pob: '', driverLicense: '', gender: '', nationality: '', 
    civilStatus: '', customField: '' 
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
  certifications: [],
  internships: [],
  activities: [],
  hobbies: '',
  courses: [],
  references: [],
  qualities: [],
  achievements: [],
  signature: { text: '', image: null },
  footer: '',
  custom: { title: 'Custom Section', content: '' },
  sectionOrder: [
    'summary', 'experience', 'education', 'skills', 'languages', 
    'projects', 'certifications', 'internships', 'activities', 
    'hobbies', 'courses', 'references', 'qualities', 'achievements', 
    'signature', 'footer', 'custom'
  ],
  visibleSections: ['summary', 'experience', 'education', 'skills']
};

const defaultState = JSON.parse(JSON.stringify(state));
const personalFieldKeys = Object.keys(defaultState.personal);
const defaultVisibleSections = ['summary', 'experience', 'education', 'skills', 'languages', 'projects', 'certifications'];

let zoom = 1;

// ---- Section Drag & Drop ----
let draggedSection = null;

// ---- Item Drag & Drop ----
let draggedItem = null;
let draggedType = null;
let draggedIndex = null;

function initSectionDragging() {
  const container = document.querySelector('.form-scroll');
  const sections = document.querySelectorAll('.form-section:not(#section-personal)');

  sections.forEach(section => {
    const header = section.querySelector('.section-header');
    header.setAttribute('draggable', 'true');

    header.addEventListener('dragstart', (e) => {
      draggedSection = section;
      section.classList.add('section-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    header.addEventListener('dragend', () => {
      section.classList.remove('section-dragging');
      draggedSection = null;
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('section-drag-over'));
    });

    section.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!draggedSection || draggedSection === section) return;
      section.classList.add('section-drag-over');
    });

    section.addEventListener('dragleave', () => {
      section.classList.remove('section-drag-over');
    });

    section.addEventListener('drop', (e) => {
      e.preventDefault();
      section.classList.remove('section-drag-over');
      if (!draggedSection || draggedSection === section) return;

      const allSections = Array.from(document.querySelectorAll('.form-section'));
      const fromIndex = allSections.indexOf(draggedSection);
      const toIndex = allSections.indexOf(section);

      if (fromIndex < toIndex) {
        section.after(draggedSection);
      } else {
        section.before(draggedSection);
      }

      updateSectionOrder();
      renderPreview();
      saveToStorage();
    });
  });
}

function updateSectionOrder() {
  const sections = document.querySelectorAll('.form-section:not(#section-personal)');
  state.sectionOrder = Array.from(sections).map(s => s.id.replace('section-', ''));
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('resume-preview')) {
    // Landing page
    initLanding();
    return;
  }
  loadFromStorage();
  initFromUrl();
  bindTemplateButtons();
  bindTemplateToggle();
  bindAccentColor();
  bindPersonalFields();
  bindSummaryField();
  bindSimpleFields();
  bindPhotoUpload();
  bindDownloadBtn();
  renderAllDynamic();
  syncTemplateButtons();
  renderTemplateThumbnails();
  renderPreview();
  bindClearBtn();
  initSectionDragging();
  window.addEventListener('resize', applyZoom);
});

// ---- Landing ----
function initLanding() {
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-template')) return;
      const t = card.dataset.template;
      window.location.href = `editor.html?template=${t}`;
    });
  });
}

function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get('template');
  if (t && getTemplateIds().includes(t)) {
    state.template = t;
  }
}

// ---- Storage ----
function saveToStorage() {
  try { localStorage.setItem('rf_state', JSON.stringify(state)); } catch (e) { }
}
function loadFromStorage() {
  try {
    const s = localStorage.getItem('rf_state');
    if (s) Object.assign(state, JSON.parse(s));
    normalizeState();
    if (state.accentColor) {
      document.getElementById('accent-color').value = state.accentColor;
    }
    if (state.sectionOrder) {
      reorderFormSections();
    }
  } catch (e) { }
}

function normalizeState() {
  state.personal = { ...defaultState.personal, ...(state.personal || {}) };
  state.signature = { ...defaultState.signature, ...(state.signature || {}) };
  state.custom = { ...defaultState.custom, ...(state.custom || {}) };

  [
    'experience', 'education', 'skills', 'languages', 'projects', 'certifications',
    'internships', 'activities', 'courses', 'references', 'qualities', 'achievements'
  ].forEach(key => {
    if (!Array.isArray(state[key])) state[key] = [];
  });

  if (!Array.isArray(state.sectionOrder)) {
    state.sectionOrder = [...defaultState.sectionOrder];
  } else {
    state.sectionOrder = [
      ...state.sectionOrder.filter(id => defaultState.sectionOrder.includes(id)),
      ...defaultState.sectionOrder.filter(id => !state.sectionOrder.includes(id))
    ];
  }

  const storedVisible = Array.isArray(state.visibleSections) ? state.visibleSections : [];
  state.visibleSections = [
    ...defaultVisibleSections,
    ...storedVisible.filter(id => defaultState.sectionOrder.includes(id))
  ].filter((id, index, arr) => arr.indexOf(id) === index);
}

function reorderFormSections() {
  const container = document.querySelector('.form-scroll');
  if (!container || !state.sectionOrder) return;

  state.sectionOrder.forEach(id => {
    const el = document.getElementById(`section-${id}`);
    if (el) container.appendChild(el);
  });
}

// ---- Template Buttons ----
function bindTemplateButtons() {
  document.querySelectorAll('.tmpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.template = btn.dataset.tmpl;
      syncTemplateButtons();
      renderPreview();
      saveToStorage();
    });
  });
}

function bindTemplateToggle() {
  const toggle = document.getElementById('template-toggle');
  const group = document.querySelector('.template-toolbar-group');
  if (!toggle || !group) return;

  toggle.addEventListener('click', () => {
    group.classList.toggle('is-collapsed');
    toggle.setAttribute('aria-expanded', String(!group.classList.contains('is-collapsed')));
  });
}

function getTemplateIds() {
  return Array.from(document.querySelectorAll('.tmpl-btn')).map(btn => btn.dataset.tmpl);
}

function syncTemplateButtons() {
  document.querySelectorAll('.tmpl-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tmpl === state.template);
  });
}

// ---- Accent Color ----
function bindAccentColor() {
  const input = document.getElementById('accent-color');
  if (!input) return;
  input.addEventListener('input', () => {
    state.accentColor = input.value;
    renderTemplateThumbnails();
    renderPreview();
    saveToStorage();
  });
}

// ---- Personal Fields ----
function bindPersonalFields() {
  document.querySelectorAll('[data-field]').forEach(el => {
    const field = el.dataset.field;
    if (el.id === 'summary' || !field || field.includes('.') || !personalFieldKeys.includes(field)) return;
    
    // Set initial value from state
    el.value = state.personal[field] || '';
    
    // If field has data, show its container if it's hidden
    if (el.value) {
      const row = el.closest('.form-row, .form-group');
      if (row && (row.id.startsWith('row-') || row.classList.contains('hidden'))) {
        row.classList.remove('hidden');
      }
    }
    
    el.addEventListener('input', () => {
      state.personal[field] = el.value;
      renderPreview();
      saveToStorage();
    });
  });
}

function toggleExtraField(id) {
  const row = document.getElementById(`row-${id}`);
  if (row) {
    row.classList.toggle('hidden');
  }
}

function bindSummaryField() {
  const el = document.getElementById('summary');
  if (!el) return;
  el.value = state.summary;
  el.addEventListener('input', () => { state.summary = el.value; renderPreview(); saveToStorage(); });
}

function bindSimpleFields() {
  const mappings = [
    { id: 'hobbies', stateKey: 'hobbies' },
    { id: 'footer', stateKey: 'footer' },
    { id: 'signatureText', stateKey: 'signature', subKey: 'text' },
    { id: 'customTitle', stateKey: 'custom', subKey: 'title' },
    { id: 'customContent', stateKey: 'custom', subKey: 'content' }
  ];

  mappings.forEach(m => {
    const el = document.getElementById(m.id);
    if (!el) return;
    if (m.subKey) {
      el.value = state[m.stateKey][m.subKey] || '';
      el.addEventListener('input', () => {
        state[m.stateKey][m.subKey] = el.value;
        renderPreview();
        saveToStorage();
      });
    } else {
      el.value = state[m.stateKey] || '';
      el.addEventListener('input', () => {
        state[m.stateKey] = el.value;
        renderPreview();
        saveToStorage();
      });
    }
  });
}


// ---- Photo Upload ----
function bindPhotoUpload() {
  const input = document.getElementById('photo-input');
  const removeBtn = document.getElementById('remove-photo-btn');
  if (!input) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      state.photo = e.target.result;
      updatePhotoPreview();
      renderPreview();
      saveToStorage();
    };
    reader.readAsDataURL(file);
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      state.photo = null;
      input.value = '';
      updatePhotoPreview();
      renderPreview();
      saveToStorage();
    });
  }

  updatePhotoPreview();
}

function updatePhotoPreview() {
  const preview = document.getElementById('photo-preview');
  const removeBtn = document.getElementById('remove-photo-btn');
  if (!preview) return;

  if (state.photo) {
    preview.innerHTML = `<img src="${state.photo}" alt="Photo" />`;
    if (removeBtn) removeBtn.classList.remove('hidden');
    return;
  }

  preview.innerHTML = `
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  `;
  if (removeBtn) removeBtn.classList.add('hidden');
}

// ---- Section toggle ----
function toggleSection(id) {
  const body = document.getElementById(`body-${id}`);
  const icon = document.getElementById(`collapse-${id}`);
  if (!body) return;
  body.classList.toggle('hidden');
  icon.classList.toggle('collapsed');
}

// ---- Clear ----
function bindClearBtn() {
  const btn = document.getElementById('clear-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!confirm('Clear all resume data?')) return;
    localStorage.removeItem('rf_state');
    location.reload();
  });
}

// ---- Zoom ----
function zoomIn() { zoom = Math.min(zoom + 0.1, 1.5); applyZoom(); }
function zoomOut() { zoom = Math.max(zoom - 0.1, 0.4); applyZoom(); }
function resetZoom() { zoom = 1; applyZoom(); }
function applyZoom() {
  const w = document.getElementById('preview-wrapper');
  const page = document.getElementById('resume-preview');
  const scroll = document.querySelector('.preview-scroll');
  if (w && page && scroll) {
    const isNarrow = window.matchMedia('(max-width: 768px)').matches;
    const pageWidth = page.offsetWidth || 794;
    const pageHeight = page.offsetHeight || 1122;
    const fitScale = isNarrow ? Math.min(1, Math.max(0.28, (scroll.clientWidth - 24) / pageWidth)) : 1;
    const scale = fitScale * zoom;

    w.style.transform = `scale(${scale})`;
    w.style.transformOrigin = isNarrow ? 'top left' : 'top center';
    w.style.width = isNarrow ? `${pageWidth * scale}px` : '';
    w.style.height = isNarrow ? `${pageHeight * scale}px` : '';
  }
  const lbl = document.getElementById('zoom-level');
  if (lbl) lbl.textContent = Math.round(zoom * 100) + '%';
}

// ============================================================
// ---- DYNAMIC ENTRIES ----
// ============================================================

function renderAllDynamic() {
  renderList('experience', renderExperienceForm, state.experience);
  renderList('education', renderEducationForm, state.education);
  renderList('skills', renderSkillForm, state.skills);
  renderList('languages', renderLanguageForm, state.languages);
  renderList('projects', renderProjectForm, state.projects);
  renderList('certifications', renderCertificationForm, state.certifications);
}

function renderList(type, renderer, list) {
  const container = document.getElementById(`${type}-list`);
  if (!container) return;
  container.innerHTML = '';
  list.forEach((item, i) => {
    container.appendChild(renderer(item, i));
  });
}

function makeEntry(title, subtitle, content, removeCallback, type, index) {
  const card = document.createElement('div');
  card.className = 'entry-card collapsed';
  card.setAttribute('draggable', 'true');

  const render = () => {
    if (card.classList.contains('collapsed')) {
      card.innerHTML = `
        <div class="entry-summary">
          <div class="entry-summary-text">
            <div class="entry-summary-title">${esc(title) || 'Untitled'}</div>
            <div class="entry-summary-subtitle">${esc(subtitle) || 'Click to edit'}</div>
          </div>
          <button class="btn-edit-entry">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      `;
      card.onclick = () => { card.classList.remove('collapsed'); card.classList.add('expanded'); render(); };
    } else {
      card.innerHTML = '';
      card.onclick = null;
      const form = document.createElement('div');
      form.className = 'entry-form';
      form.appendChild(content);

      const footer = document.createElement('div');
      footer.className = 'entry-footer';
      
      const btnDel = document.createElement('button');
      btnDel.className = 'btn-delete-card';
      btnDel.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
      btnDel.onclick = (e) => { e.stopPropagation(); removeCallback(); };

      const btnDone = document.createElement('button');
      btnDone.className = 'btn-done';
      btnDone.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Done';
      btnDone.onclick = (e) => { 
        e.stopPropagation(); 
        card.classList.remove('expanded'); 
        card.classList.add('collapsed'); 
        renderAllDynamic();
      };

      footer.appendChild(btnDel);
      footer.appendChild(btnDone);
      form.appendChild(footer);
      card.appendChild(form);
    }
  };

  render();

  // Drag Events
  card.addEventListener('dragstart', (e) => {
    draggedItem = card;
    draggedType = type;
    draggedIndex = index;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.style.opacity = '0.4', 0);
  });
  card.addEventListener('dragend', () => { card.style.opacity = '1'; card.classList.remove('dragging'); document.querySelectorAll('.entry-card').forEach(c => c.classList.remove('drag-over')); });
  card.addEventListener('dragover', (e) => { e.preventDefault(); if (draggedType !== type) return; card.classList.add('drag-over'); e.dataTransfer.dropEffect = 'move'; });
  card.addEventListener('dragleave', () => { card.classList.remove('drag-over'); });
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    if (draggedType !== type || draggedIndex === index) return;
    const list = state[type];
    const itemToMove = list.splice(draggedIndex, 1)[0];
    list.splice(index, 0, itemToMove);
    renderAllDynamic();
    renderPreview();
    saveToStorage();
  });

  return card;
}

function makeInput(label, val, onInput, placeholder = '') {
  const g = document.createElement('div');
  g.className = 'form-group';
  g.innerHTML = `<label>${label}</label><input type="text" value="${esc(val)}" placeholder="${placeholder}" />`;
  g.querySelector('input').addEventListener('input', e => onInput(e.target.value));
  return g;
}
function makeDateDropdowns(label, value, onInput, includePresent = false) {
  const g = document.createElement('div');
  g.className = 'form-group';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = [];
  const currYear = new Date().getFullYear();
  for (let y = currYear + 10; y >= 1950; y--) years.push(y);

  let mVal = '', yVal = '', isPresent = (value === 'Present');
  if (!isPresent && value) {
    const pts = String(value).split(' ');
    if (pts.length === 2) { mVal = pts[0]; yVal = pts[1]; }
    else if (pts.length === 1 && !isNaN(pts[0])) { yVal = pts[0]; }
  }

  const update = () => {
    if (includePresent && isPresent) onInput('Present');
    else if (mVal && yVal) onInput(`${mVal} ${yVal}`);
    else if (yVal) onInput(yVal);
    else onInput('');
  };

  g.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
      <label style="margin:0;">${label}</label>
      ${includePresent ? `
        <div class="present-toggle">
          <label class="switch">
            <input type="checkbox" ${isPresent ? 'checked' : ''} />
            <span class="slider"></span>
          </label>
          <span>Present</span>
        </div>
      ` : ''}
    </div>
    <div class="date-select-row">
      <select class="m-select"><option value="">Month</option>${months.map(m => `<option value="${m}" ${m === mVal ? 'selected' : ''}>${m}</option>`).join('')}</select>
      <select class="y-select"><option value="">Year</option>${years.map(y => `<option value="${y}" ${String(y) === String(yVal) ? 'selected' : ''}>${y}</option>`).join('')}</select>
    </div>
  `;

  const mSel = g.querySelector('.m-select');
  const ySel = g.querySelector('.y-select');
  
  const setDisabled = (dis) => {
    mSel.disabled = ySel.disabled = dis;
    mSel.style.opacity = ySel.style.opacity = dis ? '0.5' : '1';
  };
  setDisabled(isPresent);

  mSel.onchange = e => { mVal = e.target.value; update(); };
  ySel.onchange = e => { yVal = e.target.value; update(); };

  if (includePresent) {
    g.querySelector('input').onchange = e => {
      isPresent = e.target.checked;
      setDisabled(isPresent);
      if (isPresent) { mSel.value = ''; ySel.value = ''; mVal = ''; yVal = ''; }
      update();
    };
  }

  return g;
}

function makeRichText(label, val, onInput, placeholder = '') {
  const g = document.createElement('div');
  g.className = 'form-group';
  g.innerHTML = `
    <label>${label}</label>
    <div class="rt-toolbar">
      <button class="rt-btn" title="Bold"><b>B</b></button>
      <button class="rt-btn" title="Italic" style="font-style:italic">I</button>
      <button class="rt-btn" title="Underline" style="text-decoration:underline">U</button>
      <div class="rt-divider"></div>
      <button class="rt-btn" title="Link">🔗</button>
      <div class="rt-divider"></div>
      <button class="rt-btn" title="Bulleted List">⁝≡</button>
      <button class="rt-btn" title="Numbered List">1≡</button>
      <div class="rt-divider"></div>
      <button class="rt-btn" title="Align Left">≡</button>
      <button class="rt-btn" title="Align Center">⌄</button>
      <button class="rt-btn btn-ai-spark">✨ AI Suggestions</button>
    </div>
    <textarea class="rt-area" rows="4" placeholder="${placeholder}">${esc(val)}</textarea>
  `;
  g.querySelector('textarea').addEventListener('input', e => onInput(e.target.value));
  return g;
}
function makeTextarea(label, val, onInput, placeholder = '', rows = 3) {
  const g = document.createElement('div');
  g.className = 'form-group';
  g.innerHTML = `<label>${label}</label><textarea rows="${rows}" placeholder="${placeholder}">${esc(val)}</textarea>`;
  g.querySelector('textarea').addEventListener('input', e => onInput(e.target.value));
  return g;
}
function makeRow(...children) {
  const row = document.createElement('div');
  row.className = 'form-row';
  children.forEach(c => row.appendChild(c));
  return row;
}
function makeSelect(label, val, options, onInput) {
  const g = document.createElement('div');
  g.className = 'form-group';
  const sel = document.createElement('select');
  options.forEach(o => { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; if (o === val) opt.selected = true; sel.appendChild(opt); });
  sel.addEventListener('change', e => onInput(e.target.value));
  g.innerHTML = `<label>${label}</label>`;
  g.appendChild(sel);
  return g;
}

// --- Experience ---
function addExperience() {
  state.experience.push({ company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '' });
  renderListClean('experience', buildExperienceCard, state.experience);
  renderPreview(); saveToStorage();
}
function removeExperience(i) {
  state.experience.splice(i, 1);
  renderListClean('experience', buildExperienceCard, state.experience);
  renderPreview(); saveToStorage();
}
function buildExperienceCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeInput('Position', item.position, v => { item.position = v; rp(); saveToStorage(); }, 'Job title'));
  wrap.appendChild(makeRow(
    makeInput('Employer', item.company, v => { item.company = v; rp(); saveToStorage(); }, 'Company name'),
    makeInput('City', item.location || '', v => { item.location = v; rp(); saveToStorage(); }, 'City, Country')
  ));
  wrap.appendChild(makeRow(
    makeDateDropdowns('Start date', item.startDate, v => { item.startDate = v; rp(); saveToStorage(); }),
    makeDateDropdowns('End date', item.endDate, v => { item.endDate = v; rp(); saveToStorage(); }, true)
  ));
  wrap.appendChild(makeRichText('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'Start typing here...'));
  
  const title = item.position || 'Job Title';
  const sub = [item.company, item.location].filter(Boolean).join(', ') || 'Employer, City';
  return makeEntry(title, sub, wrap, () => removeExperience(i), 'experience', i);
}

// --- Education ---
function addEducation() {
  state.education.push({ institution: '', degree: '', field: '', location: '', startDate: '', endDate: '', description: '' });
  renderListClean('education', buildEducationCard, state.education);
  renderPreview(); saveToStorage();
}
function removeEducation(i) {
  state.education.splice(i, 1);
  renderListClean('education', buildEducationCard, state.education);
  renderPreview(); saveToStorage();
}
function buildEducationCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeInput('Education', item.degree, v => { item.degree = v; rp(); saveToStorage(); }, 'Degree / Field of study'));
  wrap.appendChild(makeRow(
    makeInput('School', item.institution, v => { item.institution = v; rp(); saveToStorage(); }, 'University name'),
    makeInput('City', item.location || '', v => { item.location = v; rp(); saveToStorage(); }, 'City, Country')
  ));
  wrap.appendChild(makeRow(
    makeDateDropdowns('Start date', item.startDate, v => { item.startDate = v; rp(); saveToStorage(); }),
    makeDateDropdowns('End date', item.endDate, v => { item.endDate = v; rp(); saveToStorage(); }, true)
  ));
  wrap.appendChild(makeRichText('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'Start typing here...'));
  
  const title = item.degree || 'Degree';
  const sub = [item.institution, item.location].filter(Boolean).join(', ') || 'School, City';
  return makeEntry(title, sub, wrap, () => removeEducation(i), 'education', i);
}

// --- Skills ---
function addSkill() {
  state.skills.push({ name: '', level: 'Proficient' });
  renderListClean('skills', buildSkillCard, state.skills);
  renderPreview(); saveToStorage();
}
function removeSkill(i) {
  state.skills.splice(i, 1);
  renderListClean('skills', buildSkillCard, state.skills);
  renderPreview(); saveToStorage();
}
function buildSkillCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeRow(
    makeInput('Skill', item.name, v => { item.name = v; rp(); saveToStorage(); }, 'JavaScript'),
    makeSelect('Level', item.level, ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert', 'Proficient'], v => { item.level = v; rp(); saveToStorage(); })
  ));
  return makeEntry(item.name || 'Skill', item.level || 'Level', wrap, () => removeSkill(i), 'skills', i);
}

// --- Languages ---
function addLanguage() {
  state.languages.push({ name: '', proficiency: 'Fluent' });
  renderListClean('languages', buildLanguageCard, state.languages);
  renderPreview(); saveToStorage();
}
function removeLanguage(i) {
  state.languages.splice(i, 1);
  renderListClean('languages', buildLanguageCard, state.languages);
  renderPreview(); saveToStorage();
}
function buildLanguageCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeRow(
    makeInput('Language', item.name, v => { item.name = v; rp(); saveToStorage(); }, 'English'),
    makeSelect('Proficiency', item.proficiency, ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Beginner'], v => { item.proficiency = v; rp(); saveToStorage(); })
  ));
  return makeEntry(item.name || 'Language', item.proficiency || 'Proficiency', wrap, () => removeLanguage(i), 'languages', i);
}

// --- Projects ---
function addProject() {
  state.projects.push({ name: '', url: '', description: '', tech: '' });
  renderListClean('projects', buildProjectCard, state.projects);
  renderPreview(); saveToStorage();
}
function removeProject(i) {
  state.projects.splice(i, 1);
  renderListClean('projects', buildProjectCard, state.projects);
  renderPreview(); saveToStorage();
}
function buildProjectCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeRow(
    makeInput('Project Name', item.name, v => { item.name = v; rp(); saveToStorage(); }, 'My App'),
    makeInput('URL / Link', item.url, v => { item.url = v; rp(); saveToStorage(); }, 'github.com/...')
  ));
  wrap.appendChild(makeInput('Technologies', item.tech, v => { item.tech = v; rp(); saveToStorage(); }, 'React, Node.js, PostgreSQL'));
  wrap.appendChild(makeRichText('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'What the project does...'));
  return makeEntry(item.name || 'Project Name', item.tech || 'Technologies', wrap, () => removeProject(i), 'projects', i);
}

// --- Certifications ---
function addCertification() {
  state.certifications.push({ name: '', issuer: '', date: '', url: '' });
  renderListClean('certifications', buildCertCard, state.certifications);
  renderPreview(); saveToStorage();
}
function removeCertification(i) {
  state.certifications.splice(i, 1);
  renderListClean('certifications', buildCertCard, state.certifications);
  renderPreview(); saveToStorage();
}
function buildCertCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeRow(
    makeInput('Certification', item.name, v => { item.name = v; rp(); saveToStorage(); }, 'AWS Certified'),
    makeInput('Issuing Org', item.issuer, v => { item.issuer = v; rp(); saveToStorage(); }, 'Amazon')
  ));
  wrap.appendChild(makeRow(
    makeDateDropdowns('Date', item.date, v => { item.date = v; rp(); saveToStorage(); }),
    makeInput('URL', item.url, v => { item.url = v; rp(); saveToStorage(); }, 'credential link')
  ));
  return makeEntry(item.name || 'Certification', item.issuer || 'Issuing Org', wrap, () => removeCertification(i), 'certifications', i);
}

// Helper to render list directly with card builder
function renderListClean(type, builder, list) {
  const container = document.getElementById(`${type}-list`);
  if (!container) return;
  container.innerHTML = '';
  list.forEach((item, i) => container.appendChild(builder(item, i)));
}

// --- Internships ---
function addInternship() {
  state.internships.push({ company: '', position: '', location: '', startDate: '', endDate: '', description: '' });
  renderListClean('internships', buildInternshipCard, state.internships);
  rp(); saveToStorage();
}
function removeInternship(i) {
  state.internships.splice(i, 1);
  renderListClean('internships', buildInternshipCard, state.internships);
  rp(); saveToStorage();
}
function buildInternshipCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeInput('Position', item.position, v => { item.position = v; rp(); saveToStorage(); }, 'Intern title'));
  wrap.appendChild(makeRow(
    makeInput('Employer', item.company, v => { item.company = v; rp(); saveToStorage(); }, 'Company name'),
    makeInput('City', item.location || '', v => { item.location = v; rp(); saveToStorage(); }, 'City, Country')
  ));
  wrap.appendChild(makeRow(
    makeDateDropdowns('Start date', item.startDate, v => { item.startDate = v; rp(); saveToStorage(); }),
    makeDateDropdowns('End date', item.endDate, v => { item.endDate = v; rp(); saveToStorage(); }, true)
  ));
  wrap.appendChild(makeRichText('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'What you did...'));
  return makeEntry(item.position || 'Internship', item.company || 'Company', wrap, () => removeInternship(i), 'internships', i);
}

// --- Activities ---
function addActivity() {
  state.activities.push({ name: '', organization: '', date: '', description: '' });
  renderListClean('activities', buildActivityCard, state.activities);
  rp(); saveToStorage();
}
function removeActivity(i) {
  state.activities.splice(i, 1);
  renderListClean('activities', buildActivityCard, state.activities);
  rp(); saveToStorage();
}
function buildActivityCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeInput('Activity Name', item.name, v => { item.name = v; rp(); saveToStorage(); }, 'Volunteer, Member...'));
  wrap.appendChild(makeInput('Organization', item.organization, v => { item.organization = v; rp(); saveToStorage(); }, 'Club, Non-profit...'));
  wrap.appendChild(makeDateDropdowns('Date', item.date, v => { item.date = v; rp(); saveToStorage(); }));
  wrap.appendChild(makeRichText('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'Details...'));
  return makeEntry(item.name || 'Activity', item.organization || 'Organization', wrap, () => removeActivity(i), 'activities', i);
}

// --- Courses ---
function addCourse() {
  state.courses.push({ name: '', institution: '', date: '' });
  renderListClean('courses', buildCourseCard, state.courses);
  rp(); saveToStorage();
}
function removeCourse(i) {
  state.courses.splice(i, 1);
  renderListClean('courses', buildCourseCard, state.courses);
  rp(); saveToStorage();
}
function buildCourseCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeInput('Course Name', item.name, v => { item.name = v; rp(); saveToStorage(); }, 'Computer Science 101'));
  wrap.appendChild(makeInput('Institution', item.institution, v => { item.institution = v; rp(); saveToStorage(); }, 'Coursera, University...'));
  wrap.appendChild(makeDateDropdowns('Date', item.date, v => { item.date = v; rp(); saveToStorage(); }));
  return makeEntry(item.name || 'Course', item.institution || 'Institution', wrap, () => removeCourse(i), 'courses', i);
}

// --- References ---
function addReference() {
  state.references.push({ name: '', company: '', email: '', phone: '' });
  renderListClean('references', buildReferenceCard, state.references);
  rp(); saveToStorage();
}
function removeReference(i) {
  state.references.splice(i, 1);
  renderListClean('references', buildReferenceCard, state.references);
  rp(); saveToStorage();
}
function buildReferenceCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeRow(
    makeInput('Full Name', item.name, v => { item.name = v; rp(); saveToStorage(); }, 'John Smith'),
    makeInput('Company', item.company, v => { item.company = v; rp(); saveToStorage(); }, 'Company X')
  ));
  wrap.appendChild(makeRow(
    makeInput('Email', item.email, v => { item.email = v; rp(); saveToStorage(); }, 'john@example.com'),
    makeInput('Phone', item.phone, v => { item.phone = v; rp(); saveToStorage(); }, '+1 234...')
  ));
  return makeEntry(item.name || 'Reference', item.company || 'Company', wrap, () => removeReference(i), 'references', i);
}

// --- Qualities ---
function addQuality() {
  state.qualities.push({ name: '' });
  renderListClean('qualities', buildQualityCard, state.qualities);
  rp(); saveToStorage();
}
function removeQuality(i) {
  state.qualities.splice(i, 1);
  renderListClean('qualities', buildQualityCard, state.qualities);
  rp(); saveToStorage();
}
function buildQualityCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeInput('Quality', item.name, v => { item.name = v; rp(); saveToStorage(); }, 'Problem Solver'));
  return makeEntry(item.name || 'Quality', '', wrap, () => removeQuality(i), 'qualities', i);
}

// --- Achievements ---
function addAchievement() {
  state.achievements.push({ name: '', description: '' });
  renderListClean('achievements', buildAchievementCard, state.achievements);
  rp(); saveToStorage();
}
function removeAchievement(i) {
  state.achievements.splice(i, 1);
  renderListClean('achievements', buildAchievementCard, state.achievements);
  rp(); saveToStorage();
}
function buildAchievementCard(item, i) {
  const wrap = document.createElement('div');
  wrap.appendChild(makeInput('Achievement', item.name, v => { item.name = v; rp(); saveToStorage(); }, 'Employee of the Month'));
  wrap.appendChild(makeTextarea('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'Short description...'));
  return makeEntry(item.name || 'Achievement', '', wrap, () => removeAchievement(i), 'achievements', i);
}

function toggleAddSectionPopover() {
  const popover = document.getElementById('add-section-popover');
  const btn = document.getElementById('add-section-toggle-btn');
  if (popover) {
    popover.classList.toggle('hidden');
    if (btn) {
      btn.querySelector('svg').style.transform = popover.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }
}

// Section Toggling
function toggleVisibleSection(id) {
  const section = document.getElementById(`section-${id}`);
  const btn = document.querySelector(`.btn-popover-item[onclick="toggleVisibleSection('${id}')"]`);
  
  if (state.visibleSections.includes(id)) {
    state.visibleSections = state.visibleSections.filter(sid => sid !== id);
    if (section) section.classList.add('hidden');
    if (btn) btn.classList.remove('active');
  } else {
    state.visibleSections.push(id);
    if (section) section.classList.remove('hidden');
    if (btn) btn.classList.add('active');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Close popover after adding
    setTimeout(() => {
      const popover = document.getElementById('add-section-popover');
      if (popover) popover.classList.add('hidden');
      const toggleBtn = document.getElementById('add-section-toggle-btn');
      if (toggleBtn) toggleBtn.querySelector('svg').style.transform = 'rotate(0deg)';
    }, 300);
  }
  renderPreview();
  saveToStorage();
}



// Override renderAllDynamic to use clean builders
function renderAllDynamic() {
  renderListClean('experience', buildExperienceCard, state.experience);
  renderListClean('education', buildEducationCard, state.education);
  renderListClean('skills', buildSkillCard, state.skills);
  renderListClean('languages', buildLanguageCard, state.languages);
  renderListClean('projects', buildProjectCard, state.projects);
  renderListClean('certifications', buildCertCard, state.certifications);
  
  // New sections
  renderListClean('internships', buildInternshipCard, state.internships);
  renderListClean('activities', buildActivityCard, state.activities);
  renderListClean('courses', buildCourseCard, state.courses);
  renderListClean('references', buildReferenceCard, state.references);
  renderListClean('qualities', buildQualityCard, state.qualities);
  renderListClean('achievements', buildAchievementCard, state.achievements);

  // Simple text fields
  const hobbiesEl = document.getElementById('hobbies');
  if (hobbiesEl) hobbiesEl.value = state.hobbies || '';
  
  const footerEl = document.getElementById('footer');
  if (footerEl) footerEl.value = state.footer || '';

  const sigTextEl = document.getElementById('signatureText');
  if (sigTextEl) sigTextEl.value = state.signature.text || '';

  const customTitleEl = document.getElementById('customTitle');
  if (customTitleEl) customTitleEl.value = state.custom.title || '';

  const customContentEl = document.getElementById('customContent');
  if (customContentEl) customContentEl.value = state.custom.content || '';

  // Update visible sections buttons and sidebar
  updateSectionVisibilityUI();
}

function updateSectionVisibilityUI() {
  defaultState.sectionOrder.forEach(id => {
    const section = document.getElementById(`section-${id}`);
    if (section) section.classList.toggle('hidden', !state.visibleSections.includes(id));
    const btn = document.querySelector(`.btn-popover-item[onclick="toggleVisibleSection('${id}')"]`);
    if (btn) btn.classList.toggle('active', state.visibleSections.includes(id));
  });
}



// shorthand
function rp() { renderPreview(); }

// ============================================================
// ---- RESUME PREVIEW RENDERER ----
// ============================================================

function renderPreview() {
  const preview = document.getElementById('resume-preview');
  if (!preview) return;
  const accent = state.accentColor || '#2563eb';
  const accentLight = hexToRgba(accent, 0.12);
  preview.style.setProperty('--resume-accent', accent);
  preview.style.setProperty('--resume-accent-light', accentLight);

  const tmpl = state.template;
  const html = buildTemplateHtml(tmpl);

  preview.className = `resume-page tmpl-${tmpl}`;
  preview.innerHTML = html;
  preview.style.setProperty('--resume-accent', accent);
  preview.style.setProperty('--resume-accent-light', accentLight);
  requestAnimationFrame(() => {
    paginateResume(preview);
    applyZoom();
  });
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      paginateResume(preview);
      applyZoom();
    });
  }
}

function paginateResume(root, options = {}) {
  if (!root) return;
  const pageHeight = options.pageHeight || 1122;
  const pageGap = options.gap ?? 14;
  const bottomGuard = options.bottomGuard || 24;
  const rootStyle = getComputedStyle(root);
  const rootTopPadding = parseFloat(rootStyle.paddingTop) || 0;
  const pagePitch = pageHeight + pageGap;
  const selector = [
    '.r-section',
    '.m-section',
    '.prof-section',
    '.md-section',
    '.mf-section',
    '.ep-section',
    '.tl-item',
    '.cp-item',
    '.ed-section'
  ].join(',');

  root.querySelectorAll('.resume-page-spacer').forEach(el => el.remove());
  root.querySelectorAll('.resume-page-gap-visual').forEach(el => el.remove());
  root.querySelectorAll('.resume-page-break-before').forEach(el => el.classList.remove('resume-page-break-before'));
  root.style.removeProperty('min-height');

  const getTop = (el) => el.getBoundingClientRect().top - root.getBoundingClientRect().top;
  const candidates = Array.from(root.querySelectorAll(selector))
    // We now ALLOW sidebar elements to be paginated, so they break correctly!
    .filter(el => el.offsetParent !== null && el.offsetHeight > 0)
    .sort((a, b) => {
      const aTop = getTop(a);
      const bTop = getTop(b);
      return aTop - bTop;
    });

  const visualGapsAdded = new Set();

  candidates.forEach(el => {
    const top = getTop(el);
    const height = el.getBoundingClientRect().height;
    if (height >= pageHeight - 120) return;

    const pageStart = Math.floor(top / pagePitch) * pagePitch;
    const pageEnd = pageStart + pageHeight;
    const bottom = top + height;
    if (top > pageStart + bottomGuard && bottom > pageEnd - bottomGuard) {
      const parentTopPadding = parseFloat(getComputedStyle(el.parentElement).paddingTop) || 0;
      const nextPageTopPadding = Math.max(rootTopPadding, parentTopPadding, 34);
      const remainingPageSpace = Math.max(0, pageEnd - top);
      const spacerHeight = remainingPageSpace + pageGap + nextPageTopPadding;
      
      // 1. Physical spacer (pushes content inside the specific template column)
      const spacer = document.createElement('div');
      spacer.className = 'resume-page-spacer';
      spacer.style.height = `${Math.ceil(spacerHeight)}px`;
      el.classList.add('resume-page-break-before');
      el.parentNode.insertBefore(spacer, el);
      
      // 2. Visual gap overlay (attached to root to span the entire paper width)
      // We only want ONE visual gap per physical page boundary to avoid dark overlapping shadows.
      if (!visualGapsAdded.has(pageEnd)) {
        visualGapsAdded.add(pageEnd);
        const visualGap = document.createElement('div');
        visualGap.className = 'resume-page-gap-visual';
        visualGap.style.setProperty('--resume-page-gap', `${pageGap}px`);
        visualGap.style.setProperty('--resume-page-remainder', `${Math.ceil(remainingPageSpace)}px`);
        visualGap.style.setProperty('--spacer-y', `${Math.ceil(top)}px`);
        visualGap.style.height = `${Math.ceil(spacerHeight)}px`;
        root.appendChild(visualGap);
      }
    }
  });

  const totalHeight = Math.max(root.scrollHeight, pageHeight);
  const pageCount = Math.max(1, Math.ceil((totalHeight + pageGap) / pagePitch));
  root.style.minHeight = `${(pageCount * pageHeight) + ((pageCount - 1) * pageGap)}px`;
}

function buildTemplateHtml(tmpl) {
  switch (tmpl) {
    case 'classic': return buildClassic();
    case 'modern': return buildModern();
    case 'creative': return buildCreative();
    case 'minimal': return buildMinimal();
    case 'executive': return buildExecutive();
    case 'tech': return buildTech();
    case 'elegant': return buildElegant();
    case 'bold': return buildBold();
    case 'startup': return buildStartup();
    case 'corporate': return buildCorporate();
    case 'professional': return buildProfessional();
    case 'modern-dark': return buildModernDark();
    case 'classic-blue': return buildClassicBlue();
    case 'minimal-formal': return buildMinimalFormal();
    case 'traditional-serif': return buildTraditionalSerif();
    case 'europass': return buildEuropass();
    case 'modern-right': return buildModernRight();
    case 'nordic': return buildNordic();
    case 'timeline': return buildTimeline();
    case 'mono': return buildMono();
    case 'compact': return buildCompact();
    case 'portfolio': return buildPortfolio();
    case 'graduate': return buildGraduate();
    case 'clean-sidebar': return buildCleanSidebar();
    case 'editorial': return buildEditorial();
    default: return buildClassic();
  }
}

function renderTemplateThumbnails() {
  const thumbs = document.querySelectorAll('.tmpl-thumb');
  if (!thumbs.length) return;

  thumbs.forEach(thumb => {
    const btn = thumb.closest('.tmpl-btn');
    if (!btn) return;
    const tmpl = btn.dataset.tmpl;
    const html = buildTemplateThumbnailHtml(tmpl);
    thumb.innerHTML = `<div class="thumbnail-page resume-page tmpl-${tmpl}">${html}</div>`;
  });
}

function buildTemplateThumbnailHtml(tmpl) {
  const original = snapshotThumbnailState();
  const originalTemplate = state.template;
  applyThumbnailState(tmpl);

  let html = '';
  try {
    html = buildTemplateHtml(tmpl);
  } finally {
    restoreThumbnailState(original, originalTemplate);
  }
  return html;
}

function snapshotThumbnailState() {
  return {
    accentColor: state.accentColor,
    photo: state.photo,
    personal: { ...state.personal },
    summary: state.summary,
    experience: state.experience,
    education: state.education,
    skills: state.skills,
    languages: state.languages,
    projects: state.projects,
    certifications: state.certifications,
    internships: state.internships,
    activities: state.activities,
    hobbies: state.hobbies,
    courses: state.courses,
    references: state.references,
    qualities: state.qualities,
    achievements: state.achievements,
    signature: { ...state.signature },
    footer: state.footer,
    custom: { ...state.custom },
    visibleSections: state.visibleSections
  };
}

function applyThumbnailState(tmpl) {
  state.template = tmpl;
  state.accentColor = state.accentColor || '#2563eb';
  state.photo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23dbeafe'/%3E%3Ccircle cx='60' cy='44' r='24' fill='%2393c5fd'/%3E%3Cpath d='M20 118c6-30 28-48 40-48s34 18 40 48' fill='%232563eb'/%3E%3C/svg%3E";
  Object.assign(state.personal, {
    firstName: 'Josephine',
    lastName: 'Fournier',
    jobTitle: 'Product Designer',
    email: 'josephine@email.com',
    phone: '+1 555 0199',
    city: 'Paris',
    country: 'France',
    linkedin: 'linkedin.com/in/josephine'
  });
  state.summary = 'Creative professional with experience building clear, elegant products and leading cross-functional projects.';
  state.experience = [
    { position: 'Senior Designer', company: 'Studio North', location: 'Paris', startDate: '2022', endDate: 'Present', description: 'Led product design systems and improved user workflows across web and mobile platforms.' },
    { position: 'Designer', company: 'Blue Labs', location: 'Lyon', startDate: '2019', endDate: '2022', description: 'Created brand, UX and visual design assets for SaaS and editorial teams.' }
  ];
  state.education = [
    { institution: 'Design Academy', degree: 'BA Visual Design', field: '', location: 'Paris', startDate: '2015', endDate: '2019', description: '' }
  ];
  state.skills = [
    { name: 'Product Design', level: 90 },
    { name: 'Brand Systems', level: 82 },
    { name: 'Research', level: 76 }
  ];
  state.languages = [
    { name: 'French', level: 'Native' },
    { name: 'English', level: 'Fluent' }
  ];
  state.projects = [
    { name: 'Portfolio Platform', tech: 'Figma, Web', url: '', description: 'Designed a modular profile builder.' }
  ];
  state.certifications = [
    { name: 'UX Strategy', issuer: 'Design Guild', date: '2023', description: '' }
  ];
  state.internships = [
    { position: 'Design Intern', company: 'Atelier UI', location: 'Paris', startDate: '2018', endDate: '2019', description: 'Supported research and visual design delivery.' }
  ];
  state.activities = [
    { name: 'Design Club Mentor', organization: 'Local University', date: '2021', description: 'Mentored students on portfolio projects.' }
  ];
  state.hobbies = 'Photography, typography, travel';
  state.courses = [
    { name: 'Design Systems Foundations', institution: 'Interaction School', date: '2024' }
  ];
  state.references = [
    { name: 'Marie Laurent', company: 'Studio North', email: 'marie@example.com', phone: '+1 555 0100' }
  ];
  state.qualities = [
    { name: 'Detail-oriented' },
    { name: 'Collaborative' }
  ];
  state.achievements = [
    { name: 'Design Excellence Award', description: 'Recognized for improving onboarding clarity.' }
  ];
  state.signature = { text: 'Josephine Fournier', image: null };
  state.footer = 'ResumeElite sample resume';
  state.custom = { title: 'Selected Work', content: 'Available portfolio case studies on request.' };
  state.visibleSections = ['summary', 'experience', 'education', 'skills', 'languages', 'projects', 'certifications'];
}

function restoreThumbnailState(original, originalTemplate) {
  state.template = originalTemplate;
  state.accentColor = original.accentColor;
  state.photo = original.photo;
  Object.assign(state.personal, original.personal);
  state.summary = original.summary;
  state.experience = original.experience;
  state.education = original.education;
  state.skills = original.skills;
  state.languages = original.languages;
  state.projects = original.projects;
  state.certifications = original.certifications;
  state.internships = original.internships;
  state.activities = original.activities;
  state.hobbies = original.hobbies;
  state.courses = original.courses;
  state.references = original.references;
  state.qualities = original.qualities;
  state.achievements = original.achievements;
  state.signature = original.signature;
  state.footer = original.footer;
  state.custom = original.custom;
  state.visibleSections = original.visibleSections;
}

// ---- Shared helpers ----
const p = state.personal;
function esc(str = '') { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function linkify(type, val) {
  if (!val) return '';
  let href = val;
  if (type === 'email') href = `mailto:${val}`;
  if (type === 'phone') href = `tel:${val.replace(/\s+/g, '')}`;
  if (type === 'website' || type === 'linkedin') {
    if (!/^https?:\/\//i.test(val)) href = `https://${val}`;
  }
  return `<a href="${href}" target="_blank" style="color:inherit;text-decoration:none;">${esc(val)}</a>`;
}
function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function getName() { const f = state.personal.firstName, l = state.personal.lastName; return (f || l) ? esc(f) + ' ' + esc(l) : 'Your Name'; }
function getTitle() { return esc(state.personal.jobTitle) || 'Job Title'; }
function formatBullets(str = '') {
  if (!str) return '';
  // Split by newline and filter empty
  const lines = str.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  
  // If it's just one line and doesn't look like a bullet, just return escaped text
  if (lines.length === 1 && !lines[0].startsWith('•') && !lines[0].startsWith('-') && !lines[0].startsWith('*')) {
    return esc(str);
  }

  // Convert to UL/LI
  const listItems = lines.map(line => {
    // Remove existing bullet characters from the start
    const clean = line.replace(/^[•\-\*\u2022]\s*/, '');
    return `<li>${esc(clean)}</li>`;
  }).join('');
  
  return `<ul>${listItems}</ul>`;
}
function avatarHtml(cls = 'r-avatar', phClass = 'r-avatar-placeholder') {
  if (state.photo) return `<img src="${state.photo}" class="${cls}" alt="Profile" />`;
  return `<div class="${phClass}"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>`;
}

function getIcon(type, tmpl) {
  const isSolid = (tmpl === 'modern-dark' || tmpl === 'bold');
  const svgIcons = ['modern', 'tech', 'professional', 'corporate', 'modern-dark', 'elegant', 'executive', 'startup', 'classic-blue', 'minimal-formal', 'traditional-serif', 'europass', 'modern-right', 'nordic', 'timeline', 'mono', 'compact', 'portfolio', 'graduate', 'clean-sidebar', 'editorial'];
  
  const outlinePaths = {
    email: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    location: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    website: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    dob: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    pob: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    license: '<rect x="1" y="3" width="22" height="18" rx="2" ry="2"/><path d="M7 8h10"/><path d="M7 12h10"/><path d="M7 16h6"/>',
    gender: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    nationality: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    civil: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>',
    custom: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'
  };

  const solidPaths = {
    email: '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor" stroke="none"/>',
    phone: '<path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.24-1.01c-.36-1.11-.56-2.3-.56-3.53 0-.55-.45-1-1-1H4.03c-.55 0-1 .45-1 1 0 9.39 7.63 17.02 17.02 17.02.55 0 1-.45 1-1v-3.52c0-.55-.45-1-1.02-1z" fill="currentColor" stroke="none"/>',
    location: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" fill="currentColor" stroke="none"/>',
    linkedin: '<path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a2.7 2.7 0 0 0-2.7-2.7c-1.1 0-1.9.6-2.2 1.2v-1h-2.5v7.8h2.5v-4.1c0-.7.6-1.3 1.3-1.3a1.3 1.3 0 0 1 1.3 1.3v4.1h2.5M6.7 8.3a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8m1.2 10.2V10.7H5.5v7.8h2.4z" fill="currentColor" stroke="none"/>',
    website: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" stroke="none"/>',
    dob: '<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor" stroke="none"/>',
    pob: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" stroke="none"/>',
    license: '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 12H5v-2h7v2zm8-4H5V8h15v4z" fill="currentColor" stroke="none"/>',
    gender: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" stroke="none"/>',
    nationality: '<path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" fill="currentColor" stroke="none"/>',
    civil: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" fill="currentColor" stroke="none"/>',
    custom: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" stroke="none"/>'
  };

  const emojis = {
    email: '✉', phone: '📞', location: '📍', linkedin: 'in', website: '🌐', dob: '📅', pob: '🏠', license: '🚗', gender: '👤', nationality: '🏳️', civil: '💍', custom: '📝'
  };

  if (svgIcons.includes(tmpl)) {
    const p = isSolid ? solidPaths : outlinePaths;
    const style = isSolid ? `fill="currentColor"` : `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    let pathContent = p[type] || '';
    // Use a safety margin by scaling the path down and centering it
    const safePath = `<g transform="translate(2, 2) scale(0.833)">${pathContent}</g>`;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" class="r-icon-svg" viewBox="0 0 24 24" ${style} style="display:inline-block; flex-shrink:0; overflow:visible;">${safePath}</svg>`;
    if (tmpl === 'modern-right') {
      return `<span class="mr-icon-bg">${svgStr}</span>`;
    }
    return svgStr;
  }
  return emojis[type] || '';
}

function contactItems(dark = false) {
  const p = state.personal;
  const tmpl = state.template;
  const color = dark ? 'color:#e2e8f0' : '';
  const items = [];
  if (p.email) items.push(`<span class="r-contact-item" style="${color}">${getIcon('email', tmpl)} ${linkify('email', p.email)}</span>`);
  if (p.phone) items.push(`<span class="r-contact-item" style="${color}">${getIcon('phone', tmpl)} ${linkify('phone', p.phone)}</span>`);
  if (p.city || p.country) items.push(`<span class="r-contact-item" style="${color}">${getIcon('location', tmpl)} ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>`);
  if (p.linkedin) items.push(`<span class="r-contact-item" style="${color}">${getIcon('linkedin', tmpl)} ${linkify('linkedin', p.linkedin)}</span>`);
  if (p.website) items.push(`<span class="r-contact-item" style="${color}">${getIcon('website', tmpl)} ${linkify('website', p.website)}</span>`);
  
  if (p.dob) items.push(`<span class="r-contact-item" style="${color}">${getIcon('dob', tmpl)} ${esc(p.dob)}</span>`);
  if (p.pob) items.push(`<span class="r-contact-item" style="${color}">${getIcon('pob', tmpl)} ${esc(p.pob)}</span>`);
  if (p.driverLicense) items.push(`<span class="r-contact-item" style="${color}">${getIcon('license', tmpl)} ${esc(p.driverLicense)}</span>`);
  if (p.gender) items.push(`<span class="r-contact-item" style="${color}">${getIcon('gender', tmpl)} ${esc(p.gender)}</span>`);
  if (p.nationality) items.push(`<span class="r-contact-item" style="${color}">${getIcon('nationality', tmpl)} ${esc(p.nationality)}</span>`);
  if (p.civilStatus) items.push(`<span class="r-contact-item" style="${color}">${getIcon('civil', tmpl)} ${esc(p.civilStatus)}</span>`);
  if (p.customField) items.push(`<span class="r-contact-item" style="${color}">${getIcon('custom', tmpl)} ${esc(p.customField)}</span>`);
  
  return items.length ? `<div class="r-contact">${items.join('')}</div>` : '';
}

function optionalPersonalContactItems(tmpl, className = '') {
  const p = state.personal;
  const cls = className ? ` class="${className}"` : '';
  return [
    p.dob ? `<span${cls}>${getIcon('dob', tmpl)} ${esc(p.dob)}</span>` : '',
    p.pob ? `<span${cls}>${getIcon('pob', tmpl)} ${esc(p.pob)}</span>` : '',
    p.driverLicense ? `<span${cls}>${getIcon('license', tmpl)} ${esc(p.driverLicense)}</span>` : '',
    p.gender ? `<span${cls}>${getIcon('gender', tmpl)} ${esc(p.gender)}</span>` : '',
    p.nationality ? `<span${cls}>${getIcon('nationality', tmpl)} ${esc(p.nationality)}</span>` : '',
    p.civilStatus ? `<span${cls}>${getIcon('civil', tmpl)} ${esc(p.civilStatus)}</span>` : '',
    p.customField ? `<span${cls}>${getIcon('custom', tmpl)} ${esc(p.customField)}</span>` : ''
  ].filter(Boolean);
}

function inlinePersonalContactValues(includeOptional = true) {
  const p = state.personal;
  return [
    (p.city || p.country) ? esc([p.city, p.country].filter(Boolean).join(', ')) : '',
    p.phone ? linkify('phone', p.phone) : '',
    p.email ? linkify('email', p.email) : '',
    p.linkedin ? linkify('linkedin', p.linkedin) : '',
    p.website ? linkify('website', p.website) : '',
    ...(includeOptional ? [p.dob, p.pob, p.driverLicense, p.gender, p.nationality, p.civilStatus, p.customField].filter(Boolean).map(esc) : [])
  ].filter(Boolean);
}
function sectionTitle(label) { return `<div class="r-section-title">${label}</div>`; }

const sectionMap = {
  summary: summarySection,
  experience: expSection,
  education: eduSection,
  skills: skillsSection,
  languages: langSection,
  projects: projSection,
  certifications: certSection,
  internships: internshipSection,
  activities: activitySection,
  hobbies: hobbySection,
  courses: courseSection,
  references: referenceSection,
  qualities: qualitySection,
  achievements: achievementSection,
  signature: signatureSection,
  footer: footerSection,
  custom: customSection
};

function renderOrderedSections(ids) {
  return orderedVisibleSectionIds(ids)
    .map(id => sectionMap[id] ? sectionMap[id]() : '')
    .join('');
}

function orderedVisibleSectionIds(ids) {
  const requested = Array.isArray(ids) ? ids : [];
  const order = Array.isArray(state.sectionOrder) ? state.sectionOrder : requested;
  const visible = Array.isArray(state.visibleSections) ? state.visibleSections : requested;
  return order
    .filter((id, index) => order.indexOf(id) === index)
    .filter(id => requested.includes(id) && visible.includes(id));
}

function summarySection() {
  if (!state.summary) return '';
  return `<div class="r-section">${sectionTitle('Professional Summary')}<p class="r-summary">${esc(state.summary)}</p></div>`;
}
function expSection() {
  const list = state.experience.filter(e => e.position || e.company);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="r-item">
      <div class="r-item-title">${esc(e.position)}</div>
      <div class="r-item-sub">${esc(e.company)}${e.location ? ' • ' + esc(e.location) : ''}${e.startDate ? ' • ' + esc(e.startDate) + ' – ' + (esc(e.endDate) || 'Present') : ''}</div>
      ${e.description ? `<div class="r-item-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('Work Experience')}${items}</div>`;
}
function eduSection() {
  const list = state.education.filter(e => e.degree || e.institution);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="r-item">
      <div class="r-item-title">${esc(e.degree)}${e.field ? ' in ' + esc(e.field) : ''}</div>
      <div class="r-item-sub">${esc(e.institution)}${e.location ? ' • ' + esc(e.location) : ''}${e.startDate ? ' • ' + esc(e.startDate) + ' – ' + (esc(e.endDate) || 'Present') : ''}</div>
      ${e.description ? `<div class="r-item-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('Education')}${items}</div>`;
}
function skillsSection() {
  const list = state.skills.filter(s => s.name && s.name.trim());
  if (!list.length) return '';
  const tags = list.map(s => `<span class="r-skill">${esc(s.name)}</span>`).join('');
  return `<div class="r-section">${sectionTitle('Skills')}<div class="r-skills">${tags}</div></div>`;
}
function langSection() {
  const list = state.languages.filter(l => l.name && l.name.trim());
  if (!list.length) return '';
  const items = list.map(l => `<div class="r-item"><div class="r-item-title">${esc(l.name)}</div><div class="r-item-sub">${esc(l.proficiency)}</div></div>`).join('');
  return `<div class="r-section">${sectionTitle('Languages')}${items}</div>`;
}
function projSection() {
  const list = state.projects.filter(p => p.name && p.name.trim());
  if (!list.length) return '';
  const items = list.map(pr => `
    <div class="r-item">
      <div class="r-item-title">${esc(pr.name)}${pr.url ? ` <span style="font-weight:400;font-size:0.78rem;color:var(--resume-accent)">↗ ${esc(pr.url)}</span>` : ''}</div>
      ${pr.tech ? `<div class="r-item-sub">${esc(pr.tech)}</div>` : ''}
      ${pr.description ? `<div class="r-item-desc">${esc(pr.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('Projects')}${items}</div>`;
}
function certSection() {
  const list = state.certifications.filter(c => c.name && c.name.trim());
  if (!list.length) return '';
  const items = list.map(c => `
    <div class="r-item"><div class="r-item-title">${esc(c.name)}</div>
    <div class="r-item-sub">${esc(c.issuer)}${c.date ? ' • ' + esc(c.date) : ''}</div></div>`).join('');
  return `<div class="r-section">${sectionTitle('Certifications')}${items}</div>`;
}

function internshipSection() {
  const list = state.internships.filter(e => e.position || e.company);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="r-item">
      <div class="r-item-title">${esc(e.position)}</div>
      <div class="r-item-sub">${esc(e.company)}${e.location ? ' • ' + esc(e.location) : ''}${e.startDate ? ' • ' + esc(e.startDate) + ' – ' + (esc(e.endDate) || 'Present') : ''}</div>
      ${e.description ? `<div class="r-item-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('Internships')}${items}</div>`;
}
function activitySection() {
  const list = state.activities.filter(a => a.name || a.organization);
  if (!list.length) return '';
  const items = list.map(a => `
    <div class="r-item">
      <div class="r-item-title">${esc(a.name)}</div>
      <div class="r-item-sub">${esc(a.organization)}${a.date ? ' • ' + esc(a.date) : ''}</div>
      ${a.description ? `<div class="r-item-desc">${esc(a.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('Extracurricular Activities')}${items}</div>`;
}
function hobbySection() {
  if (!state.hobbies) return '';
  return `<div class="r-section">${sectionTitle('Hobbies')}<p class="r-summary">${esc(state.hobbies)}</p></div>`;
}
function courseSection() {
  const list = state.courses.filter(c => c.name || c.institution);
  if (!list.length) return '';
  const items = list.map(c => `
    <div class="r-item">
      <div class="r-item-title">${esc(c.name)}</div>
      <div class="r-item-sub">${esc(c.institution)}${c.date ? ' • ' + esc(c.date) : ''}</div>
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('Courses')}${items}</div>`;
}
function referenceSection() {
  const list = state.references.filter(r => r.name || r.company);
  if (!list.length) return '';
  const items = list.map(r => `
    <div class="r-item">
      <div class="r-item-title">${esc(r.name)}</div>
      <div class="r-item-sub">${esc(r.company)}</div>
      <div class="r-item-desc">${[r.email, r.phone].filter(Boolean).join(' • ')}</div>
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('References')}${items}</div>`;
}
function qualitySection() {
  const list = state.qualities.filter(q => q.name && q.name.trim());
  if (!list.length) return '';
  const tags = list.map(q => `<span class="r-skill">${esc(q.name)}</span>`).join('');
  return `<div class="r-section">${sectionTitle('Qualities')}<div class="r-skills">${tags}</div></div>`;
}
function achievementSection() {
  const list = state.achievements.filter(a => a.name && a.name.trim());
  if (!list.length) return '';
  const items = list.map(a => `
    <div class="r-item">
      <div class="r-item-title">${esc(a.name)}</div>
      ${a.description ? `<div class="r-item-desc">${esc(a.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('Achievements')}${items}</div>`;
}
function signatureSection() {
  if (!state.signature.text) return '';
  return `<div class="r-section" style="margin-top:40px;text-align:right;">
    <div style="font-family:'Playfair Display', serif;font-size:1.5rem;font-style:italic;">${esc(state.signature.text)}</div>
    <div style="border-top:1px solid #ddd;display:inline-block;padding-top:5px;margin-top:5px;min-width:150px;text-align:center;">Signature</div>
  </div>`;
}
function footerSection() {
  if (!state.footer) return '';
  return `<div class="r-footer" style="margin-top:30px;padding-top:15px;font-size:0.75rem;color:#888;text-align:center;border-top:1px solid #eee;">${esc(state.footer)}</div>`;
}
function customSection() {
  if (!state.custom.content) return '';
  return `<div class="r-section">${sectionTitle(state.custom.title || 'Custom Section')}<div class="r-item-desc">${esc(state.custom.content)}</div></div>`;
}

// ---- Classic ----
function buildClassic() {
  return `
    <div class="r-header">
      ${avatarHtml()}
      <div>
        <div class="r-name">${getName()}</div>
        <div class="r-title">${getTitle()}</div>
        ${contactItems()}
      </div>
    </div>
    ${renderOrderedSections(['summary', 'experience', 'education', 'skills', 'languages', 'certifications', 'projects', 'internships', 'activities', 'hobbies', 'courses', 'references', 'qualities', 'achievements', 'custom', 'signature', 'footer'])}
  `;
}


function buildModern() {
  const contacts = inlinePersonalContactValues(true).join(', ');

  const mSectionMap = {
    summary: mSummarySection,
    experience: mExpSection,
    education: mEduSection,
    skills: mSkillsSection,
    languages: mLangSection,
    references: mRefSection,
    certifications: mCertSection,
    projects: mProjSection,
    internships: mInternshipSection,
    activities: mActivitySection,
    hobbies: mHobbySection,
    courses: mCourseSection,
    qualities: qualitySection,
    achievements: mAchievementSection,
    signature: signatureSection,
    footer: footerSection,
    custom: customSection
  };

  const sections = orderedVisibleSectionIds(state.sectionOrder)
    .map(id => mSectionMap[id] ? mSectionMap[id]() : '')
    .join('');

  return `
    <div class="m-container">
      <div class="m-header">
        ${state.photo ? `<div class="m-avatar-wrap">${avatarHtml('m-avatar', 'm-avatar-placeholder')}</div>` : ''}
        <div class="m-header-info">
          <div class="m-name">${getName()}${state.personal.jobTitle ? ', ' + getTitle() : ''}</div>
          <div class="m-contact">${contacts}</div>
        </div>
      </div>
      <div class="m-body">
        ${sections}
      </div>
    </div>
  `;
}

function mSectionWrapper(title, content) {
  if (!content) return '';
  return `
    <div class="m-section">
      <div class="m-section-left">
        <div class="m-section-title">${title}</div>
      </div>
      <div class="m-section-right">
        ${content}
      </div>
    </div>
  `;
}

function mSummarySection() {
  if (!state.summary) return '';
  return mSectionWrapper('Summary', `<p class="m-summary">${esc(state.summary)}</p>`);
}

function mExpSection() {
  const list = state.experience.filter(e => e.position || e.company);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="m-item-row">
      <div class="m-item-date">${e.startDate ? esc(e.startDate) + ' &mdash; ' + (esc(e.endDate) || 'Present') : ''}</div>
      <div class="m-item-details">
        <div class="m-item-title-row">
          <span class="m-item-title">${esc(e.position)}${e.company ? ', ' + esc(e.company) : ''}</span>
        </div>
        ${e.description ? `<div class="m-item-desc">${e.description.split('\n').map(line => line.trim() ? `<li>${esc(line)}</li>` : '').join('')}</div>` : ''}
      </div>
    </div>
  `).join('');
  return mSectionWrapper('Work Experience', items);
}

function mEduSection() {
  const list = state.education.filter(e => e.degree || e.institution);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="m-item-row">
      <div class="m-item-date">${e.startDate ? esc(e.startDate) + ' &mdash; ' + (esc(e.endDate) || 'Present') : ''}</div>
      <div class="m-item-details">
        <div class="m-item-title-row">
          <span class="m-item-title">${esc(e.degree)}${e.field ? ', ' + esc(e.field) : ''}</span>
        </div>
        ${e.institution ? `<div class="m-item-sub">${esc(e.institution)}</div>` : ''}
        ${e.description ? `<div class="m-item-desc">${e.description.split('\n').map(line => line.trim() ? `<li>${esc(line)}</li>` : '').join('')}</div>` : ''}
      </div>
    </div>
  `).join('');
  return mSectionWrapper('Education', items);
}

function mSkillsSection() {
  const list = state.skills.filter(s => s.name && s.name.trim());
  if (!list.length) return '';
  const items = list.map(s => `
    <div class="m-skill-item">
      <span class="m-skill-name">${esc(s.name)}</span>
      <span class="m-skill-level">${esc(s.level)}</span>
    </div>
  `).join('');
  return mSectionWrapper('Skills', `<div class="m-skills-grid">${items}</div>`);
}

function mLangSection() {
  const list = state.languages.filter(l => l.name && l.name.trim());
  if (!list.length) return '';
  const items = list.map(l => `
    <div class="m-skill-item">
      <span class="m-skill-name">${esc(l.name)}</span>
      <span class="m-skill-level">${esc(l.proficiency)}</span>
    </div>
  `).join('');
  return mSectionWrapper('Languages', `<div class="m-skills-grid">${items}</div>`);
}

function mRefSection() {
  const list = state.references.filter(r => r.name);
  if (!list.length) return '';
  const items = list.map(r => `
    <div class="m-ref-item">
      <div class="m-item-title">${esc(r.name)}${r.company ? ' &mdash; ' + esc(r.company) : ''}</div>
      <div class="m-ref-contact">${r.email ? esc(r.email) : ''}${r.email && r.phone ? ' &mdash; ' : ''}${r.phone ? esc(r.phone) : ''}</div>
    </div>
  `).join('');
  return mSectionWrapper('References', items);
}

function mCertSection() {
  const list = state.certifications.filter(c => c.name);
  if (!list.length) return '';
  const items = list.map(c => `
    <div class="m-item-row">
      <div class="m-item-date">${esc(c.date || '')}</div>
      <div class="m-item-details">
        <div class="m-item-title">${esc(c.name)}</div>
        <div class="m-item-sub">${esc(c.issuer || '')}</div>
        ${c.url ? `<div class="m-item-desc">${linkify('website', c.url)}</div>` : ''}
      </div>
    </div>
  `).join('');
  return mSectionWrapper('Certifications', items);
}

function mProjSection() {
  const list = state.projects.filter(p => p.name);
  if (!list.length) return '';
  const items = list.map(p => `
    <div class="m-item-row">
      <div class="m-item-date"></div>
      <div class="m-item-details">
        <div class="m-item-title">${esc(p.name)}${p.url ? ' &mdash; ' + linkify('website', p.url) : ''}</div>
        ${p.tech ? `<div class="m-item-sub">${esc(p.tech)}</div>` : ''}
        ${p.description ? `<div class="m-item-desc">${esc(p.description)}</div>` : ''}
      </div>
    </div>
  `).join('');
  return mSectionWrapper('Projects', items);
}

function mInternshipSection() {
  const list = state.internships.filter(e => e.position || e.company);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="m-item-row">
      <div class="m-item-date">${e.startDate ? esc(e.startDate) + ' &mdash; ' + (esc(e.endDate) || 'Present') : ''}</div>
      <div class="m-item-details">
        <div class="m-item-title">${esc(e.position)}${e.company ? ', ' + esc(e.company) : ''}</div>
        ${e.description ? `<div class="m-item-desc">${e.description.split('\n').map(line => line.trim() ? `<li>${esc(line)}</li>` : '').join('')}</div>` : ''}
      </div>
    </div>
  `).join('');
  return mSectionWrapper('Internships', items);
}

function mActivitySection() {
  const list = state.activities.filter(a => a.name || a.organization);
  if (!list.length) return '';
  const items = list.map(a => `
    <div class="m-item-row">
      <div class="m-item-date">${esc(a.date || '')}</div>
      <div class="m-item-details">
        <div class="m-item-title">${esc(a.name)}${a.organization ? ', ' + esc(a.organization) : ''}</div>
        ${a.description ? `<div class="m-item-desc">${a.description.split('\n').map(line => line.trim() ? `<li>${esc(line)}</li>` : '').join('')}</div>` : ''}
      </div>
    </div>
  `).join('');
  return mSectionWrapper('Activities', items);
}

function mHobbySection() {
  if (!state.hobbies || !state.hobbies.trim()) return '';
  return mSectionWrapper('Hobbies', `<p class="m-summary">${esc(state.hobbies)}</p>`);
}

function mCourseSection() {
  const list = state.courses.filter(c => c.name);
  if (!list.length) return '';
  const items = list.map(c => `
    <div class="m-item-row">
      <div class="m-item-date">${esc(c.date || '')}</div>
      <div class="m-item-details">
        <div class="m-item-title">${esc(c.name)}</div>
        <div class="m-item-sub">${esc(c.institution || '')}</div>
      </div>
    </div>
  `).join('');
  return mSectionWrapper('Courses', items);
}

function mAchievementSection() {
  const list = state.achievements.filter(a => a.name && a.name.trim());
  if (!list.length) return '';
  const items = list.map(a => `<li>${esc(a.name)}${a.description ? `: ${esc(a.description)}` : ''}</li>`).join('');
  return mSectionWrapper('Achievements', `<ul class="m-item-desc">${items}</ul>`);
}

function levelToWidth(level) {
  const map = { 'Beginner': 20, 'Elementary': 40, 'Intermediate': 60, 'Proficient': 75, 'Advanced': 85, 'Expert': 100, 'Fluent': 90, 'Native': 100 };
  return map[level] || 70;
}
function levelToDots(level) {
  const map = { 'Beginner': 1, 'Elementary': 2, 'Intermediate': 3, 'Proficient': 4, 'Advanced': 4, 'Expert': 5, 'Fluent': 5, 'Native': 5 };
  return map[level] || 3;
}

// ---- Creative ----
function buildCreative() {
  return `
    <div class="r-header">
      ${avatarHtml('r-avatar', 'r-avatar-placeholder')}
      <div>
        <div class="r-name">${getName()}</div>
        <div class="r-title">${getTitle()}</div>
        ${contactItems(true)}
      </div>
    </div>
    <div class="r-body">
      ${renderOrderedSections(['summary', 'experience', 'education', 'skills', 'languages', 'projects', 'certifications', 'internships', 'activities', 'hobbies', 'courses', 'references', 'qualities', 'achievements', 'custom', 'signature', 'footer'])}
    </div>
  `;
}

// ---- Minimal ----
function buildMinimal() {
  const p = state.personal;
  const contacts = [
    linkify('email', p.email), linkify('phone', p.phone), [p.city, p.country].filter(Boolean).join(', '), linkify('linkedin', p.linkedin), linkify('website', p.website),
    p.dob, p.pob, p.driverLicense, p.gender, p.nationality, p.civilStatus, p.customField
  ].filter(Boolean);
  return `
    <div class="r-name">${getName()}</div>
    <div class="r-title">${getTitle()}</div>
    <div class="r-divider"></div>
    ${contacts.length ? `<div class="r-contact">${contacts.map(c => `<span class="r-contact-item">${c}</span>`).join('')}</div>` : ''}
    ${renderOrderedSections(['summary', 'experience', 'education', 'skills', 'languages', 'projects', 'certifications', 'internships', 'activities', 'hobbies', 'courses', 'references', 'qualities', 'achievements', 'custom', 'signature', 'footer'])}
  `;
}
function buildMinimalExp() {
  if (!state.experience.length) return '';
  const items = state.experience.map(e => `
    <div class="r-item">
      <div class="r-item-header">
        <div class="r-item-title">${esc(e.position)} — ${esc(e.company)}</div>
        <div class="r-item-date">${e.startDate ? esc(e.startDate) + ' – ' + (esc(e.endDate) || 'Present') : ''}</div>
      </div>
      ${e.description ? `<div class="r-item-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section"><div class="r-section-title">Experience</div>${items}</div>`;
}
function buildMinimalEdu() {
  if (!state.education.length) return '';
  const items = state.education.map(e => `
    <div class="r-item">
      <div class="r-item-header">
        <div class="r-item-title">${esc(e.degree)}${e.field ? ' in ' + esc(e.field) : ''}</div>
        <div class="r-item-date">${e.startDate ? esc(e.startDate) + ' – ' + (esc(e.endDate) || 'Present') : ''}</div>
      </div>
      <div class="r-item-sub">${esc(e.institution)}</div>
    </div>`).join('');
  return `<div class="r-section"><div class="r-section-title">Education</div>${items}</div>`;
}

// ---- Executive ----
function buildExecutive() {
  const p = state.personal;
  const tmpl = state.template;
  const contacts = [];
  if (p.email) contacts.push(`<span class="r-contact-item">${getIcon('email', tmpl)} ${linkify('email', p.email)}</span>`);
  if (p.phone) contacts.push(`<span class="r-contact-item">${getIcon('phone', tmpl)} ${linkify('phone', p.phone)}</span>`);
  if (p.city || p.country) contacts.push(`<span class="r-contact-item">${getIcon('location', tmpl)} ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>`);
  if (p.linkedin) contacts.push(`<span class="r-contact-item">${getIcon('linkedin', tmpl)} ${linkify('linkedin', p.linkedin)}</span>`);
  if (p.website) contacts.push(`<span class="r-contact-item">${getIcon('website', tmpl)} ${linkify('website', p.website)}</span>`);
  if (p.dob) contacts.push(`<span class="r-contact-item">${getIcon('dob', tmpl)} ${esc(p.dob)}</span>`);
  if (p.pob) contacts.push(`<span class="r-contact-item">${getIcon('pob', tmpl)} ${esc(p.pob)}</span>`);
  if (p.driverLicense) contacts.push(`<span class="r-contact-item">${getIcon('license', tmpl)} ${esc(p.driverLicense)}</span>`);
  if (p.gender) contacts.push(`<span class="r-contact-item">${getIcon('gender', tmpl)} ${esc(p.gender)}</span>`);
  if (p.nationality) contacts.push(`<span class="r-contact-item">${getIcon('nationality', tmpl)} ${esc(p.nationality)}</span>`);
  if (p.civilStatus) contacts.push(`<span class="r-contact-item">${getIcon('civil', tmpl)} ${esc(p.civilStatus)}</span>`);
  if (p.customField) contacts.push(`<span class="r-contact-item">${getIcon('custom', tmpl)} ${esc(p.customField)}</span>`);

  return `
    <div class="r-header">
      <div class="r-name">${getName()}</div>
      <div class="r-title">${getTitle()}</div>
      ${contacts.length ? `<div class="r-contact">${contacts.join('')}</div>` : ''}
    </div>
    ${state.summary ? `<div class="r-section r-summary" style="margin-bottom:20px">${esc(state.summary)}</div>` : ''}
    <div class="r-body">
      <div>${renderOrderedSections(['experience', 'projects', 'internships', 'activities', 'achievements', 'custom'])}</div>
      <div>${renderOrderedSections(['education', 'skills', 'languages', 'certifications', 'hobbies', 'courses', 'references', 'qualities', 'signature', 'footer'])}</div>
    </div>
  `;
}

// ---- Tech ----
function buildTech() {
  const p = state.personal;
  const tmpl = state.template;
  const contacts = [];
  if (p.email) contacts.push(`<span class="r-contact-item">${getIcon('email', tmpl)} ${linkify('email', p.email)}</span>`);
  if (p.phone) contacts.push(`<span class="r-contact-item">${getIcon('phone', tmpl)} ${linkify('phone', p.phone)}</span>`);
  if (p.city || p.country) contacts.push(`<span class="r-contact-item">${getIcon('location', tmpl)} ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>`);
  if (p.linkedin) contacts.push(`<span class="r-contact-item">${getIcon('linkedin', tmpl)} ${linkify('linkedin', p.linkedin)}</span>`);
  if (p.website) contacts.push(`<span class="r-contact-item">${getIcon('website', tmpl)} ${linkify('website', p.website)}</span>`);
  if (p.dob) contacts.push(`<span class="r-contact-item">${getIcon('dob', tmpl)} ${esc(p.dob)}</span>`);
  if (p.pob) contacts.push(`<span class="r-contact-item">${getIcon('pob', tmpl)} ${esc(p.pob)}</span>`);
  if (p.driverLicense) contacts.push(`<span class="r-contact-item">${getIcon('license', tmpl)} ${esc(p.driverLicense)}</span>`);
  if (p.gender) contacts.push(`<span class="r-contact-item">${getIcon('gender', tmpl)} ${esc(p.gender)}</span>`);
  if (p.nationality) contacts.push(`<span class="r-contact-item">${getIcon('nationality', tmpl)} ${esc(p.nationality)}</span>`);
  if (p.civilStatus) contacts.push(`<span class="r-contact-item">${getIcon('civil', tmpl)} ${esc(p.civilStatus)}</span>`);
  if (p.customField) contacts.push(`<span class="r-contact-item">${getIcon('custom', tmpl)} ${esc(p.customField)}</span>`);



  return `
    <div class="r-header">
      <div class="r-header-top">
        <div>
          <div class="r-name">${getName()}</div>
          <div class="r-title">${getTitle()}</div>
        </div>
        ${avatarHtml('r-avatar', 'r-avatar-placeholder')}
      </div>
      ${contacts.length ? `<div class="r-contact">${contacts.join('')}</div>` : ''}
    </div>
    <div class="r-body">
      ${renderOrderedSections(['summary'])}
      <div class="r-two-col">
        <div>
          ${renderOrderedSections(['experience', 'projects', 'internships', 'activities', 'achievements', 'custom'])}
        </div>
        <div>
          ${renderOrderedSections(['education', 'skills', 'languages', 'certifications', 'qualities', 'hobbies', 'courses', 'references', 'signature', 'footer'])}
        </div>
      </div>
    </div>
  `;
}

// ---- Elegant ----
function buildElegant() {
  const p = state.personal;
  const contacts = [
    p.email ? `✉ ${linkify('email', p.email)}` : '',
    p.phone ? `📞 ${linkify('phone', p.phone)}` : '',
    (p.city || p.country) ? `📍 ${esc([p.city, p.country].filter(Boolean).join(', '))}` : '',
    p.linkedin ? `in ${linkify('linkedin', p.linkedin)}` : '',
    p.website ? `🌐 ${linkify('website', p.website)}` : '',
    p.dob ? `📅 ${esc(p.dob)}` : '',
    p.pob ? `🏠 ${esc(p.pob)}` : '',
    p.driverLicense ? `🚗 ${esc(p.driverLicense)}` : '',
    p.gender ? `👤 ${esc(p.gender)}` : '',
    p.nationality ? `🏳️ ${esc(p.nationality)}` : '',
    p.civilStatus ? `💍 ${esc(p.civilStatus)}` : '',
    p.customField ? `📝 ${esc(p.customField)}` : ''
  ].filter(Boolean);

  return `
    <div class="r-header">
      ${avatarHtml('r-avatar', 'r-avatar-placeholder')}
      <div>
        <div class="r-name">${getName()}</div>
        <div class="r-title">${getTitle()}</div>
      </div>
    </div>
    ${contacts.length ? `<div class="r-contact">${contacts.map(c => `<span class="r-contact-item">${c}</span>`).join('')}</div>` : ''}
    <div class="r-body">
      ${renderOrderedSections(['summary', 'experience', 'education', 'internships', 'activities', 'achievements', 'custom'])}
      <div class="r-two-col">
        <div>
          ${renderOrderedSections(['skills', 'certifications', 'qualities', 'hobbies'])}
        </div>
        <div>
          ${renderOrderedSections(['projects', 'languages', 'courses', 'references'])}
        </div>
      </div>
      ${renderOrderedSections(['signature', 'footer'])}
    </div>
  `;
}

// ---- Bold ----
function buildBold() {
  const p = state.personal;
  const validSkills = state.skills.filter(s => s.name && s.name.trim());
  const validLangs = state.languages.filter(l => l.name && l.name.trim());
  const contacts = [];
  if (p.email) contacts.push(`<div class="r-sb-item">${getIcon('email', 'bold')} ${linkify('email', p.email)}</div>`);
  if (p.phone) contacts.push(`<div class="r-sb-item">${getIcon('phone', 'bold')} ${linkify('phone', p.phone)}</div>`);
  if (p.city || p.country) contacts.push(`<div class="r-sb-item">${getIcon('location', 'bold')} ${esc([p.city, p.country].filter(Boolean).join(', '))}</div>`);
  if (p.linkedin) contacts.push(`<div class="r-sb-item">${getIcon('linkedin', 'bold')} ${linkify('linkedin', p.linkedin)}</div>`);
  if (p.website) contacts.push(`<div class="r-sb-item">${getIcon('website', 'bold')} ${linkify('website', p.website)}</div>`);
  if (p.dob) contacts.push(`<div class="r-sb-item">${getIcon('dob', 'bold')} ${esc(p.dob)}</div>`);
  if (p.pob) contacts.push(`<div class="r-sb-item">${getIcon('pob', 'bold')} ${esc(p.pob)}</div>`);
  if (p.driverLicense) contacts.push(`<div class="r-sb-item">${getIcon('license', 'bold')} ${esc(p.driverLicense)}</div>`);
  if (p.gender) contacts.push(`<div class="r-sb-item">${getIcon('gender', 'bold')} ${esc(p.gender)}</div>`);
  if (p.nationality) contacts.push(`<div class="r-sb-item">${getIcon('nationality', 'bold')} ${esc(p.nationality)}</div>`);
  if (p.civilStatus) contacts.push(`<div class="r-sb-item">${getIcon('civil', 'bold')} ${esc(p.civilStatus)}</div>`);
  if (p.customField) contacts.push(`<div class="r-sb-item">${getIcon('custom', 'bold')} ${esc(p.customField)}</div>`);

  return `
    <div class="r-sidebar">
      <div class="r-sidebar-name">${getName()}</div>
      <div class="r-sidebar-title">${getTitle()}</div>
      ${avatarHtml('r-avatar', 'r-avatar-placeholder')}
      ${contacts.length ? `<div class="r-sb-section"><div class="r-sb-title">Contact</div>${contacts.join('')}</div>` : ''}
      ${renderOrderedSections(['skills', 'languages', 'qualities', 'hobbies', 'courses', 'references'])}
    </div>
    <div class="r-main">
      ${renderOrderedSections(['summary', 'experience', 'education', 'projects', 'certifications', 'internships', 'activities', 'achievements', 'custom', 'signature', 'footer'])}
    </div>
  `;
}

// ---- Startup ----
function buildStartup() {
  const p = state.personal;
  const contacts = [
    linkify('email', p.email), linkify('phone', p.phone), [p.city, p.country].filter(Boolean).join(', '), linkify('linkedin', p.linkedin), linkify('website', p.website),
    p.dob, p.pob, p.driverLicense, p.gender, p.nationality, p.civilStatus, p.customField
  ].filter(Boolean);

  return `
    <div class="r-header">
      <div class="r-header-content">
        <div class="r-name">${getName()}</div>
        <div class="r-title">${getTitle()}</div>
        ${contacts.length ? `<div class="r-contact">${contacts.map(c => `<span class="r-contact-item">${c}</span>`).join('')}</div>` : ''}
      </div>
      ${avatarHtml('r-avatar', 'r-avatar-placeholder')}
    </div>
    <div class="r-body">
      ${renderOrderedSections(['summary'])}
      <div class="r-two-col">
        <div class="r-col-main">
          ${renderOrderedSections(['experience', 'projects', 'internships', 'activities', 'achievements', 'custom'])}
        </div>
        <div class="r-col-side">
          ${renderOrderedSections(['education', 'skills', 'certifications', 'languages', 'hobbies', 'courses', 'references', 'qualities', 'signature', 'footer'])}
        </div>
      </div>
    </div>
  `;
}

// ---- Corporate ----
function buildCorporate() {
  const p = state.personal;
  const contacts = [
    p.email ? `✉ ${linkify('email', p.email)}` : '',
    p.phone ? `📞 ${linkify('phone', p.phone)}` : '',
    (p.city || p.country) ? `📍 ${esc([p.city, p.country].filter(Boolean).join(', '))}` : '',
    p.linkedin ? `in ${linkify('linkedin', p.linkedin)}` : '',
    p.website ? `🌐 ${linkify('website', p.website)}` : '',
    p.dob ? `📅 ${esc(p.dob)}` : '',
    p.pob ? `🏠 ${esc(p.pob)}` : '',
    p.driverLicense ? `🚗 ${esc(p.driverLicense)}` : '',
    p.gender ? `👤 ${esc(p.gender)}` : '',
    p.nationality ? `🏳️ ${esc(p.nationality)}` : '',
    p.civilStatus ? `💍 ${esc(p.civilStatus)}` : '',
    p.customField ? `📝 ${esc(p.customField)}` : ''
  ].filter(Boolean);

  return `
    <div class="r-header">
      <div class="r-name">${getName()}</div>
      <div class="r-title">${getTitle()}</div>
      ${contacts.length ? `<div class="r-contact">${contacts.map(c => `<span class="r-contact-item">${c}</span>`).join('<span class="r-contact-sep">|</span>')}</div>` : ''}
    </div>
    <div class="r-body">
      ${renderOrderedSections(['summary'])}
      <div class="r-two-col">
        <div class="r-col-left">
          ${renderOrderedSections(['experience', 'projects', 'internships', 'activities', 'achievements', 'custom'])}
        </div>
        <div class="r-col-right">
          ${renderOrderedSections(['education', 'skills', 'certifications', 'languages', 'hobbies', 'courses', 'references', 'qualities', 'signature', 'footer'])}
        </div>
      </div>
    </div>
  `;
}

// ---- Professional (Refined High-Fidelity) ----
function buildProfessional() {
  const p = state.personal;
  const tmpl = state.template;
  const contacts = [
    p.email ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('email', tmpl)}</span> ${linkify('email', p.email)}</span>` : '',
    p.phone ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('phone', tmpl)}</span> ${linkify('phone', p.phone)}</span>` : '',
    (p.city || p.country) ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('location', tmpl)}</span> ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>` : '',
    p.linkedin ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('linkedin', tmpl)}</span> ${linkify('linkedin', p.linkedin)}</span>` : '',
    p.website ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('website', tmpl)}</span> ${linkify('website', p.website)}</span>` : '',
    p.dob ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('dob', tmpl)}</span> ${esc(p.dob)}</span>` : '',
    p.pob ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('pob', tmpl)}</span> ${esc(p.pob)}</span>` : '',
    p.driverLicense ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('license', tmpl)}</span> ${esc(p.driverLicense)}</span>` : '',
    p.gender ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('gender', tmpl)}</span> ${esc(p.gender)}</span>` : '',
    p.nationality ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('nationality', tmpl)}</span> ${esc(p.nationality)}</span>` : '',
    p.civilStatus ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('civil', tmpl)}</span> ${esc(p.civilStatus)}</span>` : '',
    p.customField ? `<span class="r-contact-item"><span class="r-prof-icon">${getIcon('custom', tmpl)}</span> ${esc(p.customField)}</span>` : ''
  ].filter(Boolean);

  const profSectionMap = {
    summary: summarySection,
    education: profEduSection,
    experience: profExpSection,
    skills: profSkillsSection,
    certifications: profCertSection,
    languages: profLangSection,
    projects: profProjSection,
    internships: profInternshipSection,
    activities: profActivitySection,
    hobbies: profHobbySection,
    courses: profCourseSection,
    references: profReferenceSection,
    qualities: profQualitySection,
    achievements: profAchievementSection,
    signature: profSignatureSection,
    footer: profFooterSection,
    custom: profCustomSection
  };

  const sections = orderedVisibleSectionIds(state.sectionOrder)
    .map(id => profSectionMap[id] ? profSectionMap[id]() : '')
    .join('');

  return `
    <div class="prof-pg">
      <div class="prof-header">
        <div class="prof-header-content">
          <div class="prof-name">${getName()}</div>
          <div class="prof-job-title">${getTitle()}</div>
          <div class="prof-contacts">${contacts.join('')}</div>
        </div>
        <div class="prof-photo">
          ${avatarHtml('prof-img', 'prof-ph')}
        </div>
      </div>
      <div class="prof-body">
        ${sections}
      </div>
    </div>
  `;
}

function profSectionWrapper(label, content, extraClass = '') {
  if (!content) return '';
  return `
    <div class="prof-section ${extraClass}">
      <div class="prof-section-label">${label}</div>
      ${content}
    </div>
  `;
}

function profExpSection() {
  const list = state.experience.filter(e => e.position || e.company);
  if (!list.length) return '';
  const rows = list.map(e => `
    <div class="prof-item-row">
      <div class="prof-date-side">${e.startDate ? esc(e.startDate) + ' - ' + (esc(e.endDate) || 'Present') : ''}</div>
      <div class="prof-bullet-side"><span class="prof-sq"></span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(e.position)}</div>
        <div class="prof-item-sub">${esc(e.company)}${e.location ? ' • ' + esc(e.location) : ''}</div>
        ${e.description ? `<div class="prof-item-desc">${esc(e.description)}</div>` : ''}
      </div>
    </div>`).join('');
  return profSectionWrapper('Employment', rows);
}

function profEduSection() {
  const list = state.education.filter(e => e.degree || e.institution);
  if (!list.length) return '';
  const rows = list.map(e => `
    <div class="prof-item-row">
      <div class="prof-date-side">${e.startDate ? esc(e.startDate) + ' - ' + (esc(e.endDate) || 'Present') : ''}</div>
      <div class="prof-bullet-side"><span class="prof-sq"></span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(e.degree)}${e.field ? ', ' + esc(e.field) : ''}</div>
        <div class="prof-item-sub">${esc(e.institution)}${e.location ? ' • ' + esc(e.location) : ''}</div>
        ${e.description ? `<div class="prof-item-desc">${esc(e.description)}</div>` : ''}
      </div>
    </div>`).join('');
  return profSectionWrapper('Education', rows);
}

function profSkillsSection() {
  const list = state.skills.filter(s => s.name && s.name.trim());
  if (!list.length) return '';
  const rows = `<div class="prof-skills-grid">${list.map(s => `<div class="prof-skill-item">${esc(s.name)}</div>`).join('')}</div>`;
  return profSectionWrapper('Skills', rows, 'prof-no-timeline');
}

function profLangSection() {
  const list = state.languages.filter(l => l.name && l.name.trim());
  if (!list.length) return '';
  const rows = `<div class="prof-skills-grid">${list.map(l => `<div class="prof-skill-item">${esc(l.name)}</div>`).join('')}</div>`;
  return profSectionWrapper('Languages', rows, 'prof-no-timeline');
}


function profCertSection() {
  const list = state.certifications.filter(c => c.name && c.name.trim());
  if (!list.length) return '';
  const rows = list.map(c => `
    <div class="prof-item-row">
      <div class="prof-date-side">${esc(c.date || '')}</div>
      <div class="prof-bullet-side"><span class="prof-sq"></span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(c.name)}</div>
        ${c.issuer ? `<div class="prof-item-sub">${esc(c.issuer)}</div>` : ''}
        ${c.url ? `<div class="prof-item-desc">${linkify('website', c.url)}</div>` : ''}
      </div>
    </div>`).join('');
  return profSectionWrapper('Certificates', rows);
}

function profProjSection() {
  const list = state.projects.filter(p => p.name && p.name.trim());
  if (!list.length) return '';
  const rows = list.map(p => `
    <div class="prof-item-row">
      <div class="prof-date-side"></div>
      <div class="prof-bullet-side"><span class="prof-sq"></span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(p.name)}</div>
        ${p.tech ? `<div class="prof-item-sub">${esc(p.tech)}</div>` : ''}
        ${p.url ? `<div class="prof-item-desc">${linkify('website', p.url)}</div>` : ''}
        ${p.description ? `<div class="prof-item-desc">${formatBullets(p.description)}</div>` : ''}
      </div>
    </div>`).join('');
  return profSectionWrapper('Projects', rows);
}

function profInternshipSection() {
  const list = state.internships.filter(e => e.position || e.company);
  if (!list.length) return '';
  const rows = list.map(e => `
    <div class="prof-item-row">
      <div class="prof-date-side">${e.startDate ? esc(e.startDate) + ' - ' + (esc(e.endDate) || 'Present') : ''}</div>
      <div class="prof-bullet-side"><span class="prof-sq"></span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(e.position)}</div>
        <div class="prof-item-sub">${esc(e.company)}${e.location ? ' • ' + esc(e.location) : ''}</div>
        ${e.description ? `<div class="prof-item-desc">${esc(e.description)}</div>` : ''}
      </div>
    </div>`).join('');
  return profSectionWrapper('Internships', rows);
}

function profActivitySection() {
  const list = state.activities.filter(a => a.name || a.organization);
  if (!list.length) return '';
  const rows = list.map(a => `
    <div class="prof-item-row">
      <div class="prof-date-side">${esc(a.date || '')}</div>
      <div class="prof-bullet-side"><span class="prof-sq"></span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(a.name)}</div>
        <div class="prof-item-sub">${esc(a.organization)}</div>
        ${a.description ? `<div class="prof-item-desc">${esc(a.description)}</div>` : ''}
      </div>
    </div>`).join('');
  return profSectionWrapper('Activities', rows);
}

function profHobbySection() {
  if (!state.hobbies) return '';
  const list = state.hobbies.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  if (!list.length) return '';
  const rows = `<div class="prof-hobby-grid">${list.map(h => `<div class="prof-hobby-item"><span class="prof-hobby-bullet"></span> ${esc(h)}</div>`).join('')}</div>`;
  return profSectionWrapper('Hobbies', rows, 'prof-no-timeline');
}

function profCourseSection() {
  const list = state.courses.filter(c => c.name || c.institution);
  if (!list.length) return '';
  const rows = list.map(c => `
    <div class="prof-item-row">
      <div class="prof-date-side">${esc(c.date || '')}</div>
      <div class="prof-bullet-side"><span class="prof-sq"></span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(c.name)}</div>
        <div class="prof-item-sub">${esc(c.institution)}</div>
      </div>
    </div>`).join('');
  return profSectionWrapper('Courses', rows);
}

function profReferenceSection() {
  const list = state.references.filter(r => r.name || r.company);
  if (!list.length) return '';
  const rows = list.map(r => `
    <div class="prof-item-row">
      <div class="prof-date-side">Reference</div>
      <div class="prof-bullet-side"><span class="prof-sq"></span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(r.name)}</div>
        <div class="prof-item-sub">${esc(r.company)}</div>
        <div class="prof-item-desc">${[r.email, r.phone].filter(Boolean).join(' • ')}</div>
      </div>
    </div>`).join('');
  return profSectionWrapper('References', rows);
}

function profQualitySection() {
  const list = state.qualities.filter(q => q.name && q.name.trim());
  if (!list.length) return '';
  const rows = `<div class="prof-skills-full"><div class="prof-skills-grid">${list.map(q => `<div class="prof-skill-item">${esc(q.name)}</div>`).join('')}</div></div>`;
  return profSectionWrapper('Qualities', rows, 'prof-no-timeline');
}

function profAchievementSection() {
  const list = state.achievements.filter(a => a.name && a.name.trim());
  if (!list.length) return '';
  const rows = list.map(a => `
    <div class="prof-item-row">
      <div class="prof-date-side">Award</div>
      <div class="prof-bullet-side"><span class="prof-sq"></span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(a.name)}</div>
        ${a.description ? `<div class="prof-item-desc">${esc(a.description)}</div>` : ''}
      </div>
    </div>`).join('');
  return profSectionWrapper('Achievements', rows);
}

function profSignatureSection() {
  if (!state.signature.text) return '';
  const content = `<div class="prof-content-side" style="grid-column:3;text-align:right;margin-top:20px;">
    <div style="font-family:'Playfair Display', serif;font-size:1.8rem;font-style:italic;color:#3b82f6;">${esc(state.signature.text)}</div>
    <div style="border-top:1px solid #e2e8f0;display:inline-block;padding-top:4px;margin-top:4px;min-width:150px;font-size:0.8rem;text-transform:uppercase;">Signature</div>
  </div>`;
  return profSectionWrapper('Signature', content);
}

function profFooterSection() {
  if (!state.footer) return '';
  return `<div style="margin-top:30px;padding-top:15px;border-top:1px solid #f1f5f9;text-align:center;color:#94a3b8;font-size:0.75rem;grid-column:1/4;">${esc(state.footer)}</div>`;
}

function profCustomSection() {
  if (!state.custom.content) return '';
  const content = `<div class="prof-content-side" style="grid-column:3"><div class="prof-item-desc">${esc(state.custom.content)}</div></div>`;
  return profSectionWrapper(state.custom.title || 'Custom', content, 'prof-no-timeline');
}



// ---- Modern Dark (Premium Andi Ajdini Style) ----
function buildModernDark() {
  const p = state.personal;
  const mdSectionMap = {
    summary: modernDarkSummary,
    experience: modernDarkExp,
    education: modernDarkEdu,
    skills: modernDarkSkills,
    certifications: modernDarkCert,
    languages: modernDarkLanguages,
    projects: modernDarkProjects,
    internships: modernDarkInternships,
    activities: modernDarkActivities,
    hobbies: modernDarkHobbies,
    courses: modernDarkCourses,
    references: modernDarkReferences,
    qualities: modernDarkQualities,
    achievements: modernDarkAchievements,
    signature: modernDarkSignature,
    footer: modernDarkFooter,
    custom: modernDarkCustom
  };

  const leftSections = orderedVisibleSectionIds(state.sectionOrder)
    .filter(id => ['experience', 'education', 'projects', 'courses', 'internships', 'activities', 'achievements', 'custom', 'signature'].includes(id))
    .map(id => mdSectionMap[id] ? mdSectionMap[id]() : '')
    .join('');

  const rightSections = orderedVisibleSectionIds(state.sectionOrder)
    .filter(id => ['summary', 'skills', 'certifications', 'languages', 'hobbies', 'references', 'qualities', 'footer'].includes(id))
    .map(id => mdSectionMap[id] ? mdSectionMap[id]() : '')
    .join('');

  return `
    <div class="tmpl-modern-dark">
      <div class="md-header">
        <div class="md-header-main">
          <h1 class="md-name">${getName()}</h1>
          <div class="md-role">${getTitle()}</div>
          <div class="md-contacts">
            ${p.phone ? `<span><span class="md-icon">${getIcon('phone', 'modern-dark')}</span> ${linkify('phone', p.phone)}</span>` : ''}
            ${p.email ? `<span><span class="md-icon">${getIcon('email', 'modern-dark')}</span> ${linkify('email', p.email)}</span>` : ''}
            ${(p.city || p.country) ? `<span><span class="md-icon">${getIcon('location', 'modern-dark')}</span> ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>` : ''}
            ${p.linkedin ? `<span><span class="md-icon">${getIcon('linkedin', 'modern-dark')}</span> ${linkify('linkedin', p.linkedin)}</span>` : ''}
            ${p.website ? `<span><span class="md-icon">${getIcon('website', 'modern-dark')}</span> ${linkify('website', p.website)}</span>` : ''}
            ${p.dob ? `<span><span class="md-icon">${getIcon('dob', 'modern-dark')}</span> ${esc(p.dob)}</span>` : ''}
            ${p.pob ? `<span><span class="md-icon">${getIcon('pob', 'modern-dark')}</span> ${esc(p.pob)}</span>` : ''}
            ${p.driverLicense ? `<span><span class="md-icon">${getIcon('license', 'modern-dark')}</span> ${esc(p.driverLicense)}</span>` : ''}
            ${p.gender ? `<span><span class="md-icon">${getIcon('gender', 'modern-dark')}</span> ${esc(p.gender)}</span>` : ''}
            ${p.nationality ? `<span><span class="md-icon">${getIcon('nationality', 'modern-dark')}</span> ${esc(p.nationality)}</span>` : ''}
            ${p.civilStatus ? `<span><span class="md-icon">${getIcon('civil', 'modern-dark')}</span> ${esc(p.civilStatus)}</span>` : ''}
            ${p.customField ? `<span><span class="md-icon">${getIcon('custom', 'modern-dark')}</span> ${esc(p.customField)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="md-body">
        <div class="md-left-col">
          ${leftSections}
        </div>
        <div class="md-right-col">
          ${rightSections}
        </div>
      </div>
    </div>
  `;
}

function modernDarkSection(title, content) {
  if (!content) return '';
  return `
    <div class="md-section">
      <h2 class="md-sec-title">${title}</h2>
      <div class="md-sec-content">${content}</div>
    </div>
  `;
}

function modernDarkExp() {
  const list = state.experience.filter(e => e.position || e.company);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="md-item">
      <div class="md-item-header">
        <div class="md-item-title">${esc(e.position)}</div>
        <div class="md-item-date">${e.startDate ? esc(e.startDate) + ' - ' + (esc(e.endDate) || 'Present') : ''}</div>
      </div>
      <div class="md-item-sub">${esc(e.company)}</div>
      <div class="md-item-loc">${esc(e.location || '')}</div>
      ${e.description ? `<div class="md-item-desc">
        ${e.description.split('\n').map(line => line.trim() ? `<li>${esc(line)}</li>` : '').join('')}
      </div>` : ''}
    </div>
  `).join('');
  return modernDarkSection('Experience', items);
}

function modernDarkEdu() {
  const list = state.education.filter(e => e.degree || e.institution);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="md-item">
      <div class="md-item-header">
        <div class="md-item-title">${esc(e.degree)}${e.field ? ' - ' + esc(e.field) : ''}</div>
      </div>
      <div class="md-item-sub">${esc(e.institution)}</div>
      <div class="md-item-date">${e.startDate ? esc(e.startDate) + ' - ' + (esc(e.endDate) || 'Present') : ''}</div>
      <div class="md-item-loc">${esc(e.location || '')}</div>
    </div>
  `).join('');
  return modernDarkSection('Education', items);
}

function modernDarkSummary() {
  if (!state.summary) return '';
  return modernDarkSection('Summary', `<p class="md-summary-text">${esc(state.summary)}</p>`);
}

function modernDarkSkills() {
  const list = state.skills.filter(s => s.name && s.name.trim());
  if (!list.length) return '';
  const items = list.map(s => `
    <div class="md-skill-row">
      <div class="md-skill-name">${esc(s.name)}</div>
      <div class="md-skill-dots">
        ${[1, 2, 3, 4, 5].map(i => `<span class="md-dot ${i <= levelToDots(s.level) ? 'active' : ''}"></span>`).join('')}
      </div>
      <div class="md-skill-level">${esc(s.level)}</div>
    </div>
  `).join('');
  return modernDarkSection('Skills', items);
}

function modernDarkCert() {
  const list = state.certifications.filter(c => c.name && c.name.trim());
  if (!list.length) return '';
  const items = list.map(c => `
    <div class="md-cert-item">
      <div class="md-cert-name">${esc(c.name)}${c.date ? ' (' + esc(c.date) + ')' : ''}</div>
      ${c.issuer ? `<div class="md-item-sub" style="font-size:0.85rem;text-transform:none;letter-spacing:0">${esc(c.issuer)}</div>` : ''}
      ${c.url ? `<div class="md-item-sub" style="font-size:0.85rem;text-transform:none;letter-spacing:0">${linkify('website', c.url)}</div>` : ''}
    </div>
  `).join('');
  return modernDarkSection('Certifications', items);
}

function modernDarkLanguages() {
  const list = state.languages.filter(l => l.name && l.name.trim());
  if (!list.length) return '';
  const items = list.map(l => `
    <div class="md-lang-row">
      <span>${esc(l.name)}</span>
      <span class="md-lang-level">${esc(l.proficiency || '')}</span>
    </div>
  `).join('');
  return modernDarkSection('Languages', items);
}

function modernDarkProjects() {
  const list = state.projects.filter(p => p.name && p.name.trim());
  if (!list.length) return '';
  const items = list.map(pr => `
    <div class="md-item">
      <div class="md-item-header">
        <div class="md-item-title">${esc(pr.name)}</div>
        <div class="md-item-date">${esc(pr.tech || '')}</div>
      </div>
      ${pr.url ? `<div class="md-item-sub" style="font-size:0.8rem;text-transform:none;letter-spacing:0">${esc(pr.url)}</div>` : ''}
      ${pr.description ? `<div class="md-item-desc">${esc(pr.description)}</div>` : ''}
    </div>
  `).join('');
  return modernDarkSection('Projects', items);
}

function modernDarkInternships() {
  const list = state.internships.filter(e => e.position || e.company);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="md-item">
      <div class="md-item-header">
        <div class="md-item-title">${esc(e.position)}</div>
        <div class="md-item-date">${e.startDate ? esc(e.startDate) + ' - ' + (esc(e.endDate) || 'Present') : ''}</div>
      </div>
      <div class="md-item-sub">${esc(e.company)}</div>
      ${e.description ? `<div class="md-item-desc">${esc(e.description)}</div>` : ''}
    </div>
  `).join('');
  return modernDarkSection('Internships', items);
}

function modernDarkActivities() {
  const list = state.activities.filter(a => a.name || a.organization);
  if (!list.length) return '';
  const items = list.map(a => `
    <div class="md-item">
      <div class="md-item-header">
        <div class="md-item-title">${esc(a.name)}</div>
        <div class="md-item-date">${esc(a.date || '')}</div>
      </div>
      <div class="md-item-sub">${esc(a.organization)}</div>
      ${a.description ? `<div class="md-item-desc">${esc(a.description)}</div>` : ''}
    </div>
  `).join('');
  return modernDarkSection('Activities', items);
}

function modernDarkHobbies() {
  if (!state.hobbies) return '';
  return modernDarkSection('Hobbies', `<p class="md-summary-text">${esc(state.hobbies)}</p>`);
}

function modernDarkCourses() {
  const list = state.courses.filter(c => c.name || c.institution);
  if (!list.length) return '';
  const items = list.map(c => `
    <div class="md-item" style="margin-bottom:15px">
      <div class="md-item-title" style="font-size:1rem">${esc(c.name)}</div>
      <div class="md-item-sub">${esc(c.institution)}</div>
      <div class="md-item-date">${esc(c.date || '')}</div>
    </div>
  `).join('');
  return modernDarkSection('Courses', items);
}

function modernDarkReferences() {
  const list = state.references.filter(r => r.name || r.company);
  if (!list.length) return '';
  const items = list.map(r => `
    <div class="md-item" style="margin-bottom:20px">
      <div class="md-item-title">${esc(r.name)}</div>
      <div class="md-item-sub">${esc(r.company)}</div>
      <div class="md-item-date" style="color:#bbb;text-transform:none;letter-spacing:0">${[r.email, r.phone].filter(Boolean).join(' • ')}</div>
    </div>
  `).join('');
  return modernDarkSection('References', items);
}

function modernDarkQualities() {
  const list = state.qualities.filter(q => q.name && q.name.trim());
  if (!list.length) return '';
  const tags = list.map(q => `<span class="md-tech-tag" style="background:#222;color:#ffdb70;border:1px solid #333;padding:4px 10px;border-radius:4px;margin-right:8px;margin-bottom:8px;display:inline-block;font-size:0.8rem;font-weight:600">${esc(q.name)}</span>`).join('');
  return modernDarkSection('Qualities', `<div>${tags}</div>`);
}

function modernDarkAchievements() {
  const list = state.achievements.filter(a => a.name && a.name.trim());
  if (!list.length) return '';
  const items = list.map(a => `
    <div class="md-item">
      <div class="md-item-title">${esc(a.name)}</div>
      ${a.description ? `<p class="md-summary-text" style="font-size:0.85rem;margin-top:4px">${esc(a.description)}</p>` : ''}
    </div>
  `).join('');
  return modernDarkSection('Achievements', items);
}

function modernDarkSignature() {
  if (!state.signature.text) return '';
  return `
    <div class="md-section" style="margin-top:40px">
      <div style="font-family:'Playfair Display', serif;font-size:2rem;font-style:italic;color:#ffdb70;">${esc(state.signature.text)}</div>
      <div style="border-top:1px solid #333;display:inline-block;padding-top:8px;margin-top:8px;min-width:200px;color:#888;font-size:0.8rem;text-transform:uppercase;letter-spacing:2px;">Signature</div>
    </div>
  `;
}

function modernDarkFooter() {
  if (!state.footer) return '';
  return `<div style="margin-top:50px;padding-top:20px;border-top:1px solid #222;text-align:center;color:#666;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;">${esc(state.footer)}</div>`;
}

function modernDarkCustom() {
  if (!state.custom.content) return '';
  return modernDarkSection(state.custom.title || 'Custom Section', `<p class="md-summary-text">${esc(state.custom.content)}</p>`);
}


// ============================================================
// ---- NEW TEMPLATES ----
// ============================================================

// ---- Classic Blue ----
function buildClassicBlue() {
  const p = state.personal;
  const contacts = [
    p.email ? `<span class="cb-contact-item">${getIcon('email', 'classic-blue')} ${linkify('email', p.email)}</span>` : '',
    p.phone ? `<span class="cb-contact-item">${getIcon('phone', 'classic-blue')} ${linkify('phone', p.phone)}</span>` : '',
    (p.city || p.country) ? `<span class="cb-contact-item">${getIcon('location', 'classic-blue')} ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>` : '',
    p.linkedin ? `<span class="cb-contact-item">${getIcon('linkedin', 'classic-blue')} ${linkify('linkedin', p.linkedin)}</span>` : '',
    p.website ? `<span class="cb-contact-item">${getIcon('website', 'classic-blue')} ${linkify('website', p.website)}</span>` : '',
    ...optionalPersonalContactItems('classic-blue', 'cb-contact-item')
  ].filter(Boolean);

  const cbSectionMap = {
    summary: summarySection,
    education: eduSection,
    experience: expSection,
    skills: cbSkillsSection,
    certifications: certSection,
    languages: langSection,
    projects: projSection,
    internships: internshipSection,
    activities: activitySection,
    hobbies: hobbySection,
    courses: courseSection,
    references: referenceSection,
    qualities: qualitySection,
    achievements: achievementSection,
    signature: signatureSection,
    footer: footerSection,
    custom: customSection
  };

  const sections = orderedVisibleSectionIds(state.sectionOrder)
    .map(id => cbSectionMap[id] ? cbSectionMap[id]() : '')
    .join('');

  return `
    <div class="cb-header">
      <div class="cb-header-left">${avatarHtml('cb-avatar', 'cb-avatar-placeholder')}</div>
      <div class="cb-header-right">
        <div class="cb-name">${getName()}</div>
        <div class="cb-title">${getTitle()}</div>
        ${contacts.length ? `<div class="cb-contact">${contacts.join(' &nbsp;|&nbsp; ')}</div>` : ''}
      </div>
    </div>
    <div class="cb-body">
      ${sections}
    </div>
  `;
}

function cbSkillsSection() {
  const list = state.skills.filter(s => s.name && s.name.trim());
  if (!list.length) return '';
  const tags = list.map(s => `
    <div class="cb-skill-item">
      <span class="cb-skill-name">${esc(s.name)}</span>
      ${s.level ? `<span class="cb-skill-level">${esc(s.level)}</span>` : ''}
    </div>
  `).join('');
  return `<div class="r-section cb-section"><div class="r-section-title cb-section-title">Skills</div><div class="cb-skills">${tags}</div></div>`;
}

// ---- Minimal Formal ----
function buildMinimalFormal() {
  const contacts = inlinePersonalContactValues(true);

  const mfSectionMap = {
    summary: mfSummarySection,
    education: mfEduSection,
    experience: mfExpSection,
    skills: mfSkillsSection,
    certifications: mfCertSection,
    languages: mfLangSection,
    projects: mfProjSection,
    internships: mfInternshipSection,
    activities: mfActivitySection,
    hobbies: hobbySection,
    courses: mfCourseSection,
    references: mfRefSection,
    qualities: qualitySection,
    achievements: achievementSection,
    signature: signatureSection,
    footer: footerSection,
    custom: customSection
  };

  const sections = orderedVisibleSectionIds(state.sectionOrder)
    .map(id => mfSectionMap[id] ? mfSectionMap[id]() : '')
    .join('');

  return `
    <div class="mf-header">
      ${state.photo ? `<div class="mf-avatar-col">${avatarHtml('mf-avatar', 'mf-avatar-placeholder')}</div>` : ''}
      <div class="mf-info-col">
        <div class="mf-name">${getName()}${getTitle() ? ', ' + getTitle() : ''}</div>
        <div class="mf-contact">${contacts.join(', ')}</div>
      </div>
    </div>
    <div class="mf-body">
      ${sections}
    </div>
  `;
}

function mfExpSection() {
  const list = state.experience.filter(e => e.position || e.company);
  if (!list.length) return '';
  const rows = list.map(e => `
    <div class="mf-item-row">
      <div class="mf-date-col">${e.startDate ? esc(e.startDate) + ' — ' + (esc(e.endDate) || 'Present') : ''}</div>
      <div class="mf-main-col">
        <div class="mf-item-title">${esc(e.position)}, ${esc(e.company)}</div>
        ${e.description ? `<div class="r-item-desc">${formatBullets(e.description)}</div>` : ''}
      </div>
      <div class="mf-loc-col">${esc(e.location)}</div>
    </div>`).join('');
  return `<div class="mf-section"><div class="mf-section-title">Work Experience</div><div class="mf-section-content">${rows}</div></div>`;
}

function mfEduSection() {
  const list = state.education.filter(e => e.degree || e.institution);
  if (!list.length) return '';
  const rows = list.map(e => `
    <div class="mf-item-row">
      <div class="mf-date-col">${e.startDate ? esc(e.startDate) + ' — ' + (esc(e.endDate) || 'Present') : ''}</div>
      <div class="mf-main-col">
        <div class="mf-item-title">${esc(e.degree)}${e.field ? ' in ' + esc(e.field) : ''}, ${esc(e.institution)}</div>
        ${e.description ? `<div class="r-item-desc">${formatBullets(e.description)}</div>` : ''}
      </div>
      <div class="mf-loc-col">${esc(e.location)}</div>
    </div>`).join('');
  return `<div class="mf-section"><div class="mf-section-title">Education</div><div class="mf-section-content">${rows}</div></div>`;
}

function mfSkillsSection() {
  const list = state.skills.filter(s => s.name && s.name.trim());
  if (!list.length) return '';
  const tags = list.map(s => `
    <div class="mf-skill-item">
      <span class="mf-skill-name">${esc(s.name)}</span>
      ${s.level ? `<span class="mf-skill-level">${esc(s.level)}</span>` : ''}
    </div>
  `).join('');
  return `<div class="mf-section"><div class="mf-section-title">Skills</div><div class="mf-section-content"><div class="mf-skills">${tags}</div></div></div>`;
}

function mfLangSection() {
  const list = state.languages.filter(l => l.name && l.name.trim());
  if (!list.length) return '';
  const tags = list.map(l => `
    <div class="mf-skill-item">
      <span class="mf-skill-name">${esc(l.name)}</span>
      ${l.proficiency ? `<span class="mf-skill-level">${esc(l.proficiency)}</span>` : ''}
    </div>
  `).join('');
  return `<div class="mf-section"><div class="mf-section-title">Languages</div><div class="mf-section-content"><div class="mf-skills">${tags}</div></div></div>`;
}

function mfSummarySection() {
  if (!state.summary) return '';
  return `<div class="mf-section"><div class="mf-section-title">Summary</div><div class="mf-section-content"><div class="r-summary" style="margin:0;">${esc(state.summary)}</div></div></div>`;
}

function mfRefSection() {
  const list = state.references.filter(r => r.name);
  if (!list.length) return '';
  const rows = list.map(r => `
    <div class="mf-item-row" style="margin-bottom: 12px;">
      <div class="mf-date-col"></div>
      <div class="mf-main-col">
        <div class="mf-item-title">${esc(r.name)}${r.company ? ' — <span style="font-weight:normal">' + esc(r.company) + '</span>' : ''}</div>
        <div class="r-item-desc" style="color: #333; margin-top:2px;">${[esc(r.email), esc(r.phone)].filter(Boolean).join(' – ')}</div>
      </div>
      <div class="mf-loc-col"></div>
    </div>`).join('');
  return `<div class="mf-section"><div class="mf-section-title">References</div><div class="mf-section-content">${rows}</div></div>`;
}

function mfCourseSection() {
  const list = state.courses.filter(c => c.name || c.institution);
  if (!list.length) return '';
  const rows = list.map(c => `
    <div class="mf-item-row">
      <div class="mf-date-col">${esc(c.date)}</div>
      <div class="mf-main-col">
        <div class="mf-item-title">${esc(c.name)}</div>
        ${c.institution ? `<div class="r-item-desc" style="margin-top:2px;">${esc(c.institution)}</div>` : ''}
      </div>
      <div class="mf-loc-col"></div>
    </div>`).join('');
  return `<div class="mf-section"><div class="mf-section-title" style="margin-bottom: 15px;">Courses</div>${rows}</div>`;
}

function mfCertSection() {
  const list = state.certifications.filter(c => c.name && c.name.trim());
  if (!list.length) return '';
  const rows = list.map(c => `
    <div class="mf-item-row">
      <div class="mf-date-col">${esc(c.date || '')}</div>
      <div class="mf-main-col">
        <div class="mf-item-title">${esc(c.name)}</div>
        ${c.issuer ? `<div class="r-item-desc" style="margin-top:2px;">${esc(c.issuer)}</div>` : ''}
        ${c.url ? `<div class="r-item-desc">${linkify('website', c.url)}</div>` : ''}
      </div>
      <div class="mf-loc-col"></div>
    </div>`).join('');
  return `<div class="mf-section"><div class="mf-section-title" style="margin-bottom: 15px;">Certifications</div>${rows}</div>`;
}

function mfProjSection() {
  const list = state.projects.filter(p => p.name && p.name.trim());
  if (!list.length) return '';
  const rows = list.map(pr => `
    <div class="mf-item-row">
      <div class="mf-date-col">${pr.startDate ? esc(pr.startDate) + ' — ' + (esc(pr.endDate) || 'Present') : ''}</div>
      <div class="mf-main-col">
        <div class="mf-item-title">${esc(pr.name)}${pr.url ? ` <span style="font-weight:400;font-size:0.85rem;color:#333;">↗ ${esc(pr.url)}</span>` : ''}</div>
        ${pr.tech ? `<div class="r-item-sub" style="font-weight:600; font-size:0.9rem; margin-top:2px;">${esc(pr.tech)}</div>` : ''}
        ${pr.description ? `<div class="r-item-desc">${formatBullets(pr.description)}</div>` : ''}
      </div>
      <div class="mf-loc-col"></div>
    </div>`).join('');
  return `<div class="mf-section"><div class="mf-section-title" style="margin-bottom: 15px;">Projects</div>${rows}</div>`;
}

function mfInternshipSection() {
  const list = state.internships.filter(e => e.position || e.company);
  if (!list.length) return '';
  const rows = list.map(e => `
    <div class="mf-item-row">
      <div class="mf-date-col">${e.startDate ? esc(e.startDate) + ' — ' + (esc(e.endDate) || 'Present') : ''}</div>
      <div class="mf-main-col">
        <div class="mf-item-title">${esc(e.position)}, ${esc(e.company)}</div>
        ${e.description ? `<div class="r-item-desc">${formatBullets(e.description)}</div>` : ''}
      </div>
      <div class="mf-loc-col">${esc(e.location)}</div>
    </div>`).join('');
  return `<div class="mf-section"><div class="mf-section-title" style="margin-bottom: 15px;">Internships</div>${rows}</div>`;
}

function mfActivitySection() {
  const list = state.activities.filter(a => a.name || a.organization);
  if (!list.length) return '';
  const rows = list.map(a => `
    <div class="mf-item-row">
      <div class="mf-date-col">${esc(a.date)}</div>
      <div class="mf-main-col">
        <div class="mf-item-title">${esc(a.name)}, ${esc(a.organization)}</div>
        ${a.description ? `<div class="r-item-desc">${formatBullets(a.description)}</div>` : ''}
      </div>
      <div class="mf-loc-col"></div>
    </div>`).join('');
  return `<div class="mf-section"><div class="mf-section-title" style="margin-bottom: 15px;">Extracurricular Activities</div>${rows}</div>`;
}

// ---- Traditional Serif ----
function buildTraditionalSerif() {
  const p = state.personal;
  const contacts = [
    (p.city || p.country) ? esc([p.city, p.country].filter(Boolean).join(', ')).toUpperCase() : '',
    p.email ? `MAILTO:${esc(p.email).toUpperCase()}` : '',
    p.phone ? esc(p.phone) : '',
    p.linkedin ? esc(p.linkedin).toUpperCase() : '',
    p.website ? esc(p.website).toUpperCase() : '',
    ...[p.dob, p.pob, p.driverLicense, p.gender, p.nationality, p.civilStatus, p.customField].filter(Boolean).map(v => esc(v).toUpperCase())
  ].filter(Boolean);

  const tsSectionMap = {
    summary: summarySection,
    education: tsEduSection,
    experience: tsExpSection,
    skills: tsSkillsSection,
    certifications: tsCertSection,
    languages: tsLangSection,
    projects: tsProjSection,
    internships: tsInternshipSection,
    activities: tsActivitySection,
    hobbies: hobbySection,
    courses: tsCourseSection,
    references: referenceSection,
    qualities: qualitySection,
    achievements: achievementSection,
    signature: signatureSection,
    footer: footerSection,
    custom: customSection
  };

  const sections = orderedVisibleSectionIds(state.sectionOrder)
    .map(id => tsSectionMap[id] ? tsSectionMap[id]() : '')
    .join('');

  return `
    <div class="ts-header">
      ${state.photo ? `<div class="ts-avatar-wrap">${avatarHtml('ts-avatar', 'ts-avatar-placeholder')}</div>` : ''}
      <div class="ts-contact">${contacts.join(' &bull; ')}</div>
      <div class="ts-name">${getName()}</div>
      <div class="ts-title">${getTitle()}</div>
    </div>
    <div class="ts-body">
      ${sections}
    </div>
  `;
}

function tsExpSection() {
  const list = state.experience.filter(e => e.position || e.company);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="r-item ts-item">
      <div class="ts-item-row">
        <div class="ts-item-title">${esc(e.position)}</div>
        <div class="ts-item-date">${e.startDate ? esc(e.startDate) + ' &mdash; ' + (esc(e.endDate) || 'Present') : ''}</div>
      </div>
      <div class="ts-item-row">
        <div class="ts-item-sub">${esc(e.company)}</div>
        <div class="ts-item-loc">${esc(e.location || '')}</div>
      </div>
      ${e.description ? `<div class="r-item-desc ts-item-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section ts-section">${sectionTitle('Work Experience')}${items}</div>`;
}

function tsEduSection() {
  const list = state.education.filter(e => e.degree || e.institution);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="r-item ts-item">
      <div class="ts-item-row">
        <div class="ts-item-title">${esc(e.degree)}${e.field ? ' in ' + esc(e.field) : ''}</div>
        <div class="ts-item-date">${e.startDate ? esc(e.startDate) + ' &mdash; ' + (esc(e.endDate) || 'Present') : ''}</div>
      </div>
      <div class="ts-item-row">
        <div class="ts-item-sub">${esc(e.institution)}</div>
        <div class="ts-item-loc">${esc(e.location || '')}</div>
      </div>
      ${e.description ? `<div class="r-item-desc ts-item-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section ts-section">${sectionTitle('Education')}${items}</div>`;
}

function tsSkillsSection() {
  const list = state.skills.filter(s => s.name && s.name.trim());
  if (!list.length) return '';
  const tags = list.map(s => `${esc(s.name)}${s.level ? ` (<em>${esc(s.level)}</em>)` : ''}`).join(', ');
  return `<div class="r-section ts-section"><div class="r-section-title ts-section-title">Skills</div><div class="ts-skills" style="line-height:1.8;text-align:center;">${tags}</div></div>`;
}

function tsLangSection() {
  const list = state.languages.filter(l => l.name && l.name.trim());
  if (!list.length) return '';
  const tags = list.map(l => `${esc(l.name)}${l.proficiency ? ` (<em>${esc(l.proficiency)}</em>)` : ''}`).join(', ');
  return `<div class="r-section ts-section"><div class="r-section-title ts-section-title">Languages</div><div class="ts-skills" style="line-height:1.8;text-align:center;">${tags}</div></div>`;
}

function tsCertSection() {
  const list = state.certifications.filter(c => c.name);
  if (!list.length) return '';
  const items = list.map(c => `
    <div class="r-item ts-item">
      <div class="ts-item-row">
        <div class="ts-item-title">${esc(c.name)}</div>
        <div class="ts-item-date">${esc(c.date || '')}</div>
      </div>
      <div class="ts-item-row">
        <div class="ts-item-sub">${esc(c.issuer)}</div>
        <div class="ts-item-loc">${c.url ? linkify('website', c.url) : ''}</div>
      </div>
    </div>`).join('');
  return `<div class="r-section ts-section">${sectionTitle('Certifications')}${items}</div>`;
}

function tsProjSection() {
  const list = state.projects.filter(p => p.name);
  if (!list.length) return '';
  const items = list.map(p => `
    <div class="r-item ts-item">
      <div class="ts-item-row">
        <div class="ts-item-title">${esc(p.name).toUpperCase()} ${p.url ? linkify('website', p.url) : ''}</div>
        <div class="ts-item-date"></div>
      </div>
      <div class="ts-item-row">
        <div class="ts-item-sub">${esc(p.tech || '')}</div>
        <div class="ts-item-loc"></div>
      </div>
      ${p.description ? `<div class="r-item-desc ts-item-desc">${esc(p.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section ts-section">${sectionTitle('Projects')}${items}</div>`;
}

function tsInternshipSection() {
  const list = state.internships.filter(e => e.position || e.company);
  if (!list.length) return '';
  const items = list.map(e => `
    <div class="r-item ts-item">
      <div class="ts-item-row">
        <div class="ts-item-title">${esc(e.position).toUpperCase()}</div>
        <div class="ts-item-date">${e.startDate ? esc(e.startDate) + ' &mdash; ' + (esc(e.endDate) || 'Present') : ''}</div>
      </div>
      <div class="ts-item-row">
        <div class="ts-item-sub">${esc(e.company)}</div>
        <div class="ts-item-loc">${esc(e.location || '')}</div>
      </div>
      ${e.description ? `<div class="r-item-desc ts-item-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section ts-section">${sectionTitle('Internships')}${items}</div>`;
}

function tsCourseSection() {
  const list = state.courses.filter(c => c.name);
  if (!list.length) return '';
  const items = list.map(c => `
    <div class="r-item ts-item">
      <div class="ts-item-row">
        <div class="ts-item-title">${esc(c.name)}</div>
        <div class="ts-item-date">${esc(c.date || '')}</div>
      </div>
      <div class="ts-item-row">
        <div class="ts-item-sub">${esc(c.institution)}</div>
        <div class="ts-item-loc"></div>
      </div>
    </div>`).join('');
  return `<div class="r-section ts-section">${sectionTitle('Courses')}${items}</div>`;
}

function tsActivitySection() {
  const list = state.activities.filter(a => a.name || a.organization);
  if (!list.length) return '';
  const items = list.map(a => `
    <div class="r-item ts-item">
      <div class="ts-item-row">
        <div class="ts-item-title">${esc(a.name)}</div>
        <div class="ts-item-date">${esc(a.date || '')}</div>
      </div>
      <div class="ts-item-row">
        <div class="ts-item-sub">${esc(a.organization)}</div>
        <div class="ts-item-loc"></div>
      </div>
      ${a.description ? `<div class="r-item-desc ts-item-desc">${esc(a.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section ts-section">${sectionTitle('Extracurricular Activities')}${items}</div>`;
}

// ---- Europass ----
function buildEuropass() {
  const p = state.personal;
  
  const epSectionMap = {
    summary: epSummarySection,
    education: epEduSection,
    experience: epExpSection,
    skills: epSkillsSection,
    certifications: certSection,
    languages: epLangSection,
    projects: projSection,
    internships: epInternshipSection,
    activities: activitySection,
    hobbies: epHobbySection,
    courses: courseSection,
    references: epRefSection,
    qualities: qualitySection,
    achievements: achievementSection,
    signature: signatureSection,
    footer: footerSection,
    custom: customSection
  };

  const sections = orderedVisibleSectionIds(state.sectionOrder)
    .map(id => epSectionMap[id] ? epSectionMap[id]() : '')
    .join('');

  return `
    <div class="ep-header">
      <div class="ep-header-left">
        ${avatarHtml('ep-avatar', 'ep-avatar-placeholder')}
        <div class="ep-info">
          <div class="ep-name">${getName()}</div>
          <div class="ep-header-line"></div>
          <div class="ep-contacts">
            <div style="display:flex; flex-wrap:wrap; align-items:center;">
              ${p.phone ? `<span class="ep-c-item"><strong>Phone:</strong> ${linkify('phone', p.phone)} <span style="margin: 0 8px; color: rgba(255,255,255,0.5);">|</span></span>` : ''}
              ${p.email ? `<span class="ep-c-item"><strong>Email address:</strong> ${linkify('email', p.email)} <span style="margin: 0 8px; color: rgba(255,255,255,0.5);">|</span></span>` : ''}
              ${p.linkedin ? `<span class="ep-c-item"><strong>LinkedIn:</strong> ${linkify('linkedin', p.linkedin)} <span style="margin: 0 8px; color: rgba(255,255,255,0.5);">|</span></span>` : ''}
              ${p.website ? `<span class="ep-c-item"><strong>Website:</strong> ${linkify('website', p.website)} <span style="margin: 0 8px; color: rgba(255,255,255,0.5);">|</span></span>` : ''}
            </div>
            ${(p.address || p.city || p.country) ? `<div class="ep-c-item" style="margin-top:6px;"><strong>Address:</strong> ${esc([p.address, p.city, p.country].filter(Boolean).join(', '))}</div>` : ''}
            ${[p.dob, p.pob, p.driverLicense, p.gender, p.nationality, p.civilStatus, p.customField].filter(Boolean).length ? `
              <div class="ep-c-item" style="margin-top:6px;">
                ${[
                  p.dob ? `<strong>Date of birth:</strong> ${esc(p.dob)}` : '',
                  p.pob ? `<strong>Place of birth:</strong> ${esc(p.pob)}` : '',
                  p.driverLicense ? `<strong>Driving license:</strong> ${esc(p.driverLicense)}` : '',
                  p.gender ? `<strong>Gender:</strong> ${esc(p.gender)}` : '',
                  p.nationality ? `<strong>Nationality:</strong> ${esc(p.nationality)}` : '',
                  p.civilStatus ? `<strong>Civil status:</strong> ${esc(p.civilStatus)}` : '',
                  p.customField ? `<strong>Additional:</strong> ${esc(p.customField)}` : ''
                ].filter(Boolean).join(' <span style="margin: 0 8px; color: rgba(255,255,255,0.5);">|</span> ')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="ep-header-right">
        <div class="ep-logo-wrap">
          <svg width="60" height="40" viewBox="0 0 120 80">
            <rect width="116" height="76" x="2" y="2" fill="transparent" stroke="#fff" stroke-width="2" stroke-dasharray="6 4"/>
            <g transform="translate(60,40)">
              ${Array.from({length: 12}).map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180);
                const x = Math.cos(angle) * 24;
                const y = Math.sin(angle) * 24;
                return `<polygon points="0,-6 1.4,-1.8 5.8,-1.8 2.2,0.8 3.4,5 0,2.4 -3.4,5 -2.2,0.8 -5.8,-1.8 -1.4,-1.8" fill="#fff" transform="translate(${x},${y}) scale(0.8)"/>`;
              }).join('')}
            </g>
          </svg>
          <span class="ep-logo-text">europass</span>
        </div>
      </div>
    </div>
    <div class="ep-body">
      ${sections}
    </div>
  `;
}

function epExpSection() {
  const list = state.experience.filter(e => e.position || e.company);
  if (!list.length) return '';
  const rows = list.map(e => `
    <div class="ep-item">
      <div class="ep-item-meta">${e.startDate ? esc(e.startDate) + ' - ' + (esc(e.endDate) || 'Present') : ''}${e.location ? ' &bull; ' + esc(e.location) : ''}</div>
      <div class="ep-item-title"><strong>${esc(e.position)}</strong> <span class="ep-item-company">${esc(e.company)}</span></div>
      ${e.description ? `<div class="r-item-desc">${formatBullets(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="ep-section"><div class="ep-section-title">Work Experience</div><div class="ep-section-content">${rows}</div></div>`;
}

function epEduSection() {
  const list = state.education.filter(e => e.degree || e.institution);
  if (!list.length) return '';
  const rows = list.map(e => `
    <div class="ep-item">
      <div class="ep-item-meta">${e.startDate ? esc(e.startDate) + ' - ' + (esc(e.endDate) || 'Present') : ''}${e.location ? ' &bull; ' + esc(e.location) : ''}</div>
      <div class="ep-item-title"><strong>${esc(e.degree)}${e.field ? ' ' + esc(e.field) : ''}</strong> <span class="ep-item-company">${esc(e.institution)}</span></div>
      ${e.description ? `<div class="r-item-desc">${formatBullets(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="ep-section"><div class="ep-section-title">Education & Training</div><div class="ep-section-content">${rows}</div></div>`;
}

function epInternshipSection() {
  const list = state.internships.filter(e => e.position || e.company);
  if (!list.length) return '';
  const rows = list.map(e => `
    <div class="ep-item">
      <div class="ep-item-meta">${e.startDate ? esc(e.startDate) + ' - ' + (esc(e.endDate) || 'Present') : ''}${e.location ? ' &bull; ' + esc(e.location) : ''}</div>
      <div class="ep-item-title"><strong>${esc(e.position)}</strong> <span class="ep-item-company">${esc(e.company)}</span></div>
      ${e.description ? `<div class="r-item-desc">${formatBullets(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="ep-section"><div class="ep-section-title">Internships</div><div class="ep-section-content">${rows}</div></div>`;
}

function epSkillsSection() {
  const list = state.skills.filter(s => s.name && s.name.trim());
  if (!list.length) return '';
  const tags = list.map(s => `
    <div class="ep-skill-item">
      <span class="ep-skill-name">${esc(s.name)}</span>
      ${s.level ? `<span class="ep-skill-level">${esc(s.level)}</span>` : ''}
    </div>
  `).join('');
  return `<div class="ep-section"><div class="ep-section-title">Skills</div><div class="ep-section-content"><div class="ep-skills-grid">${tags}</div></div></div>`;
}

function epLangSection() {
  const list = state.languages.filter(l => l.name && l.name.trim());
  if (!list.length) return '';
  const tags = list.map(l => `
    <div class="ep-skill-item">
      <span class="ep-skill-name">${esc(l.name)}</span>
      ${l.proficiency ? `<span class="ep-skill-level">${esc(l.proficiency)}</span>` : ''}
    </div>
  `).join('');
  return `<div class="ep-section"><div class="ep-section-title">Language Skills</div><div class="ep-section-content"><div class="ep-skills-grid">${tags}</div></div></div>`;
}

function epSummarySection() {
  if (!state.summary) return '';
  return `<div class="ep-section"><div class="ep-section-title">About Myself</div><div class="r-summary">${esc(state.summary)}</div></div>`;
}

function epRefSection() {
  const list = state.references.filter(r => r.name);
  if (!list.length) return '';
  const rows = list.map(r => `
    <div class="ep-item">
      <div class="ep-item-title"><strong>${esc(r.name)}</strong> <span class="ep-item-company">${esc(r.company)}</span></div>
      <div class="r-item-desc" style="color:#666;">${[esc(r.email), esc(r.phone)].filter(Boolean).join(' &bull; ')}</div>
    </div>`).join('');
  return `<div class="ep-section"><div class="ep-section-title">Recommendations</div><div class="ep-section-content">${rows}</div></div>`;
}

function epHobbySection() {
  if (!state.hobbies) return '';
  return `<div class="ep-section"><div class="ep-section-title">Hobbies</div><div class="r-summary">${esc(state.hobbies)}</div></div>`;
}

// ---- Modern Right ----
function buildModernRight() {
  const p = state.personal;
  const contacts = [
    p.phone ? `<div class="mr-contact-item">${getIcon('phone', 'modern-right')} ${linkify('phone', p.phone)}</div>` : '',
    p.email ? `<div class="mr-contact-item">${getIcon('email', 'modern-right')} ${linkify('email', p.email)}</div>` : '',
    p.linkedin ? `<div class="mr-contact-item">${getIcon('linkedin', 'modern-right')} ${linkify('linkedin', p.linkedin)}</div>` : '',
    p.website ? `<div class="mr-contact-item">${getIcon('website', 'modern-right')} ${linkify('website', p.website)}</div>` : '',
    (p.city || p.country) ? `<div class="mr-contact-item">${getIcon('location', 'modern-right')} ${esc([p.city, p.country].filter(Boolean).join(', '))}</div>` : '',
    ...optionalPersonalContactItems('modern-right', 'mr-contact-item')
  ].filter(Boolean);

  const sidebarSections = ['skills', 'languages', 'courses', 'hobbies', 'qualities', 'certifications'];
  const mainSections = orderedVisibleSectionIds(state.sectionOrder).filter(id => !sidebarSections.includes(id));

  return `
    <div class="mr-container">
      <div class="mr-main">
        <div class="mr-header">
          <div class="mr-name">${getName()}</div>
          <div class="mr-title">${getTitle()}</div>
        </div>
        ${renderOrderedSections(mainSections)}
      </div>
      <div class="mr-sidebar">
        <div class="mr-avatar-wrap">
          ${avatarHtml('mr-avatar', 'mr-avatar-placeholder')}
        </div>
        ${contacts.length ? `<div class="mr-sidebar-section"><div class="mr-sidebar-title">Contact</div>${contacts.join('')}</div>` : ''}
        ${renderOrderedSections(sidebarSections)}
      </div>
    </div>
  `;
}

// ---- Nordic ----
function buildNordic() {
  const p = state.personal;
  const contacts = resumeContactItems('nordic');
  return `
    <div class="nx-header">
      <div>
        <div class="nx-kicker">${getTitle()}</div>
        <div class="nx-name">${getName()}</div>
      </div>
      <div class="nx-photo">${avatarHtml('nx-avatar', 'nx-avatar-placeholder')}</div>
    </div>
    ${contacts ? `<div class="nx-contact">${contacts}</div>` : ''}
    <div class="nx-body">${renderOrderedSections(state.sectionOrder)}</div>
  `;
}

// ---- Timeline ----
function buildTimeline() {
  return `
    <div class="tl-header">
      <div class="tl-mark"></div>
      <div>
        <div class="tl-name">${getName()}</div>
        <div class="tl-title">${getTitle()}</div>
        <div class="tl-contact">${resumeContactItems('timeline')}</div>
      </div>
    </div>
    <div class="tl-body">${renderOrderedSections(state.sectionOrder)}</div>
  `;
}

// ---- Mono ----
function buildMono() {
  return `
    <div class="mo-header">
      <div class="mo-name">${getName()}</div>
      <div class="mo-title">${getTitle()}</div>
      <div class="mo-contact">${resumeContactItems('mono')}</div>
    </div>
    <div class="mo-rule"></div>
    <div class="mo-body">${renderOrderedSections(state.sectionOrder)}</div>
  `;
}

// ---- Compact ----
function buildCompact() {
  return `
    <div class="cp-header">
      <div>
        <div class="cp-name">${getName()}</div>
        <div class="cp-title">${getTitle()}</div>
      </div>
      <div class="cp-contact">${resumeContactItems('compact')}</div>
    </div>
    <div class="cp-body">${renderOrderedSections(state.sectionOrder)}</div>
  `;
}

// ---- Portfolio ----
function buildPortfolio() {
  const sideSections = ['skills', 'languages', 'certifications', 'hobbies', 'qualities'];
  const mainSections = orderedVisibleSectionIds(state.sectionOrder).filter(id => !sideSections.includes(id));
  return `
    <div class="pf-shell">
      <aside class="pf-side">
        ${avatarHtml('pf-avatar', 'pf-avatar-placeholder')}
        <div class="pf-name">${getName()}</div>
        <div class="pf-title">${getTitle()}</div>
        <div class="pf-contact">${resumeContactItems('portfolio')}</div>
        ${renderOrderedSections(sideSections)}
      </aside>
      <main class="pf-main">${renderOrderedSections(mainSections)}</main>
    </div>
  `;
}

// ---- Graduate ----
function buildGraduate() {
  const priority = ['education', 'skills', 'projects', 'certifications', 'courses', 'languages'];
  const rest = orderedVisibleSectionIds(state.sectionOrder).filter(id => !priority.includes(id));
  return `
    <div class="gr-header">
      <div class="gr-cap">Academic Resume</div>
      <div class="gr-name">${getName()}</div>
      <div class="gr-title">${getTitle()}</div>
      <div class="gr-contact">${resumeContactItems('graduate')}</div>
    </div>
    <div class="gr-body">${renderSectionsByList([...priority, ...rest])}</div>
  `;
}

// ---- Clean Sidebar ----
function buildCleanSidebar() {
  const sideSections = ['skills', 'languages', 'courses', 'references'];
  const mainSections = orderedVisibleSectionIds(state.sectionOrder).filter(id => !sideSections.includes(id));
  return `
    <div class="cs-layout">
      <div class="cs-main">
        <div class="cs-name">${getName()}</div>
        <div class="cs-title">${getTitle()}</div>
        ${renderOrderedSections(mainSections)}
      </div>
      <aside class="cs-side">
        <div class="cs-contact">${resumeContactItems('clean-sidebar')}</div>
        ${renderOrderedSections(sideSections)}
      </aside>
    </div>
  `;
}

// ---- Editorial ----
function buildEditorial() {
  return `
    <div class="ed-header">
      <div class="ed-label">Profile</div>
      <div class="ed-name">${getName()}</div>
      <div class="ed-title">${getTitle()}</div>
      <div class="ed-contact">${resumeContactItems('editorial')}</div>
    </div>
    <div class="ed-body">${renderOrderedSections(state.sectionOrder)}</div>
  `;
}

function resumeContactItems(tmpl) {
  const p = state.personal;
  return [
    p.email ? `<span>${getIcon('email', tmpl)} ${linkify('email', p.email)}</span>` : '',
    p.phone ? `<span>${getIcon('phone', tmpl)} ${linkify('phone', p.phone)}</span>` : '',
    (p.city || p.country) ? `<span>${getIcon('location', tmpl)} ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>` : '',
    p.linkedin ? `<span>${getIcon('linkedin', tmpl)} ${linkify('linkedin', p.linkedin)}</span>` : '',
    p.website ? `<span>${getIcon('website', tmpl)} ${linkify('website', p.website)}</span>` : '',
    ...optionalPersonalContactItems(tmpl)
  ].filter(Boolean).join('');
}

function renderSectionsByList(ids) {
  const order = Array.isArray(state.sectionOrder) ? state.sectionOrder : ids;
  const visible = Array.isArray(state.visibleSections) ? state.visibleSections : ids;
  return ids
    .filter((id, index) => ids.indexOf(id) === index && order.includes(id) && visible.includes(id))
    .map(id => sectionMap[id] ? sectionMap[id]() : '')
    .join('');
}

// ---- Download PDF ----
function bindDownloadBtn() {
  const btn = document.getElementById('download-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    let fn = 'Resume.pdf';
    if (state.personal.firstName || state.personal.lastName) {
      fn = `${state.personal.firstName || ''}_${state.personal.lastName || ''}_ResumeElite`.replace(/_+/g, '_').trim() + '.pdf';
    }

    const oldZoom = zoom;
    if (zoom !== 1) {
      zoom = 1;
      applyZoom();
    }

    btn.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;">⏳</span> Generating...`;
    btn.disabled = true;

    const element = document.getElementById('resume-preview');
    const exportRoot = document.createElement('div');
    const exportElement = element.cloneNode(true);
    exportRoot.className = 'pdf-export-root';
    exportElement.id = 'resume-preview-pdf';
    exportElement.classList.add('pdf-exporting');
    exportRoot.appendChild(exportElement);
    document.documentElement.classList.add('is-pdf-exporting');
    document.body.classList.add('is-pdf-exporting');
    document.body.appendChild(exportRoot);
    paginateResume(exportElement, { gap: 0, bottomGuard: 24 });

    const resetDownloadButton = () => {
      if (exportRoot.parentNode) exportRoot.parentNode.removeChild(exportRoot);
      document.documentElement.classList.remove('is-pdf-exporting');
      document.body.classList.remove('is-pdf-exporting');
      if (oldZoom !== 1) {
        zoom = oldZoom;
        applyZoom();
      }
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg> Download PDF`;
      btn.disabled = false;
    };

    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await Promise.all(Array.from(exportElement.querySelectorAll('img')).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));
      paginateResume(exportElement, { gap: 0, bottomGuard: 24 });
      if (!window.html2canvas) {
        throw new Error('html2canvas library is not loaded');
      }
      const PDFCtor = window.jspdf?.jsPDF || window.jsPDF;
      if (!PDFCtor) {
        throw new Error('jsPDF library is not loaded');
      }
      const exportBounds = exportElement.getBoundingClientRect();
      const exportHeight = Math.ceil(Math.max(exportBounds.height, exportElement.scrollHeight, 1122));
      const canvas = await html2canvas(exportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
        height: exportHeight,
        windowWidth: 1200,
        windowHeight: exportHeight,
        scrollX: 0,
        scrollY: 0
      });

      const pdf = new PDFCtor('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fn);
    } catch (err) {
      console.error('PDF export failed', err);
      alert(`PDF export failed: ${err.message || 'Please refresh the page and try again.'}`);
    } finally {
      resetDownloadButton();
    }
  });
}
