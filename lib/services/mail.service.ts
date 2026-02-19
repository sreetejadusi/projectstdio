import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/AppError";

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export class MailService {
  async sendMail(input: SendMailInput) {
    if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN || !env.MAIL_FROM) {
      throw new AppError("Mail provider not configured", 500, "MAIL_PROVIDER_NOT_CONFIGURED");
    }

    const auth = Buffer.from(`api:${env.MAILGUN_API_KEY}`).toString("base64");
    const form = new URLSearchParams();
    form.append("from", env.MAIL_FROM);
    form.append("to", input.to);
    form.append("subject", input.subject);
    form.append("text", input.text);
    form.append("html", input.html);

    const response = await fetch(`https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new AppError("Failed to send email", 500, "MAIL_SEND_FAILED", {
        status: response.status,
        response: body,
      });
    }
  }

  async sendVerificationEmail(to: string, verificationUrl: string) {
    return this.sendMail({
      to,
      subject: "Confirm your STDIO account",
      text: `Confirm your account by opening this link: ${verificationUrl}`,
      html: `<p>Confirm your STDIO account:</p><p><a href=\"${verificationUrl}\">Confirm account</a></p>`,
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    return this.sendMail({
      to,
      subject: "Reset your STDIO password",
      text: `Reset your password using this link (expires in 2 hours): ${resetUrl}`,
      html: `<p>Reset your password (expires in 2 hours):</p><p><a href=\"${resetUrl}\">Reset password</a></p>`,
    });
  }
}

export const mailService = new MailService();
