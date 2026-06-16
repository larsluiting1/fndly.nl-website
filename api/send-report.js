const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderBreakdownRows(breakdown) {
  return breakdown.map((b) => `
    <tr>
      <td style="padding:8px 0;color:#444;font-size:14px;border-bottom:1px solid #eee;">${escapeHtml(b.name)}</td>
      <td style="padding:8px 0;text-align:right;font-weight:700;color:#111;font-size:14px;border-bottom:1px solid #eee;">${escapeHtml(b.score)}/100</td>
    </tr>`).join('');
}

function reportEmailHtml({ domain, overall, breakdown }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#111;padding:32px 24px;">
    <h2 style="margin:0 0 6px;font-size:22px;">Your Visibility &amp; Design Report</h2>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Here's the in-depth breakdown for <strong>${escapeHtml(domain)}</strong>.</p>
    <div style="background:#f7f7f5;border-radius:14px;padding:28px;margin-bottom:24px;text-align:center;">
      <div style="font-size:44px;font-weight:800;color:#111;line-height:1;">${escapeHtml(overall)}/100</div>
      <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-top:6px;">Overall Score</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">${renderBreakdownRows(breakdown)}</table>
    <p style="color:#555;font-size:14px;line-height:1.6;">Want a real, personalized strategy to close these gaps? Reply to this email or book a free call and we'll walk you through exactly what to fix first.</p>
    <a href="https://fndly.nl/#contact" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Book a free strategy call</a>
    <p style="color:#aaa;font-size:12px;margin-top:36px;">FNDLY — Findability Made Simple</p>
  </div>`;
}

function notifyEmailHtml({ name, email, phone, domain, overall, breakdown }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;">
    <h3 style="margin:0 0 16px;">New visibility check lead</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px;">
      <strong>Name:</strong> ${escapeHtml(name || '(not provided)')}<br>
      <strong>Email:</strong> ${escapeHtml(email)}<br>
      <strong>Phone:</strong> ${escapeHtml(phone)}<br>
      <strong>Website checked:</strong> ${escapeHtml(domain)}<br>
      <strong>Overall score:</strong> ${escapeHtml(overall)}/100
    </p>
    <table style="border-collapse:collapse;width:100%;max-width:360px;">${renderBreakdownRows(breakdown)}</table>
  </div>`;
}

async function sendEmail({ apiKey, from, to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error (${res.status}): ${text}`);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, email, phone, domain, overall, breakdown } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }
  if (!phone || String(phone).trim().length < 6) {
    res.status(400).json({ error: 'A valid phone number is required' });
    return;
  }
  if (!domain || overall === undefined || !Array.isArray(breakdown)) {
    res.status(400).json({ error: 'Missing report data' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Email service not configured' });
    return;
  }

  const from = process.env.REPORT_FROM_EMAIL || 'FNDLY <reports@fndly.nl>';
  const notifyTo = process.env.NOTIFY_EMAIL || 'hello@fndly.nl';

  try {
    await Promise.all([
      sendEmail({
        apiKey, from, to: email,
        subject: `Your visibility & design report for ${domain}`,
        html: reportEmailHtml({ domain, overall, breakdown }),
      }),
      sendEmail({
        apiKey, from, to: notifyTo,
        subject: `New lead: ${domain} (score ${overall}/100)`,
        html: notifyEmailHtml({ name, email, phone, domain, overall, breakdown }),
      }),
    ]);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Failed to send email' });
  }
};
