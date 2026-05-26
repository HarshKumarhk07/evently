import env from '../config/env.js';
import logger from '../utils/logger.js';

const shell = (title, body) => `
  <div style="background:#0c0a13;padding:32px;font-family:Inter,Arial,sans-serif">
    <div style="max-width:520px;margin:auto;background:#15121f;border:1px solid #2a2438;border-radius:20px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:24px 32px">
        <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:-.5px">Bookify</h1>
      </div>
      <div style="padding:32px;color:#cbc6da;font-size:15px;line-height:1.6">
        <h2 style="color:#fff;margin-top:0">${title}</h2>
        ${body}
      </div>
      <div style="padding:20px 32px;border-top:1px solid #2a2438;color:#6b6580;font-size:12px">
        You are receiving this because you have an account on Bookify.
      </div>
    </div>
  </div>`;

/* Sends an email through Brevo — or logs it when mail delivery is not configured. */
async function send({ to, subject, html }) {
  if (!env.hasMail) {
    logger.info(`[email:mock] To: ${to} | Subject: ${subject}`);
    return { mocked: true };
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': env.brevo.apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: env.brevo.senderEmail,
        name: env.brevo.senderName,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Brevo mail failed (${response.status}): ${message}`);
  }

  logger.success(`Email sent to ${to}`);
  return { mocked: false };
}

export const emailService = {
  sendWelcome: (user) =>
    send({
      to: user.email,
      subject: 'Welcome to Bookify',
      html: shell(
        `Welcome, ${user.name.split(' ')[0]}`,
        '<p>Your account is ready. Discover the best dining, plays and events in your city.</p>',
      ),
    }),

  sendOTP: (user, otp) =>
    send({
      to: user.email,
      subject: 'Your Bookify verification code',
      html: shell(
        'Verification code',
        `<p>Use the code below to reset your password. It expires in 10 minutes.</p>
         <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#a855f7">${otp}</p>`,
      ),
    }),

  sendBookingConfirmation: (user, booking) =>
    send({
      to: booking.contact?.email || user.email,
      subject: `Booking confirmed — ${booking.reference}`,
      html: shell(
        'Booking confirmed',
        `<p>Your booking for <strong>${booking.itemTitle}</strong> is confirmed.</p>
         <p>Reference: <strong style="color:#a855f7">${booking.reference}</strong></p>
         <p>Amount paid: <strong>₹${booking.amount.toLocaleString('en-IN')}</strong></p>`,
      ),
    }),
};
