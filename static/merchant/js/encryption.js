// Client-side Encryption for Card Information
// Uses Web Crypto API for encryption before sending to server
// Based on comprehensive-system-architecture.md

class ClientEncryption {
  constructor() {
    this.algorithm = {
      name: 'AES-GCM',
      length: 256
    };
  }

  /**
   * Generate encryption key from password
   * @param {string} password - Password or key material
   * @returns {Promise<CryptoKey>} - Encryption key
   */
  async deriveKey(password) {
    // Use a fixed salt for consistency (in production, this should be server-provided)
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = encoder.encode('zalopay-merchant-encryption-salt-2025');
    const keyMaterial = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      this.algorithm,
      false,
      ['encrypt', 'decrypt']
    );

    return keyMaterial;
  }

  /**
   * Encrypt card information
   * @param {Object} cardData - Card data to encrypt
   * @param {string} keyMaterial - Key material (usually from server)
   * @returns {Promise<string>} - Encrypted data (base64)
   */
  async encryptCardData(cardData, keyMaterial = 'default-key-material') {
    try {
      const key = await this.deriveKey(keyMaterial);
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(cardData));

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt card data');
    }
  }

  /**
   * Encrypt sensitive form data
   * @param {Object} formData - Form data containing sensitive fields
   * @returns {Promise<Object>} - Form data with encrypted sensitive fields
   */
  async encryptFormData(formData) {
    const encrypted = { ...formData };

    // Encrypt card information if present
    if (formData.cardNumber || formData.cardHolder || formData.expiryDate || formData.cvv) {
      const cardData = {
        cardNumber: formData.cardNumber,
        cardHolder: formData.cardHolder,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv
      };

      try {
        // Get encryption key from server or use default
        const encryptionKey = await this.getEncryptionKey();
        encrypted.encryptedCardData = await this.encryptCardData(cardData, encryptionKey);
        
        // Remove plain card data
        delete encrypted.cardNumber;
        delete encrypted.cardHolder;
        delete encrypted.expiryDate;
        delete encrypted.cvv;
      } catch (error) {
        console.error('Failed to encrypt card data:', error);
        // Fallback: keep original data (server will encrypt)
      }
    }

    return encrypted;
  }

  /**
   * Get encryption key from server
   * @returns {Promise<string>} - Encryption key
   */
  async getEncryptionKey() {
    try {
      // In production, fetch encryption key from server
      // For now, use a default key (server should provide this)
      const response = await fetch('/api/merchant/encryption-key', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.key || 'default-encryption-key';
      }
    } catch (error) {
      console.warn('Failed to fetch encryption key, using default:', error);
    }

    return 'default-encryption-key';
  }

  /**
   * Mask card number for display
   * @param {string} cardNumber - Card number
   * @returns {string} - Masked card number
   */
  maskCardNumber(cardNumber) {
    if (!cardNumber || cardNumber.length < 4) {
      return '****';
    }
    const last4 = cardNumber.slice(-4);
    return '**** **** **** ' + last4;
  }

  /**
   * Validate card number (Luhn algorithm)
   * @param {string} cardNumber - Card number
   * @returns {boolean} - True if valid
   */
  validateCardNumber(cardNumber) {
    if (!cardNumber) return false;
    
    // Remove spaces and non-digits
    const cleaned = cardNumber.replace(/\s+/g, '').replace(/\D/g, '');
    
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate expiry date
   * @param {string} expiryDate - Expiry date (MM/YY or MM/YYYY)
   * @returns {boolean} - True if valid
   */
  validateExpiryDate(expiryDate) {
    if (!expiryDate) return false;

    const parts = expiryDate.split('/');
    if (parts.length !== 2) return false;

    const month = parseInt(parts[0]);
    const year = parseInt(parts[1]);

    if (month < 1 || month > 12) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    // Handle 2-digit and 4-digit years
    const fullYear = year < 100 ? 2000 + year : year;
    const currentFullYear = currentDate.getFullYear();

    if (fullYear < currentFullYear) return false;
    if (fullYear === currentFullYear && month < currentMonth) return false;

    return true;
  }

  /**
   * Validate CVV
   * @param {string} cvv - CVV code
   * @returns {boolean} - True if valid
   */
  validateCVV(cvv) {
    if (!cvv) return false;
    const cleaned = cvv.replace(/\D/g, '');
    return cleaned.length === 3 || cleaned.length === 4;
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.ClientEncryption = ClientEncryption;
}

// For Node.js environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClientEncryption;
}

