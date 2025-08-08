const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const VehicleSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
  },
  brand: {
    type: String
  },
  model: {
    type: String
  },
  color: {
    type: String
  },
  isElectric: {
    type: Boolean,
    default: false
  },
  defaultVehicle: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);