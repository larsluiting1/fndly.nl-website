function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, email, company, website, message } = req.body || {};

  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(200).json({ ok: true });
    return;
  }

  const from = process.env.REPORT_FROM_EMAIL || 'FNDLY <reports@fndly.nl>';
  const notifyTo = process.env.NOTIFY_EMAIL || 'hello@fndly.nl';

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;max-width:520px;">
    <h3 style="margin:0 0 16px;font-size:18px;">New Dashboard Access Request</h3>
    <p style="font-size:14px;line-height:1.8;margin:0 0 20px;">
      <strong>Name:</strong> ${escapeHtml(name)}<br>
      <strong>Email:</strong> ${escapeHtml(email)}<br>
      <strong>Company:</strong> ${escapeHtml(company || '(not provided)')}<br>
      <strong>Website:</strong> ${escapeHtml(website || '(not provided)')}<br>
    </p>
    ${message ? `<p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 20px;padding:16px;background:#f7f7f5;border-radius:8px;"><strong>Message:</strong><br>${escapeHtml(message)}</p>` : ''}
    <p style="font-size:13px;color:#888;">Reply to this email to respond directly to the applicant.</p>
  </div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: notifyTo,
        reply_to: email,
        subject: `Dashboard access request: ${name}${company ? ` (${company})` : ''}`,
        html,
      }),
    });
    if (!r.ok) console.error('Resend error:', await r.text());
  } catch (err) {
    console.error(err);
  }

  res.status(200).json({ ok: true });
};
