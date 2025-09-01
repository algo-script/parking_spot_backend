const moment = require("moment");
const ParkingSpot = require("../../model/parkingSpot");
const User = require("../../model/user");
const Booking = require("../../model/booking");
const Vehicle = require("../../model/vehicle")
const QRCode = require("qrcode");

exports.confirmBooking = async (req, res) => {
  try {
    const {
      parkingSpotId,
      vehicleId,
      date,
      startTime,
      endTime,
      duration,
      totalAmount,
    } = req.body;

    // Validate required fields
    if (!parkingSpotId || !vehicleId || !date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Fetch parking spot to get hourly rate and validate availability
    const parkingSpot = await ParkingSpot.findById(parkingSpotId);
    if (!parkingSpot) {
      return res
        .status(404)
        .json({ success: false, message: "Parking spot not found" });
    }
    const dayId = moment(date).format("dddd").toLowerCase();
    if (!parkingSpot.availableDays[dayId]) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Spot not available on selected day",
        });
    }

    // ✅ Check time conflict with existing bookings
    const conflictingBooking = await Booking.findOne({
      parkingSpot: parkingSpotId,
      date: new Date(date),
      status: { $in: ["pending", "confirmed"] },
      $or: [
        // Case 1: Existing booking starts inside requested range
        { startTime: { $lt: endTime, $gte: startTime } },
        // Case 2: Existing booking ends inside requested range
        { endTime: { $gt: startTime, $lte: endTime } },
        // Case 3: Existing booking fully covers requested range
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
      ],
    });

    if (conflictingBooking) { 
      return res.status(400).json({
        success: false,
        message:
          "The parking spot is already booked for the selected time range",
      });
    }

      // ✅ Fetch vehicle details (to include in response later)
      const vehicle = await Vehicle.findById(vehicleId).select("brand model");
      if (!vehicle) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      parkingSpot: parkingSpotId,
      vehicle: vehicleId,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      totalAmount,
      status: "pending",
    });

    await booking.save();

    // Generate QR Code with bookingId or any info
    const qrData = {
      bookingId: booking.bookingId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      parkingSpotId: booking.parkingSpot,
      userId: booking.user,
    };

    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    // Optional: Save QR code to booking document
    booking.qrCode = qrCodeUrl;
    await booking.save();

    res.status(201).json({
        success: true,
        message: "Booking confirmed sucessfully",
        booking: {
          bookingId: booking.bookingId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          date:booking.date,
          vehicle: {
            brand: vehicle.brand,
            model: vehicle.model,
          },
          qrCodeUrl,
        },
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getuserBooking = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("parkingSpot", "address location images hourlyRate")
      .populate("user", "name")
      .populate("vehicle", "brand model vehicleNumber")
      .sort({ createdAt: -1 });

    // Format the response to match renderRenterView expectations
    const formattedBookings = bookings.map((booking) => ({
      ...booking._doc,
      address: booking.parkingSpot?.address,
      ownerName: booking.user?.name,
      location: booking.parkingSpot?.location,
      image: booking.parkingSpot?.images, // Use first image
      status: booking.status, // Map "confirmed" to "upcoming"
    }));

    res.json({ success: true, data: formattedBookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Booking already cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ success: true, message: "Booking cancelled sucessfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAvailableTimes = async (req, res) => {
  try {
    const { parkingSpotId, date } = req.body;

    const spot = await ParkingSpot.findById(parkingSpotId);
    if (!spot)
      return res.status(404).json({ message: "Parking spot not found" });

    const reqDate = moment(date, "YYYY-MM-DD");
    const weekday = reqDate.format("dddd").toLowerCase();
    

    // Check if this day is allowed
    if (!spot.availableDays[weekday]) {
      return res.json({
        sucess: false,
        slots: [],
        message: "Not available on this day",
      });
    }

    // Full availability of spot
    let opening = moment(spot.timeAvailability.start, "HH:mm");
    let closing = moment(spot.timeAvailability.end, "HH:mm");

     // ⏰ If it's today, shift opening to "now" (but within closing hours)    
     if (reqDate.isSame(moment(), "day")) {
      const now = moment();
      if (now.isAfter(opening) && now.isBefore(closing)) {
        opening = now.clone().seconds(0).milliseconds(0); // round off seconds/ms
      }
    }

    // Fetch all bookings for this spot & date
    const bookings = await Booking.find({
      parkingSpot: parkingSpotId,
      date: date,
      status: { $in: ["pending", "confirmed"] },
    }).sort({ startTime: 1 });
    

    // Convert to moment ranges
    let bookedRanges = bookings.map((b) => ({
      start: moment(b.startTime, "HH:mm"),
      end: moment(b.endTime, "HH:mm"),
    }));
    
    // Calculate free slots
    let freeSlots = [];
    let lastEnd = opening;

    for (let booking of bookedRanges) {
      if (lastEnd.isBefore(booking.start)) {
        freeSlots.push({
          start: lastEnd.format("HH:mm"),
          end: booking.start.format("HH:mm"),
        });
      }
      lastEnd = moment.max(lastEnd, booking.end);
    }
    
    if (lastEnd.isBefore(closing)) {
      freeSlots.push({
        start: lastEnd.format("HH:mm"),
        end: closing.format("HH:mm"),
      });
    }
  
    return res.json({
      success: freeSlots.length > 0,
      slots: freeSlots,
      message: "fetch free slot details successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
