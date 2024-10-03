require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const axios = require ('axios');
// Signup Controller
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = jwt.sign({ id: newUser.id }, process.env.SECRET, {
      expiresIn: "1h",
    });

    // Return token and user info
    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      expiresIn: 3600,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login Controller
exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id },process.env.SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email }, expiresIn: 3600 });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

const USER_INFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

exports.googleAuth = async (req, res) => {
  const { token } = req.body;
  try {
      const response = await axios.get(USER_INFO_URL, {
          headers: {
              Authorization: `Bearer ${token}`,
          },
      });

      const userInfo = response.data;
      const jwtToken = jwt.sign({ user: userInfo }, process.env.SECRET, { expiresIn: '1h' });

      res.status(200).json({ token: jwtToken, user: userInfo, expiresIn: 3600 });
  } catch (error) {
      console.error('Failed to fetch user info:', error.response?.data || error.message);
      res.status(error.response?.status || 401).json({
          message: 'Failed to fetch user info',
          details: error.response?.data,
          error: error.message,
      });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const  userId  = req.user;
    
    const { password } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    await user.destroy();

    res.status(200).json({ message: "Account successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
