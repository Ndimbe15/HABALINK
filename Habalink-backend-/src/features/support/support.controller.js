import SupportMessage from "./support.model.js";

// @desc    Create a support message
// @route   POST /api/support
// @access  Public
export const createSupportMessage = async (req, res) => {
  try {
    const { name, email, phone, bookingReference, message } = req.body;

    const supportMessage = await SupportMessage.create({
      name,
      email,
      phone,
      bookingReference,
      message,
    });

    res.status(201).json({ success: true, data: supportMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all support messages
// @route   GET /api/support
// @access  Private/Admin
export const getSupportMessages = async (req, res) => {
  try {
    const messages = await SupportMessage.find({}).sort("-createdAt");
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a support message as read
// @route   PUT /api/support/:id/read
// @access  Private/Admin
export const markAsRead = async (req, res) => {
  try {
    const message = await SupportMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    
    // Toggle read state
    message.isRead = !message.isRead;
    await message.save();

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a support message
// @route   DELETE /api/support/:id
// @access  Private/Admin
export const deleteSupportMessage = async (req, res) => {
  try {
    const message = await SupportMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    await message.deleteOne();
    res.status(200).json({ success: true, message: "Message removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
