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
    try {
      await forward({
        source: 'thrive-funnel', type: 'payment', ts: new Date().toISOString(),
        data: { paymentIntent: pi.id, amount: pi.amount, currency: pi.currency, session_date: m.session_date, session_time: m.session_time },
        lead: { fn: m.first_name, ln: m.last_name, org: m.organization, em: m.email, ph: m.phone },
      });
    } catch (e) { console.error(e); return res.status(502).end(); }
  }
  res.status(200).json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };
