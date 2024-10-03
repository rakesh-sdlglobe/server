const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.SECRET;
const OTP_EXPIRY = 300; // OTP expiry time in seconds (5 minutes)

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// In-memory store for OTPs (use a database in production)
const otpStore = {};

/**
 * Generate a random OTP
 * @returns {string} OTP
 */
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
};

/**
 * Send verification email with OTP
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const sendVerificationEmail = async (req, res, next) => {
    const { email } = req.body;

    try {
        const otp = generateOTP();
        otpStore[email] = { otp, expires: Date.now() + OTP_EXPIRY * 1000 }; // Store OTP with expiry time

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP for email verification is: ${otp}. It is valid for 5 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send('Verification email sent successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong while sending the verification email.');
    }
};

/**
 * Verify OTP sent to the user's email and generate JWT token
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const verifyEmailOTP = async (req, res, next) => {
    const { email, otp } = req.body;

    try {
        const storedOTP = otpStore[email];

        // Check if the OTP exists and is not expired
        if (!storedOTP || Date.now() > storedOTP.expires) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Check if the provided OTP matches the stored OTP
        if (storedOTP.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Generate JWT token
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

        // Optionally, delete the OTP after successful verification
        delete otpStore[email];

        // Send back the token
        res.status(200).json({ message: 'Email verified successfully', token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong during verification' });
    }
};

module.exports = { sendVerificationEmail, verifyEmailOTP };
