import Report from "./report.model.js";

// @desc    Submit a report (House Seeker)
// @route   POST /api/reports
// @access  Private (House Seeker)
export const submitReport = async (req, res) => {
  try {
    const { propertyId, landlordId, issueType, description } = req.body;

    const report = await Report.create({
      reporterId: req.user._id,
      propertyId,
      landlordId,
      issueType,
      description,
    });

    res.status(201).json({ success: true, data: report, message: "Report submitted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reports (Admin)
// @route   GET /api/reports
// @access  Private (Admin)
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().populate("reporterId", "fullName email").populate("propertyId", "title").populate("landlordId", "fullName email");
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update report status (Admin)
// @route   PUT /api/reports/:id/status
// @access  Private (Admin)
export const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    report.status = status;
    await report.save();
    
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
