const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Make sure to load the environment variables

// Controller to handle Facebook login
exports.facebookLogin = async (req, res) => {
  const { facebookToken } = req.body;

  try {
    // Step 1: Validate the Facebook token with Facebook's Graph API
    const facebookResponse = await axios.get(
      `https://graph.facebook.com/me?access_token=${facebookToken}&fields=id,name,email,picture`
    );

    const { id, name, email, picture } = facebookResponse.data;

    if (!id || !email) {
      return res.status(400).json({ message: 'Facebook authentication failed' });
    }

    // Step 2: Generate a JWT token with user data (you can adjust the payload as needed)
    const token = jwt.sign(
      { id, name, email }, // Payload
      process.env.JWT_SECRET, // Secret key from your environment variables
      { expiresIn: '1h' } // Token expiration time
    );

    // Step 3: Respond with the user data and the generated token
    res.status(200).json({
      facebookId: id,
      name,
      email,
      picture: picture.data.url,
      token // JWT token
    });
  } catch (error) {
    console.error('Facebook authentication error:', error);
    res.status(500).json({ message: 'Server error during Facebook authentication' });
  }
};
