const { verifyRequest, validateLeadPayload } = require('./_bot-shield');

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

function sanitizeSignatureDataUrl(val) {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed || trimmed.length > 90000) return '';
  return /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(trimmed) ? trimmed : '';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { type, data, lead, ts } = req.body || {};
  if (!['lead', 'vote', 'booking', 'support', 'assessment'].includes(type)) {
    return res.status(400).json({ error: 'Bad event type' });
  }
  // 'payment' is intentionally NOT accepted from the browser; see stripe-webhook.js

  const needsFormShield = type === 'lead' || type === 'support';
  const guard = await verifyRequest(req, res, {
    bucket: type === 'assessment' ? 'assessment' : 'event',
    maxRequests: type === 'assessment' ? 20 : 12,
    windowMs: 10 * 60 * 1000,
    requireFormShield: needsFormShield
  });
  if (!guard.ok) return;

  if (type === 'lead' || type === 'support' || type === 'assessment') {
    const leadCheck = validateLeadPayload(req.body);
    if (!leadCheck.ok) return res.status(leadCheck.status).json({ error: leadCheck.error });
  }

  try {
    const l = lead || {};
    const d = data || {};
    const r = d.ratings || [];
    const eventSource = d.source || 'thrive-funnel';
    let normalizedCoupon = String(d.coupon_code || '').trim();
    if (eventSource === 'coupon_sponsored_enrollment') {
      if (normalizedCoupon.toLowerCase() !== 'mcbride') {
        return res.status(400).json({ error: 'Invalid or unrecognized coupon code.' });
      }
      normalizedCoupon = 'McBride';
    }
    const cleanSigUrl = sanitizeSignatureDataUrl(d.signature_data_url);
    const fullName = [l.fn, l.ln].filter(Boolean).join(' ');
    await forward({
      source: eventSource,
      event_source: eventSource,
      funnel_app: 'thrive-coaching',
      type,
      ts: ts || new Date().toISOString(),
      first_name: l.fn || '',
      last_name: l.ln || '',
      firstName: l.fn || '',
      lastName: l.ln || '',
      name: fullName,
      companyName: l.org || '',
      full_name: fullName,
      company_name: l.org || '',
      email: l.em || '',
      phone: l.ph || '',
      rating_between_session_engagement: r[0] ?? '',
      rating_client_ai_reality: r[1] ?? '',
      rating_ethical_ai_copilot: r[2] ?? '',
      vote: d.vote || '',
      booking_label: d.label || '',
      support_category: d.category || '',
      support_urgency: d.urgency || '',
      support_squad: d.squad || '',
      waiver_signed: Boolean(d.waiver_signed),
      waiver_accepted: Boolean(d.waiver_accepted),
      waiver_ref: d.confirmation_ref || '',
      agreement_version: d.agreement_version || '',
      funding_source: d.funding_source || '',
      sponsor_org: d.sponsor_org || '',
      coupon_code: normalizedCoupon,
      amount_usd: d.amount_usd != null ? d.amount_usd : '',
      printed_name: d.printed_name || '',
      signed_date: d.signed_date || '',
      signature_mode: d.signature_mode || '',
      typed_signature: d.typed_signature || '',
      signature_data_url: cleanSigUrl,
      signature_png_included: Boolean(cleanSigUrl),
      sms_consent: Boolean(d.sms_consent),
      assessment_name: d.assessment_name || '',
      assessment_score: d.assessment_score != null ? d.assessment_score : '',
      completed_assessments: d.completed_assessments || '',
      message: d.message || '',
      data: d,
      lead,
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'Forwarding failed' });
  }
};

module.exports.forward = forward;
