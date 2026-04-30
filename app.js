/* ===== EliteResume app.js ===== */

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
  bindTemplateButtons();
  bindAccentColor();
  bindPersonalFields();
  bindSummaryField();
  bindSimpleFields();
  bindPhotoUpload();
  bindDownloadBtn();
  renderAllDynamic();
  renderPreview();
  bindClearBtn();
  initFromUrl();
  initSectionDragging();
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
  if (t && ['classic', 'modern', 'creative', 'minimal', 'executive', 'tech', 'elegant', 'bold', 'startup', 'corporate', 'professional'].includes(t)) {
    state.template = t;
    document.querySelectorAll('.tmpl-btn').forEach(b => b.classList.toggle('active', b.dataset.tmpl === t));
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
    if (state.accentColor) {
      document.getElementById('accent-color').value = state.accentColor;
    }
    if (state.sectionOrder) {
      reorderFormSections();
    }
  } catch (e) { }
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
      document.querySelectorAll('.tmpl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPreview();
      saveToStorage();
    });
  });
}

// ---- Accent Color ----
function bindAccentColor() {
  const input = document.getElementById('accent-color');
  if (!input) return;
  input.addEventListener('input', () => {
    state.accentColor = input.value;
    renderPreview();
    saveToStorage();
  });
}

// ---- Personal Fields ----
function bindPersonalFields() {
  document.querySelectorAll('[data-field]').forEach(el => {
    const field = el.dataset.field;
    if (el.id === 'summary' || !field) return;
    
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
  if (!input) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      state.photo = e.target.result;
      const preview = document.getElementById('photo-preview');
      preview.innerHTML = `<img src="${state.photo}" alt="Photo" />`;
      renderPreview();
      saveToStorage();
    };
    reader.readAsDataURL(file);
  });
  if (state.photo) {
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = `<img src="${state.photo}" alt="Photo" />`;
  }
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
  if (w) w.style.transform = `scale(${zoom})`;
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
  state.visibleSections.forEach(id => {
    const section = document.getElementById(`section-${id}`);
    if (section) section.classList.remove('hidden');
    const btn = document.querySelector(`.btn-popover-item[onclick="toggleVisibleSection('${id}')"]`);
    if (btn) btn.classList.add('active');
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
  let html = '';
  switch (tmpl) {
    case 'classic': html = buildClassic(); break;
    case 'modern': html = buildModern(); break;
    case 'creative': html = buildCreative(); break;
    case 'minimal': html = buildMinimal(); break;
    case 'executive': html = buildExecutive(); break;
    case 'tech': html = buildTech(); break;
    case 'elegant': html = buildElegant(); break;
    case 'bold': html = buildBold(); break;
    case 'startup': html = buildStartup(); break;
    case 'corporate': html = buildCorporate(); break;
    case 'professional': html = buildProfessional(); break;
    case 'modern-dark': html = buildModernDark(); break;
    default: html = buildClassic();
  }

  preview.className = `resume-page tmpl-${tmpl}`;
  preview.innerHTML = html;
  preview.style.setProperty('--resume-accent', accent);
  preview.style.setProperty('--resume-accent-light', accentLight);
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
function avatarHtml(cls = 'r-avatar', phClass = 'r-avatar-placeholder') {
  if (state.photo) return `<img src="${state.photo}" class="${cls}" alt="Profile" />`;
  return `<div class="${phClass}"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>`;
}
function getIcon(type, tmpl) {
  const isSolid = (tmpl === 'modern-dark' || tmpl === 'bold');
  const svgIcons = ['modern', 'tech', 'professional', 'corporate', 'modern-dark', 'elegant', 'executive', 'startup'];
  
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
    return `<svg class="r-icon-svg" viewBox="0 0 24 24">${p[type] || ''}</svg>`;
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
  if (!state.sectionOrder) return ids.map(id => sectionMap[id] ? sectionMap[id]() : '').join('');

  return state.sectionOrder
    .filter(id => ids.includes(id))
    .map(id => sectionMap[id] ? sectionMap[id]() : '')
    .join('');
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

// ---- Modern ----
function buildModern() {
  const validSkills = state.skills.filter(s => s.name && s.name.trim());
  const validLangs = state.languages.filter(l => l.name && l.name.trim());
  const sbSkills = validSkills.map(s => `<div class="r-sb-skill"><span class="r-sb-skill-name">${esc(s.name)}</span></div><div class="r-sb-bar-bg"><div class="r-sb-bar-fill" style="width:${levelToWidth(s.level)}%"></div></div>`).join('');
  const sbLangs = validLangs.map(l => `<div class="r-sb-item">◆ ${esc(l.name)} <small style="opacity:0.6">${esc(l.proficiency)}</small></div>`).join('');
  const p = state.personal;
  const contacts = [];
  if (p.email) contacts.push(`<div class="r-sb-item">${getIcon('email', 'modern')} ${linkify('email', p.email)}</div>`);
  if (p.phone) contacts.push(`<div class="r-sb-item">${getIcon('phone', 'modern')} ${linkify('phone', p.phone)}</div>`);
  if (p.city || p.country) contacts.push(`<div class="r-sb-item">${getIcon('location', 'modern')} ${esc([p.city, p.country].filter(Boolean).join(', '))}</div>`);
  if (p.linkedin) contacts.push(`<div class="r-sb-item">${getIcon('linkedin', 'modern')} ${linkify('linkedin', p.linkedin)}</div>`);
  if (p.website) contacts.push(`<div class="r-sb-item">${getIcon('website', 'modern')} ${linkify('website', p.website)}</div>`);
  if (p.dob) contacts.push(`<div class="r-sb-item">${getIcon('dob', 'modern')} ${esc(p.dob)}</div>`);
  if (p.pob) contacts.push(`<div class="r-sb-item">${getIcon('pob', 'modern')} ${esc(p.pob)}</div>`);
  if (p.driverLicense) contacts.push(`<div class="r-sb-item">${getIcon('license', 'modern')} ${esc(p.driverLicense)}</div>`);
  if (p.gender) contacts.push(`<div class="r-sb-item">${getIcon('gender', 'modern')} ${esc(p.gender)}</div>`);
  if (p.nationality) contacts.push(`<div class="r-sb-item">${getIcon('nationality', 'modern')} ${esc(p.nationality)}</div>`);
  if (p.civilStatus) contacts.push(`<div class="r-sb-item">${getIcon('civil', 'modern')} ${esc(p.civilStatus)}</div>`);
  if (p.customField) contacts.push(`<div class="r-sb-item">${getIcon('custom', 'modern')} ${esc(p.customField)}</div>`);

  return `
    <div class="r-sidebar">
      ${avatarHtml('r-avatar', 'r-avatar-placeholder')}
      <div class="r-sidebar-name">${getName()}</div>
      <div class="r-sidebar-title">${getTitle()}</div>
      ${contacts.length ? `<div class="r-sb-section"><div class="r-sb-title">Contact</div>${contacts.join('')}</div>` : ''}
      ${renderOrderedSections(['skills', 'languages', 'qualities', 'hobbies', 'courses', 'references'])}
    </div>
    <div class="r-main">
      ${renderOrderedSections(['summary', 'experience', 'education', 'projects', 'certifications', 'internships', 'activities', 'achievements', 'custom', 'signature', 'footer'])}
    </div>
  `;
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

  const validSkills = state.skills.filter(s => s.name && s.name.trim());
  const skillTags = validSkills.slice(0, 6).map(s => `<span class="r-tech-tag">${esc(s.name)}</span>`).join('');

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
      ${skillTags ? `<div class="r-tech-tags">${skillTags}</div>` : ''}
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
    projects: projSection,
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

  const sections = state.sectionOrder
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
      <div class="prof-date-side">${esc(c.date)}</div>
      <div class="prof-bullet-side"><span class="prof-sq"></span></div>
      <div class="prof-content-side">
        <div class="prof-item-desc-plain">${esc(c.name)}</div>
      </div>
    </div>`).join('');
  return profSectionWrapper('Certificates', rows);
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

  const leftSections = state.sectionOrder
    .filter(id => ['experience', 'education', 'internships', 'activities', 'achievements', 'custom', 'signature'].includes(id))
    .map(id => mdSectionMap[id] ? mdSectionMap[id]() : '')
    .join('');

  const rightSections = state.sectionOrder
    .filter(id => ['summary', 'skills', 'certifications', 'languages', 'projects', 'hobbies', 'courses', 'references', 'qualities', 'footer'].includes(id))
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
      <div class="md-cert-name">${esc(c.name)}</div>
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


// ---- Download PDF ----
function bindDownloadBtn() {
  const btn = document.getElementById('download-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    let fn = 'Resume.pdf';
    if (state.personal.firstName || state.personal.lastName) {
      fn = `${state.personal.firstName || ''}_${state.personal.lastName || ''}_EliteResume`.replace(/_+/g, '_').trim() + '.pdf';
    }

    const oldZoom = zoom;
    if (zoom !== 1) {
      zoom = 1;
      applyZoom();
    }

    btn.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;">⏳</span> Generating...`;
    btn.disabled = true;

    const element = document.getElementById('resume-preview');
    const opt = {
      margin: 0,
      filename: fn,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      if (oldZoom !== 1) {
        zoom = oldZoom;
        applyZoom();
      }
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg> Download PDF`;
      btn.disabled = false;
    });
  });
}
