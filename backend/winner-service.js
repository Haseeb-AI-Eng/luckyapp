const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/form_registrations';
mongoose.connect(mongoURI);

const Submission = mongoose.model('Submission', new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
}));

// 2. Email Transporter (Using Gmail as an example)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your App Password (not your login password)
    }
});

async function selectWinners(count) {
    try {
        console.log(`🎲 Selecting ${count} random winners...`);

        // MongoDB's $sample selects random documents efficiently
        const winners = await Submission.aggregate([{ $sample: { size: count } }]);

        if (winners.length === 0) {
            console.log("❌ No registered users found.");
            return;
        }

        for (const user of winners) {
            const mailOptions = {
                from: `"Lucky Draw Team" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "🎉 Congratulations! You've been selected!",
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                        <h2 style="color: #2563eb;">Congratulations, ${user.firstName}!</h2>
                        <p>We are thrilled to inform you that you have been randomly selected in our <b>Lucky Draw 2026</b>.</p>
                        <p>Our team will contact you shortly with the next steps regarding your prize.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #666;">If you didn't expect this email, please ignore it.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to winner: ${user.firstName} (${user.email})`);
        }

        console.log("🏁 All winner notifications sent successfully!");
        process.exit();

    } catch (error) {
        console.error("Selection failed:", error);
        process.exit(1);
    }
}

// Run the function - Change '3' to however many winners you want
selectWinners(3);