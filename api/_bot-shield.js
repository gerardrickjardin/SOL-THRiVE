const crypto = require('crypto');

const MIN_DWELL_MS = 1200;
const MAX_CHALLENGE_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours
const MAX_RATE_BUCKETS = 2500;

const RATE_STORE = globalThis.__thriveRateLimitStore || new Map();
globalThis.__thriveRateLimitStore = RATE_STORE;

function getShieldSecret() {
  const baseSecret =
    process.env.BOT_PROTECTION_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    process.env.VISION_CONTROL_WEBHOOK_URL ||
    '';

  if (baseSecret) {
    return crypto
      .createHmac('sha256', 'thrive-bot-shield-v1')
      .update(baseSecret)
      .digest();
  }

  if (!globalThis.__thriveEphemeralShieldSecret) {
    globalThis.__thriveEphemeralShieldSecret = crypto.randomBytes(32);
  }
  return globalThis.__thriveEphemeralShieldSecret;
}

function getClientIp(req) {
  const xff = String((req && req.headers && req.headers['x-forwarded-for']) || '').trim();
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = String((req && req.headers && req.headers['x-real-ip']) || '').trim();
  if (realIp) return realIp;
  return (req && req.socket && req.socket.remoteAddress) || 'unknown';
}

function getUserAgentHash(req) {
  const ua = String((req && req.headers && req.headers['user-agent']) || '').trim();
  return crypto.createHash('sha256').update(ua).digest('hex').slice(0, 16);
}

function parseHostname(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch (_) {
    return '';
  }
}

function isAllowedHostname(hostname, reqHost) {
  if (!hostname) return false;
  const normalizedHost = String(reqHost || '').split(':')[0].toLowerCase();
  if (normalizedHost && hostname === normalizedHost) return true;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (hostname === 'thrivecoaching.ai' || hostname.endsWith('.thrivecoaching.ai')) return true;
  if (hostname.endsWith('.vercel.app') && hostname.includes('sol-th-ri')) return true;
  const vercelUrl = String(process.env.VERCEL_URL || '').split(':')[0].toLowerCase();
  if (vercelUrl && hostname === vercelUrl) return true;
  return false;
}

function isAllowedOrigin(req, options = {}) {
  const headers = (req && req.headers) || {};
  const secFetchSite = String(headers['sec-fetch-site'] || '').toLowerCase();
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const originHost = parseHostname(headers.origin);
  const refererHost = parseHostname(headers.referer);
  const reqHost = headers.host || '';

  if (originHost) {
    return isAllowedHostname(originHost, reqHost);
  }
  if (refererHost) {
    return isAllowedHostname(refererHost, reqHost);
  }

  // Raw non-browser scripts omit Origin & Referer; block on protected POST routes.
  return Boolean(options.allowMissingOrigin);
}

function checkRateLimit(req, bucket, maxRequests, windowMs) {
  const ip = getClientIp(req);
  const now = Date.now();
  const key = `${bucket}:${ip}`;

  if (RATE_STORE.size > MAX_RATE_BUCKETS) {
    const cutoff = now - windowMs;
    for (const [k, stamps] of RATE_STORE.entries()) {
      const fresh = stamps.filter((t) => t > cutoff);
      if (fresh.length === 0) RATE_STORE.delete(k);
      else RATE_STORE.set(k, fresh);
    }
  }

  const existing = RATE_STORE.get(key) || [];
  const recent = existing.filter((t) => now - t < windowMs);
  if (recent.length >= maxRequests) {
    const oldest = recent[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  recent.push(now);
  RATE_STORE.set(key, recent);
  return { allowed: true, remaining: Math.max(0, maxRequests - recent.length), retryAfterSec: 0 };
}

function b64UrlEncode(input) {
  return Buffer.from(input).toString('base64url');
}

function b64UrlDecode(input) {
  return Buffer.from(String(input || ''), 'base64url').toString('utf8');
}

function signPayload(payloadB64) {
  return crypto
    .createHmac('sha256', getShieldSecret())
    .update(payloadB64)
    .digest('base64url');
}

function issueChallenge(req) {
  const issuedAt = Date.now();
  const payload = {
    iat: issuedAt,
    nonce: crypto.randomBytes(10).toString('hex'),
    ua: getUserAgentHash(req)
  };
  const payloadB64 = b64UrlEncode(JSON.stringify(payload));
  const sig = signPayload(payloadB64);
  return {
    token: `${payloadB64}.${sig}`,
    issuedAt,
    minDwellMs: MIN_DWELL_MS,
    turnstileSiteKey: String(process.env.TURNSTILE_SITE_KEY || '').trim()
  };
}

function verifyChallengeToken(token, req) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, reason: 'missing_token' };
  }
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed_token' };

  const [payloadB64, sig] = parts;
  const expectedSig = signPayload(payloadB64);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { ok: false, reason: 'invalid_signature' };
  }

  let payload;
  try {
    payload = JSON.parse(b64UrlDecode(payloadB64));
  } catch (_) {
    return { ok: false, reason: 'invalid_payload' };
  }

  if (!payload || typeof payload.iat !== 'number') {
    return { ok: false, reason: 'missing_iat' };
  }

  if (payload.ua !== getUserAgentHash(req)) {
    return { ok: false, reason: 'ua_mismatch' };
  }

  const ageMs = Date.now() - payload.iat;
  if (ageMs < MIN_DWELL_MS) {
    return { ok: false, reason: 'submitted_too_fast' };
  }
  if (ageMs > MAX_CHALLENGE_AGE_MS) {
    return { ok: false, reason: 'expired_token' };
  }

  return { ok: true, ageMs };
}

async function verifyTurnstileToken(turnstileToken, req) {
  const siteKey = String(process.env.TURNSTILE_SITE_KEY || '').trim();
  const secretKey = String(process.env.TURNSTILE_SECRET_KEY || '').trim();
  if (!siteKey || !secretKey) {
    return { enabled: false, ok: true };
  }
  if (!turnstileToken || typeof turnstileToken !== 'string') {
    return { enabled: true, ok: false, reason: 'missing_turnstile_token' };
  }

  try {
    const body = new URLSearchParams({
      secret: secretKey,
      response: turnstileToken,
      remoteip: getClientIp(req)
    });
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const result = await r.json();
    if (!r.ok || !result || result.success !== true) {
      return { enabled: true, ok: false, reason: 'turnstile_failed' };
    }
    return { enabled: true, ok: true };
  } catch (_) {
    return { enabled: true, ok: false, reason: 'turnstile_unavailable' };
  }
}

function hasHoneypotValue(body, shield) {
  const candidates = [
    shield && shield.hp,
    body && body.hp,
    body && body.website,
    body && body.company_url,
    body && body.thrive_hp_check
  ];
  return candidates.some((v) => typeof v === 'string' && v.trim().length > 0);
}

function isSpamText(value) {
  const s = String(value || '').trim();
  if (!s) return false;
  if (/[\r\n]/.test(s) && s.length < 160) return false;
  const urls = s.match(/https?:\/\//gi) || [];
  if (urls.length >= 3) return true;
  if (/<\s*script\b/i.test(s)) return true;
  return false;
}

function hasHeaderInjection(value) {
  return /[\r\n]/.test(String(value || ''));
}

function validateLeadPayload(body) {
  const lead = (body && body.lead) || {};
  const data = (body && body.data) || {};

  if (hasHeaderInjection(lead.fn) || hasHeaderInjection(lead.ln) || hasHeaderInjection(lead.em)) {
    return { ok: false, status: 400, error: 'Invalid characters in submission.' };
  }

  if (lead.em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(lead.em).trim())) {
    return { ok: false, status: 400, error: 'Please provide a valid email address.' };
  }

  const combinedMsg = [data.message, lead.fn, lead.ln, lead.org].filter(Boolean).join(' ');
  if (combinedMsg.length > 5000 || isSpamText(combinedMsg)) {
    return { ok: false, status: 400, error: 'Submission blocked by spam filter.' };
  }

  return { ok: true };
}

async function verifyRequest(req, res, options = {}) {
  const {
    bucket = 'default',
    maxRequests = 15,
    windowMs = 10 * 60 * 1000,
    requireFormShield = false,
    allowMissingOrigin = false
  } = options;

  if (!isAllowedOrigin(req, { allowMissingOrigin })) {
    res.status(403).json({ error: 'Unauthorized request origin.' });
    return { ok: false };
  }

  const rl = checkRateLimit(req, bucket, maxRequests, windowMs);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    res.status(429).json({ error: 'Too many requests. Please wait a few minutes and try again.' });
    return { ok: false };
  }

  const body = (req && req.body && typeof req.body === 'object') ? req.body : {};
  const shield = (body && body._shield && typeof body._shield === 'object') ? body._shield : {};

  if (hasHoneypotValue(body, shield)) {
    res.status(400).json({ error: 'Submission blocked by spam protection.' });
    return { ok: false };
  }

  if (requireFormShield) {
    const challengeResult = verifyChallengeToken(shield.token, req);
    if (!challengeResult.ok) {
      const msg = challengeResult.reason === 'submitted_too_fast'
        ? 'Please take a moment to review your information before submitting.'
        : 'Security check could not be verified. Please refresh the page and try again.';
      res.status(403).json({ error: msg, reason: challengeResult.reason });
      return { ok: false };
    }

    if (!shield.interacted || Number(shield.events || 0) < 1) {
      res.status(403).json({ error: 'Human interaction verification failed. Please interact with the form and try again.', reason: 'no_interaction' });
      return { ok: false };
    }

    const turnstileToken = shield.turnstileToken || body['cf-turnstile-response'] || '';
    const tsResult = await verifyTurnstileToken(turnstileToken, req);
    if (!tsResult.ok) {
      res.status(403).json({ error: 'Human verification failed. Please complete the check and try again.', reason: tsResult.reason });
      return { ok: false };
    }
  }

  return { ok: true };
}

module.exports = {
  MIN_DWELL_MS,
  MAX_CHALLENGE_AGE_MS,
  getClientIp,
  isAllowedOrigin,
  checkRateLimit,
  issueChallenge,
  verifyChallengeToken,
  verifyTurnstileToken,
  validateLeadPayload,
  verifyRequest
};
