// Advanced Device Fingerprinting
// Collects comprehensive device fingerprinting data
// Based on comprehensive-system-architecture.md lines 201-244

/**
 * Generate comprehensive device fingerprint
 * @returns {Promise<Object>} - Complete device fingerprint
 */
async function generateDeviceFingerprint() {
  const fingerprint = {
    // Basic information
    screen_resolution: `${screen.width}x${screen.height}`,
    color_depth: screen.colorDepth,
    pixel_ratio: window.devicePixelRatio || 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    languages: navigator.languages || [navigator.language],
    platform: navigator.platform,
    user_agent: navigator.userAgent,
    
    // Hardware information
    hardware_concurrency: navigator.hardwareConcurrency || null,
    device_memory: navigator.deviceMemory || null,
    
    // Canvas fingerprinting
    canvas_signature: null,
    
    // WebGL fingerprinting
    webgl_vendor: null,
    webgl_renderer: null,
    webgl_version: null,
    
    // Audio fingerprinting
    audio_fingerprint: null,
    
    // Plugins
    plugins: [],
    
    // Fonts
    fonts: [],
    
    // Additional browser properties
    cookie_enabled: navigator.cookieEnabled,
    do_not_track: navigator.doNotTrack || null,
    max_touch_points: navigator.maxTouchPoints || 0,
    
    // Timestamp
    fingerprint_timestamp: new Date().toISOString()
  };

  // Canvas fingerprinting
  try {
    fingerprint.canvas_signature = await getCanvasFingerprint();
  } catch (error) {
    console.warn('Canvas fingerprinting failed:', error);
  }

  // WebGL fingerprinting
  try {
    const webglInfo = getWebGLFingerprint();
    fingerprint.webgl_vendor = webglInfo.vendor;
    fingerprint.webgl_renderer = webglInfo.renderer;
    fingerprint.webgl_version = webglInfo.version;
  } catch (error) {
    console.warn('WebGL fingerprinting failed:', error);
  }

  // Audio fingerprinting
  try {
    fingerprint.audio_fingerprint = await getAudioFingerprint();
  } catch (error) {
    console.warn('Audio fingerprinting failed:', error);
  }

  // Plugin detection
  try {
    fingerprint.plugins = getPlugins();
  } catch (error) {
    console.warn('Plugin detection failed:', error);
  }

  // Font detection
  try {
    fingerprint.fonts = await getFonts();
  } catch (error) {
    console.warn('Font detection failed:', error);
  }

  return fingerprint;
}

/**
 * Generate canvas fingerprint
 * @returns {Promise<string>} - Canvas signature (base64)
 */
async function getCanvasFingerprint() {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  
  // Draw text with various styles
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('Device fingerprinting test 🔒', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('Device fingerprinting test 🔒', 4, 17);
  
  // Add geometric shapes
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgb(255,0,255)';
  ctx.beginPath();
  ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgb(0,255,255)';
  ctx.beginPath();
  ctx.arc(100, 50, 50, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  
  // Convert to base64
  return canvas.toDataURL();
}

/**
 * Get WebGL fingerprint
 * @returns {Object} - WebGL information
 */
function getWebGLFingerprint() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return { vendor: null, renderer: null, version: null };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  const version = gl.getParameter(gl.VERSION);

  return {
    vendor: vendor || null,
    renderer: renderer || null,
    version: version || null
  };
}

/**
 * Generate audio fingerprint
 * @returns {Promise<string>} - Audio fingerprint
 */
async function getAudioFingerprint() {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0; // Mute output
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      scriptProcessor.onaudioprocess = function(bins) {
        const output = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(output);
        
        // Generate fingerprint from audio data
        const hash = Array.from(output.slice(0, 100))
          .map(v => Math.abs(v).toString(36))
          .join('')
          .substring(0, 32);
        
        const fingerprint = `${audioContext.sampleRate}:${analyser.channelCount}:${hash}`;
        
        // Cleanup
        oscillator.stop();
        audioContext.close();
        
        resolve(fingerprint);
      };

      oscillator.start(0);
      
      // Timeout fallback
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        resolve(`${audioContext.sampleRate}:2:timeout`);
      }, 1000);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get installed plugins
 * @returns {Array} - Plugin names
 */
function getPlugins() {
  const plugins = [];
  
  if (navigator.plugins) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins.push(navigator.plugins[i].name);
    }
  }
  
  return plugins;
}

/**
 * Detect installed fonts
 * @returns {Promise<Array>} - Font names
 */
async function getFonts() {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const h = document.getElementsByTagName('body')[0];
  
  const baseWidths = {};
  const baseHeights = {};
  
  // Get base widths
  for (let i = 0; i < baseFonts.length; i++) {
    const span = document.createElement('span');
    span.style.fontSize = testSize;
    span.style.fontFamily = baseFonts[i];
    span.innerHTML = testString;
    h.appendChild(span);
    baseWidths[baseFonts[i]] = span.offsetWidth;
    baseHeights[baseFonts[i]] = span.offsetHeight;
    h.removeChild(span);
  }
  
  // Common fonts to test
  const fonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
    'Arial Black', 'Impact', 'Tahoma', 'Lucida Console', 'Courier',
    'Lucida Sans Unicode', 'Franklin Gothic Medium', 'Century Gothic',
    'MS Sans Serif', 'MS Serif', 'Symbol', 'Webdings', 'Wingdings',
    'Zapf Dingbats', 'Cambria', 'Calibri', 'Consolas', 'Segoe UI'
  ];
  
  const detectedFonts = [];
  
  for (let i = 0; i < fonts.length; i++) {
    let detected = false;
    for (let j = 0; j < baseFonts.length; j++) {
      const span = document.createElement('span');
      span.style.fontSize = testSize;
      span.style.fontFamily = fonts[i] + ',' + baseFonts[j];
      span.innerHTML = testString;
      h.appendChild(span);
      const width = span.offsetWidth;
      const height = span.offsetHeight;
      h.removeChild(span);
      
      if (width !== baseWidths[baseFonts[j]] || height !== baseHeights[baseFonts[j]]) {
        detected = true;
        break;
      }
    }
    
    if (detected) {
      detectedFonts.push(fonts[i]);
    }
  }
  
  return detectedFonts;
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.DeviceFingerprinting = {
    generateDeviceFingerprint,
    getCanvasFingerprint,
    getWebGLFingerprint,
    getAudioFingerprint,
    getPlugins,
    getFonts
  };
}

// For Node.js environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateDeviceFingerprint,
    getCanvasFingerprint,
    getWebGLFingerprint,
    getAudioFingerprint,
    getPlugins,
    getFonts
  };
}

