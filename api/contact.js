module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!resendApiKey || !toEmail) {
    return response.status(500).json({
      error: 'Le formulaire nest pas encore configure cote serveur.',
    });
  }

  const { email, subject, message, company } = request.body || {};

  if (company) {
    return response.status(200).json({ ok: true });
  }

  if (!email || !subject || !message) {
    return response.status(400).json({ error: 'Veuillez remplir tous les champs.' });
  }

  if (String(message).length > 4000 || String(subject).length > 120) {
    return response.status(400).json({ error: 'Votre message est trop long.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    return response.status(400).json({ error: 'Adresse email invalide.' });
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'OneSabil <onboarding@resend.dev>',
      to: [toEmail],
      reply_to: String(email),
      subject: `[OneSabil] ${String(subject)}`,
      text: [`Email: ${email}`, '', 'Message:', String(message)].join('\n'),
    }),
  });

  if (!resendResponse.ok) {
    return response.status(502).json({ error: 'Impossible d envoyer le message.' });
  }

  return response.status(200).json({ ok: true });
};
