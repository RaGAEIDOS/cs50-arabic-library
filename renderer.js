const catNames = {
  cs50: 'CS-50', math: 'الرياضيات', physics: 'الفيزياء',
  chemistry: 'الكيمياء', statistics: 'الإحصاء', biology: 'البيولوجيا'
};
const catCountIds = {
  cs50: 'cs50Count', math: 'mathCount', physics: 'physicsCount',
  chemistry: 'chemistryCount', statistics: 'statisticsCount', biology: 'biologyCount'
};
const catGridIds = {
  cs50: 'cs50Grid', math: 'mathGrid', physics: 'physicsGrid',
  chemistry: 'chemistryGrid', statistics: 'statisticsGrid', biology: 'biologyGrid'
};
const catBarIds = {
  cs50: 'cs50Bar', math: 'mathBar', physics: 'physicsBar',
  chemistry: 'chemistryBar', statistics: 'statisticsBar', biology: 'biologyBar'
};
const catPctIds = {
  cs50: 'cs50Pct', math: 'mathPct', physics: 'physicsPct',
  chemistry: 'chemistryPct', statistics: 'statisticsPct', biology: 'biologyPct'
};
const typeLabels = {
  video: 'فيديو', book: 'كتاب', summary: 'تلخيص',
  exercise: 'تمرين', link: 'رابط', pdf: 'PDF'
};
const typeBadges = {
  video: 'badge-video', book: 'badge-book', summary: 'badge-summary',
  exercise: 'badge-exercise', link: 'badge-link', pdf: 'badge-book'
};
const typeIcons = {
  video: 'fa-play', book: 'fa-book', summary: 'fa-file-lines',
  exercise: 'fa-list-check', link: 'fa-arrow-up-right-from-square', pdf: 'fa-file-pdf'
};
const diffLabels = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };
const diffIcons = { easy: 'fa-face-smile', medium: 'fa-face-meh', hard: 'fa-face-flushed' };

let lib = { resources: [], bookmarks: [], progress: {} };
const activeFilters = {};

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initEvents();
  renderAll();
  updateStats();
  renderRecent();
});

function loadData() {
  try {
    const saved = localStorage.getItem('cs50LibraryData');
    if (saved) {
      const parsed = JSON.parse(saved);
      lib.resources = parsed.resources || [...defaultResources];
      lib.bookmarks = parsed.bookmarks || [];
      lib.progress = parsed.progress || {};
    } else {
      lib.resources = [...defaultResources];
    }
  } catch {
    lib.resources = [...defaultResources];
  }
}

function save() {
  try {
    localStorage.setItem('cs50LibraryData', JSON.stringify(lib));
    toast('تم الحفظ');
  } catch (e) {
    console.error('Save error:', e);
  }
}

function toast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg || 'تم الحفظ';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function initEvents() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => goTo(btn.dataset.section));
  });

  document.querySelectorAll('.quick-card').forEach(card => {
    card.addEventListener('click', () => goTo(card.dataset.section));
  });

  document.getElementById('searchInput').addEventListener('input', e => search(e.target.value));

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sectionId = btn.closest('.section').id;
      if (!activeFilters[sectionId]) activeFilters[sectionId] = {};
      activeFilters[sectionId].type = btn.dataset.filter;
      applyAllFilters(sectionId);
    });
  });

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sectionId = btn.closest('.section').id;
      if (!activeFilters[sectionId]) activeFilters[sectionId] = {};
      activeFilters[sectionId].difficulty = btn.dataset.difficulty;
      applyAllFilters(sectionId);
    });
  });

  document.getElementById('addBtn').addEventListener('click', () => {
    document.getElementById('addModal').classList.add('active');
  });

  document.getElementById('addForm').addEventListener('submit', e => {
    e.preventDefault();
    addResource();
  });

  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => {
      el.closest('.modal').classList.remove('active');
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    }
  });

  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

function goTo(id) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-section="${id}"]`);
  if (navBtn) navBtn.classList.add('active');

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add('active');

  document.getElementById('sidebar').classList.remove('open');

  if (id === 'bookmarks') renderBookmarks();
  if (id === 'progress') renderProgress();
}

function renderAll() {
  Object.keys(catGridIds).forEach(cat => {
    const items = lib.resources.filter(r => r.category === cat);
    renderGrid(catGridIds[cat], items);
  });
  updateCounts();
}

function renderGrid(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-folder-open"></i><p>لا توجد موارد</p></div>';
    return;
  }
  el.innerHTML = items.map(r => cardHTML(r)).join('');
  el.querySelectorAll('.card').forEach(c => {
    c.addEventListener('click', e => {
      if (!e.target.closest('.card-bookmark')) showDetail(+c.dataset.id);
    });
  });
  el.querySelectorAll('.card-bookmark').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleBookmark(+btn.dataset.id);
    });
  });
}

function cardHTML(r) {
  const bm = lib.bookmarks.includes(r.id);
  const diffBadge = r.difficulty ? `<span class="diff-badge diff-${r.difficulty}"><i class="fas ${diffIcons[r.difficulty]}"></i> ${diffLabels[r.difficulty]}</span>` : '';
  return `
    <div class="card" data-id="${r.id}" data-type="${r.type}" data-difficulty="${r.difficulty || ''}">
      <div class="card-top">
        <span class="card-badge ${typeBadges[r.type] || 'badge-link'}">
          <i class="fas ${typeIcons[r.type] || 'fa-link'}"></i>
          ${typeLabels[r.type] || r.type}
        </span>
        ${diffBadge}
        <button class="card-bookmark ${bm ? 'active' : ''}" data-id="${r.id}">
          <i class="fas fa-bookmark"></i>
        </button>
      </div>
      <h4>${r.title}</h4>
      <p>${r.description || ''}</p>
      <div class="card-meta">
        <span>${catNames[r.category] || r.category}</span>
        <span>${r.subcategory || ''}</span>
      </div>
    </div>`;
}

function renderRecent() {
  const recent = lib.resources.slice(-6).reverse();
  renderGrid('recentGrid', recent);
}

function renderBookmarks() {
  const items = lib.resources.filter(r => lib.bookmarks.includes(r.id));
  const grid = document.getElementById('bookmarksGrid');
  const empty = document.getElementById('emptyBookmarks');
  if (items.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    renderGrid('bookmarksGrid', items);
  }
}

function toggleBookmark(id) {
  const i = lib.bookmarks.indexOf(id);
  if (i > -1) {
    lib.bookmarks.splice(i, 1);
    toast('تمت الإزالة من المفضلة');
  } else {
    lib.bookmarks.push(id);
    toast('تمت الإضافة للمفضلة');
  }
  save();
  renderAll();
  updateStats();
}

function showDetail(id) {
  const r = lib.resources.find(x => x.id === id);
  if (!r) return;
  document.getElementById('detailTitle').innerHTML = `<i class="fas fa-info-circle"></i> ${r.title}`;

  const diffText = r.difficulty ? `<div class="detail-section"><h4><i class="fas fa-signal"></i> المستوى</h4><p><span class="diff-badge diff-${r.difficulty}"><i class="fas ${diffIcons[r.difficulty]}"></i> ${diffLabels[r.difficulty]}</span></p></div>` : '';

  let html = `
    <div class="detail-section">
      <h4><i class="fas fa-align-right"></i> الوصف</h4>
      <p>${r.description || 'لا يوجد وصف'}</p>
    </div>
    <div class="detail-section">
      <h4><i class="fas fa-tag"></i> النوع</h4>
      <p>${typeLabels[r.type] || r.type}</p>
    </div>
    <div class="detail-section">
      <h4><i class="fas fa-folder"></i> القسم</h4>
      <p>${catNames[r.category] || r.category}</p>
    </div>
    ${diffText}`;

  if (r.url) {
    html += `
    <div class="detail-section">
      <h4><i class="fas fa-link"></i> الرابط</h4>
      <p><a href="${r.url}" target="_blank">${r.url}</a></p>
    </div>`;
  }

  html += `
    <div class="detail-actions">
      ${r.url ? `<a href="${r.url}" target="_blank" class="btn btn-primary"><i class="fas fa-arrow-up-right-from-square"></i> فتح الرابط</a>` : ''}
      <button class="btn btn-primary" onclick="window._updateProgress(${r.id})"><i class="fas fa-chart-line"></i> تحديث التقدم</button>
      <button class="btn" style="background:var(--red);color:#fff" onclick="window._deleteRes(${r.id})"><i class="fas fa-trash"></i> حذف</button>
    </div>`;

  document.getElementById('detailBody').innerHTML = html;
  document.getElementById('detailModal').classList.add('active');
}

function addResource() {
  const title = document.getElementById('fTitle').value.trim();
  const desc = document.getElementById('fDesc').value.trim();
  const url = document.getElementById('fUrl').value.trim();
  const type = document.getElementById('fType').value;
  const cat = document.getElementById('fCat').value;
  const diff = document.getElementById('fDifficulty') ? document.getElementById('fDifficulty').value : '';

  if (!title) return;

  lib.resources.push({
    id: Date.now(),
    title,
    description: desc,
    url,
    type,
    category: cat,
    subcategory: '',
    difficulty: diff,
    progress: 0,
    bookmarked: false
  });

  save();
  renderAll();
  updateStats();
  renderRecent();
  document.getElementById('addForm').reset();
  document.getElementById('addModal').classList.remove('active');
  toast('تمت إضافة المورد');
}

window._deleteRes = function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return;
  lib.resources = lib.resources.filter(r => r.id !== id);
  lib.bookmarks = lib.bookmarks.filter(b => b !== id);
  delete lib.progress[id];
  save();
  renderAll();
  updateStats();
  renderRecent();
  document.getElementById('detailModal').classList.remove('active');
  toast('تم الحذف');
};

window._updateProgress = function(id) {
  const r = lib.resources.find(x => x.id === id);
  if (!r) return;
  const val = prompt(`التقدم الحالي: ${r.progress}%\nأدخل التقدم الجديد (0-100):`, r.progress);
  if (val === null) return;
  const p = Math.min(100, Math.max(0, parseInt(val) || 0));
  r.progress = p;
  lib.progress[id] = p;
  save();
  renderAll();
  updateStats();
  toast('تم تحديث التقدم');
};

function applyAllFilters(sectionId) {
  const f = activeFilters[sectionId] || {};
  const typeFilter = f.type || 'all';
  const diffFilter = f.difficulty || 'all';
  const gridId = sectionId + 'Grid';
  const el = document.getElementById(gridId);
  if (!el) return;
  el.querySelectorAll('.card').forEach(c => {
    const matchType = typeFilter === 'all' || c.dataset.type === typeFilter;
    const matchDiff = diffFilter === 'all' || c.dataset.difficulty === diffFilter;
    c.style.display = (matchType && matchDiff) ? '' : 'none';
  });
}

function search(q) {
  if (!q.trim()) { renderAll(); return; }
  q = q.toLowerCase();
  const results = lib.resources.filter(r =>
    r.title.toLowerCase().includes(q) ||
    (r.description || '').toLowerCase().includes(q) ||
    (catNames[r.category] || '').includes(q) ||
    (r.subcategory || '').toLowerCase().includes(q)
  );
  Object.keys(catGridIds).forEach(cat => {
    renderGrid(catGridIds[cat], results.filter(r => r.category === cat));
  });
}

function updateStats() {
  const totalEl = document.getElementById('totalCount');
  const bmEl = document.getElementById('bookmarkCount');
  if (totalEl) totalEl.textContent = lib.resources.length;
  if (bmEl) bmEl.textContent = lib.bookmarks.length;
}

function updateCounts() {
  Object.entries(catCountIds).forEach(([cat, elId]) => {
    const el = document.getElementById(elId);
    if (el) {
      const count = lib.resources.filter(r => r.category === cat).length;
      el.textContent = count + ' مورد';
    }
  });
}

function renderProgress() {
  let totalDone = 0, totalRes = 0;
  const cats = Object.keys(catBarIds);

  cats.forEach(cat => {
    const res = lib.resources.filter(r => r.category === cat);
    const done = res.filter(r => (r.progress || 0) >= 100).length;
    const pct = res.length > 0 ? Math.round((done / res.length) * 100) : 0;
    totalDone += done;
    totalRes += res.length;

    const bar = document.getElementById(catBarIds[cat]);
    const txt = document.getElementById(catPctIds[cat]);
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
  });

  const mainPct = totalRes > 0 ? Math.round((totalDone / totalRes) * 100) : 0;
  const pctEl = document.getElementById('mainPct');
  if (pctEl) pctEl.textContent = mainPct + '%';

  const circle = document.getElementById('mainCircle');
  if (circle) {
    const circ = 2 * Math.PI * 85;
    circle.style.strokeDasharray = circ;
    circle.style.strokeDashoffset = circ - (mainPct / 100) * circ;
  }
}
