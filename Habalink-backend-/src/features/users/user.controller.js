import User from "./user.model.js";

// @desc    Upload documents for landlord verification
// @route   POST /api/users/verify-landlord
// @access  Private (Landlord)
export const submitLandlordVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "landlord") {
      return res.status(403).json({ success: false, message: "Only landlords can verify" });
    }
    
    if (user.landlordVerificationStatus === "verified" || user.landlordVerificationStatus === "pending") {
      return res.status(400).json({ success: false, message: "Already verified or pending verification." });
    }

    if (!req.files || !req.files['idDocument'] || !req.files['ownershipDocument']) {
        return res.status(400).json({ success: false, message: "Both Identity Document and Ownership Document are required." });
    }

    // Save the file paths to the user document
    const idPath = req.files['idDocument'][0].path.replace(/\\/g, "/"); 
    const ownershipPath = req.files['ownershipDocument'][0].path.replace(/\\/g, "/"); 

    user.idDocumentUrl = `/${idPath}`;
    user.ownershipDocumentUrl = `/${ownershipPath}`;
    user.landlordVerificationStatus = "pending";

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "Verification submitted successfully. Please wait for admin approval.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        landlordVerificationStatus: user.landlordVerificationStatus
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
