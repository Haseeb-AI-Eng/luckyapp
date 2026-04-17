const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- 1. Database Connection ---
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/form_registrations';

mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB: form_registrations"))
    .catch(err => console.error("Database connection error:", err));

// --- 2. Database Schema ---
const SubmissionSchema = new mongoose.Schema({
    userId: { type: String, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fatherName: { type: String, required: true },
    gender: { type: String, required: true },
    phone: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    city: { type: String, required: true },
    isWinner: { type: Boolean, default: false }, // Tracks if they won a draw
    submittedAt: { type: Date, default: Date.now }
});

const Submission = mongoose.model('Submission', SubmissionSchema);


// --- New Winner Schema ---
const WinnerSchema = new mongoose.Schema({
    userId: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    wonAt: { type: Date, default: Date.now }
});

const Winner = mongoose.model('Winner', WinnerSchema);

// --- 3. Email Transporter Setup ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail
        pass: process.env.EMAIL_PASS  // Your App Password
    }
});

// --- 4. Lucky Draw Logic (30% of Users) ---
async function runLuckyDraw() {
    try {
        const totalUsers = await Submission.countDocuments();

        // Calculate 30% of users (e.g., 6 winners if total is 20)
        const winnerCount = Math.floor(totalUsers * 0.30);

        console.log(`🎯 Milestone Reached! Selecting ${winnerCount} winners from ${totalUsers} users...`);

        if (winnerCount < 1) return;

        // Select random winners from the pool
        const selectedWinners = await Submission.aggregate([
            { $match: { isWinner: false } },
            { $sample: { size: winnerCount } }
        ]);

        const winnersToSave = []; // Array to store winners for the new collection

        for (const user of selectedWinners) {
            // Mark as winner in Database
            await Submission.updateOne({ _id: user._id }, { isWinner: true });

            // Add to winners array for the new collection
            winnersToSave.push({
                userId: user.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone
            });

            // Send Professional Email
            const mailOptions = {
                from: `"Lucky Draw Team" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "🎉 Congratulations! You've been selected!",
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #3b82f6; border-radius: 15px; max-width: 500px;">
                        <h2 style="color: #1e40af;">Winner Announcement!</h2>
                        <p>Hello <b>${user.firstName}</b>,</p>
                        <p>We are excited to inform you that you are one of the 30% randomly selected winners from our recent registration drive!</p>
                        <p>Our team will reach out to your provided phone number (<b>${user.phone}</b>) soon.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 11px; color: #999;">Registration Portal 2026 | SecureCloud Systems</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Winner Email Sent: ${user.email}`);
        }

        // Save all selected winners to the new Winners collection
        if (winnersToSave.length > 0) {
            await Winner.insertMany(winnersToSave);
            console.log(`📂 Successfully archived ${winnersToSave.length} winners to the Winners collection.`);
        }

        console.log("🏁 Lucky Draw completed successfully.");
    } catch (error) {
        console.error("❌ Lucky Draw Error:", error);
    }
}

// --- 5. API Endpoints ---

// Submit Form
app.post('/api/save-form', async (req, res) => {
    const { firstName, lastName, fatherName, gender, phone, email, city } = req.body;

    try {
        const generatedId = `USR-${Date.now()}`;
        const newEntry = new Submission({
            userId: generatedId,
            firstName, lastName, fatherName, gender, phone, email, city
        });

        await newEntry.save();
        console.log(`[SUCCESS] New user: ${email}`);

        // CHECK COUNT: Trigger draw automatically at 20 registrations
        console.log('checking registration count...');
        const currentCount = await Submission.countDocuments();
        console.log(`Registration Progress: ${currentCount}/20`);

        if (currentCount > 0 && currentCount % 7 === 0) {
            console.log("🎯 TRIGGERING LUCKY DRAW...");
            // Use 'await' here for a second just to see if it throws an error in the console
            runLuckyDraw().catch(err => console.error("Internal Draw Error:", err));
        } else {
            console.log("Keep going! Not a multiple of 7 yet.");
        }

        res.status(201).json({ message: "Data saved successfully!", id: generatedId });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "The email or phone is already registered." });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Generate QR Code
app.get('/api/generate-qr', async (req, res) => {
    const formUrl = 'https://forms.gle/PaeR46GeuVPYCTPm6';
    try {
        const qrImage = await QRCode.toDataURL(formUrl, {
            color: { dark: '#1e40af', light: '#00000000' },
            margin: 2,
            width: 300
        });
        res.json({ qrCode: qrImage });
    } catch (err) {
        res.status(500).json({ error: "Failed to generate QR" });
    }
});

// Fetch All Submissions (For your Dashboard)
app.get('/api/submissions', async (req, res) => {
    try {
        const data = await Submission.find().sort({ submittedAt: -1 });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// --- 6. Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server active on port ${PORT}`);
    console.log(`📈 Draw trigger set to 20 registrations.`);
});