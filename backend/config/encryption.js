// Encryption keys configuration
// Loads and validates encryption keys from environment variables

function getEncryptionConfig() {
  const cardEncryptionKey = process.env.CARD_ENCRYPTION_KEY;
  const oauthEncryptionKey = process.env.OAUTH_ENCRYPTION_KEY || process.env.CARD_ENCRYPTION_KEY;

  if (!cardEncryptionKey) {
    throw new Error('CARD_ENCRYPTION_KEY environment variable is required');
  }

  // Validate key length (AES-256 requires 32 bytes = 64 hex characters)
  if (cardEncryptionKey.length !== 64) {
    throw new Error('CARD_ENCRYPTION_KEY must be 64 hex characters (32 bytes) for AES-256');
  }

  return {
    cardEncryptionKey,
    oauthEncryptionKey
  };
}

module.exports = {
  getEncryptionConfig
};

