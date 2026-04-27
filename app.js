/* ===== EliteResume app.js ===== */

// ---- State ----
const state = {
  template: 'classic',
  accentColor: '#2563eb',
  photo: null,
  personal: { firstName: '', lastName: '', jobTitle: '', email: '', phone: '', city: '', country: '', linkedin: '', website: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
  certifications: [],
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'languages', 'projects', 'certifications']
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
    if (el.id === 'summary') return;
    el.value = state.personal[field] || '';
    el.addEventListener('input', () => {
      state.personal[field] = el.value;
      renderPreview();
      saveToStorage();
    });
  });
}

function bindSummaryField() {
  const el = document.getElementById('summary');
  if (!el) return;
  el.value = state.summary;
  el.addEventListener('input', () => { state.summary = el.value; renderPreview(); saveToStorage(); });
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

function makeEntry(title, content, removeCallback, type, index) {
  const card = document.createElement('div');
  card.className = 'entry-card';
  card.draggable = true;
  card.dataset.index = index;
  card.dataset.type = type;

  card.innerHTML = `
    <div class="entry-header">
      <div class="entry-drag-handle" title="Drag to reorder">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
      </div>
      <span class="entry-title">${title}</span>
      <button class="btn-remove" title="Remove">✕</button>
    </div>
  `;
  card.querySelector('.btn-remove').onclick = removeCallback;
  card.appendChild(content);

  // Drag Events
  card.addEventListener('dragstart', (e) => {
    draggedItem = card;
    draggedType = type;
    draggedIndex = index;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    // Smooth transition
    setTimeout(() => card.style.opacity = '0.4', 0);
  });

  card.addEventListener('dragend', () => {
    card.style.opacity = '1';
    card.classList.remove('dragging');
    document.querySelectorAll('.entry-card').forEach(c => c.classList.remove('drag-over'));
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedType !== type) return;
    card.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    if (draggedType !== type || draggedIndex === index) return;

    // Swap items in state
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
  for (let y = currYear + 5; y >= 1950; y--) years.push(y);

  let mVal = '', yVal = '', isPresent = (value === 'Present');
  if (!isPresent && value) {
    const pts = String(value).split(' ');
    if (pts.length === 2) { mVal = pts[0]; yVal = pts[1]; }
    else if (pts.length === 1 && !isNaN(pts[0])) { yVal = pts[0]; } // Year only
  }

  const update = () => {
    if (includePresent && isPresent) onInput('Present');
    else if (mVal && yVal) onInput(`${mVal} ${yVal}`);
    else if (yVal) onInput(yVal);
    else if (mVal) onInput(mVal);
    else onInput('');
  };

  const labelHtml = `
    <label style="display:flex;justify-content:space-between;align-items:center;">
      ${label}
      ${includePresent ? `
        <label style="font-weight:normal;font-size:0.8rem;display:flex;align-items:center;margin:0;cursor:pointer;color:var(--mid);">
          <input type="checkbox" style="margin:0 4px 0 0;width:auto;" ${isPresent ? 'checked' : ''} />
          Present
        </label>
      ` : ''}
    </label>
  `;

  g.innerHTML = labelHtml;
  const selectRow = document.createElement('div');
  selectRow.className = 'date-select-row';

  const mSel = document.createElement('select');
  mSel.innerHTML = '<option value="">Month</option>' + months.map(m => `<option value="${m}" ${m === mVal ? 'selected' : ''}>${m}</option>`).join('');

  const ySel = document.createElement('select');
  ySel.innerHTML = '<option value="">Year</option>' + years.map(y => `<option value="${y}" ${String(y) === String(yVal) ? 'selected' : ''}>${y}</option>`).join('');

  if (isPresent) { mSel.disabled = ySel.disabled = true; mSel.style.opacity = ySel.style.opacity = '0.6'; }

  mSel.onchange = e => { mVal = e.target.value; update(); };
  ySel.onchange = e => { yVal = e.target.value; update(); };

  if (includePresent) {
    g.querySelector('input[type="checkbox"]').onchange = e => {
      isPresent = e.target.checked;
      mSel.disabled = ySel.disabled = isPresent;
      mSel.style.opacity = ySel.style.opacity = isPresent ? '0.6' : '1';
      if (isPresent) { mSel.value = ''; ySel.value = ''; mVal = ''; yVal = ''; }
      update();
    };
  }

  selectRow.appendChild(mSel);
  selectRow.appendChild(ySel);
  g.appendChild(selectRow);
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
  state.experience.push({ company: '', position: '', startDate: '', endDate: '', current: false, description: '' });
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
  const r1 = makeRow(
    makeInput('Company', item.company, v => { item.company = v; rp(); saveToStorage(); }, 'Acme Corp'),
    makeInput('Position', item.position, v => { item.position = v; rp(); saveToStorage(); }, 'Software Engineer')
  );
  const r2 = makeRow(
    makeDateDropdowns('Start Date', item.startDate, v => { item.startDate = v; rp(); saveToStorage(); }),
    makeDateDropdowns('End Date', item.endDate, v => { item.endDate = v; rp(); saveToStorage(); }, true)
  );
  const r3 = makeTextarea('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'Key responsibilities and achievements...');
  wrap.appendChild(r1); wrap.appendChild(r2); wrap.appendChild(r3);
  return makeEntry(`Experience ${i + 1}`, wrap, () => removeExperience(i), 'experience', i);
}

// --- Education ---
function addEducation() {
  state.education.push({ institution: '', degree: '', field: '', startDate: '', endDate: '', description: '' });
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
  wrap.appendChild(makeInput('Institution', item.institution, v => { item.institution = v; rp(); saveToStorage(); }, 'Harvard University'));
  wrap.appendChild(makeRow(
    makeInput('Degree', item.degree, v => { item.degree = v; rp(); saveToStorage(); }, 'Bachelor\'s'),
    makeInput('Field of Study', item.field, v => { item.field = v; rp(); saveToStorage(); }, 'Computer Science')
  ));
  wrap.appendChild(makeRow(
    makeDateDropdowns('Start Year', item.startDate, v => { item.startDate = v; rp(); saveToStorage(); }),
    makeDateDropdowns('End Year', item.endDate, v => { item.endDate = v; rp(); saveToStorage(); }, true)
  ));
  wrap.appendChild(makeTextarea('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'Honors, activities...', 2));
  return makeEntry(`Education ${i + 1}`, wrap, () => removeEducation(i), 'education', i);
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
  return makeEntry(`Skill ${i + 1}`, wrap, () => removeSkill(i), 'skills', i);
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
  return makeEntry(`Language ${i + 1}`, wrap, () => removeLanguage(i), 'languages', i);
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
  wrap.appendChild(makeTextarea('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'What the project does...', 2));
  return makeEntry(`Project ${i + 1}`, wrap, () => removeProject(i), 'projects', i);
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
  return makeEntry(`Certification ${i + 1}`, wrap, () => removeCertification(i), 'certifications', i);
}

// Helper to render list directly with card builder
function renderListClean(type, builder, list) {
  const container = document.getElementById(`${type}-list`);
  if (!container) return;
  container.innerHTML = '';
  list.forEach((item, i) => container.appendChild(builder(item, i)));
}

// Override renderAllDynamic to use clean builders
function renderAllDynamic() {
  renderListClean('experience', buildExperienceCard, state.experience);
  renderListClean('education', buildEducationCard, state.education);
  renderListClean('skills', buildSkillCard, state.skills);
  renderListClean('languages', buildLanguageCard, state.languages);
  renderListClean('projects', buildProjectCard, state.projects);
  renderListClean('certifications', buildCertCard, state.certifications);
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
function contactItems(dark = false) {
  const p = state.personal;
  const color = dark ? 'color:#e2e8f0' : '';
  const items = [];
  if (p.email) items.push(`<span class="r-contact-item" style="${color}">✉ ${esc(p.email)}</span>`);
  if (p.phone) items.push(`<span class="r-contact-item" style="${color}">📞 ${esc(p.phone)}</span>`);
  if (p.city || p.country) items.push(`<span class="r-contact-item" style="${color}">📍 ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>`);
  if (p.linkedin) items.push(`<span class="r-contact-item" style="${color}">in ${esc(p.linkedin)}</span>`);
  if (p.website) items.push(`<span class="r-contact-item" style="${color}">🌐 ${esc(p.website)}</span>`);
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
  certifications: certSection
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
      <div class="r-item-sub">${esc(e.company)}${e.startDate ? ' • ' + esc(e.startDate) + ' – ' + (esc(e.endDate) || 'Present') : ''}</div>
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
      <div class="r-item-sub">${esc(e.institution)}${e.startDate ? ' • ' + esc(e.startDate) + ' – ' + (esc(e.endDate) || 'Present') : ''}</div>
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
    ${renderOrderedSections(['summary', 'experience', 'education', 'skills', 'languages', 'certifications', 'projects'])}
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
  if (p.email) contacts.push(`<div class="r-sb-item">✉ ${esc(p.email)}</div>`);
  if (p.phone) contacts.push(`<div class="r-sb-item">📞 ${esc(p.phone)}</div>`);
  if (p.city || p.country) contacts.push(`<div class="r-sb-item">📍 ${esc([p.city, p.country].filter(Boolean).join(', '))}</div>`);
  if (p.linkedin) contacts.push(`<div class="r-sb-item">in ${esc(p.linkedin)}</div>`);
  if (p.website) contacts.push(`<div class="r-sb-item">🌐 ${esc(p.website)}</div>`);

  return `
    <div class="r-sidebar">
      ${avatarHtml('r-avatar', 'r-avatar-placeholder')}
      <div class="r-sidebar-name">${getName()}</div>
      <div class="r-sidebar-title">${getTitle()}</div>
      ${contacts.length ? `<div class="r-sb-section"><div class="r-sb-title">Contact</div>${contacts.join('')}</div>` : ''}
      ${renderOrderedSections(['skills', 'languages'])}
    </div>
    <div class="r-main">
      ${renderOrderedSections(['summary', 'experience', 'education', 'projects', 'certifications'])}
    </div>
  `;
}

function levelToWidth(level) {
  const map = { 'Beginner': 20, 'Elementary': 40, 'Intermediate': 60, 'Proficient': 75, 'Advanced': 85, 'Expert': 100, 'Fluent': 90, 'Native': 100 };
  return map[level] || 70;
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
      ${renderOrderedSections(['summary', 'experience', 'education', 'skills', 'languages', 'projects', 'certifications'])}
    </div>
  `;
}

// ---- Minimal ----
function buildMinimal() {
  const p = state.personal;
  const contacts = [p.email, p.phone, [p.city, p.country].filter(Boolean).join(', '), p.linkedin, p.website].filter(Boolean);
  return `
    <div class="r-name">${getName()}</div>
    <div class="r-title">${getTitle()}</div>
    <div class="r-divider"></div>
    ${contacts.length ? `<div class="r-contact">${contacts.map(c => `<span class="r-contact-item">${esc(c)}</span>`).join('')}</div>` : ''}
    ${renderOrderedSections(['summary', 'experience', 'education', 'skills', 'languages', 'projects', 'certifications'])}
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
  const contacts = [];
  if (p.email) contacts.push(`<span class="r-contact-item">✉ ${esc(p.email)}</span>`);
  if (p.phone) contacts.push(`<span class="r-contact-item">📞 ${esc(p.phone)}</span>`);
  if (p.city || p.country) contacts.push(`<span class="r-contact-item">📍 ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>`);
  if (p.linkedin) contacts.push(`<span class="r-contact-item">in ${esc(p.linkedin)}</span>`);

  const leftCol = renderOrderedSections(['experience', 'projects']);
  const rightCol = renderOrderedSections(['education', 'skills', 'languages', 'certifications']);

  return `
    <div class="r-header">
      <div class="r-name">${getName()}</div>
      <div class="r-title">${getTitle()}</div>
      ${contacts.length ? `<div class="r-contact">${contacts.join('')}</div>` : ''}
    </div>
    ${state.summary ? `<div class="r-section r-summary" style="margin-bottom:20px">${esc(state.summary)}</div>` : ''}
    <div class="r-body">
      <div>${leftCol}</div>
      <div>${rightCol}</div>
    </div>
  `;
}

// ---- Tech ----
function buildTech() {
  const p = state.personal;
  const contacts = [];
  if (p.email) contacts.push(`<span class="r-contact-item">✉ ${esc(p.email)}</span>`);
  if (p.phone) contacts.push(`<span class="r-contact-item">📞 ${esc(p.phone)}</span>`);
  if (p.city || p.country) contacts.push(`<span class="r-contact-item">📍 ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>`);
  if (p.linkedin) contacts.push(`<span class="r-contact-item">in ${esc(p.linkedin)}</span>`);
  if (p.website) contacts.push(`<span class="r-contact-item">🌐 ${esc(p.website)}</span>`);

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
          ${renderOrderedSections(['experience', 'projects'])}
        </div>
        <div>
          ${renderOrderedSections(['education', 'skills', 'languages', 'certifications'])}
        </div>
      </div>
    </div>
  `;
}

// ---- Elegant ----
function buildElegant() {
  const p = state.personal;
  const contacts = [
    p.email ? `✉ ${esc(p.email)}` : '',
    p.phone ? `📞 ${esc(p.phone)}` : '',
    (p.city || p.country) ? `📍 ${esc([p.city, p.country].filter(Boolean).join(', '))}` : '',
    p.linkedin ? `in ${esc(p.linkedin)}` : '',
    p.website ? `🌐 ${esc(p.website)}` : ''
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
      ${renderOrderedSections(['summary', 'experience', 'education'])}
      <div class="r-two-col">
        <div>
          ${renderOrderedSections(['skills', 'certifications'])}
        </div>
        <div>
          ${renderOrderedSections(['projects', 'languages'])}
        </div>
      </div>
    </div>
  `;
}

// ---- Bold ----
function buildBold() {
  const p = state.personal;
  const validSkills = state.skills.filter(s => s.name && s.name.trim());
  const validLangs = state.languages.filter(l => l.name && l.name.trim());
  const contacts = [];
  if (p.email) contacts.push(`<div class="r-sb-item">✉ ${esc(p.email)}</div>`);
  if (p.phone) contacts.push(`<div class="r-sb-item">📞 ${esc(p.phone)}</div>`);
  if (p.city || p.country) contacts.push(`<div class="r-sb-item">📍 ${esc([p.city, p.country].filter(Boolean).join(', '))}</div>`);
  if (p.linkedin) contacts.push(`<div class="r-sb-item">in ${esc(p.linkedin)}</div>`);
  if (p.website) contacts.push(`<div class="r-sb-item">🌐 ${esc(p.website)}</div>`);

  return `
    <div class="r-sidebar">
      <div class="r-sidebar-name">${getName()}</div>
      <div class="r-sidebar-title">${getTitle()}</div>
      ${avatarHtml('r-avatar', 'r-avatar-placeholder')}
      ${contacts.length ? `<div class="r-sb-section"><div class="r-sb-title">Contact</div>${contacts.join('')}</div>` : ''}
      ${renderOrderedSections(['skills', 'languages'])}
    </div>
    <div class="r-main">
      ${renderOrderedSections(['summary', 'experience', 'education', 'projects', 'certifications'])}
    </div>
  `;
}

// ---- Startup ----
function buildStartup() {
  const p = state.personal;
  const contacts = [p.email, p.phone, [p.city, p.country].filter(Boolean).join(', '), p.linkedin, p.website].filter(Boolean);

  return `
    <div class="r-header">
      <div class="r-header-content">
        <div class="r-name">${getName()}</div>
        <div class="r-title">${getTitle()}</div>
        ${contacts.length ? `<div class="r-contact">${contacts.map(c => `<span class="r-contact-item">${esc(c)}</span>`).join('')}</div>` : ''}
      </div>
      ${avatarHtml('r-avatar', 'r-avatar-placeholder')}
    </div>
    <div class="r-body">
      ${renderOrderedSections(['summary'])}
      <div class="r-two-col">
        <div class="r-col-main">
          ${renderOrderedSections(['experience', 'projects'])}
        </div>
        <div class="r-col-side">
          ${renderOrderedSections(['education', 'skills', 'certifications', 'languages'])}
        </div>
      </div>
    </div>
  `;
}

// ---- Corporate ----
function buildCorporate() {
  const p = state.personal;
  const contacts = [
    p.email ? `✉ ${esc(p.email)}` : '',
    p.phone ? `📞 ${esc(p.phone)}` : '',
    (p.city || p.country) ? `📍 ${esc([p.city, p.country].filter(Boolean).join(', '))}` : '',
    p.linkedin ? `in ${esc(p.linkedin)}` : ''
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
          ${renderOrderedSections(['experience', 'projects'])}
        </div>
        <div class="r-col-right">
          ${renderOrderedSections(['education', 'skills', 'certifications', 'languages'])}
        </div>
      </div>
    </div>
  `;
}

// ---- Professional (Refined High-Fidelity) ----
function buildProfessional() {
  const p = state.personal;
  const contacts = [
    p.email ? `<span class="r-contact-item"><span class="r-prof-icon">✉</span> ${esc(p.email)}</span>` : '',
    p.phone ? `<span class="r-contact-item"><span class="r-prof-icon">📞</span> ${esc(p.phone)}</span>` : '',
    (p.city || p.country) ? `<span class="r-contact-item"><span class="r-prof-icon">🏠</span> ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>` : '',
    p.linkedin ? `<span class="r-contact-item"><span class="r-prof-icon">in</span> ${esc(p.linkedin)}</span>` : ''
  ].filter(Boolean);

  const profSectionMap = {
    summary: summarySection,
    education: profEduSection,
    experience: profExpSection,
    skills: profSkillsSection,
    certifications: profCertSection,
    languages: langSection,
    projects: projSection
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
      <div class="prof-bullet-side"><span class="prof-sq">■</span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(e.position)}</div>
        <div class="prof-item-sub">${esc(e.company)}</div>
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
      <div class="prof-bullet-side"><span class="prof-sq">■</span></div>
      <div class="prof-content-side">
        <div class="prof-item-title">${esc(e.degree)}${e.field ? ', ' + esc(e.field) : ''}</div>
        <div class="prof-item-sub">${esc(e.institution)}</div>
        ${e.description ? `<div class="prof-item-desc">${esc(e.description)}</div>` : ''}
      </div>
    </div>`).join('');
  return profSectionWrapper('Education', rows);
}

function profSkillsSection() {
  const list = state.skills.filter(s => s.name && s.name.trim());
  if (!list.length) return '';
  const rows = `
    <div class="prof-skills-full">
      <div class="prof-skills-grid">
        ${list.map(s => `<div class="prof-skill-item">${esc(s.name)}</div>`).join('')}
      </div>
    </div>`;
  return profSectionWrapper('Skills', rows, 'prof-skills-section');
}

function profCertSection() {
  const list = state.certifications.filter(c => c.name && c.name.trim());
  if (!list.length) return '';
  const rows = list.map(c => `
    <div class="prof-item-row">
      <div class="prof-date-side">${esc(c.date)}</div>
      <div class="prof-bullet-side"><span class="prof-sq">■</span></div>
      <div class="prof-content-side">
        <div class="prof-item-desc-plain">${esc(c.name)}</div>
      </div>
    </div>`).join('');
  return profSectionWrapper('Certificates', rows);
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
    projects: projSection // fallback
  };

  const leftSections = state.sectionOrder
    .filter(id => ['experience', 'education'].includes(id))
    .map(id => mdSectionMap[id] ? mdSectionMap[id]() : '')
    .join('');

  const rightSections = state.sectionOrder
    .filter(id => ['summary', 'skills', 'certifications', 'languages', 'projects'].includes(id))
    .map(id => mdSectionMap[id] ? mdSectionMap[id]() : '')
    .join('');

  return `
    <div class="tmpl-modern-dark">
      <div class="md-header">
        <div class="md-header-main">
          <h1 class="md-name">${getName()}</h1>
          <div class="md-role">${getTitle()}</div>
          <div class="md-contacts">
            ${p.phone ? `<span><span class="md-icon">📞</span> ${esc(p.phone)}</span>` : ''}
            ${p.email ? `<span><span class="md-icon">✉</span> ${esc(p.email)}</span>` : ''}
            ${(p.city || p.country) ? `<span><span class="md-icon">📍</span> ${esc([p.city, p.country].filter(Boolean).join(', '))}</span>` : ''}
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
        ${[1, 2, 3, 4, 5].map(i => `<span class="md-dot ${i <= 5 ? 'active' : ''}"></span>`).join('')}
      </div>
      <div class="md-skill-level">Expert</div>
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
      <span class="md-lang-level">${esc(l.level || '')}</span>
    </div>
  `).join('');
  return modernDarkSection('Languages', items);
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
