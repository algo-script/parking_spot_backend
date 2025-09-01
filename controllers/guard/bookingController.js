const moment = require("moment");
const ParkingSpot = require("../../model/parkingSpot");
const User = require("../../model/user");
const Booking = require("../../model/booking");
const Vehicle = require("../../model/vehicle");
const QRCode = require("qrcode");
const { response } = require("express");

exports.competeBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const bookingdata = await Booking.findById(bookingId);
    if (!bookingdata) {
      return res
        .status(404)
        .json({ success: false, message: "bookingdata not found" });
    }
    if (!bookingdata.status === "confirmed") {
      return res
        .status(400)
        .json({ success: false, message: "not allow to complete" });
    }
    bookingdata.status = "completed";
    await bookingdata.save();
    res.json({
      success: true,
      message: "bookig completed sucessfully",
    });
  } catch (error) {
    console.error("Error competeBooking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to competeBooking",
      error: error.message,
    });
  }
};

exports.verifyBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const bookingdata = await Booking.findOne({ bookingId })
      .populate("user")
      .populate("vehicle");
    if (!bookingdata) {
      return res.status(404).json({
        success: false,
        message: "Invalid verification data",
      });
    }

    res.json({
      success: true,
      message: "QR verified successfully",
      data: bookingdata,
    });
  } catch (error) {
    console.error("Error verifyBooking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verifyBooking",
      error: error.message,
    });
  }
};

exports.confirmEntry = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const bookingdata = await Booking.findById(bookingId);
    if (!bookingdata) {
      return res
        .status(404)
        .json({ success: false, message: "bookingdata not found" });
    }
    if (!bookingdata.status === "pending") {
      return res
        .status(400)
        .json({ success: false, message: "not allow to confirm" });
    }
    bookingdata.status = "confirmed";
    await bookingdata.save();
    res.json({
      success: true,
      message: "bookig confirmed sucessfully",
    });
  } catch (error) {
    console.error("Error competeBooking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to competeBooking",
      error: error.message,
    });
  }
};

exports.recentAndUpcomingBooking = async (req, res) => {
  try {
    const { activeTab } = req.query;

    const now = moment();
    const sevenDaysAgo = moment().subtract(10, "days");

    let query = { parkingSpot: req.user.spotId };

    if (activeTab === "upcoming") {
      // Start time after now → upcoming
      query.date = { $gte: now.startOf("day").toDate() }; 
    } else if (activeTab === "recent") {
      // End time before now but after 7 days ago → recent
      query.date = {
        $gte: sevenDaysAgo.startOf("day").toDate(),
        $lte: now.endOf("day").toDate(),
      };
    }

    const bookings = await Booking.find(query)
      .populate("user", "name email mobile")
      .populate("vehicle", "vehicleNumber model")
      .sort({ date: activeTab === "upcoming" ? 1 : -1 }); // upcoming → ascending, recent → descending

    res.json({
      success: true,
      message: "Booking data fetched successfully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error recentAndUpcomingBooking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to recentAndUpcomingBooking",
      error: error.message,
    });
  }
};
