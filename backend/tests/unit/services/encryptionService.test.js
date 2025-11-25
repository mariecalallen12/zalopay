const EncryptionService = require('../../../services/encryption');

describe('EncryptionService', () => {
  const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('should encrypt and decrypt a string', () => {
    const service = new EncryptionService(key);
    const payload = 'hello-world';

    const encrypted = service.encrypt(payload);
    expect(encrypted).toHaveProperty('encrypted');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('authTag');

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(payload);
  });

  it('should encrypt and decrypt an object', () => {
    const service = new EncryptionService(key);
    const payload = { email: 'test@example.com', token: 'abc123' };

    const encrypted = service.encrypt(payload);
    const decrypted = service.decrypt(encrypted);

    expect(decrypted).toEqual(payload);
  });

  it('should throw when key is missing', () => {
    expect(() => new EncryptionService()).toThrow('Encryption key is required');
  });
});
