import Property from "./property.model.js";

// @desc    Upload a new property (Landlord only)
// @route   POST /api/properties
// @access  Private (Landlord)
export const uploadProperty = async (req, res) => {
  try {
    if (req.user.landlordVerificationStatus !== "verified") {
      return res.status(403).json({ success: false, message: "You must be a verified landlord to upload properties." });
    }

    const { title, type, location, price, description, latitude, longitude, featured } = req.body;
    let images = req.body.images || [];

    // Map uploaded files to URL paths
    if (req.files && req.files.length > 0) {
      const uploadedImageUris = req.files.map(
        (file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
      );
      // Append to any existing passed URLs
      images = Array.isArray(images) ? [...images, ...uploadedImageUris] : [images, ...uploadedImageUris];
    } else if (!Array.isArray(images) && typeof images === "string") {
      images = [images];
    }

    const property = await Property.create({
      title,
      type,
      location,
      price,
      description,
      images,
      latitude,
      longitude,
      featured: featured || false,
      landlordId: req.user._id,
      status: "pending", // Default to pending for admin approval
    });

    res.status(201).json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active/approved properties (Public or Seeker)
// @route   GET /api/properties
// @access  Public
export const getAvailableProperties = async (req, res) => {
  try {
    const properties = await Property.find({ status: "approved" }).populate("landlordId", "fullName email landlordVerificationStatus");
    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get properties for logged-in landlord
// @route   GET /api/properties/landlord
// @access  Private (Landlord)
export const getLandlordProperties = async (req, res) => {
  try {
    const properties = await Property.find({ landlordId: req.user._id });
    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate("landlordId", "fullName email landlordVerificationStatus");
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    res.status(200).json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update property (Landlord can update their own)
// @route   PUT /api/properties/:id
// @access  Private (Landlord)
export const updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    // Check ownership
    if (property.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this property" });
    }

    // A landlord update resets status to pending for re-approval, unless it's just marking as unavailable
    const upcomingStatus = req.body.status || "pending";
    let images = req.body.images || property.images || [];

    // Map uploaded files to URL paths
    if (req.files && req.files.length > 0) {
      const uploadedImageUris = req.files.map(
        (file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
      );
      images = Array.isArray(images) ? [...images, ...uploadedImageUris] : [images, ...uploadedImageUris];
    } else if (typeof images === "string") {
      images = [images];
    }

    const updateData = { ...req.body, status: upcomingStatus, images };
    
    // Don't allow landlords to approve their own property
    if (updateData.status === "approved") {
      updateData.status = "pending";
    }

    property = await Property.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
