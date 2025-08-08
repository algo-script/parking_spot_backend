const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ParkingSpotSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    name: {
        type: String,
        required: true,
    },
    user: {
    type: String,
    ref: "User", // Assumes you have a User model
    required: true,
  },
  address: { 
    type: String, 
    required: true 
  },
  location: {
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
    }
  },
  timeAvailability:
   {
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true
    },
  },
  availableDays: {
    monday: { type: Boolean, default: false },
    tuesday: { type: Boolean, default: false },
    wednesday: { type: Boolean, default: false },
    thursday: { type: Boolean, default: false },
    friday: { type: Boolean, default: false },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false },
  },
  isCovered: { 
    type: String, 
    enum: ["covered", "uncovered"], 
    required: true 
  },
  size: { 
    type: String, 
    enum: ["compact", "standard", "large"], 
    required: true 
  },
  hourlyRate: { 
    type: Number, 
    required: true 
   },
  description: { 
    type: String 
   },
   images: {
    type: [String],
    default: [],
  },
  isAvailable:{
     type:Boolean,
     required:true,
     default:true
  }
}, { timestamps: true });

ParkingSpotSchema.index({ location: '2dsphere' });
module.exports = mongoose.model("ParkingSpot", ParkingSpotSchema);


