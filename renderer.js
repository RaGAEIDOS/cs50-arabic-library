let libraryData = {
  resources: [],
  bookmarks: [],
  progress: {},
  settings: {
    autoSave: true,
    autoSaveInterval: 30
  }
};

let autoSaveTimer = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initializeEventListeners();
  renderAllSections();
  updateStats();
  startAutoSave();
});

// Load data from localStorage
async function loadData() {
  try {
    const savedData = localStorage.getItem('cs50LibraryData');
    if (savedData) {
      libraryData = JSON.parse(savedData);
    } else {
      libraryData.resources = [...defaultResources];
    }
  } catch (error) {
    console.error('Error loading data:', error);
    libraryData.resources = [...defaultResources];
  }
}

// Save data to localStorage
async function saveData() {
  try {
    localStorage.setItem('cs50LibraryData', JSON.stringify(libraryData));
    showSaveNotification();
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Start auto-save timer
function startAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }
  if (libraryData.settings.autoSave) {
    autoSaveTimer = setInterval(saveData, libraryData.settings.autoSaveInterval * 1000);
  }
}

// Show toast notification
function showToast(message = 'تم الحفظ بنجاح') {
  const toast = document.getElementById('toast');
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Show save notification
function showSaveNotification() {
  const indicator = document.querySelector('.save-dot');
  indicator.style.background = '#10b981';
  indicator.style.boxShadow = '0 0 12px #10b981';
  setTimeout(() => {
    indicator.style.background = '#10b981';
    indicator.style.boxShadow = '0 0 8px #10b981';
  }, 1000);
}

// Navigate to section
function navigateToSection(sectionId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
  if (navBtn) navBtn.classList.add('active');
  
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(sectionId);
  if (section) section.classList.add('active');
  
  if (sectionId === 'bookmarks') {
    renderBookmarks();
  } else if (sectionId === 'progress') {
    updateProgressDashboard();
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Navigation - Sidebar
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateToSection(btn.dataset.section);
    });
  });

  // Quick access cards
  document.querySelectorAll('.quick-card').forEach(card => {
    card.addEventListener('click', () => {
      navigateToSection(card.dataset.section);
    });
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchResources(e.target.value);
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const section = btn.closest('.section');
      const sectionId = section.id;
      const filter = btn.dataset.filter;
      
      filterResources(sectionId, filter);
    });
  });

  // Add resource modal
  document.getElementById('addResourceBtn').addEventListener('click', () => {
    document.getElementById('addResourceModal').classList.add('active');
  });

  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('addResourceModal').classList.remove('active');
  });

  // Detail modal
  document.getElementById('closeDetail').addEventListener('click', () => {
    document.getElementById('resourceDetailModal').classList.remove('active');
  });

  // Resource form
  document.getElementById('resourceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    addNewResource();
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', () => {
      overlay.closest('.modal').classList.remove('active');
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });
}

// Render all sections
function renderAllSections() {
  renderResources('cs50Resources', libraryData.resources.filter(r => r.category === 'cs50'));
  renderResources('mathResources', libraryData.resources.filter(r => r.category === 'math'));
  renderResources('physicsResources', libraryData.resources.filter(r => r.category === 'physics'));
  renderResources('chemistryResources', libraryData.resources.filter(r => r.category === 'chemistry'));
  renderResources('statisticsResources', libraryData.resources.filter(r => r.category === 'statistics'));
  renderResources('biologyResources', libraryData.resources.filter(r => r.category === 'biology'));
  renderRecentResources();
  updateQuickAccessCounts();
}

// Render resources to a grid
function renderResources(containerId, resources) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = resources.map(resource => createResourceCard(resource)).join('');
  
  // Add event listeners to cards
  container.querySelectorAll('.resource-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.bookmark-btn')) {
        showResourceDetail(parseInt(card.dataset.id));
      }
    });
  });
  
  // Add bookmark listeners
  container.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBookmark(parseInt(btn.dataset.id));
    });
  });
}

// Create resource card HTML
function createResourceCard(resource) {
  const isBookmarked = libraryData.bookmarks.includes(resource.id);
  const typeIcons = {
    video: 'fa-play',
    book: 'fa-book',
    summary: 'fa-file-alt',
    exercise: 'fa-tasks',
    link: 'fa-external-link-alt'
  };
  
  return `
    <div class="resource-card" data-id="${resource.id}" data-category="${resource.category}" data-type="${resource.type}">
      <div class="resource-card-header">
        <span class="resource-type ${resource.type}">
          <i class="fas ${typeIcons[resource.type] || 'fa-link'}"></i>
          ${getTypeName(resource.type)}
        </span>
        <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" data-id="${resource.id}">
          <i class="fas fa-bookmark"></i>
        </button>
      </div>
      <h4>${resource.title}</h4>
      <p>${resource.description}</p>
      <div class="resource-meta">
        <span class="resource-category">${categoryNames[resource.category] || resource.category}</span>
        <span>${resource.subcategory ? subcategoryNames[resource.subcategory] || resource.subcategory : ''}</span>
      </div>
    </div>
  `;
}

// Get type name in Arabic
function getTypeName(type) {
  const types = {
    video: 'فيديو',
    book: 'كتاب',
    summary: 'تلخيص',
    exercise: 'تمرين',
    link: 'رابط'
  };
  return types[type] || type;
}

// Render recent resources
function renderRecentResources() {
  const recent = libraryData.resources.slice(-6).reverse();
  const container = document.getElementById('recentResources');
  if (container) {
    container.innerHTML = recent.map(resource => createResourceCard(resource)).join('');
  }
}

// Render bookmarks
function renderBookmarks() {
  const bookmarkedResources = libraryData.resources.filter(r => libraryData.bookmarks.includes(r.id));
  const container = document.getElementById('bookmarkedResources');
  const emptyState = document.getElementById('emptyBookmarks');
  
  if (bookmarkedResources.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    renderResources('bookmarkedResources', bookmarkedResources);
  }
}

// Toggle bookmark
function toggleBookmark(id) {
  const index = libraryData.bookmarks.indexOf(id);
  if (index > -1) {
    libraryData.bookmarks.splice(index, 1);
    showToast('تم إزالة المورد من المفضلة');
  } else {
    libraryData.bookmarks.push(id);
    showToast('تم إضافة المورد للمفضلة');
  }
  
  const resource = libraryData.resources.find(r => r.id === id);
  if (resource) {
    resource.bookmarked = libraryData.bookmarks.includes(id);
  }
  
  saveData();
  renderAllSections();
  updateStats();
}

// Show resource detail
function showResourceDetail(id) {
  const resource = libraryData.resources.find(r => r.id === id);
  if (!resource) return;
  
  document.getElementById('detailTitle').innerHTML = `<i class="fas fa-info-circle"></i> ${resource.title}`;
  
  let content = `
    <div class="detail-section">
      <h4><i class="fas fa-align-right"></i> الوصف</h4>
      <p>${resource.description}</p>
    </div>
    
    <div class="detail-section">
      <h4><i class="fas fa-tag"></i> النوع</h4>
      <p>${getTypeName(resource.type)}</p>
    </div>
    
    <div class="detail-section">
      <h4><i class="fas fa-folder"></i> القسم</h4>
      <p>${categoryNames[resource.category]} - ${subcategoryNames[resource.subcategory] || resource.subcategory}</p>
    </div>
  `;
  
  if (resource.url) {
    content += `
      <div class="detail-section">
        <h4><i class="fas fa-link"></i> الرابط</h4>
        <p><a href="${resource.url}" target="_blank">${resource.url}</a></p>
      </div>
    `;
  }
  
  content += `
    <div class="detail-actions">
      ${resource.url ? `<a href="${resource.url}" target="_blank" class="action-btn primary"><i class="fas fa-external-link-alt"></i> فتح الرابط</a>` : ''}
      <button class="action-btn primary" onclick="updateResourceProgress(${resource.id})"><i class="fas fa-chart-line"></i> تحديث التقدم</button>
      <button class="action-btn" style="background: var(--danger); color: white;" onclick="deleteResource(${resource.id})"><i class="fas fa-trash"></i> حذف</button>
    </div>
  `;
  
  document.getElementById('detailContent').innerHTML = content;
  document.getElementById('resourceDetailModal').classList.add('active');
}

// Add new resource
function addNewResource() {
  const title = document.getElementById('resourceTitle').value;
  const description = document.getElementById('resourceDescription').value;
  const url = document.getElementById('resourceUrl').value;
  const type = document.getElementById('resourceType').value;
  const category = document.getElementById('resourceCategory').value;
  const subcategory = document.getElementById('resourceSubcategory').value;
  
  const newResource = {
    id: Date.now(),
    title,
    description,
    url,
    type,
    category,
    subcategory,
    bookmarked: false,
    progress: 0,
    dateAdded: new Date().toISOString().split('T')[0]
  };
  
  libraryData.resources.push(newResource);
  saveData();
  renderAllSections();
  updateStats();
  
  // Reset form
  document.getElementById('resourceForm').reset();
  document.getElementById('addResourceModal').classList.remove('active');
  showToast('تم إضافة المورد بنجاح');
}

// Delete resource
function deleteResource(id) {
  if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
    libraryData.resources = libraryData.resources.filter(r => r.id !== id);
    libraryData.bookmarks = libraryData.bookmarks.filter(b => b !== id);
    delete libraryData.progress[id];
    
    saveData();
    renderAllSections();
    updateStats();
    document.getElementById('resourceDetailModal').classList.remove('active');
    showToast('تم حذف المورد بنجاح');
  }
}

// Update resource progress
function updateResourceProgress(id) {
  const resource = libraryData.resources.find(r => r.id === id);
  if (!resource) return;
  
  const newProgress = prompt(`التقدم الحالي: ${resource.progress}%\nأدخل التقدم الجديد (0-100):`, resource.progress);
  
  if (newProgress !== null) {
    const progress = Math.min(100, Math.max(0, parseInt(newProgress) || 0));
    resource.progress = progress;
    libraryData.progress[id] = progress;
    
    saveData();
    renderAllSections();
    updateStats();
    showToast('تم تحديث التقدم بنجاح');
  }
}

// Filter resources
function filterResources(sectionId, filter) {
  const container = document.getElementById(sectionId + 'Resources');
  if (!container) return;
  
  const cards = container.querySelectorAll('.resource-card');
  cards.forEach(card => {
    if (filter === 'all' || card.dataset.type === filter) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Search resources
function searchResources(query) {
  if (!query) {
    renderAllSections();
    return;
  }
  
  query = query.toLowerCase();
  const results = libraryData.resources.filter(r => 
    r.title.toLowerCase().includes(query) ||
    r.description.toLowerCase().includes(query) ||
    (categoryNames[r.category] || '').includes(query) ||
    (subcategoryNames[r.subcategory] || '').includes(query)
  );
  
  // Show results in all sections
  renderResources('cs50Resources', results.filter(r => r.category === 'cs50'));
  renderResources('mathResources', results.filter(r => r.category === 'math'));
  renderResources('physicsResources', results.filter(r => r.category === 'physics'));
  renderResources('chemistryResources', results.filter(r => r.category === 'chemistry'));
  renderResources('statisticsResources', results.filter(r => r.category === 'statistics'));
  renderResources('biologyResources', results.filter(r => r.category === 'biology'));
}

// Update statistics
function updateStats() {
  document.getElementById('totalResources').textContent = libraryData.resources.length;
  document.getElementById('bookmarkedCount').textContent = libraryData.bookmarks.length;
}

// Update quick access counts
function updateQuickAccessCounts() {
  const categories = ['cs50', 'math', 'physics', 'chemistry', 'statistics', 'biology'];
  const quickCards = document.querySelectorAll('.quick-card');
  
  quickCards.forEach((card, index) => {
    if (categories[index]) {
      const count = libraryData.resources.filter(r => r.category === categories[index]).length;
      card.querySelector('small').textContent = `${count} مورد`;
    }
  });
}

// Update progress dashboard
function updateProgressDashboard() {
  const categories = ['cs50', 'math', 'physics', 'chemistry', 'statistics', 'biology'];
  const progressIds = ['cs50Progress', 'mathProgress', 'physicsProgress', 'chemistryProgress', 'statsProgress', 'bioProgress'];
  const textIds = ['cs50ProgressText', 'mathProgressText', 'physicsProgressText', 'chemistryProgressText', 'statsProgressText', 'bioProgressText'];
  
  let totalCompleted = 0;
  let totalResources = 0;
  
  categories.forEach((cat, index) => {
    const resources = libraryData.resources.filter(r => r.category === cat);
    const completed = resources.filter(r => r.progress >= 100).length;
    const percentage = resources.length > 0 ? Math.round((completed / resources.length) * 100) : 0;
    
    totalCompleted += completed;
    totalResources += resources.length;
    
    document.getElementById(progressIds[index]).style.width = percentage + '%';
    document.getElementById(textIds[index]).textContent = percentage + '%';
  });
  
  // Update main progress ring
  const mainPercentage = totalResources > 0 ? Math.round((totalCompleted / totalResources) * 100) : 0;
  document.getElementById('mainProgressPercent').textContent = mainPercentage + '%';
  
  // Update SVG circle
  const circle = document.getElementById('mainProgressCircle');
  if (circle) {
    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (mainPercentage / 100) * circumference;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
  }
}

// Make functions available globally
window.updateResourceProgress = updateResourceProgress;
window.deleteResource = deleteResource;
