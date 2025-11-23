/**
 * Screen Viewer Component - Real-time screen frame display
 */

class ScreenViewer {
  constructor(containerId, deviceId, socket) {
    this.containerId = containerId;
    this.deviceId = deviceId;
    this.socket = socket;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.image = null;
    this.isStreaming = false;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.lastPanX = 0;
    this.lastPanY = 0;
    this.isFullscreen = false;
    
    this.init();
  }

  /**
   * Initialize screen viewer
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'screen-canvas';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.cursor = 'default';
    this.canvas.style.imageRendering = 'pixelated'; // For crisp pixel display
    
    this.ctx = this.canvas.getContext('2d');
    
    // Create image element for loading frames
    this.image = new Image();
    this.image.onload = () => {
      this.drawFrame();
    };

    // Append canvas to container
    this.container.appendChild(this.canvas);

    // Setup event listeners
    this.setupEventListeners();

    // Setup socket listeners
    this.setupSocketListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Canvas mouse events for panning
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left
        this.isPanning = true;
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        const deltaX = e.clientX - this.lastPanX;
        const deltaY = e.clientY - this.lastPanY;
        this.panX += deltaX;
        this.panY += deltaY;
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
        this.drawFrame();
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isPanning = false;
    });

    // Mouse wheel for zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom *= delta;
      this.zoom = Math.max(0.1, Math.min(5, this.zoom)); // Limit zoom between 0.1x and 5x
      this.drawFrame();
    });

    // Touch events for mobile
    let touchStartDistance = 0;
    let touchStartZoom = 1;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        touchStartDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        touchStartZoom = this.zoom;
      } else if (e.touches.length === 1) {
        this.isPanning = true;
        this.lastPanX = e.touches[0].clientX;
        this.lastPanY = e.touches[0].clientY;
      }
      e.preventDefault();
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        this.zoom = touchStartZoom * (distance / touchStartDistance);
        this.zoom = Math.max(0.1, Math.min(5, this.zoom));
        this.drawFrame();
      } else if (e.touches.length === 1 && this.isPanning) {
        const deltaX = e.touches[0].clientX - this.lastPanX;
        const deltaY = e.touches[0].clientY - this.lastPanY;
        this.panX += deltaX;
        this.panY += deltaY;
        this.lastPanX = e.touches[0].clientX;
        this.lastPanY = e.touches[0].clientY;
        this.drawFrame();
      }
      e.preventDefault();
    });

    this.canvas.addEventListener('touchend', (e) => {
      this.isPanning = false;
      e.preventDefault();
    });
  }

  /**
   * Setup socket listeners
   */
  setupSocketListeners() {
    // Listen for screen frames
    this.socket.on('screen-frame-broadcast', (frameData) => {
      if (frameData.deviceId === this.deviceId) {
        this.handleFrame(frameData);
      }
    });

    // Listen for streaming status
    this.socket.on('screen-stream-started', (data) => {
      if (data.deviceId === this.deviceId) {
        this.isStreaming = true;
        this.frameCount = 0;
        this.lastFrameTime = Date.now();
        this.updateStatus('Streaming...');
      }
    });

    this.socket.on('screen-stream-stopped', (data) => {
      if (data.deviceId === this.deviceId) {
        this.isStreaming = false;
        this.updateStatus('Streaming stopped');
        // Clear canvas
        this.clearCanvas();
      }
    });
  }

  /**
   * Handle incoming frame
   */
  handleFrame(frameData) {
    if (!this.isStreaming) {
      return;
    }

    // Update FPS
    const now = Date.now();
    if (this.lastFrameTime > 0) {
      const elapsed = now - this.lastFrameTime;
      if (elapsed > 0) {
        this.fps = Math.round(1000 / elapsed);
      }
    }
    this.lastFrameTime = now;
    this.frameCount++;

    // Load frame image
    if (frameData.frame) {
      this.image.src = 'data:image/jpeg;base64,' + frameData.frame;
    }
  }

  /**
   * Draw frame on canvas
   */
  drawFrame() {
    if (!this.image.complete || !this.image.naturalWidth) {
      return;
    }

    // Resize canvas to container
    const containerRect = this.container.getBoundingClientRect();
    this.canvas.width = containerRect.width;
    this.canvas.height = containerRect.height;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate scaled dimensions
    const imgWidth = this.image.naturalWidth;
    const imgHeight = this.image.naturalHeight;
    const scaledWidth = imgWidth * this.zoom;
    const scaledHeight = imgHeight * this.zoom;

    // Calculate position (centered with pan offset)
    const x = (this.canvas.width - scaledWidth) / 2 + this.panX;
    const y = (this.canvas.height - scaledHeight) / 2 + this.panY;

    // Draw image
    this.ctx.drawImage(this.image, x, y, scaledWidth, scaledHeight);

    // Draw FPS overlay
    this.drawFPSOverlay();
  }

  /**
   * Draw FPS overlay
   */
  drawFPSOverlay() {
    if (this.fps > 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(10, 10, 80, 25);
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = '14px monospace';
      this.ctx.fillText(`FPS: ${this.fps}`, 15, 28);
    }
  }

  /**
   * Clear canvas
   */
  clearCanvas() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('No stream', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  /**
   * Reset zoom and pan
   */
  resetView() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.drawFrame();
  }

  /**
   * Zoom in
   */
  zoomIn() {
    this.zoom *= 1.2;
    this.zoom = Math.min(5, this.zoom);
    this.drawFrame();
  }

  /**
   * Zoom out
   */
  zoomOut() {
    this.zoom *= 0.8;
    this.zoom = Math.max(0.1, this.zoom);
    this.drawFrame();
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    if (!this.isFullscreen) {
      if (this.container.requestFullscreen) {
        this.container.requestFullscreen();
      } else if (this.container.webkitRequestFullscreen) {
        this.container.webkitRequestFullscreen();
      } else if (this.container.msRequestFullscreen) {
        this.container.msRequestFullscreen();
      }
      this.isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      this.isFullscreen = false;
    }
  }

  /**
   * Update status
   */
  updateStatus(message) {
    // This can be used to update a status element if needed
    console.log(`Screen Viewer Status: ${message}`);
  }

  /**
   * Destroy viewer
   */
  destroy() {
    if (this.socket) {
      this.socket.off('screen-frame-broadcast');
      this.socket.off('screen-stream-started');
      this.socket.off('screen-stream-stopped');
    }
    if (this.container && this.canvas) {
      this.container.removeChild(this.canvas);
    }
  }
}

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScreenViewer;
}

