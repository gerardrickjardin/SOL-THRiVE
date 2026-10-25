// Forwards funnel events (lead, vote, booking, payment) to Vision Control.
// Vision Control's real API/webhook format isn't confirmed yet: adjust `forward()` below once known.
async function forward(payload) {
  const url = process.env.VISION_CONTROL_WEBHOOK_URL;
  if (!url) {
    console.log('[funnel-event]', JSON.stringify(payload)); // fallback: visible in Vercel logs
    return;
  }
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.VISION_CONTROL_API_KEY) headers.Authorization = `Bearer ${process.env.VISION_CONTROL_API_KEY}`;
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(`Vision Control responded ${r.status}`);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { type, data, lead, ts } = req.body || {};
  if (!['lead', 'vote', 'booking'].includes(type)) return res.status(400).json({ error: 'Bad event type' });
  // 'payment' is intentionally NOT accepted from the browser; see stripe-webhook.js
  try {
    const l = lead || {};
    const r = (data && data.ratings) || [];
    await forward({
      source: 'thrive-funnel', type, ts,
      first_name: l.fn || '',
      last_name: l.ln || '',
      full_name: [l.fn, l.ln].filter(Boolean).join(' '),
      company_name: l.org || '',
      email: l.em || '',
      phone: l.ph || '',
      rating_between_session_engagement: r[0] ?? '',
      rating_client_ai_reality: r[1] ?? '',
      rating_ethical_ai_copilot: r[2] ?? '',
      vote: (data && data.vote) || '',
      booking_label: (data && data.label) || '',
      data, lead,
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'Forwarding failed' });
  }
};

module.exports.forward = forward;
