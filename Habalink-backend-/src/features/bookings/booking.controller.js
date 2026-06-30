import Booking from "./booking.model.js";
import Property from "../properties/property.model.js";

// @desc    Book an appointment (House Seeker)
// @route   POST /api/bookings
// @access  Private (House Seeker)
export const createBooking = async (req, res) => {
  try {
    const { propertyId, appointmentDate, appointmentTime } = req.body;

    const property = await Property.findById(propertyId);
    if (!property || property.status !== "approved") {
      return res.status(404).json({ success: false, message: "Property not available for booking" });
    }

    const booking = await Booking.create({
      seekerId: req.user._id,
      landlordId: property.landlordId,
      propertyId,
      appointmentDate,
      appointmentTime,
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get seeker bookings
// @route   GET /api/bookings/my-bookings
// @access  Private (House Seeker)
export const getSeekerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ seekerId: req.user._id }).populate("propertyId", "title location price");
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get landlord bookings (appointments)
// @route   GET /api/bookings/appointments
// @access  Private (Landlord)
export const getLandlordAppointments = async (req, res) => {
  try {
    const bookings = await Booking.find({ landlordId: req.user._id }).populate("propertyId", "title location price").populate("seekerId", "fullName email");
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status (accept/reject appointment)
// @route   PUT /api/bookings/:id/status
// @access  Private (Landlord)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    booking.bookingStatus = status;
    await booking.save();
    
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
