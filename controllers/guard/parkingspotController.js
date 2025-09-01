const moment = require("moment");
const ParkingSpot = require("../../model/parkingSpot");
const User = require("../../model/user");
const Booking = require("../../model/booking");

exports.getspotWithCurrentBooking = async (req, res) => {
  try {
    const spotData = await ParkingSpot.findById(req.user.spotId);
    if (!spotData) {
      return res.status(404).json({ 
        success: false,
        message: "No spotData found" ,
        data:{}
      });
    }

    const currentDate = moment().format("YYYY-MM-DD");
    const currentTime = moment().format("HH:mm");
    // Find only active bookings for the user
    const booking = await Booking.findOne({
      parkingSpot: spotData._id,
      date: new Date(currentDate),
      startTime: { $lte: currentTime },
      endTime: { $gt: currentTime },
      status: { $in: ["pending", "confirmed"] },
    })
      .populate("vehicle")
      .populate("user");
     

    return res.json({
      success: true,
      message: "dashboard fetch successfully",
      spotdata:spotData,
      bookingdata: booking,
    });
    
  } catch (error) {
    console.error("Error getspotWithCurrentBooking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to getspot With Current Booking",
      error: error.message,
    });
  }
};
