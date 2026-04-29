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

// --- Request Logging Middleware ---
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - Time: ${new Date().toISOString()}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`   Body:`, JSON.stringify(req.body, null, 2));
    }
    next();
});

// --- 1. Database Connection ---
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/game';

mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB: game"))
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
console.log(`\n📧 [EMAIL CONFIG] Checking .env variables...`);
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET'}\n`);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail
        pass: process.env.EMAIL_PASS  // Your App Password
    }
});

// Verify email configuration
transporter.verify((error, success) => {
    if (error) {
        console.error(`❌ [EMAIL ERROR] Email transporter verification failed:`, error.message);
        console.error(`   Ensure EMAIL_USER and EMAIL_PASS are correct in .env`);
    } else {
        console.log(`✅ [EMAIL] Email transporter verified and ready`);
        console.log(`   From: ${process.env.EMAIL_USER}`);
        console.log(`   Status: Connected and authenticated\n`);
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
                subject: "🎉 Congratulations! You are a Lucky Draw Winner!",
                html: `
                    <div style="font-family: sans-serif; padding: 30px; border: 2px solid #10b981; border-radius: 15px; max-width: 600px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <h1 style="color: #059669; font-size: 32px; margin: 0;">🎉</h1>
                            <h2 style="color: #047857; margin: 10px 0; font-size: 24px;">Congratulations!</h2>
                        </div>
                        <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 15px 0;">
                            Hello <b>${user.firstName}</b>,
                        </p>
                        <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #10b981; margin: 20px 0;">
                            <p style="color: #1f2937; font-size: 16px; line-height: 1.8; margin: 0;">
                                <b>🎉 Congratulations! You are the winner of our Lucky Draw. Thank you for participating with us!</b>
                            </p>
                        </div>
                        <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">
                            We are thrilled to inform you that you have been selected as a winner. Our team will contact you shortly at <b>${user.phone}</b> with further details regarding your prize.
                        </p>
                        <hr style="border: none; border-top: 1px solid #d1d5db; margin: 25px 0;">
                        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
                            Registration Portal 2026 | SecureCloud Systems
                        </p>
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
        console.log(`Registration Progress: ${currentCount}/10`);

        if (currentCount > 0 && currentCount % 10 === 0) {
            console.log("🎯 TRIGGERING LUCKY DRAW...");
            // Use 'await' here for a second just to see if it throws an error in the console
            runLuckyDraw().catch(err => console.error("Internal Draw Error:", err));
        } else {
            console.log("Keep going! Not a multiple of 10 yet.");
        }

        res.status(201).json({ message: "Data saved successfully!", id: generatedId });

    } catch (error) {
        if (error.code === 11000) {
            console.error(`[ERROR] Duplicate entry - ${error.message}`);
            return res.status(409).json({ error: "The email or phone is already registered." });
        }
        console.error(`[ERROR] Save-Form Error:`, error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Register User (Frontend endpoint)
app.post('/api/register', async (req, res) => {
    console.log(`📝 Register endpoint called with data:`, req.body);
    
    const { userCode, name, email, organization, contact } = req.body;

    try {
        if (!name || !email || !contact) {
            console.warn(`[WARNING] Missing required fields - name: ${name}, email: ${email}, contact: ${contact}`);
            return res.status(400).json({ error: "Missing required fields: name, email, contact" });
        }

        const generatedId = userCode || `USR-${Date.now()}`;
        const nameParts = name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const newEntry = new Submission({
            userId: generatedId,
            firstName: firstName,
            lastName: lastName,
            fatherName: organization || 'N/A',
            gender: 'Not Specified',
            phone: contact,
            email: email.toLowerCase(),
            city: 'N/A'
        });

        await newEntry.save();
        console.log(`✅ [SUCCESS] New user registered: ${email} (ID: ${generatedId})`);

        // CHECK COUNT: Trigger draw automatically at every 10 registrations
        const currentCount = await Submission.countDocuments();
        console.log(`📊 Registration Progress: ${currentCount}/10`);

        if (currentCount > 0 && currentCount % 10 === 0) {
            console.log("🎯 TRIGGERING LUCKY DRAW...");
            runLuckyDraw().catch(err => console.error("Internal Draw Error:", err));
        }

        res.status(201).json({ 
            success: true, 
            message: "Registration successful!", 
            id: generatedId,
            userCode: generatedId 
        });

    } catch (error) {
        if (error.code === 11000) {
            console.error(`[ERROR] Duplicate entry - ${error.message}`);
            return res.status(409).json({ error: "The email or phone is already registered." });
        }
        console.error(`[ERROR] Registration Error:`, error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Generate QR Code
app.get('/api/generate-qr', async (req, res) => {
    console.log(`🔲 Generating QR Code...`);
    const formUrl = 'https://forms.gle/PaeR46GeuVPYCTPm6';
    try {
        const qrImage = await QRCode.toDataURL(formUrl, {
            color: { dark: '#1e40af', light: '#00000000' },
            margin: 2,
            width: 300
        });
        console.log(`✅ QR Code generated successfully`);
        res.json({ qrCode: qrImage });
    } catch (err) {
        console.error(`[ERROR] QR Generation failed:`, err);
        res.status(500).json({ error: "Failed to generate QR" });
    }
});

// Fetch All Submissions (For your Dashboard)
app.get('/api/submissions', async (req, res) => {
    console.log(`📋 Fetching all submissions...`);
    try {
        const data = await Submission.find().sort({ submittedAt: -1 });
        console.log(`✅ Retrieved ${data.length} submissions`);
        res.status(200).json(data);
    } catch (error) {
        console.error(`[ERROR] Failed to fetch submissions:`, error);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// Pick a Random Winner
app.get('/api/pick-winner', async (req, res) => {
    console.log(`🎰 Pick Winner endpoint called...`);
    try {
        const users = await Submission.find({ isWinner: false });
        console.log(`📊 Found ${users.length} users eligible for winning`);

        if (users.length === 0) {
            console.warn(`[WARNING] No eligible users found for winning`);
            return res.status(404).json({ error: "No users available" });
        }

        const winner = users[Math.floor(Math.random() * users.length)];
        console.log(`🎉 Winner selected: ${winner.firstName} ${winner.lastName} (${winner.email})`);

        // Mark as winner
        winner.isWinner = true;
        await winner.save();
        console.log(`✅ Winner marked in database`);

        // Send Winner Email
        console.log(`📧 [EMAIL SENDING] Preparing email...`);
        console.log(`   To: ${winner.email}`);
        console.log(`   From: ${process.env.EMAIL_USER}`);
        
        const mailOptions = {
            from: `"Lucky Draw Team" <${process.env.EMAIL_USER}>`,
            to: winner.email,
            subject: "🎉 Congratulations! You've been selected as a winner!",
            html: `
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
            `
        };

        try {
            console.log(`📧 [EMAIL SENDING] Attempting to send email...`);
            const result = await transporter.sendMail(mailOptions);
            console.log(`✅ 📧 Winner Email Sent Successfully to: ${winner.email}`);
            console.log(`   Message ID: ${result.messageId}`);
        } catch (emailError) {
            console.error(`❌ [EMAIL ERROR] Failed to send email to ${winner.email}`);
            console.error(`   Error Message: ${emailError.message}`);
            console.error(`   Error Code: ${emailError.code}`);
            console.error(`   From: ${process.env.EMAIL_USER}`);
            console.error(`   To: ${winner.email}`);
        }

        // Save to Winners collection
        const winnerRecord = new Winner({
            userId: winner.userId,
            firstName: winner.firstName,
            lastName: winner.lastName,
            email: winner.email,
            phone: winner.phone
        });
        await winnerRecord.save();
        console.log(`📂 Winner archived to Winners collection`);

        res.json({ 
            winner: {
                name: `${winner.firstName} ${winner.lastName}`,
                email: winner.email,
                phone: winner.phone,
                userCode: winner.userId
            }
        });

    } catch (error) {
        console.error(`[ERROR] Pick winner failed:`, error.message);
        res.status(500).json({ error: "Failed to pick winner" });
    }
});

// Test Email Endpoint (Optional - for debugging)
app.get('/api/test-email', async (req, res) => {
    console.log(`\n📧 [TEST EMAIL] Endpoint called...`);
    console.log(`   Sending from: ${process.env.EMAIL_USER}`);
    console.log(`   Sending to: ${process.env.EMAIL_USER}`);
    
    const testMail = {
        from: `"Lucky Draw Team" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Send to self for testing
        subject: "✅ Lucky Draw Email Test - System Working!",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; max-width: 600px; margin: 0 auto;">
                <div style="background: white; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #667eea; text-align: center;">✅ Email System Test</h1>
                    <p style="font-size: 16px; color: #555;">
                        If you're reading this, the email system is working correctly!
                    </p>
                    <p style="font-size: 14px; color: #888;">
                        Sent at: ${new Date().toLocaleString()}
                    </p>
                </div>
            </div>
        `
    };

    try {
        console.log(`📧 [TEST EMAIL] Attempting to send...`);
        const result = await transporter.sendMail(testMail);
        console.log(`✅ [TEST EMAIL] Email sent successfully!`);
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   To: ${process.env.EMAIL_USER}\n`);
        res.json({ 
            success: true, 
            message: "Test email sent successfully! Check your inbox.",
            sentTo: process.env.EMAIL_USER
        });
    } catch (error) {
        console.error(`❌ [TEST EMAIL ERROR] Failed to send test email`);
        console.error(`   Error Message: ${error.message}`);
        console.error(`   Error Code: ${error.code}`);
        console.error(`   Details:`, error);
        res.status(500).json({ 
            success: false,
            error: error.message,
            code: error.code,
            hint: "Check EMAIL_USER and EMAIL_PASS in .env file",
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER
        });
    }
});

// --- 6. Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Server active on port ${PORT}`);
    console.log(`📈 Draw trigger set to every 10 registrations`);
    console.log(`\n📍 Available Routes:`);
    console.log(`   POST   /api/register           - Register a new user`);
    console.log(`   POST   /api/save-form          - Save form data`);
    console.log(`   GET    /api/pick-winner       - Pick a random winner (sends email)`);
    console.log(`   GET    /api/submissions       - Fetch all submissions`);
    console.log(`   GET    /api/generate-qr       - Generate QR code`);
    console.log(`   GET    /api/test-email        - Test email configuration`);
    console.log(`${'='.repeat(60)}\n`);
});