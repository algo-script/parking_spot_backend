const User = require("../../model/user");
const ParkingSpot = require("../../model/parkingSpot");
const generateToken = require("../../utils/helperFunctions");


exports.registerUser = async (req, res) => {
  try {
    const { name, mobile, email, password, role } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with email or mobile already exists" });
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
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
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
      return res.status(401).json({  success: false,message: "Invalid credentials" });
    }

    res.json({
      success: true,
      message: `${user.role} login sucessfully`,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.changePassword = async(req,res)=>{
  try {
    const userId = req.user._id; // make sure to set user ID from auth middleware
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // const salt = await bcrypt.genSalt(10);
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
    
  } catch (error) {
    res.status(500).json({ success:false,message: "Internal server Error", error: error.message });
  }
}

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email, mobile, responseTime } = req.body;
    if (!name || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and mobile are required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check for email uniqueness (excluding current user)
    const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    // Check for mobile uniqueness (excluding current user)
    const existingMobile = await User.findOne({
      mobile,
      _id: { $ne: user._id },
    });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already in use",
      });
    }

    user.name = name;
    user.email = email;
    user.mobile = mobile;
    user.responseTime = responseTime;
    if (req.files.length > 0) {
      user.profileImage = req.files[0].filename;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


exports.addGuardDetails = async(req,res)=>{
  try {
    const { name, mobile, email, password, spotId } = req.body;

    // Basic validation
    if (!name || !mobile || !email || !password ||!spotId) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    // Check for unique email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Check for unique mobile
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({ success: false, message: "Mobile number already exists" });
    }

    // Create new Guard
    const guard = new User({
      name,
      mobile,
      email,
      password,
      role: "Guard",
      spotId: spotId ,
      addedBy: req.user._id 
    });

    await guard.save();

    return res.status(201).json({
      success: true,
      message: "Guard added successfully",
    });
  } catch (error) {
    console.error("Error addGuardDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

exports.updateGuardDetails = async (req, res) => {
  try {
    const { guardId,name, mobile, email, password, spotId } = req.body;

    // Find guard by ID
    const guard = await User.findOne({ _id: guardId, role: "Guard" });
    if (!guard) {
      return res.status(404).json({ success: false, message: "Guard not found" });
    }

    // Check for unique email (if updated)
    if (email && email !== guard.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
      guard.email = email;
    }

    // Check for unique mobile (if updated)
    if (mobile && mobile !== guard.mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return res.status(400).json({ success: false, message: "Mobile number already exists" });
      }
      guard.mobile = mobile;
    }

    // Update other fields
    if (name) guard.name = name;
    if (password) {
      guard.password = password; 
    }

    await guard.save();

    return res.status(200).json({
      success: true,
      message: "Guard details updated successfully",
    });
  } catch (error) {
    console.error("Error updateGuardDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

