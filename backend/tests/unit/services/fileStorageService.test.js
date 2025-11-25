const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const FileStorageService = require('../../../services/fileStorage');

describe('FileStorageService', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filestorage-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('should initialize storage folders', async () => {
    const service = new FileStorageService(tempDir);
    await service.initialize();

    await expect(fs.stat(path.join(tempDir, 'identity'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(tempDir, 'documents'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(tempDir, 'exports'))).resolves.toBeDefined();
  });

  it('should store and delete a file in the selected category', async () => {
    const service = new FileStorageService(tempDir);
    await service.initialize();

    const buffer = Buffer.from('sample-content');
    const storedPath = await service.storeFile(buffer, 'sample.txt', 'identity');

    expect(storedPath.startsWith(path.join(tempDir, 'identity'))).toBe(true);
    const stat = await fs.stat(storedPath);
    expect(stat.size).toBe(buffer.length);

    await service.deleteFile(storedPath);
    await expect(fs.stat(storedPath)).rejects.toBeDefined();
  });

  it('should default to documents category when unknown category provided', async () => {
    const service = new FileStorageService(tempDir);
    await service.initialize();

    const buffer = Buffer.from('content');
    const storedPath = await service.storeFile(buffer, 'note.txt', 'unknown');

    expect(storedPath.startsWith(path.join(tempDir, 'documents'))).toBe(true);
  });
});
