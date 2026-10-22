const REVOKED_KEYS = new Set([
  "AIzaSyDhByu-gVi8PNLtDdl41ETxOmu2JOEVt8A",
  "sk_d2fc2ac281afdb8a56178f44c8ebca76f21da62f7a256bf8"
]);

const DEFAULT_VOICE_ID = "4EfJOraSN0d4Lt6iDXwh";

function sanitizeKey(val) {
  const trimmed = String(val || "").trim();
  if (!trimmed || trimmed.includes("VITE_") || REVOKED_KEYS.has(trimmed)) {
    return "";
  }
  return trimmed;
}

function sanitizeVoiceId(rawId) {
  const trimmed = String(rawId || "").trim();
  if (/^[a-zA-Z0-9_-]{10,48}$/.test(trimmed)) {
    return trimmed;
  }
  return DEFAULT_VOICE_ID;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (_) {
      res.status(400).json({ error: "Invalid JSON payload" });
      return;
    }
  }
  body = body || {};

  const text = String(body.text || "").trim().slice(0, 5000);
  if (!text) {
    res.status(400).json({ error: "Missing text in request body" });
    return;
  }

  const headerKey = req.headers && req.headers["x-elevenlabs-api-key"];
  const activeKey = sanitizeKey(
    headerKey ||
    process.env.ELEVENLABS_API_KEY ||
    process.env.VITE_ELEVENLABS_API_KEY ||
    ""
  );

  if (!activeKey) {
    res.status(503).json({ fallback: true, reason: "no_active_server_key" });
    return;
  }

  const voiceId = sanitizeVoiceId(body.voiceId);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Accept": "audio/mpeg",
          "xi-api-key": activeKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text.replace(/THRiVE/g, "Thrive"),
          model_id: body.model_id || "eleven_turbo_v2_5",
          voice_settings: body.voice_settings || { stability: 0.5, similarity_boost: 0.75 }
        })
      }
    );
    clearTimeout(timeoutId);

    if (!upstream.ok) {
      res.status(upstream.status || 502).json({ fallback: true, reason: `upstream_http_${upstream.status}` });
      return;
    }

    const arrayBuffer = await upstream.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    clearTimeout(timeoutId);
    res.status(502).json({ fallback: true, reason: err?.name === "AbortError" ? "timeout" : "network_error" });
  }
};
