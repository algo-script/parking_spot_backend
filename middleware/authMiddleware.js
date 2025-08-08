const jwt = require('jsonwebtoken');
const User = require('../model/user');

// Middleware to verify JWT and attach user to request
const authenticateToken = async (req, res, next) => {
  let token;

  // Check for Authorization header with Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user from DB (optional: exclude password field)
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ message: 'User not found' });

      req.user = user; // Attach user to request
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
};

const optionalAuth = async(req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      req.user = user; // attach user info to request
    } catch (err) {
      console.log("Invalid token, skipping user attachment.");
    }
  }

  // Move to next middleware regardless of token validity
  next();
};

// Middleware to allow only specific roles (e.g. Admin)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied: ${req.user.role} role not authorized` });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles,optionalAuth };
