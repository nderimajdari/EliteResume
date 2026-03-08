/* ===== ResumeForge app.js ===== */

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
  certifications: []
};

let zoom = 1;

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
  if (t && ['classic', 'modern', 'creative', 'minimal', 'executive', 'tech', 'elegant', 'bold', 'startup', 'corporate'].includes(t)) {
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
  } catch (e) { }
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

function makeEntry(title, content, removeCallback) {
  const card = document.createElement('div');
  card.className = 'entry-card';
  card.innerHTML = `<div class="entry-header"><span class="entry-title">${title}</span><button class="btn-remove" title="Remove">✕</button></div>`;
  card.querySelector('.btn-remove').onclick = removeCallback;
  card.appendChild(content);
  return card;
}

function makeInput(label, val, onInput, placeholder = '') {
  const g = document.createElement('div');
  g.className = 'form-group';
  g.innerHTML = `<label>${label}</label><input type="text" value="${esc(val)}" placeholder="${placeholder}" />`;
  g.querySelector('input').addEventListener('input', e => onInput(e.target.value));
  return g;
}
function makeEndDateInput(label, val, onInput, placeholder = '') {
  const g = document.createElement('div');
  g.className = 'form-group';
  const isPresent = (val || '').toLowerCase() === 'present';
  const valToShow = isPresent ? '' : esc(val);

  g.innerHTML = `
    <label style="display:flex;justify-content:space-between;align-items:center;">
      ${label}
      <label style="font-weight:normal;font-size:0.8rem;display:flex;align-items:center;margin:0;cursor:pointer;color:var(--text-light);">
        <input type="checkbox" style="margin:0 4px 0 0;width:auto;" ${isPresent ? 'checked' : ''} />
        Present
      </label>
    </label>
    <input type="text" value="${valToShow}" placeholder="${placeholder}" ${isPresent ? 'disabled' : ''} ${isPresent ? 'style="opacity:0.6"' : ''} />
  `;

  const textInput = g.querySelector('input[type="text"]');
  const checkbox = g.querySelector('input[type="checkbox"]');

  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      textInput.disabled = true;
      textInput.style.opacity = '0.6';
      textInput.value = '';
      onInput('Present');
    } else {
      textInput.disabled = false;
      textInput.style.opacity = '1';
      onInput(textInput.value);
    }
  });

  textInput.addEventListener('input', (e) => {
    if (!checkbox.checked) onInput(e.target.value);
  });

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
  renderList('experience', renderExperienceForm, state.experience);
  renderPreview(); saveToStorage();
}
function removeExperience(i) {
  state.experience.splice(i, 1);
  renderList('experience', renderExperienceForm, state.experience);
  renderPreview(); saveToStorage();
}
function renderExperienceForm(item, i) {
  const frag = document.createDocumentFragment();
  frag.appendChild(makeRow(
    makeInput('Company', item.company, v => { item.company = v; rp(); }, 'Acme Corp'),
    makeInput('Position', item.position, v => { item.position = v; rp(); }, 'Senior Engineer')
  ));
  frag.appendChild(makeRow(
    makeInput('Start Date', item.startDate, v => { item.startDate = v; rp(); }, 'Jan 2020'),
    makeEndDateInput('End Date', item.endDate, v => { item.endDate = v; rp(); }, 'Present')
  ));
  frag.appendChild(makeTextarea('Description', item.description, v => { item.description = v; rp(); }, 'Key achievements and responsibilities...'));
  return makeEntry(`Experience ${i + 1}`, (() => { const w = document.createElement('div'); frag.childNodes && [...Array.from(frag.childNodes)].forEach(c => w.appendChild(c.cloneNode(true))); const f2 = document.createDocumentFragment(); f2.appendChild(makeRow(makeInput('Company', item.company, v => { item.company = v; rp(); saveToStorage(); }, 'Acme Corp'), makeInput('Position', item.position, v => { item.position = v; rp(); saveToStorage(); }, 'Engineer'))); f2.appendChild(makeRow(makeInput('Start Date', item.startDate, v => { item.startDate = v; rp(); saveToStorage(); }, 'Jan 2020'), makeEndDateInput('End Date', item.endDate, v => { item.endDate = v; rp(); saveToStorage(); }, 'Present'))); f2.appendChild(makeTextarea('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'Achievements...')); const w2 = document.createElement('div'); w2.appendChild(f2); return w2; })(), () => removeExperience(i));
}

// Simpler rebuild approach for forms
function buildExperienceCard(item, i) {
  const wrap = document.createElement('div');
  const r1 = makeRow(
    makeInput('Company', item.company, v => { item.company = v; rp(); saveToStorage(); }, 'Acme Corp'),
    makeInput('Position', item.position, v => { item.position = v; rp(); saveToStorage(); }, 'Software Engineer')
  );
  const r2 = makeRow(
    makeInput('Start Date', item.startDate, v => { item.startDate = v; rp(); saveToStorage(); }, 'Jan 2020'),
    makeEndDateInput('End Date', item.endDate, v => { item.endDate = v; rp(); saveToStorage(); }, 'Present')
  );
  const r3 = makeTextarea('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'Key responsibilities and achievements...');
  wrap.appendChild(r1); wrap.appendChild(r2); wrap.appendChild(r3);
  return makeEntry(`Experience ${i + 1}`, wrap, () => removeExperience(i));
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
    makeInput('Start Year', item.startDate, v => { item.startDate = v; rp(); saveToStorage(); }, '2016'),
    makeEndDateInput('End Year', item.endDate, v => { item.endDate = v; rp(); saveToStorage(); }, '2020')
  ));
  wrap.appendChild(makeTextarea('Description', item.description, v => { item.description = v; rp(); saveToStorage(); }, 'Honors, activities...', 2));
  return makeEntry(`Education ${i + 1}`, wrap, () => removeEducation(i));
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
  return makeEntry(`Skill ${i + 1}`, wrap, () => removeSkill(i));
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
  return makeEntry(`Language ${i + 1}`, wrap, () => removeLanguage(i));
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
  return makeEntry(`Project ${i + 1}`, wrap, () => removeProject(i));
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
    makeInput('Date', item.date, v => { item.date = v; rp(); saveToStorage(); }, 'Jun 2024'),
    makeInput('URL', item.url, v => { item.url = v; rp(); saveToStorage(); }, 'credential link')
  ));
  return makeEntry(`Certification ${i + 1}`, wrap, () => removeCertification(i));
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
  if (tmpl === 'classic') html = buildClassic();
  else if (tmpl === 'modern') html = buildModern();
  else if (tmpl === 'creative') html = buildCreative();
  else if (tmpl === 'minimal') html = buildMinimal();
  else if (tmpl === 'executive') html = buildExecutive();
  else if (tmpl === 'tech') html = buildTech();
  else if (tmpl === 'elegant') html = buildElegant();
  else if (tmpl === 'bold') html = buildBold();
  else if (tmpl === 'startup') html = buildStartup();
  else if (tmpl === 'corporate') html = buildCorporate();

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
function summarySection() {
  if (!state.summary) return '';
  return `<div class="r-section"><${sectionTitle('Professional Summary')}<p class="r-summary">${esc(state.summary)}</p></div>`;
}
function expSection() {
  if (!state.experience.length) return '';
  const items = state.experience.map(e => `
    <div class="r-item">
      <div class="r-item-title">${esc(e.position)}</div>
      <div class="r-item-sub">${esc(e.company)}${e.startDate ? ' • ' + esc(e.startDate) + ' – ' + (esc(e.endDate) || 'Present') : ''}</div>
      ${e.description ? `<div class="r-item-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('Work Experience')}${items}</div>`;
}
function eduSection() {
  if (!state.education.length) return '';
  const items = state.education.map(e => `
    <div class="r-item">
      <div class="r-item-title">${esc(e.degree)}${e.field ? ' in ' + esc(e.field) : ''}</div>
      <div class="r-item-sub">${esc(e.institution)}${e.startDate ? ' • ' + esc(e.startDate) + ' – ' + (esc(e.endDate) || 'Present') : ''}</div>
      ${e.description ? `<div class="r-item-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('Education')}${items}</div>`;
}
function skillsSection() {
  if (!state.skills.length) return '';
  const tags = state.skills.map(s => `<span class="r-skill">${esc(s.name)}</span>`).join('');
  return `<div class="r-section">${sectionTitle('Skills')}<div class="r-skills">${tags}</div></div>`;
}
function langSection() {
  if (!state.languages.length) return '';
  const items = state.languages.map(l => `<div class="r-item"><div class="r-item-title">${esc(l.name)}</div><div class="r-item-sub">${esc(l.proficiency)}</div></div>`).join('');
  return `<div class="r-section">${sectionTitle('Languages')}${items}</div>`;
}
function projSection() {
  if (!state.projects.length) return '';
  const items = state.projects.map(pr => `
    <div class="r-item">
      <div class="r-item-title">${esc(pr.name)}${pr.url ? ` <span style="font-weight:400;font-size:0.78rem;color:var(--resume-accent)">↗ ${esc(pr.url)}</span>` : ''}</div>
      ${pr.tech ? `<div class="r-item-sub">${esc(pr.tech)}</div>` : ''}
      ${pr.description ? `<div class="r-item-desc">${esc(pr.description)}</div>` : ''}
    </div>`).join('');
  return `<div class="r-section">${sectionTitle('Projects')}${items}</div>`;
}
function certSection() {
  if (!state.certifications.length) return '';
  const items = state.certifications.map(c => `
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
    ${state.summary ? `<div class="r-section"><div class="r-section-title">Professional Summary</div><p class="r-summary">${esc(state.summary)}</p></div>` : ''}
    ${expSection()}
    ${eduSection()}
    <div class="r-two-col">
      ${skillsSection()}
      <div>${langSection()}${certSection()}</div>
    </div>
    ${projSection()}
  `;
}

// ---- Modern ----
function buildModern() {
  const sbSkills = state.skills.map(s => `<div class="r-sb-skill"><span class="r-sb-skill-name">${esc(s.name)}</span></div><div class="r-sb-bar-bg"><div class="r-sb-bar-fill" style="width:${levelToWidth(s.level)}%"></div></div>`).join('');
  const sbLangs = state.languages.map(l => `<div class="r-sb-item">◆ ${esc(l.name)} <small style="opacity:0.6">${esc(l.proficiency)}</small></div>`).join('');
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
      ${state.skills.length ? `<div class="r-sb-section"><div class="r-sb-title">Skills</div>${sbSkills}</div>` : ''}
      ${state.languages.length ? `<div class="r-sb-section"><div class="r-sb-title">Languages</div>${sbLangs}</div>` : ''}
    </div>
    <div class="r-main">
      ${state.summary ? `<div class="r-section"><div class="r-section-title">Profile</div><p class="r-summary">${esc(state.summary)}</p></div>` : ''}
      ${expSection()}
      ${eduSection()}
      ${projSection()}
      ${certSection()}
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
      ${state.summary ? `<div class="r-section"><div class="r-section-title">About Me</div><p class="r-summary">${esc(state.summary)}</p></div>` : ''}
      ${expSection()}
      ${eduSection()}
      ${state.skills.length ? `<div class="r-section"><div class="r-section-title">Skills</div><div class="r-skills">${state.skills.map(s => `<span class="r-skill">${esc(s.name)}</span>`).join('')}</div></div>` : ''}
      ${langSection()}
      ${projSection()}
      ${certSection()}
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
    ${state.summary ? `<div class="r-section"><div class="r-section-title">Summary</div><p class="r-summary">${esc(state.summary)}</p></div>` : ''}
    ${buildMinimalExp()}
    ${buildMinimalEdu()}
    ${state.skills.length ? `<div class="r-section"><div class="r-section-title">Skills</div><div class="r-skills">${state.skills.map(s => `<span class="r-skill">${esc(s.name)}</span>`).join('')}</div></div>` : ''}
    ${langSection()}
    ${projSection()}
    ${certSection()}
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

  const leftCol = `
    ${expSection()}
    ${projSection()}
  `;
  const rightCol = `
    ${eduSection()}
    ${skillsSection()}
    ${langSection()}
    ${certSection()}
  `;

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

  const skillTags = state.skills.slice(0, 6).map(s => `<span class="r-tech-tag">${esc(s.name)}</span>`).join('');

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
      ${state.summary ? `<div class="r-section"><div class="r-section-title">About</div><p class="r-summary">${esc(state.summary)}</p></div>` : ''}
      <div class="r-two-col">
        <div>
          ${expSection()}
          ${projSection()}
        </div>
        <div>
          ${eduSection()}
          ${state.skills.length ? `<div class="r-section"><div class="r-section-title">Technical Skills</div><div class="r-skills">${state.skills.map(s => `<span class="r-skill">${esc(s.name)}</span>`).join('')}</div></div>` : ''}
          ${langSection()}
          ${certSection()}
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
      ${state.summary ? `<div class="r-section"><div class="r-section-title">Profile</div><p class="r-summary">${esc(state.summary)}</p></div>` : ''}
      ${expSection()}
      ${eduSection()}
      <div class="r-two-col">
        <div>
          ${state.skills.length ? `<div class="r-section"><div class="r-section-title">Expertise</div><div class="r-skills">${state.skills.map(s => `<span class="r-skill">${esc(s.name)}</span>`).join('')}</div></div>` : ''}
          ${certSection()}
        </div>
        <div>
          ${projSection()}
          ${langSection()}
        </div>
      </div>
    </div>
  `;
}

// ---- Bold ----
function buildBold() {
  const p = state.personal;
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
      ${state.skills.length ? `<div class="r-sb-section"><div class="r-sb-title">Skills</div><div class="r-skills-col">${state.skills.map(s => `<div class="r-sb-skill-tag">${esc(s.name)}</div>`).join('')}</div></div>` : ''}
      ${state.languages.length ? `<div class="r-sb-section"><div class="r-sb-title">Languages</div>${state.languages.map(l => `<div class="r-sb-item">› ${esc(l.name)}</div>`).join('')}</div>` : ''}
    </div>
    <div class="r-main">
      ${state.summary ? `<div class="r-section"><p class="r-summary r-summary-lead">${esc(state.summary)}</p></div>` : ''}
      ${expSection()}
      ${eduSection()}
      ${projSection()}
      ${certSection()}
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
      ${state.summary ? `<div class="r-section-card"><div class="r-section-title">About</div><p class="r-summary">${esc(state.summary)}</p></div>` : ''}
      <div class="r-two-col">
        <div class="r-col-main">
          ${expSection()}
          ${projSection()}
        </div>
        <div class="r-col-side">
          ${eduSection()}
          ${state.skills.length ? `<div class="r-section"><div class="r-section-title">Skills</div><div class="r-skills">${state.skills.map(s => `<span class="r-skill">${esc(s.name)}</span>`).join('')}</div></div>` : ''}
          ${certSection()}
          ${langSection()}
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
      ${state.summary ? `<div class="r-section"><div class="r-section-title">Professional Summary</div><p class="r-summary">${esc(state.summary)}</p></div>` : ''}
      <div class="r-two-col">
        <div class="r-col-left">
          ${expSection()}
          ${projSection()}
        </div>
        <div class="r-col-right">
          ${eduSection()}
          ${state.skills && state.skills.length > 0 ? `<div class="r-section"><div class="r-section-title">Core Competencies</div><div class="r-skills">${state.skills.map(s => `<span class="r-skill">${esc(s.name)}</span>`).join('')}</div></div>` : ''}
          ${certSection()}
          ${langSection()}
        </div>
      </div>
    </div>
  `;
}

// ---- Download PDF ----
function bindDownloadBtn() {
  const btn = document.getElementById('download-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    let fn = 'Resume.pdf';
    if (state.personal.firstName || state.personal.lastName) {
      fn = `${state.personal.firstName || ''}_${state.personal.lastName || ''}_Resume`.replace(/_+/g, '_').trim() + '.pdf';
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
