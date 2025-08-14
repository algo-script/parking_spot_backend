// bookingSchema.js - Mongoose schema for Booking model
const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    bookingId: {
      type: String,
      unique: true,
      required: true,
      default: () => `PSB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    },
    user: {
      type:String,
      ref: "User", // Assuming a User model exists
      required: true,
    },
    parkingSpot: {
      type:String,
      ref: "ParkingSpot", // Assuming a ParkingSpot model exists
      required: true,
    },
    vehicle: {
      type: String,
      ref: "Vehicle", // Assuming a Vehicle model exists
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // Format: "HH:MM"
      required: true,
    },
    endTime: {
      type: String, // Format: "HH:MM"
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      // default: "pending",
    },
    qrCode:{
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
