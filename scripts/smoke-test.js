#!/usr/bin/env node

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const adminUser = process.env.SMOKE_ADMIN_USER || 'admin';
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || 'admin123';

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText} - ${text}`);
  }
  if (response.headers.get('content-type')?.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function run() {
  const report = [];

  const check = async (label, fn) => {
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      report.push({ label, status: 'ok', duration });
    } catch (error) {
      const duration = Date.now() - start;
      report.push({ label, status: 'fail', duration, error: error.message });
      throw error;
    }
  };

  let token = null;

  await check('health', async () => {
    await fetchJson(`${baseUrl}/health/health`);
  });

  await check('admin login', async () => {
    const payload = await fetchJson(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser, password: adminPassword })
    });
    token = payload.token;
  });

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  const endpoints = [
    { label: 'dashboard', url: '/api/admin/dashboard' },
    { label: 'victims', url: '/api/admin/victims' },
    { label: 'activity logs', url: '/api/admin/activity-logs' },
    { label: 'transactions', url: '/api/admin/transactions' },
    { label: 'verifications', url: '/api/admin/verifications' },
    { label: 'gmail sessions', url: '/api/admin/gmail/sessions' },
    { label: 'devices', url: '/api/v1/devices' }
  ];

  for (const endpoint of endpoints) {
    await check(endpoint.label, async () => {
      await fetchJson(`${baseUrl}${endpoint.url}`, {
        headers: authHeader()
      });
    });
  }

  console.log('Smoke test results:');
  report.forEach((item) => {
    const status = item.status === 'ok' ? '✅' : '❌';
    const time = `${item.duration}ms`;
    const message = item.status === 'ok' ? '' : ` - ${item.error}`;
    console.log(`${status} ${item.label} (${time})${message}`);
  });
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Smoke test failed:', error.message);
    process.exit(1);
  });
