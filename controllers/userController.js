const User = require('../model/user');
const generateToken = require('../utils/helperFunctions');


exports.registerUser = async (req, res) => {
    try {
      const { name, mobile, email, password, role } = req.body;
  
      const userExists = await User.findOne({ $or: [{ email }, { mobile }] });
      if (userExists) {
        return res.status(400).json({ message: 'User with email or mobile already exists' });
      }

      const user = new User({
        name,
        mobile,
        email,
        password,
        role,
      });

      await user.save();
  
      res.status(201).json({
        role: user.role,
        token: generateToken(user._id),
      });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed', error: error.message });
    }
  };
  
  exports.loginUser = async (req, res) => {
    try {
      const { emailOrMobile, password } = req.body;
  
      // Find user by email or mobile
      const user = await User.findOne({
        $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }],
      });
  
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      res.json({
        role: user.role,
        token: generateToken(user._id),
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  };