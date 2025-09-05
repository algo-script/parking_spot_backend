const moment = require("moment");
const ParkingSpot = require("../../model/parkingSpot");
const User = require("../../model/user");
const Booking = require("../../model/booking");

const TIME_SLOTS = {
  morning: { label: "morning", time: "6:00 AM - 12:00 PM" },
  afternoon: { label: "afternoon", time: "12:00 PM - 6:00 PM" },
  evening: { label: "evening", time: "6:00 PM - 12:00 AM" },
  night: { label: "night", time: "12:00 AM - 06:00 AM" },
};

exports.addParkingSpots = async (req, res) => {
  try {
    const {
      name,
      user,
      address,
      isCovered,
      size,
      hourlyRate,
      description,
      location,
      timeAvailability: rawTimeAvailability,
      availableDays,
    } = req.body;

    if (!name || !address || isCovered === undefined || !size || !hourlyRate) {
      return res
        .status(400)
        .json({ status: false, message: "Missing required fields" });
    }

    if (!location || !location.coordinates || !location.type) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid location data" });
    }

    const selectedSlots = [];
    for (const slotId of Object.keys(TIME_SLOTS)) {
      if (
        rawTimeAvailability &&
        (rawTimeAvailability[slotId] === true ||
          rawTimeAvailability[slotId] === "true")
      ) {
        selectedSlots.push(slotId);
      }
    }

    if (selectedSlots.length === 0) {
      return res
        .status(400)
        .json({ status: false, message: "No valid time slot selected" });
    }

    if (selectedSlots.length > 1) {
      return res
        .status(400)
        .json({ status: false, message: "Select only one time slot" });
    }

    const slotId = selectedSlots[0];
    const slotRange = TIME_SLOTS[slotId].time;
    const [startLabel, endLabel] = slotRange.split(" - ");
    const startTime = moment(startLabel, "hh:mm A").format("HH:mm");
    const endTime = moment(endLabel, "hh:mm A").format("HH:mm");

    const processedTimeAvailability = {
      start: startTime,
      end: endTime,
    };

    const images = req.files ? req.files.map((file) => file.filename) : [];
    if (images.length > 5) {
      return res
        .status(400)
        .json({ status: false, message: "Maximum of 5 images allowed" });
    }

    const newSpot = new ParkingSpot({
      name,
      user: req.user?.id || user,
      address,
      location: {
        type: location.type || "Point",
        coordinates: [
          parseFloat(location.coordinates[0]),
          parseFloat(location.coordinates[1]),
        ],
      },
      timeAvailability: processedTimeAvailability,
      availableDays,
      isCovered,
      size,
      hourlyRate: parseFloat(hourlyRate),
      description,
      images,
    });

    const savedSpot = await newSpot.save();

    return res.status(201).json({
      status: true,
      message: "Parking spot added successfully",
      data: savedSpot,
    });
  } catch (error) {
    console.error("Error adding parking spot:", error);
    res.status(500).json({
      status: false,
      message: "Failed to add parking spot",
      error: error.message,
    });
  }
};

exports.updateParkingSpots = async (req, res) => {
  try {
    const {
      spotId,
      name,
      user,
      address,
      isCovered,
      size,
      hourlyRate,
      description,
      location,
      // timeAvailability: rawTimeAvailability,
      availableDays,
    } = req.body;

    if (!spotId) {
      return res
        .status(400)
        .json({ status: false, message: "Missing parking spot ID" });
    }

    if (!name || !address || isCovered === undefined || !size || !hourlyRate) {
      return res
        .status(400)
        .json({ status: false, message: "Missing required fields" });
    }

    if (!location || !location.coordinates || !location.type) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid location data" });
    }

    const images = req.files ? req.files.map((file) => file.filename) : [];
    if (images.length > 5) {
      return res
        .status(400)
        .json({ status: false, message: "Maximum of 5 images allowed" });
    }

    const updateFields = {
      name,
      user: req.user?.id || user,
      address,
      location: {
        type: location.type || "Point",
        coordinates: [
          parseFloat(location.coordinates[0]),
          parseFloat(location.coordinates[1]),
        ],
      },
      availableDays,
      isCovered,
      size,
      hourlyRate: parseFloat(hourlyRate),
      description,
    };

    if (images.length > 0) {
      updateFields.images = images;
    }

    const updatedSpot = await ParkingSpot.findByIdAndUpdate(
      spotId,
      updateFields,
      { new: true }
    );

    if (!updatedSpot) {
      return res.status(404).json({
        status: false,
        message: "Parking spot not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Parking spot updated successfully",
      data: updatedSpot,
    });
  } catch (error) {
    console.error("Error update parking spot:", error);
    res.status(500).json({
      status: false,
      message: "Failed to update parking spot",
      error: error.message,
    });
  }
};

exports.getParkingSpots = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch parking spots owned by the user
    const parkingSpots = await ParkingSpot.find({ user: userId }).lean();

    if (!parkingSpots.length) {
      return res.status(200).json({ status: true, data: [] });
    }

    // Get current date for filtering upcoming bookings
    const currentDate = moment().startOf("day").toDate();

    // Fetch upcoming bookings for the user's parking spots
    const parkingSpotIds = parkingSpots.map((spot) => spot._id);
    const upcomingBookings = await Booking.find({
      parkingSpot: { $in: parkingSpotIds },
      date: { $gte: currentDate },
      status: { $in: ["pending", "confirmed"] },
    })
      .select(
        "bookingId parkingSpot date startTime endTime duration totalAmount status"
      )
      .populate("user", "name")
      .lean();

    // Fetch guards assigned to these parking spots
    const guards = await User.find({
      role: "Guard",
      spotId: { $in: parkingSpotIds },
    })
      .select("name mobile email profileImage responseTime spotId")
      .lean();

    // Map parking spots with bookings and guards
    const parkingSpotsWithDetails = parkingSpots.map((spot) => {
      const spotGuards = guards.filter((g) => g.spotId === spot._id);
      const spotBookings = upcomingBookings
        .filter((b) => b.parkingSpot === spot._id)
        .map((booking) => ({
          ...booking,
          date: moment(booking.date).format("YYYY-MM-DD"),
        }));

      return {
        ...spot,
        guards: spotGuards,
        upcomingBookings: spotBookings,
      };
    });

    res.status(200).json({ status: true, data: parkingSpotsWithDetails });
  } catch (error) {
    console.error("Error fetching parking spots:", error);
    res.status(500).json({
      message: "Failed to get parking spot data",
      error: error.message,
    });
  }
};

exports.updateParkingSpotTimeAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { spotId, start, end } = req.body;

    if (!spotId || !start || !end) {
      return res
        .status(400)
        .json({ error: "spotId, start, and end times are required" });
    }

    const parkingSpot = await ParkingSpot.findOne({
      _id: spotId,
      user: userId,
    });

    if (!parkingSpot) {
      return res
        .status(404)
        .json({ error: "Parking spot not found or not authorized" });
    }

    parkingSpot.timeAvailability.start = start;
    parkingSpot.timeAvailability.end = end;
    await parkingSpot.save();
    res
      .status(200)
      .json({ status: true, message: "Time availibility Updated sucessfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to UpdateTime", error: error.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const { spotId, isAvailable } = req.body;

    // Validate request body
    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ error: "isAvailable must be a boolean" });
    }
    // Find and update the parking spot
    const parkingSpot = await ParkingSpot.findOne({
      _id: spotId,
      user: req.user._id,
    });

    if (!parkingSpot) {
      return res
        .status(404)
        .json({ error: "Parking spot not found or not owned by user" });
    }

    parkingSpot.isAvailable = isAvailable;
    await parkingSpot.save();

    res.status(200).json({
      status: true,
      message: "Availibility status Updated sucessfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to toggleAvailability", error: error.message });
  }
};

exports.findNearbyParkingSpots = async (req, res) => {
  
  
  try {
    const { latitude, longitude, startTime, endTime, maxPrice, selectedDate } =
      req.query;

    // ✅ Validate location
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid latitude or longitude" });
    }

    // ✅ Parse selected date (default = today)
    const selected = selectedDate
      ? moment(selectedDate, "YYYY-MM-DD")
      : moment();

    if (!selected.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid selectedDate format. Use YYYY-MM-DD",
      });
    }

    const weekdays = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayfind = weekdays[selected.day()];

    //  If start/end not passed → default to now - midnight
    let reqStart = startTime || "00:00";

    let reqEnd = endTime || "23:59"; // assume until end of day

    // Base query
    const query = {
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lon, lat] },
          $maxDistance: 5000,
        },
      },
      [`availableDays.${dayfind}`]: true,
    };

    // Optional price filter
    if (maxPrice && !isNaN(maxPrice)) {
      query.hourlyRate = { $lte: parseFloat(maxPrice) };
    }
    // ✅ Availability filter (weekday & spot hours)
    if (selectedDate || startTime || endTime) {
      query.$and = [
        {
          $expr: {
            $and: [
              { $lte: ["$timeAvailability.start", reqEnd] }, // spot.start < reqEnd
              { $gte: ["$timeAvailability.end", reqStart] }, // spot.end > reqStart
            ],
          },
        },
      ];
    } else {
      const now = moment().format("HH:mm");
      query.$and = [
        {
          $expr: {
            $and: [
              { $lte: ["$timeAvailability.start", "23:59"] },
              { $gte: ["$timeAvailability.end", now] },
            ],
          },
        },
      ];
    }

    // Exclude current user’s spots
    if (req.user && req.user._id) {
      query.user = { $ne: req.user._id };
    }

    //Fetch candidate spots
    let parkingSpots = await ParkingSpot.find(query).select(
      "name address location.coordinates timeAvailability hourlyRate isCovered size description images isAvailable"
    );
    // console.log(parkingSpots);

    // Step 2: Filter by booking conflicts
    const availableSpots = [];
    for (let spot of parkingSpots) {
      const overlappingBooking = await Booking.findOne({
        parkingSpot: spot._id,
        date: selected.toDate(),
        status: { $in: ["pending", "confirmed"] },
        $or: [
          { startTime: { $lt: reqEnd }, endTime: { $gt: reqStart } }, // ⬅ overlap check
        ],
      });

      if (!overlappingBooking) {
        availableSpots.push(spot);
      }
    }

    res.status(200).json({
      success: true,
      count: availableSpots.length,
      data: availableSpots,
    });
  } catch (error) {
    console.error("Error finding nearby parking spots:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getParkingSpotById = async (req, res) => {
  try {
    const { spotId } = req.params;
    const spot = await ParkingSpot.findById(spotId);
    if (!spot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    // Get owner details
    const owner = await User.findById(spot.user);

    const spotDetails = {
      _id: spot._id,
      name: spot.name,
      address: spot.address,
      description: spot.description,
      hourlyRate: spot.hourlyRate,
      isAvailable: spot.isAvailable,
      // dailyRate: Math.round(spot.hourlyRate * 8 * 0.8), // Example calculation for daily rate
      coordinates: {
        lat: spot.location.coordinates[1],
        lng: spot.location.coordinates[0],
      },
      availability: {
        startTime: spot.timeAvailability.start,
        endTime: spot.timeAvailability.end,
        availableDays: spot.availableDays,
      },
      features: {
        covered: spot.isCovered === "covered",
        secured: true, // Assuming all are secured
        cctv: true, // Assuming all have CCTV
        ev_charging: false, // Default
        height_restriction: spot.size === "large" ? "8 ft" : "6.5 ft",
        size: spot.size,
      },
      owner: {
        id: owner._id,
        name: owner.name,
        rating: 4.8, // Default rating
        reviewCount: 124, // Default count
        joinedDate: owner.createdAt.toISOString().split("T")[0],
        responseTime: owner.responseTime,
        avatar: owner?.profileImage,
        // "https://randomuser.me/api/portraits/men/32.jpg",
      },
      images:
        // spot.images.length > 0
          spot.images
          // : [
          //     "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fHBhcmtpbmd8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60",
          //     "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8cGFya2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60",
          //   ],
      // reviews: [
      //   {
      //     id: "rev-123",
      //     user: "Sarah M.",
      //     rating: 5,
      //     date: "2023-04-15",
      //     comment: "Great spot! Easy to find and very convenient location.",
      //   },
      //   {
      //     id: "rev-124",
      //     user: "David L.",
      //     rating: 4,
      //     date: "2023-03-22",
      //     comment: "Good value for the area. The owner was very responsive.",
      //   },
      // ],
    };

    res.json({
      data: spotDetails,
      success: true,
      message: "spotData fetch sucessfully",
    });
  } catch (error) {
    console.error("Error in getParkingSpotById:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

 // const now = moment().format("HH:mm");
      // query.$or = [
      //   {
      //     "timeAvailability.start": { $gte:now},
      //   },
      //   {
      //     "timeAvailability.end": { $lte:now },
      //   },
      // ];

// query.$or = [
//   {
//     [`availableDays.${dayfind}`]: true,
//     "timeAvailability.start": { $not: { $lte: reqStart  }
//     // "timeAvailability.end": { $lte: reqEnd },
//   },
// {
//   [`availableDays.${dayfind}`]: true,
//   "timeAvailability.start": { $lte: reqStart },
//   "timeAvailability.end": { $lte: reqEnd },
// },
// ];
