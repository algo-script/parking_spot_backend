const moment = require("moment");
const ParkingSpot = require("../model/parkingSpot");
const User = require("../model/user");



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
  
      if (!name || !address || !isCovered || !size || !hourlyRate) {
        return res
          .status(400)
          .json({ status: false, message: "Missing required fields" });
      }
  
      if (!location || !location.coordinates || !location.type) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid location data" });
      }
  
      // Extract selected slot from raw form input like: timeAvailability[afternoon] = true
      let selectedSlotId = null;
      for (const slotId of Object.keys(TIME_SLOTS)) {
        if (
          rawTimeAvailability &&
          (rawTimeAvailability[slotId] === true ||
            rawTimeAvailability[slotId] === "true")
        ) {
          selectedSlotId = slotId;
          break; // only one allowed
        }
      }
  
      if (!selectedSlotId) {
        return res
          .status(400)
          .json({ status: false, message: "No valid time slot selected" });
      }
  
      // Extract and format start/end times using moment
      // const slotRange = TIME_SLOTS[selectedSlotId].time; // e.g., "12:00 PM - 6:00 PM"
      // const [startLabel, endLabel] = slotRange.split(" - ");
      // Get all selected slots
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
  
      // Sort selected slots in chronological order
      const orderedSlots = Object.keys(TIME_SLOTS).filter(slot => 
        selectedSlots.includes(slot)
      );
  
      // Get first slot's start time and last slot's end time
      const firstSlot = TIME_SLOTS[orderedSlots[0]];
      const lastSlot = TIME_SLOTS[orderedSlots[orderedSlots.length - 1]];
  
      const [startLabel] = firstSlot.time.split(" - ");
      const [, endLabel] = lastSlot.time.split(" - ");
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
  
  
  exports.updateParkingSpots = async (req,res) =>{
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
  
      if (!name || !address || isCovered === undefined|| !size || !hourlyRate) {
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
  }
  
  exports.getParkingSpots = async (req, res) => {
    try {
      const userId = req.user.id;
      const parkingSpots = await ParkingSpot.find({ user: userId });
  
      res.status(200).json({ status: true, data: parkingSpots });
    } catch (error) {
      res
        .status(500)
        .json({ message: "failed to get spotData", error: error.message });
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
      const now = moment(); // current time
      const weekdays = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const today = weekdays[now.day()];
      const tomorrow = weekdays[(now.day() + 1) % 7];
      const { latitude, longitude, startTime, endTime, maxPrice } = req.query;
      // console.log(startTime, endTime);
  
      // Validate input
      if (!latitude || !longitude) {
        return res
          .status(400)
          .json({ error: "Latitude and longitude are required" });
      }
  
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
  
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Invalid latitude or longitude" });
      }
      // Format current time to 'HH:mm' for string comparison
      const currentTime = now.format("HH:mm");
  
      // Check if availability crosses midnight (e.g., 23:00 - 05:00)
      const crossesMidnight = moment(startTime, "HH:mm").isAfter(
        moment(endTime, "HH:mm")
      );
  
      // Build the base query
      const query = {
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lon, lat],
            },
            $maxDistance: 3000,
          },
        },
        // isAvailable: true,
      };
      query.$or = [];
  
      // Add price filter if provided
      if (maxPrice && !isNaN(maxPrice)) {
        query.hourlyRate = { $lte: parseFloat(maxPrice) };
      }
  
      // Optional price filter
      if (maxPrice && !isNaN(maxPrice)) {
        query.hourlyRate = { $lte: parseFloat(maxPrice) };
      }
      if(startTime && endTime){
      if (crossesMidnight) {
        query.$or.push(
          {
            [`availableDays.${today}`]: true,
            "timeAvailability.start": { $gte: currentTime },
          },
          {
            [`availableDays.${tomorrow}`]: true,
            "timeAvailability.end": { $lte: endTime },
          }
        );
      } else {
        query.$or.push({
          [`availableDays.${today}`]: true,
          "timeAvailability.start": { $gte: currentTime },
          "timeAvailability.end": { $lte: endTime },
        });
      }}
  
      if (req.user && req.user._id) {
        query.user = { $ne: req.user._id };
      }
      // Find parking spots within 500 meters
      const parkingSpots = await ParkingSpot.find(query).select(
        "name address location.coordinates timeAvailability hourlyRate isCovered size description images isAvailable"
      );
  
      res.status(200).json({
        status: true,
        count: parkingSpots.length,
        data: parkingSpots,
      });
    } catch (error) {
      console.error("Error finding nearby parking spots:", error);
      res.status(500).json({ error: "Server error" });
    }
  };
  exports.getParkingSpotById = async (req, res) => {
    try {
      const { spotId } = req.params;
      // console.log("spotId",spotId)
      const spot = await ParkingSpot.findById(spotId);
  
      if (!spot) {
        return res.status(404).json({ message: "Parking spot not found" });
      }
  
      // Get owner details
      const owner = await User.findById(spot.user);
  
      const spotDetails = {
        id: spot._id,
        name: spot.name,
        address: spot.address,
        description: spot.description,
        hourlyRate: spot.hourlyRate,
        dailyRate: Math.round(spot.hourlyRate * 8 * 0.8), // Example calculation for daily rate
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
          responseTime: owner.responseTime || "Within an hour",
          avatar:
            owner?.profileImage 
            // "https://randomuser.me/api/portraits/men/32.jpg",
        },
        images:
          spot.images.length > 0
            ? spot.images
            : [
                "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fHBhcmtpbmd8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60",
                "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8cGFya2luZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60",
              ],
        reviews: [
          {
            id: "rev-123",
            user: "Sarah M.",
            rating: 5,
            date: "2023-04-15",
            comment: "Great spot! Easy to find and very convenient location.",
          },
          {
            id: "rev-124",
            user: "David L.",
            rating: 4,
            date: "2023-03-22",
            comment: "Good value for the area. The owner was very responsive.",
          },
        ],
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
  