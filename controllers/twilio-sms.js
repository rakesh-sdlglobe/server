const { TWILIO_SERVICE_SID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, {
    lazyLoading: true
});

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.SECRET;
/**
 * Send OTP
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const sendOTP = async (req, res, next) => {
    const { countryCode, phoneNumber } = req.body; // Destructuring
    console.log(req.body);
    

    try {
        const otpResponse = await client.verify.services(TWILIO_SERVICE_SID)
            .verifications.create({
                to: `+${countryCode}${phoneNumber}`, // String interpolation
                channel: "sms"
            });

        res.status(200).send(`OTP sent successfully: ${JSON.stringify(otpResponse)}`); // Success message
    } catch (error) {
        res.status(error?.status || 400).send(error?.message || 'Something went wrong!');
    }
};

/**
 * Verify OTP
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const verifyOTP = async (req, res, next) => {
    const { countryCode, phoneNumber, otp } = req.body; // Fixed destructuring
    console.log(req.body);

    try {
        const verifiedResponse = await client.verify.services(TWILIO_SERVICE_SID)
            .verificationChecks.create({
                to: `+${countryCode}${phoneNumber}`, // String interpolation
                code: otp,
            });

        // Check if OTP verification was successful
        if (verifiedResponse.status === 'approved') {
            // Create a JWT token
            const token = jwt.sign({ phoneNumber }, JWT_SECRET, { expiresIn: '1h' }); // Customize the expiration as needed
            
            console.log(token);
            
            // Send back the phone number and token
            return res.status(200).json({
                message: 'OTP verified successfully',
                user: { phoneNumber },
                authToken: token,
            });
        } else {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
    } catch (error) {
        res.status(error?.status || 400).send(error?.message || 'Something went wrong!');
    }
};

module.exports ={sendOTP, verifyOTP};