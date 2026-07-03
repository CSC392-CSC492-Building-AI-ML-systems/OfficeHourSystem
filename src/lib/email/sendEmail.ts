/**
 * Provider-agnostic transactional email sender.
 *
 * Switch providers with EMAIL_PROVIDER (default "brevo"). Both providers are a
 * single HTTPS POST, so adding another is a few lines here — callers only ever
 * see sendEmail().
 *
 * Required env:
 *   EMAIL_FROM        verified sender address (e.g. "oh@cs.utoronto.ca")
 *   EMAIL_FROM_NAME   optional display name (default "Office Hours")
 *   brevo:  BREVO_API_KEY
 *   resend: RESEND_API_KEY
 */
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export type EmailSender = (msg: EmailMessage) => Promise<void>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function sendViaBrevo(msg: EmailMessage): Promise<void> {
  const apiKey = requireEnv("BREVO_API_KEY");
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: requireEnv("EMAIL_FROM"),
        name: process.env.EMAIL_FROM_NAME ?? "Office Hours",
      },
      to: [{ email: msg.to }],
      subject: msg.subject,
      htmlContent: msg.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo send failed (${res.status}): ${body}`);
  }
}

async function sendViaResend(msg: EmailMessage): Promise<void> {
  const apiKey = requireEnv("RESEND_API_KEY");
  const fromName = process.env.EMAIL_FROM_NAME ?? "Office Hours";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${requireEnv("EMAIL_FROM")}>`,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? "brevo";
  switch (provider) {
    case "brevo":
      return sendViaBrevo(msg);
    case "resend":
      return sendViaResend(msg);
    default:
      throw new Error(`Unknown EMAIL_PROVIDER: ${provider}`);
  }
}
