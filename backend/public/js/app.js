// DogeRat Web Interface - Main App Logic

const socket = io();
let devices = [];
let filteredDevices = [];
let platformFilter = 'all'; // 'all', 'android', 'ios'
let searchQuery = '';
let sortBy = 'connectedAt'; // 'connectedAt', 'model', 'platform'
let sortOrder = 'desc'; // 'asc', 'desc'
let isLoading = false;
let lastUpdateTime = null;

// Initialize filteredDevices
filteredDevices = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupPlatformFilter();
  setupSearchAndSort();
  loadDevices();
  setupSocketListeners();
  setInterval(loadDevices, 5000); // Refresh every 5 seconds
  updateLastRefreshTime();
  setInterval(updateLastRefreshTime, 1000);
});

// Setup platform filter
function setupPlatformFilter() {
  const filterContainer = document.getElementById('platform-filter');
  if (!filterContainer) return;
  
  filterContainer.innerHTML = `
    <div class="filter-controls">
      <div class="filter-group">
        <label for="platform-filter-select" aria-label="Filter by platform">Platform Filter:</label>
        <select id="platform-filter-select" onchange="filterByPlatform(this.value)" aria-label="Select platform filter">
          <option value="all">All Platforms</option>
          <option value="android">Android</option>
          <option value="ios">iOS</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="search-input" aria-label="Search devices">Search:</label>
        <input type="text" id="search-input" placeholder="Search by model, IP, or ID..." oninput="handleSearch(this.value)" aria-label="Search devices">
      </div>
      <div class="filter-group">
        <label for="sort-select" aria-label="Sort devices">Sort By:</label>
        <select id="sort-select" onchange="handleSort(this.value)" aria-label="Select sort option">
          <option value="connectedAt-desc">Newest First</option>
          <option value="connectedAt-asc">Oldest First</option>
          <option value="model-asc">Model A-Z</option>
          <option value="model-desc">Model Z-A</option>
          <option value="platform-asc">Platform A-Z</option>
          <option value="platform-desc">Platform Z-A</option>
        </select>
      </div>
      <div class="filter-group">
        <button class="btn btn-secondary" onclick="refreshDevices()" aria-label="Refresh device list">
          <span class="refresh-icon">🔄</span> Refresh
        </button>
      </div>
    </div>
    <div class="device-stats" id="device-stats">
      <span id="device-count">0 devices</span>
      <span id="last-refresh" class="last-refresh"></span>
    </div>
  `;
}

// Setup search and sort
function setupSearchAndSort() {
  // Handlers are defined inline in HTML
}

// Filter devices by platform
function filterByPlatform(platform) {
  platformFilter = platform;
  applyFilters();
}

// Handle search
function handleSearch(query) {
  searchQuery = query.toLowerCase().trim();
  applyFilters();
}

// Handle sort
function handleSort(value) {
  const [field, order] = value.split('-');
  sortBy = field;
  sortOrder = order;
  applyFilters();
}

// Apply all filters and sorting
function applyFilters() {
  // Initialize filteredDevices if not set
  if (!filteredDevices) {
    filteredDevices = [];
  }
  
  // Filter by platform
  filteredDevices = devices.filter(device => {
    if (platformFilter !== 'all' && device.platform !== platformFilter) {
      return false;
    }
    return true;
  });
  
  // Filter by search query
  if (searchQuery) {
    filteredDevices = filteredDevices.filter(device => {
      const model = (device.model || '').toLowerCase();
      const ip = (device.ip || '').toLowerCase();
      const id = (device.id || '').toLowerCase();
      return model.includes(searchQuery) || ip.includes(searchQuery) || id.includes(searchQuery);
    });
  }
  
  // Sort devices
  filteredDevices.sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'connectedAt':
        aVal = new Date(a.connectedAt || 0).getTime();
        bVal = new Date(b.connectedAt || 0).getTime();
        break;
      case 'model':
        aVal = (a.model || '').toLowerCase();
        bVal = (b.model || '').toLowerCase();
        break;
      case 'platform':
        aVal = (a.platform || 'android').toLowerCase();
        bVal = (b.platform || 'android').toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });
  
  renderDevices();
  updateDeviceStats();
}

// Refresh devices manually
async function refreshDevices() {
  const refreshBtn = document.querySelector('.refresh-icon');
  if (refreshBtn) {
    refreshBtn.style.animation = 'spin 1s linear';
    setTimeout(() => {
      refreshBtn.style.animation = '';
    }, 1000);
  }
  await loadDevices();
  showNotification('Device list refreshed', 'success');
}

// Update device statistics
function updateDeviceStats() {
  const statsEl = document.getElementById('device-stats');
  const countEl = document.getElementById('device-count');
  
  if (countEl) {
    const total = devices.length;
    const filtered = filteredDevices.length;
    const online = devices.filter(d => d.online).length;
    
    if (searchQuery || platformFilter !== 'all') {
      countEl.textContent = `${filtered} of ${total} devices (${online} online)`;
    } else {
      countEl.textContent = `${total} device${total !== 1 ? 's' : ''} (${online} online)`;
    }
  }
}

// Update last refresh time
function updateLastRefreshTime() {
  const lastRefreshEl = document.getElementById('last-refresh');
  if (lastRefreshEl && lastUpdateTime) {
    const secondsAgo = Math.floor((Date.now() - lastUpdateTime) / 1000);
    if (secondsAgo < 60) {
      lastRefreshEl.textContent = `Updated ${secondsAgo}s ago`;
    } else {
      const minutesAgo = Math.floor(secondsAgo / 60);
      lastRefreshEl.textContent = `Updated ${minutesAgo}m ago`;
    }
  }
}

// Load devices from API
async function loadDevices() {
  if (isLoading) return;
  
  isLoading = true;
  const dashboard = document.getElementById('devices-dashboard');
  
  try {
    // Show loading state
    if (dashboard && !dashboard.querySelector('.loading')) {
      dashboard.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading devices...</p>
        </div>
      `;
    }
    
    const url = '/api/devices'; // Always fetch all, filter client-side
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    devices = result.data || result || [];
    
    if (!Array.isArray(devices)) {
      devices = [];
    }
    
    lastUpdateTime = Date.now();
    // Initialize filteredDevices with all devices
    if (filteredDevices.length === 0 && devices.length > 0) {
      filteredDevices = [...devices];
    }
    applyFilters(); // This will call renderDevices()
  } catch (error) {
    console.error('Error loading devices:', error);
    showNotification(`Error loading devices: ${error.message}`, 'error');
    
    if (dashboard) {
      dashboard.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h2>Failed to load devices</h2>
          <p>${escapeHtml(error.message)}</p>
          <button class="btn btn-primary" onclick="refreshDevices()" style="margin-top: 15px;">Retry</button>
        </div>
      `;
    }
  } finally {
    isLoading = false;
  }
}

// Render devices to dashboard
function renderDevices() {
  const dashboard = document.getElementById('devices-dashboard');
  if (!dashboard) return;
  
  if (devices.length === 0) {
    dashboard.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📱</div>
        <h2>No devices connected</h2>
        <p>Waiting for devices to connect...</p>
        <button class="btn btn-primary" onclick="refreshDevices()" style="margin-top: 15px;">Refresh</button>
      </div>
    `;
    return;
  }
  
  if (filteredDevices.length === 0) {
    dashboard.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h2>No devices match your filters</h2>
        <p>Try adjusting your search or filter criteria.</p>
        <button class="btn btn-secondary" onclick="clearFilters()" style="margin-top: 15px;">Clear Filters</button>
      </div>
    `;
    return;
  }
  
  dashboard.innerHTML = filteredDevices.map(device => {
    const platform = device.platform || 'android';
    const platformIcon = platform === 'ios' ? '🍎' : '🤖';
    const platformBadge = `<span class="platform-badge platform-${platform}">${platformIcon} ${platform.toUpperCase()}</span>`;
    
    return `
    <div class="device-card ${device.online ? '' : 'offline'}" data-device-id="${device.id}" data-platform="${platform}">
      <div class="device-header">
        <div class="device-title">${escapeHtml(device.model)} ${platformBadge}</div>
        <span class="device-status ${device.online ? 'online' : 'offline'}">
          ${device.online ? 'Online' : 'Offline'}
        </span>
      </div>
      <div class="device-info">
        <div class="device-info-item">
          <div class="device-info-label">Platform</div>
          <div class="device-info-value">${platformIcon} ${platform.toUpperCase()}${device.platformVersion ? ` (${escapeHtml(device.platformVersion)})` : ''}</div>
        </div>
        <div class="device-info-item">
          <div class="device-info-label">Version</div>
          <div class="device-info-value">${escapeHtml(device.version)}</div>
        </div>
        <div class="device-info-item">
          <div class="device-info-label">IP Address</div>
          <div class="device-info-value">${escapeHtml(device.ip)}</div>
        </div>
        <div class="device-info-item">
          <div class="device-info-label">Connected</div>
          <div class="device-info-value">${formatDate(device.connectedAt)}</div>
        </div>
        <div class="device-info-item">
          <div class="device-info-label">Device ID</div>
          <div class="device-info-value">${device.id.substring(0, 8)}...</div>
        </div>
      </div>
      <div class="device-actions">
        <a href="/device.html?id=${device.id}" class="btn btn-primary">View Details</a>
      </div>
    </div>
  `;
  }).join('');
  
  // Add click handlers
  document.querySelectorAll('.device-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.btn')) {
        const deviceId = card.dataset.deviceId;
        window.location.href = `/device.html?id=${deviceId}`;
      }
    });
  });
}

// Setup Socket.IO listeners
function setupSocketListeners() {
  // Device connected
  socket.on('device-connected', (device) => {
    showNotification(`Device connected: ${device.model}`, 'success');
    loadDevices();
  });
  
  // Device disconnected
  socket.on('device-disconnected', (device) => {
    showNotification(`Device disconnected: ${device.model}`, 'warning');
    loadDevices();
  });
  
  // Device data update
  socket.on('device-data-update', (data) => {
    // Update UI if on device detail page
    if (window.location.pathname.includes('device.html')) {
      const urlParams = new URLSearchParams(window.location.search);
      const deviceId = urlParams.get('id');
      if (deviceId === data.deviceId) {
        // Trigger refresh of device data
        if (typeof loadDeviceData === 'function') {
          loadDeviceData();
        }
      }
    }
  });
  
  // Device message
  socket.on('device-message', (data) => {
    console.log('Device message:', data);
  });
  
  // File uploaded
  socket.on('file-uploaded', (data) => {
    showNotification(`File uploaded from ${data.deviceModel}`, 'success');
  });
}

// Execute action on device
async function executeAction(deviceId, action, params = {}) {
  try {
    const response = await fetch(`/api/device/${deviceId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, params })
    });
    
    const result = await response.json();
    if (result.success) {
      showNotification('Action sent to device', 'success');
    } else {
      showNotification(result.error || 'Failed to execute action', 'error');
    }
  } catch (error) {
    console.error('Error executing action:', error);
    showNotification('Error executing action', 'error');
  }
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Clear all filters
function clearFilters() {
  platformFilter = 'all';
  searchQuery = '';
  sortBy = 'connectedAt';
  sortOrder = 'desc';
  
  const platformSelect = document.getElementById('platform-filter-select');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  
  if (platformSelect) platformSelect.value = 'all';
  if (searchInput) searchInput.value = '';
  if (sortSelect) sortSelect.value = 'connectedAt-desc';
  
  applyFilters();
}

// Export for use in other scripts
window.executeAction = executeAction;
window.showNotification = showNotification;
window.filterByPlatform = filterByPlatform;
window.handleSearch = handleSearch;
window.handleSort = handleSort;
window.refreshDevices = refreshDevices;
window.clearFilters = clearFilters;

