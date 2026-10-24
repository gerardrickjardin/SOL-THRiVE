// Creates a Stripe PaymentIntent. Price is fixed server-side so it can't be tampered with.
const AMOUNT_CENTS = 29700; // $297.00

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'Payments are not configured yet.' });

  const { lead = {}, booking = {} } = req.body || {};
  const params = new URLSearchParams({
    amount: String(AMOUNT_CENTS),
    currency: 'usd',
    'automatic_payment_methods[enabled]': 'true',
    description: 'THRIVE Coaching Course',
    receipt_email: lead.em || '',
    'metadata[first_name]': lead.fn || '',
    'metadata[last_name]': lead.ln || '',
    'metadata[organization]': lead.org || '',
    'metadata[email]': lead.em || '',
    'metadata[phone]': lead.ph || '',
    'metadata[session_date]': booking.date || '',
    'metadata[session_time]': booking.time || '',
  });
  if (!lead.em) params.delete('receipt_email');

  try {
    const r = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'Stripe error' });
    res.status(200).json({ clientSecret: j.client_secret });
  } catch (e) {
    res.status(502).json({ error: 'Could not reach Stripe.' });
  }
};
