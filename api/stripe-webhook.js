// Stripe webhook: verifies signature, then forwards confirmed payments to Vision Control.
const crypto = require('crypto');
const { forward } = require('./event');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).end();

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks);

  const sig = String(req.headers['stripe-signature'] || '');
  const parts = Object.fromEntries(sig.split(',').map((p) => p.split('=')));
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${raw}`).digest('hex');
  const ok = parts.v1 && parts.v1.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
  if (!ok || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return res.status(400).end();

  const event = JSON.parse(raw.toString('utf8'));
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const m = pi.metadata || {};
    const fullName = [m.first_name, m.last_name].filter(Boolean).join(' ');
    try {
      await forward({
        source: 'stripe-payment',
        event_source: 'stripe-payment',
        funnel_app: 'thrive-coaching',
        type: 'payment',
        ts: new Date().toISOString(),
        first_name: m.first_name || '',
        last_name: m.last_name || '',
        firstName: m.first_name || '',
        lastName: m.last_name || '',
        full_name: fullName,
        name: fullName,
        company_name: m.organization || '',
        companyName: m.organization || '',
        email: m.email || '',
        phone: m.phone || '',
        amount_usd: Number(pi.amount || 0) / 100,
        funding_source: m.funding_source || 'Direct Self-Pay',
        waiver_accepted: m.waiver_accepted === 'true',
        sms_consent: m.sms_consent === 'true',
        payment_intent: pi.id,
        data: {
          source: 'stripe-payment',
          paymentIntent: pi.id,
          amount: pi.amount,
          amount_usd: Number(pi.amount || 0) / 100,
          currency: pi.currency,
          session_date: m.session_date,
          session_time: m.session_time,
          funding_source: m.funding_source || 'Direct Self-Pay',
          waiver_accepted: m.waiver_accepted === 'true',
          sms_consent: m.sms_consent === 'true'
        },
        lead: { fn: m.first_name, ln: m.last_name, org: m.organization, em: m.email, ph: m.phone },
      });
    } catch (e) { console.error(e); return res.status(502).end(); }
  }
  res.status(200).json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };
