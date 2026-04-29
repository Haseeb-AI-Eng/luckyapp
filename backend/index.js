const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


// Replace with your MongoDB Atlas string or local MongoDB URI
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/form_registrations";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// Schema for our Registration
const participantSchema = new mongoose.Schema({
    userCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true, // Automatically converts z5g to Z5G
        validate: {
            validator: function (v) {
                // Regex: 3 letters/numbers, a hyphen, then exactly 5 digits
                return /^[A-Z0-9]{3}-[0-9]{5}$/i.test(v);
            },
            message: props => `${props.value} is not a valid User Code! Format must be XXX-00000`
        }
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    organization: String,
    contact: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Participant = mongoose.model('Participant', participantSchema);

// API Route to register
app.post('/api/register', async (req, res) => {
    try {
        const newParticipant = new Participant(req.body);
        await newParticipant.save();
        res.status(201).json({ success: true, message: "Registered for Lucky Draw!" });
    } catch (error) {
        // Handle duplicate User Code error
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "User Code already registered!" });
        }
        res.status(500).json({ success: false, message: "Server Error" });
    }
});



const nodemailer = require('nodemailer');

// Configure Email Transporter (Use Gmail or Mailtrap for testing)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use an "App Password," not your real password
    }
});

// API to pick a winner
app.get('/api/pick-winner', async (req, res) => {
    try {
        const count = await Participant.countDocuments();
        if (count === 0) return res.status(404).json({ message: "No participants yet!" });

        // Pick one random user
        const random = Math.floor(Math.random() * count);
        const winner = await Participant.findOne().skip(random);

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: winner.email,
            subject: "🎉 Congratulations! You won the Lucky Draw!",
            text: `Hi ${winner.name}, your code ${winner.userCode} has been selected!`
        };

        await transporter.sendMail(mailOptions);

        console.log(`✅ Email successfully sent to winner: ${winner.name} (${winner.email})`);

        res.json({ success: true, winner });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));