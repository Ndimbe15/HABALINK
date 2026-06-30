import Payment from "./payment.model.js";
import Property from "../properties/property.model.js";
import Booking from "../bookings/booking.model.js";

const { FAPSHI_API_USER, FAPSHI_API_KEY, FAPSHI_BASE_URL } = process.env;

// @desc    Initiate a real Fapshi payment
// @route   POST /api/payments/initiate
// @access  Private
export const initiatePayment = async (req, res) => {
  try {
    const { amount, paymentType, propertyId, bookingId } = req.body;
    
    // Create pending payment in our DB
    const transactionReference = "HBL_" + Math.random().toString(36).substring(2, 12).toUpperCase();

    const payment = await Payment.create({
      userId: req.user._id,
      propertyId,
      bookingId,
      amount,
      paymentType,
      status: "pending",
      transactionReference
    });

    // Hit Fapshi initiate-pay API
    const response = await fetch(`${FAPSHI_BASE_URL}/initiate-pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apiuser": FAPSHI_API_USER,
        "apikey": FAPSHI_API_KEY
      },
      body: JSON.stringify({
        amount: Math.round(amount), // Fapshi requires integer
        email: req.user.email,
        userId: req.user._id.toString(),
        externalId: payment._id.toString(), 
        message: paymentType.replace("_", " ").toUpperCase(),
        redirectUrl: `${req.headers.origin}/payments/callback`
      })
    });

    const data = await response.json();

    if (!response.ok || !data.link) {
      console.error("Fapshi Initiate Error:", data);
      return res.status(400).json({ success: false, message: data.message || "Failed to contact Fapshi API" });
    }

    // Save the Fapshi native transId to our payment ref to track easily
    payment.transactionReference = data.transId;
    await payment.save();

    res.status(200).json({ 
      success: true, 
      link: data.link,
      transId: data.transId,
      message: "Redirecting to secure Fapshi gateway..." 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify a Fapshi payment and update system state
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { transId } = req.body;

    if (!transId) {
      return res.status(400).json({ success: false, message: "Transaction ID is required" });
    }

    // Hit Fapshi payment-status API
    const response = await fetch(`${FAPSHI_BASE_URL}/payment-status/${transId}`, {
      method: "GET",
      headers: {
        "apiuser": FAPSHI_API_USER,
        "apikey": FAPSHI_API_KEY
      }
    });

    const fapshiData = await response.json();

    if (!response.ok) {
      return res.status(400).json({ success: false, message: fapshiData.message || "Failed to verify transaction" });
    }

    const { status, externalId } = fapshiData;

    // Find our payment using the externalId we gave Fapshi (our MongoDB Payment _id)
    const payment = await Payment.findById(externalId);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found locally" });
    }

    if (payment.status === "successful") {
      return res.status(200).json({ success: true, message: "Payment already verified successfully." });
    }

    // If successful natively, apply business logic
    if (status === "SUCCESSFUL") {
      payment.status = "successful";
      await payment.save();

      const { paymentType, propertyId, bookingId } = payment;

      if (paymentType === "listing_fee" && propertyId) {
        await Property.findByIdAndUpdate(propertyId, { paymentStatus: "paid_listing" });
      } else if (paymentType === "featured_listing_fee" && propertyId) {
        await Property.findByIdAndUpdate(propertyId, { paymentStatus: "paid_featured", featured: true });
      } else if (paymentType === "booking_fee" && bookingId) {
        await Booking.findByIdAndUpdate(bookingId, { paymentStatus: "successful" });
      } else if (paymentType === "commission_fee" && bookingId) {
        await Booking.findByIdAndUpdate(bookingId, { commissionStatus: "paid" });
      }

      return res.status(200).json({ success: true, message: "Payment successful and finalized." });
    } else {
      // FAILED or EXPIRED
      payment.status = "failed";
      await payment.save();
      return res.status(400).json({ success: false, message: `Payment ${status.toLowerCase()}` });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's payments
// @route   GET /api/payments/my-payments
// @access  Private
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate("propertyId", "title")
      .populate("bookingId")
      .sort({ createdAt: -1 });
      
    const totalPayments = payments
      .filter(p => p.status === "successful")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
      
    res.status(200).json({ success: true, data: payments, totalPayments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all payments
// @route   GET /api/payments/all-payments
// @access  Private (Admin)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("userId", "fullName email")
      .populate("propertyId", "title")
      .populate("bookingId")
      .sort({ createdAt: -1 });
      
    const totalPayments = payments
      .filter(p => p.status === "successful")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
      
    res.status(200).json({ success: true, data: payments, totalPayments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
