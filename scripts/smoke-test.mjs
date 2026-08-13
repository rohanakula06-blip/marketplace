const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function check(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`✗ ${name}: ${err.message}`);
    return false;
  }
}

async function json(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${body.error || JSON.stringify(body)}`);
  return body;
}

const cookieJar = { value: '' };

function withCookies(headers = {}) {
  if (cookieJar.value) headers.cookie = cookieJar.value;
  return headers;
}

function saveCookies(res) {
  const set = res.headers.getSetCookie?.() || [];
  if (set.length) {
    cookieJar.value = set.map((c) => c.split(';')[0]).join('; ');
  }
}

let passed = 0;
let failed = 0;

async function run() {
  console.log(`Smoke test → ${BASE}\n`);

  if (await check('Health', async () => {
    const d = await json('/api/health');
    if (d.status !== 'ok') throw new Error('status not ok');
    if (d.database !== 'connected') throw new Error('database not connected');
  })) passed++; else failed++;

  if (await check('Workers list', async () => {
    const d = await json('/api/workers?lat=16.428&lng=81.982&sort=nearest');
    if (!Array.isArray(d.workers)) throw new Error('missing workers array');
  })) passed++; else failed++;

  if (await check('Jobs list', async () => {
    const d = await json('/api/jobs?lat=16.428&lng=81.982&status=open');
    if (!Array.isArray(d.jobs)) throw new Error('missing jobs array');
  })) passed++; else failed++;

  if (await check('Geocode search', async () => {
    const d = await json('/api/geocode/search?q=Amalapuram');
    if (!d.result?.lat) throw new Error('no result');
  })) passed++; else failed++;

  if (await check('Geocode reverse', async () => {
    const d = await json('/api/geocode/reverse?lat=16.428&lng=81.982');
    if (!d.label) throw new Error('no label');
  })) passed++; else failed++;

  if (await check('Services', async () => {
    const d = await json('/api/services');
    if (!Array.isArray(d.services)) throw new Error('missing services');
  })) passed++; else failed++;

  if (await check('Auth me (guest)', async () => {
    const d = await json('/api/auth/me');
    if (d.user !== null) throw new Error('expected null user');
  })) passed++; else failed++;

  const loginEmail = process.env.SMOKE_CUSTOMER_EMAIL;
  const loginPassword = process.env.SMOKE_CUSTOMER_PASSWORD;

  if (loginEmail && loginPassword) {
    if (await check('Customer login', async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      saveCookies(res);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || res.status);
      if (!d.user?.id) throw new Error('no user returned');
    })) passed++; else failed++;

    if (await check('Auth me (customer)', async () => {
      const d = await json('/api/auth/me', { headers: withCookies() });
      if (!d.user?.id) throw new Error('not logged in');
    })) passed++; else failed++;

    if (await check('User location GET', async () => {
      const d = await json('/api/user/location', { headers: withCookies() });
      if (d.latitude == null || d.longitude == null) throw new Error('missing coords');
    })) passed++; else failed++;

    if (await check('Workers near customer', async () => {
      const loc = await json('/api/user/location', { headers: withCookies() });
      const d = await json(`/api/workers?lat=${loc.latitude}&lng=${loc.longitude}&sort=nearest`);
      if (d.workers.length === 0) throw new Error('no workers found near customer');
    })) passed++; else failed++;

    if (await check('Bookings (customer)', async () => {
      const d = await json('/api/bookings?role=customer', { headers: withCookies() });
      if (!Array.isArray(d.bookings)) throw new Error('missing bookings');
    })) passed++; else failed++;

    if (await check('Notifications', async () => {
      const d = await json('/api/notifications', { headers: withCookies() });
      if (!Array.isArray(d.notifications)) throw new Error('missing notifications');
    })) passed++; else failed++;

    if (await check('Logout', async () => {
      await json('/api/auth/logout', { method: 'POST', headers: withCookies() });
      cookieJar.value = '';
    })) passed++; else failed++;
  } else {
    console.log('○ Auth flows skipped (set SMOKE_CUSTOMER_EMAIL + SMOKE_CUSTOMER_PASSWORD to test login)');
  }

  if (await check('AI analyze', async () => {
    const d = await json('/api/ai/analyze', {
      method: 'POST',
      headers: withCookies({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ description: 'Need an electrician for wiring repair' }),
    });
    if (!d.analysis) throw new Error('missing analysis');
  })) passed++; else failed++;

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
