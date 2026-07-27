import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Purity <no-reply@purity-parfums.com>";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends transactional email via Resend when RESEND_API_KEY is configured.
 * Without a key (local/dev), logs the email to the console so flows remain testable.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!resend) {
    console.log(`\n📧  [DEV EMAIL] To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, " ").trim()}\n`);
    return { devMode: true };
  }

  await resend.emails.send({ from: FROM, to, subject, html });
  return { devMode: false };
}

function emailShell(title: string, bodyHtml: string) {
  return `
  <div style="background:#faf8f4;padding:40px 0;font-family:Georgia,serif;color:#171412;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e6e1d6;padding:40px;">
      <p style="letter-spacing:4px;font-size:11px;text-transform:uppercase;color:#cba135;margin:0 0 24px;">Purity</p>
      <h1 style="font-size:22px;margin:0 0 16px;">${title}</h1>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#3a352f;">
        ${bodyHtml}
      </div>
      <p style="margin-top:32px;font-size:11px;color:#9a9285;">— Purity Luxury Fragrance House</p>
    </div>
  </div>`;
}

export async function sendVerificationEmail(to: string, name: string, link: string) {
  return sendEmail({
    to,
    subject: "Verify your email — Purity",
    html: emailShell(
      "Confirm your email",
      `<p>Hello ${name},</p><p>Thank you for creating a Purity account. Please confirm your email address to activate your account and start your fragrance journey.</p>
      <p style="margin:28px 0;"><a href="${link}" style="background:#0f4c81;color:#ffffff;padding:14px 28px;text-decoration:none;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Verify Email</a></p>
      <p style="color:#9a9285;">This link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>`
    ),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, link: string) {
  return sendEmail({
    to,
    subject: "Reset your password — Purity",
    html: emailShell(
      "Reset your password",
      `<p>Hello ${name},</p><p>We received a request to reset your Purity account password. Click below to choose a new password.</p>
      <p style="margin:28px 0;"><a href="${link}" style="background:#0f4c81;color:#ffffff;padding:14px 28px;text-decoration:none;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Reset Password</a></p>
      <p style="color:#9a9285;">This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>`
    ),
  });
}

export async function sendOrderConfirmationEmail(to: string, name: string, orderNumber: string, total: string) {
  return sendEmail({
    to,
    subject: `Order Confirmed — ${orderNumber}`,
    html: emailShell(
      "Your order is confirmed",
      `<p>Hello ${name},</p><p>Thank you for your purchase. Your order <strong>${orderNumber}</strong> totalling <strong>${total}</strong> has been received and is now processing.</p>
      <p style="color:#9a9285;">We'll notify you as your order is packed, shipped, and delivered.</p>`
    ),
  });
}

export async function sendOrderStatusEmail(to: string, name: string, orderNumber: string, status: string) {
  return sendEmail({
    to,
    subject: `Order Update — ${orderNumber}`,
    html: emailShell(
      "Your order status has changed",
      `<p>Hello ${name},</p><p>Your order <strong>${orderNumber}</strong> is now: <strong>${status}</strong>.</p>`
    ),
  });
}
