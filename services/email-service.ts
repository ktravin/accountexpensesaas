import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export async function sendReportEmail(params: {
  to: string;
  subject: string;
  text: string;
  attachmentName: string;
  content: Buffer;
  contentType: string;
}) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("SMTP is not configured");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });

  return transporter.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    to: params.to,
    subject: params.subject,
    text: params.text,
    attachments: [{ filename: params.attachmentName, content: params.content, contentType: params.contentType }]
  });
}
