import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env["EMAIL_USER"];
  const pass = process.env["EMAIL_PASS"];

  if (!user || !pass) {
    logger.warn("EMAIL_USER or EMAIL_PASS not set - emails will fail");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  transporter.verify((error) => {
    if (error) {
      logger.error({ err: error }, "Email transporter verification failed");
    } else {
      logger.info({ from: user }, "Email transporter verified");
    }
  });

  return transporter;
}
