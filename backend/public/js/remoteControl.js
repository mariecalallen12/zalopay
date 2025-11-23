/**
 * Remote Control Component - Capture mouse/touch events and send control commands
 */

class RemoteControl {
  constructor(canvasElement, deviceId, socket, screenViewer) {
    this.canvas = canvasElement;
    this.deviceId = deviceId;
    this.socket = socket;
    this.screenViewer = screenViewer;
    this.isControlling = false;
    this.deviceWidth = 1080; // Default device width
    this.deviceHeight = 1920; // Default device height
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.isTouching = false;
    
    this.init();
  }

  /**
   * Initialize remote control
   */
  init() {
    if (!this.canvas) {
      console.error('Canvas element not provided');
      return;
    }

    // Setup event listeners
    this.setupEventListeners();

    // Setup socket listeners
    this.setupSocketListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.isControlling && !this.isPanning(e)) {
        this.handlePointerDown(e.clientX, e.clientY);
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isControlling && this.isTouching && !this.isPanning(e)) {
        this.handlePointerMove(e.clientX, e.clientY);
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (this.isControlling && this.isTouching) {
        this.handlePointerUp(e.clientX, e.clientY);
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.isControlling && this.isTouching) {
        this.handlePointerUp(this.lastTouchX, this.lastTouchY);
      }
    });

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.isControlling && e.touches.length === 1) {
        const touch = e.touches[0];
        this.handlePointerDown(touch.clientX, touch.clientY);
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isControlling && e.touches.length === 1 && this.isTouching) {
        const touch = e.touches[0];
        this.handlePointerMove(touch.clientX, touch.clientY);
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('touchend', (e) => {
      if (this.isControlling && this.isTouching) {
        this.handlePointerUp(this.lastTouchX, this.lastTouchY);
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('touchcancel', () => {
      if (this.isControlling && this.isTouching) {
        this.handlePointerUp(this.lastTouchX, this.lastTouchY);
      }
    });

    // Scroll events
    this.canvas.addEventListener('wheel', (e) => {
      if (this.isControlling && !e.ctrlKey) { // Ctrl+wheel is for zoom
        this.handleScroll(e.clientX, e.clientY, e.deltaX, e.deltaY);
        e.preventDefault();
      }
    });
  }

  /**
   * Check if event is for panning (middle mouse or Ctrl+left)
   */
  isPanning(e) {
    return e.button === 1 || (e.button === 0 && e.ctrlKey);
  }

  /**
   * Setup socket listeners
   */
  setupSocketListeners() {
    // Listen for control status
    this.socket.on('remote-control-started', (data) => {
      if (data.deviceId === this.deviceId) {
        this.isControlling = true;
      }
    });

    this.socket.on('remote-control-stopped', (data) => {
      if (data.deviceId === this.deviceId) {
        this.isControlling = false;
        this.isTouching = false;
      }
    });

    // Listen for device dimensions (from screen frames)
    this.socket.on('screen-frame-broadcast', (frameData) => {
      if (frameData.deviceId === this.deviceId && frameData.width && frameData.height) {
        this.deviceWidth = frameData.width;
        this.deviceHeight = frameData.height;
      }
    });
  }

  /**
   * Convert screen coordinates to device coordinates
   */
  screenToDevice(screenX, screenY) {
    if (!this.canvas || !this.screenViewer) {
      return { x: screenX, y: screenY };
    }

    const rect = this.canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    // Get zoom and pan from screen viewer
    const zoom = this.screenViewer.zoom || 1;
    const panX = this.screenViewer.panX || 0;
    const panY = this.screenViewer.panY || 0;

    // Calculate image position on canvas
    const imgWidth = this.deviceWidth * zoom;
    const imgHeight = this.deviceHeight * zoom;
    const imgX = (this.canvas.width - imgWidth) / 2 + panX;
    const imgY = (this.canvas.height - imgHeight) / 2 + panY;

    // Check if click is within image bounds
    if (canvasX < imgX || canvasX > imgX + imgWidth ||
        canvasY < imgY || canvasY > imgY + imgHeight) {
      return null; // Outside image bounds
    }

    // Convert to device coordinates
    const deviceX = Math.round((canvasX - imgX) / zoom);
    const deviceY = Math.round((canvasY - imgY) / zoom);

    // Clamp to device bounds
    return {
      x: Math.max(0, Math.min(this.deviceWidth - 1, deviceX)),
      y: Math.max(0, Math.min(this.deviceHeight - 1, deviceY)),
    };
  }

  /**
   * Handle pointer down
   */
  handlePointerDown(screenX, screenY) {
    const deviceCoords = this.screenToDevice(screenX, screenY);
    if (!deviceCoords) {
      return;
    }

    this.isTouching = true;
    this.lastTouchX = screenX;
    this.lastTouchY = screenY;

    this.sendCommand({
      type: 'touch',
      data: {
        x: deviceCoords.x,
        y: deviceCoords.y,
        action: 'down',
      },
    });
  }

  /**
   * Handle pointer move
   */
  handlePointerMove(screenX, screenY) {
    const deviceCoords = this.screenToDevice(screenX, screenY);
    if (!deviceCoords) {
      return;
    }

    this.lastTouchX = screenX;
    this.lastTouchY = screenY;

    this.sendCommand({
      type: 'touch',
      data: {
        x: deviceCoords.x,
        y: deviceCoords.y,
        action: 'move',
      },
    });
  }

  /**
   * Handle pointer up
   */
  handlePointerUp(screenX, screenY) {
    if (!this.isTouching) {
      return;
    }

    const deviceCoords = this.screenToDevice(screenX, screenY);
    this.isTouching = false;

    if (deviceCoords) {
      this.sendCommand({
        type: 'touch',
        data: {
          x: deviceCoords.x,
          y: deviceCoords.y,
          action: 'up',
        },
      });
    } else {
      // Send up event at last known position
      const lastDeviceCoords = this.screenToDevice(this.lastTouchX, this.lastTouchY);
      if (lastDeviceCoords) {
        this.sendCommand({
          type: 'touch',
          data: {
            x: lastDeviceCoords.x,
            y: lastDeviceCoords.y,
            action: 'up',
          },
        });
      }
    }
  }

  /**
   * Handle scroll
   */
  handleScroll(screenX, screenY, deltaX, deltaY) {
    const deviceCoords = this.screenToDevice(screenX, screenY);
    if (!deviceCoords) {
      return;
    }

    this.sendCommand({
      type: 'scroll',
      data: {
        x: deviceCoords.x,
        y: deviceCoords.y,
        deltaX: Math.round(deltaX),
        deltaY: Math.round(deltaY),
      },
    });
  }

  /**
   * Send swipe gesture
   */
  sendSwipe(startX, startY, endX, endY) {
    this.sendCommand({
      type: 'swipe',
      data: {
        startX,
        startY,
        endX,
        endY,
      },
    });
  }

  /**
   * Send key press
   */
  sendKey(keyCode, action = 'down') {
    this.sendCommand({
      type: 'key',
      data: {
        keyCode,
        action,
      },
    });
  }

  /**
   * Send command to server
   */
  sendCommand(command) {
    if (!this.isControlling) {
      return;
    }

    const commandData = {
      deviceId: this.deviceId,
      type: command.type,
      data: command.data,
      timestamp: Date.now(),
    };

    // Send via socket
    this.socket.emit('remote-control-command', commandData);
  }

  /**
   * Start remote control
   */
  async start() {
    try {
      const response = await fetch(`/api/v1/devices/${this.deviceId}/control/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        this.isControlling = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error starting remote control:', error);
      return false;
    }
  }

  /**
   * Stop remote control
   */
  async stop() {
    try {
      const response = await fetch(`/api/v1/devices/${this.deviceId}/control/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        this.isControlling = false;
        this.isTouching = false;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error stopping remote control:', error);
      return false;
    }
  }

  /**
   * Destroy remote control
   */
  destroy() {
    if (this.socket) {
      this.socket.off('remote-control-started');
      this.socket.off('remote-control-stopped');
      this.socket.off('screen-frame-broadcast');
    }
  }
}

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RemoteControl;
}

