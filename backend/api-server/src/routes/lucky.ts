import { Router, type IRouter } from "express";
import QRCode from "qrcode";
import { db, submissions, winners, type Submission } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { getTransporter } from "../lib/mailer";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

function winnerEmailHtml(winner: {
  firstName: string;
  lastName: string;
  userId: string;
  phone: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; max-width: 600px; margin: 0 auto;">
      <div style="background: white; padding: 30px; border-radius: 10px;">
        <h1 style="color: #667eea; text-align: center; margin: 0 0 20px 0;">🎉 Congratulations!</h1>
        <h2 style="color: #333; text-align: center;">You've Been Selected!</h2>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">
          Dear <strong>${winner.firstName} ${winner.lastName}</strong>,
        </p>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">
          We are delighted to inform you that <strong>you have been selected as a winner</strong> in the Lucky Draw! 🏆
        </p>
        <div style="background: #f0f4ff; padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #667eea; font-weight: bold;">Your Registration Code:</p>
          <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #333; font-family: monospace;">${winner.userId}</p>
        </div>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">
          Our team will contact you soon at <strong>${winner.phone}</strong> to confirm your prize and arrange delivery.
        </p>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">
          Thank you for participating in our lucky draw!
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          <strong>Lucky Draw 2026</strong> | Powered by SecureCloud Systems
        </p>
      </div>
    </div>
  `;
}

router.post("/save-form", async (req, res) => {
  const { firstName, lastName, fatherName, gender, phone, email, city } =
    req.body ?? {};

  try {
    const generatedId = `USR-${Date.now()}`;
    await db.insert(submissions).values({
      userId: generatedId,
      firstName,
      lastName,
      fatherName,
      gender,
      phone,
      email: String(email).toLowerCase(),
      city,
    });

    res
      .status(201)
      .json({ message: "Data saved successfully!", id: generatedId });
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return res
        .status(409)
        .json({ error: "The email or phone is already registered." });
    }
    logger.error({ err: error }, "Save-form error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/register", async (req, res) => {
  const { userCode, name, email, organization, contact } = req.body ?? {};

  try {
    if (!name || !email || !contact) {
      return res
        .status(400)
        .json({ error: "Missing required fields: name, email, contact" });
    }

    const generatedId = userCode || `USR-${Date.now()}`;
    const nameParts = String(name).split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    await db.insert(submissions).values({
      userId: generatedId,
      firstName,
      lastName,
      fatherName: organization || "N/A",
      gender: "Not Specified",
      phone: contact,
      email: String(email).toLowerCase(),
      city: "N/A",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      id: generatedId,
      userCode: generatedId,
    });
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return res
        .status(409)
        .json({ error: "The email or phone is already registered." });
    }
    logger.error({ err: error }, "Registration error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/generate-qr", async (_req, res) => {
  const formUrl = "https://forms.gle/PaeR46GeuVPYCTPm6";
  try {
    const qrImage = await QRCode.toDataURL(formUrl, {
      color: { dark: "#1e40af", light: "#00000000" },
      margin: 2,
      width: 300,
    });
    res.json({ qrCode: qrImage });
  } catch (err) {
    logger.error({ err }, "QR generation failed");
    res.status(500).json({ error: "Failed to generate QR" });
  }
});

router.get("/submissions", async (_req, res) => {
  try {
    const data = await db
      .select()
      .from(submissions)
      .orderBy(desc(submissions.submittedAt));
    res.status(200).json(data);
  } catch (err) {
    logger.error({ err }, "Failed to fetch submissions");
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

router.get("/pick-winner", async (_req, res) => {
  try {
    const eligible: Submission[] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.isWinner, false))
      .orderBy(sql`random()`)
      .limit(1);

    if (eligible.length === 0) {
      return res.status(404).json({ error: "No users available" });
    }

    const winner = eligible[0]!;

    await db
      .update(submissions)
      .set({ isWinner: true })
      .where(eq(submissions.id, winner.id));

    await db.insert(winners).values({
      userId: winner.userId,
      firstName: winner.firstName,
      lastName: winner.lastName,
      email: winner.email,
      phone: winner.phone,
    });

    // Send winner email ONLY here, after the slot machine picks them.
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Lucky Draw Team" <${process.env["EMAIL_USER"]}>`,
        to: winner.email,
        subject: "🎉 Congratulations! You've been selected as a winner!",
        html: winnerEmailHtml(winner),
      });
      logger.info({ to: winner.email }, "Winner email sent");
    } catch (emailErr) {
      logger.error(
        { err: emailErr, to: winner.email },
        "Email send failed",
      );
    }

    res.json({
      winner: {
        name: `${winner.firstName} ${winner.lastName}`,
        email: winner.email,
        phone: winner.phone,
        userCode: winner.userId,
      },
    });
  } catch (err) {
    logger.error({ err }, "Pick winner failed");
    res.status(500).json({ error: "Failed to pick winner" });
  }
});

router.get("/test-email", async (_req, res) => {
  const user = process.env["EMAIL_USER"];
  try {
    const transporter = getTransporter();
    const result = await transporter.sendMail({
      from: `"Lucky Draw Team" <${user}>`,
      to: user,
      subject: "✅ Lucky Draw Email Test - System Working!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 30px;">
          <h1 style="color: #667eea;">✅ Email System Test</h1>
          <p>If you're reading this, the email system is working correctly!</p>
          <p style="font-size: 14px; color: #888;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });
    res.json({
      success: true,
      message: "Test email sent successfully!",
      sentTo: user,
      messageId: result.messageId,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    logger.error({ err }, "Test email failed");
    res.status(500).json({
      success: false,
      error: err?.message,
      code: err?.code,
      hint: "Check EMAIL_USER and EMAIL_PASS",
    });
  }
});

export default router;
