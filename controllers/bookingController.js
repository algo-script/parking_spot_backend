const moment = require("moment");
const ParkingSpot = require("../model/parkingSpot");
const User = require("../model/user");
const Booking = require("../model/booking")
const QRCode = require("qrcode");

exports.confirmBooking = async (req, res) => {
    try {
      const { parkingSpotId, vehicleId, date, startTime, endTime,duration ,totalAmount} = req.body;
  
      // Validate required fields
      if (!parkingSpotId || !vehicleId || !date || !startTime || !endTime) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
  
      // Fetch parking spot to get hourly rate and validate availability
      const parkingSpot = await ParkingSpot.findById(parkingSpotId);
      if (!parkingSpot) {
        return res.status(404).json({ success: false, message: 'Parking spot not found' });
      }  
      const dayId = moment(date).format("dddd").toLowerCase();
      if (!parkingSpot.availableDays[dayId]) {
      return res
        .status(400)
        .json({ success: false, message: "Spot not available on selected day" });
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
        status: 'confirmed', 
      });
  
      await booking.save();

      // Generate QR Code with bookingId or any info
    const qrData = {
        bookingId: booking.bookingId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        parkingSpotId: booking.parkingSpot,
        userId: booking.user
      };
  
      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
  
      // Optional: Save QR code to booking document
      booking.qrCode = qrCodeUrl;
      await booking.save();
  
      res.status(201).json({ success: true, message: 'Booking confirmed sucessfully',qrCodeUrl});
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }


 exports.getuserBooking = async (req, res) => {
    try {
      const bookings = await Booking.find({ user: req.user._id })
        .populate('parkingSpot', 'address location images hourlyRate')
        .populate('user', 'name')
        .populate('vehicle', 'brand model vehicleNumber')
        .sort({ createdAt: -1 });
  
      // Format the response to match renderRenterView expectations
      const formattedBookings = bookings.map(booking => ({
        ...booking._doc,
        address: booking.parkingSpot?.address,
        ownerName: booking.user?.name,
        location: booking.parkingSpot?.location,
        image: booking.parkingSpot?.images, // Use first image
        status: booking.status  // Map "confirmed" to "upcoming"
      }));
  
      res.json({ success: true, data: formattedBookings });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  exports.cancelBooking = async (req, res) => {
    try {
      const { bookingId } = req.body;
      const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
  
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
  
      if (booking.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Booking already cancelled' });
      }
  
      booking.status = 'cancelled';
      await booking.save();
  
      res.json({ success: true, message: "Booking cancelled sucessfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }