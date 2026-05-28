import env from '../config/env.js';
import logger from '../utils/logger.js';

/* ─── HTML helpers ──────────────────────────────────────────────────────── */

/* Premium, mobile-responsive shell used by every transactional email. */
function shell({ preview = '', title, body, footerNote }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${title}</title>
    <style>
      @media (max-width: 600px) {
        .wrap { width: 100% !important; padding: 16px !important; }
        .card { padding: 24px !important; }
        h1 { font-size: 22px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#0c0a14;font-family:-apple-system,Segoe UI,Inter,Roboto,Arial,sans-serif;color:#e2e0ea">
    <span style="display:none!important;opacity:0;color:transparent;height:0;width:0">${preview}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a14">
      <tr>
        <td align="center">
          <table role="presentation" class="wrap" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;padding:32px 16px">
            <!-- Brand bar -->
            <tr>
              <td style="padding:0 0 18px 0">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:12px;width:40px;height:40px;text-align:center;color:#fff;font-weight:800;font-size:20px;font-family:inherit">B</td>
                    <td style="padding-left:12px;font-size:18px;font-weight:700;letter-spacing:-.3px;color:#fff">Bookify</td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Card -->
            <tr>
              <td class="card" style="background:#15121f;border:1px solid #2a2438;border-radius:20px;padding:32px;color:#cbc6da;font-size:15px;line-height:1.65">
                <h1 style="margin:0 0 16px 0;color:#fff;font-size:24px;letter-spacing:-.4px;font-weight:700">${title}</h1>
                ${body}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:18px 4px 0 4px;color:#6b6580;font-size:12px;line-height:1.6">
                ${footerNote || 'You are receiving this because you started an action on Bookify. If this wasn\'t you, you can safely ignore this email.'}
                <br/><br/>
                © ${new Date().getFullYear()} Bookify · Dining · Plays · Events
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/* Reusable visual elements. */
const otpBlock = (otp) => `
  <div style="margin:24px 0;text-align:center">
    <div style="display:inline-block;background:#0c0a14;border:1px solid #2a2438;border-radius:14px;padding:18px 24px">
      <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#7a7395;margin-bottom:8px">Verification code</div>
      <div style="font-size:34px;font-weight:800;letter-spacing:.42em;color:#a855f7;font-family:'SF Mono',Menlo,Consolas,monospace">${otp}</div>
    </div>
    <p style="margin:12px 0 0 0;font-size:12px;color:#7a7395">This code expires in 10 minutes.</p>
  </div>`;

const ctaButton = (url, label) => `
  <p style="margin:24px 0">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;padding:13px 26px;border-radius:12px;font-weight:600;text-decoration:none;font-size:14px">
      ${label}
    </a>
  </p>`;

/* ─── Brevo transport with detailed logging ─────────────────────────────── */

/* Classifies a Brevo failure so callers can react appropriately. */
function classifyBrevoError(status, body) {
  const code = body?.code || '';
  if (status === 401) return { kind: 'auth', userMessage: 'Email provider rejected our API key.' };
  if (status === 402) return { kind: 'quota', userMessage: 'Email provider plan limit reached.' };
  if (status === 400 && /sender|domain|unauthorized/i.test(body?.message || code)) {
    return {
      kind: 'sender_not_verified',
      userMessage: 'Sender address is not verified with the email provider.',
    };
  }
  if (status >= 500) {
    return { kind: 'transient', userMessage: 'Email provider is temporarily unavailable.' };
  }
  return { kind: 'unknown', userMessage: 'Unable to send the email at this time.' };
}

async function postToBrevo(payload) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': env.brevo.apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { response, body };
}

/**
 * Sends a transactional email via Brevo with one automatic retry on transient
 * 5xx failures. Returns `{ ok, messageId? | status?, error?, kind? }` so the
 * caller can surface a meaningful error to the user.
 */
async function send({ to, subject, html, replyTo, tags }) {
  /* The mock path runs ONLY when no Brevo key is configured. In production
     `env.hasMail` is true and every email goes over the wire. */
  if (!env.hasMail) {
    logger.warn(`[email:mock] BREVO_API_KEY not set — message not delivered (to=${to})`);
    return { mocked: true, ok: true };
  }

  if (!env.brevo.senderEmail) {
    logger.error('BREVO_SENDER_EMAIL is missing — cannot send transactional email');
    return {
      ok: false,
      kind: 'config',
      error: { message: 'Mail sender is not configured on the server' },
    };
  }

  const payload = {
    sender: { email: env.brevo.senderEmail, name: env.brevo.senderName },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    ...(tags ? { tags } : {}),
  };

  /* Retry only when Brevo itself is having a bad moment (5xx / network).
     Auth, quota and sender-verification errors are deterministic and a
     retry would just waste a second. */
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { response, body } = await postToBrevo(payload);

      if (response.ok) {
        logger.success(`Email sent → ${to} :: messageId=${body.messageId || '(n/a)'}`);
        return { ok: true, messageId: body.messageId };
      }

      const cls = classifyBrevoError(response.status, body);
      logger.error(
        `Brevo ${response.status} (${cls.kind}) → ${body.code || 'unknown'} :: ${body.message || ''}`,
      );
      logger.error(`  sender=${env.brevo.senderEmail} to=${to} subject="${subject}"`);

      /* Retry once on transient 5xx, then give up. */
      if (cls.kind === 'transient' && attempt === 0) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }

      return {
        ok: false,
        status: response.status,
        kind: cls.kind,
        userMessage: cls.userMessage,
        error: body,
      };
    } catch (err) {
      /* Network-level failure — retry once. */
      if (attempt === 0) {
        logger.warn(`Brevo network failure (will retry): ${err.message}`);
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      logger.error(`Brevo network failure (final): ${err.message}`);
      return {
        ok: false,
        kind: 'transient',
        userMessage: 'Email provider unreachable.',
        error: { message: err.message },
      };
    }
  }
  return { ok: false, kind: 'unknown', userMessage: 'Email send failed.' };
}

/* ─── Templates ─────────────────────────────────────────────────────────── */

export const emailService = {
  /* Raw transport — exposed so the admin email-test endpoint can use it. */
  send,

  sendWelcome: (user) =>
    send({
      to: user.email,
      subject: 'Welcome to Bookify',
      html: shell({
        preview: 'Your Bookify account is ready.',
        title: `Welcome, ${user.name.split(' ')[0]}`,
        body: `<p>Your account is ready. Discover the best dining, plays and events in your city — booked in seconds.</p>
               ${ctaButton(env.clientUrl, 'Start exploring')}`,
      }),
    }),

  /* Password reset OTP — separate from the email-verification OTP below. */
  sendOTP: (user, otp) =>
    send({
      to: user.email,
      subject: 'Your Bookify password reset code',
      html: shell({
        preview: 'Use this code to reset your Bookify password.',
        title: 'Reset your password',
        body: `<p>Use the code below to reset your password. It expires in 10 minutes.</p>
               ${otpBlock(otp)}
               <p>If you didn't request this, you can ignore this message — your password remains unchanged.</p>`,
      }),
    }),

  sendBookingConfirmation: (user, booking) =>
    send({
      to: booking.contact?.email || user.email,
      subject: `Booking confirmed — ${booking.reference}`,
      html: shell({
        preview: `Booking ${booking.reference} is confirmed.`,
        title: 'Booking confirmed',
        body: `<p>Your booking for <strong style="color:#fff">${booking.itemTitle}</strong> is confirmed.</p>
               <p>Reference: <strong style="color:#a855f7">${booking.reference}</strong></p>
               <p>Amount paid: <strong style="color:#fff">₹${booking.amount.toLocaleString('en-IN')}</strong></p>`,
      }),
    }),

  /* ─── Manager flows ───────────────────────────────────────────────── */

  /* Step 1 — OTP sent right after the application is submitted. */
  sendManagerVerificationOTP: (user, otp) =>
    send({
      to: user.email,
      subject: 'Verify your Bookify business email',
      html: shell({
        preview: 'Your Bookify verification code',
        title: `Hi ${user.name.split(' ')[0]}, please verify your email`,
        body: `<p>Thanks for applying to list <strong style="color:#fff">${user.managerProfile?.businessName || 'your business'}</strong> on Bookify. To continue, enter this 6-digit code in the verification screen:</p>
               ${otpBlock(otp)}
               <p>If you didn't start this application, you can safely ignore this email.</p>`,
        footerNote:
          'For your security, the code expires in 10 minutes and can be used only once.',
      }),
      tags: ['manager-verify-otp'],
    }),

  /* Step 2 — sent immediately after the OTP is verified. */
  sendManagerApplicationReceived: (user) =>
    send({
      to: user.email,
      subject: 'Thank You for Connecting with Bookify',
      html: shell({
        preview: 'Your Bookify partner application has been received.',
        title: 'Thank you for connecting with Bookify',
        body: `
          <p>Hi ${user.name.split(' ')[0]},</p>
          <p>We have successfully received your business application for
             <strong style="color:#fff">${user.managerProfile?.businessName || 'your business'}</strong>.
             Your email has been verified and your KYC details are now with our review team.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;background:#0c0a14;border:1px solid #2a2438;border-radius:14px;padding:14px 18px;width:100%">
            <tr><td style="padding:6px 0;color:#7a7395;font-size:13px">Application status</td><td style="padding:6px 0;color:#a855f7;font-weight:600;text-align:right">KYC under review</td></tr>
            <tr><td style="padding:6px 0;color:#7a7395;font-size:13px">Typical review window</td><td style="padding:6px 0;color:#fff;text-align:right">1 business day</td></tr>
          </table>
          <p>What happens next:</p>
          <ul style="padding-left:20px;color:#cbc6da">
            <li style="margin:6px 0">Our team reviews your documents and business details.</li>
            <li style="margin:6px 0">If approved, you'll receive a confirmation email and full access to your partner dashboard.</li>
            <li style="margin:6px 0">If we need anything else, or are unable to approve at this time, we'll let you know by email with a reason.</li>
          </ul>
          ${ctaButton(`${env.clientUrl}/manager`, 'Open partner dashboard')}`,
        footerNote:
          'Need help? Reply to this email and our partner team will get back to you.',
      }),
      tags: ['manager-application-received'],
    }),

  sendManagerApproved: (user) =>
    send({
      to: user.email,
      subject: 'Your Bookify partner account is approved 🎉',
      html: shell({
        preview: 'You can now list and manage your business on Bookify.',
        title: 'You\'re in!',
        body: `<p>Hi ${user.name.split(' ')[0]},</p>
               <p>Your partner account for <strong style="color:#fff">${user.managerProfile?.businessName || user.name}</strong> has been approved. Your existing listings are now live and you can publish new ones from the dashboard.</p>
               ${ctaButton(`${env.clientUrl}/manager`, 'Go to dashboard')}`,
      }),
      tags: ['manager-approved'],
    }),

  sendManagerRejected: (user, reason) =>
    send({
      to: user.email,
      subject: 'Update on your Bookify partner application',
      html: shell({
        preview: 'An update on your Bookify partner application.',
        title: 'Application update',
        body: `<p>Hi ${user.name.split(' ')[0]},</p>
               <p>Thank you for applying to be a Bookify partner. After review we are unable to approve your account at this time.</p>
               ${reason
                 ? `<div style="background:#2a0f17;border:1px solid #6b1f2c;border-radius:14px;padding:14px 18px;margin:16px 0"><strong style="color:#fca5a5">Reason:</strong> <span style="color:#fed7d7">${reason}</span></div>`
                 : ''}
               <p>You're welcome to update your details and re-apply. If you believe this was a mistake, reply to this email and our team will take another look.</p>`,
        footerNote: 'Bookify partner support · reply to this email and we will respond within one business day.',
      }),
      tags: ['manager-rejected'],
    }),
};
