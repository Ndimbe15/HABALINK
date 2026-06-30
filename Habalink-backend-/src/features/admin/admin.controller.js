import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../users/user.model.js";
import Property from "../properties/property.model.js";
import Payment from "../payments/payment.model.js";


export const adminLogin = async (req, res) => {
  try {
    console.log("🔐 Admin login request received");
    console.log("📥 Request body:", req.body);

    const { email, password } = req.body;

    // Check input
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("🔍 Searching for user with email:", email);

    const user = await User.findOne({ email });

    console.log("👤 User found:", user);

    if (!user) {
      console.log("❌ No user found with this email");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("🔑 Comparing passwords...");
    console.log("➡️ Entered password:", password);
    console.log("➡️ Hashed password from DB:", user.password);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("✅ Password match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password does not match");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("🔐 Checking user role:", user.role);

    if (user.role !== "admin") {
      console.log("⛔ User is not an admin");
      return res
        .status(403)
        .json({ message: "You are not authorized as admin" });
    }

    console.log("🎟️ Generating JWT token...");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    console.log("✅ Token generated:", token);

    // Remove password before sending response
    const { password: pwd, ...safeUser } = user._doc;

    console.log("📤 Sending response to client");

    res.json({ user: safeUser, token });
  } catch (error) {
    console.error("🔥 Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Suspend or unsuspend user
// @route   PUT /api/admin/users/:id/suspend
export const toggleSuspendUser = async (req, res) => {
  try {
    const { suspended } = req.body;
    // We would ideally add a `suspended` boolean field to User model, but let's assume we can block them by setting role to something else, or creating a `suspended` field dynamically for now if mongoose allows (if StrictMode is off). Or better, we can modify the User model later if needed. For now we assume a suspended field exists.
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.set("suspended", suspended, { strict: false });
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending properties
// @route   GET /api/admin/properties/pending
export const getPendingProperties = async (req, res) => {
  try {
    const properties = await Property.find({ status: "pending" }).populate("landlordId", "fullName email");
    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update property approval status
// @route   PUT /api/admin/properties/:id/status
export const updatePropertyAdminStatus = async (req, res) => {
  try {
    const { status } = req.body; // approved, rejected
    const property = await Property.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });
    res.status(200).json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalHouses = await Property.countDocuments();
    const pendingApprovals = await Property.countDocuments({ status: "pending" });
    const totalUsers = await User.countDocuments();
    
    // For reported listings, bookings, and payments, we will use placeholders 
    // until those respective models are thoroughly integrated in the backend.
    const reportedListings = 0; 
    const totalBookings = 0;
    const successfulPayments = await Payment.find({ status: "successful" });
    const paymentsReceived = successfulPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    res.status(200).json({
      success: true, 
      data: {
        totalHouses,
        pendingApprovals,
        totalUsers,
        reportedListings,
        totalBookings,
        paymentsReceived
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending landlord verifications
// @route   GET /api/admin/landlords/pending
export const getPendingLandlords = async (req, res) => {
  try {
    const landlords = await User.find({ role: "landlord", landlordVerificationStatus: "pending" }).select("-password");
    res.status(200).json({ success: true, data: landlords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify or reject a pending landlord
// @route   PUT /api/admin/landlords/:id/verify
export const verifyLandlord = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body; // "verified" or "rejected"
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "landlord") {
      return res.status(404).json({ success: false, message: "Landlord not found" });
    }

    user.landlordVerificationStatus = status;
    if (status === "rejected" && rejectionReason) {
      user.rejectionReason = rejectionReason;
    }
    
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Promote user to admin
// @route   PUT /api/admin/users/:id/promote
export const promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    user.role = "admin";
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
