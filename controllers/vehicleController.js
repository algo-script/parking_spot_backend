const Vehicle = require("../model/vehicle")

exports.addVehicle = async (req, res) => {
    try {
      const { vehicleNumber, type, brand, model, color, isElectric, defaultVehicle } = req.body;
  
      // Validate required fields
      if ( !vehicleNumber || !type) {
        return res.status(400).json({ success: false, message: 'userId, vehicleNumber, and type are required' });
      }
  
      // Check if vehicleNumber already exists
      const existingVehicle = await Vehicle.findOne({ vehicleNumber });
      if (existingVehicle) {
        return res.status(400).json({ success: false, message: 'Vehicle number already exists' });
      }

      if (defaultVehicle) {
        await Vehicle.updateMany({ userId:req.user._id, defaultVehicle: true }, { defaultVehicle: false });
      }
  
      const vehicle = new Vehicle({
        userId:req.user._id,
        vehicleNumber,
        type,
        brand,
        model,
        color,
        isElectric: isElectric || false,
        defaultVehicle: defaultVehicle || false,
      });
  
      await vehicle.save();
      res.status(201).json({ success: true, message: 'Vehicle added successfully', data: vehicle });
    } catch (error) {
    
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };

  exports.getVehiclesByUser = async (req, res) => {
    try {
      const vehicles = await Vehicle.find({ userId:req.user._id }).sort({  defaultVehicle: -1,createdAt: -1 });
      
      res.status(200).json({ success: true, data: vehicles });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };


  exports.updateVehicle = async (req, res) => {
    try {
      // const { id } = req.params;
      const { vehicleNumber, type, brand, model, color, isElectric, defaultVehicle ,currentVehicleId} = req.body;
  
      // Validate vehicle ID
      if (!currentVehicleId) {
        return res.status(400).json({ success: false, message: 'Invalid vehicle ID' });
      }
  
      // Find the vehicle
      const vehicle = await Vehicle.findById(currentVehicleId);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
  
      // Check if vehicleNumber is being updated and already exists
      if (vehicleNumber && vehicleNumber !== vehicle.vehicleNumber) {
        const existingVehicle = await Vehicle.findOne({ vehicleNumber });
        if (existingVehicle) {
          return res.status(400).json({ success: false, message: 'Vehicle number already exists' });
        }
      }
  
      // If defaultVehicle is true, unset defaultVehicle for other vehicles of the same user
      if (defaultVehicle) {
        await Vehicle.updateMany(
          { userId: vehicle.userId, _id: { $ne: currentVehicleId }, defaultVehicle: true },
          { defaultVehicle: false }
        );
      }
  
      // Update fields
      vehicle.vehicleNumber = vehicleNumber || vehicle.vehicleNumber;
      vehicle.type = type || vehicle.type;
      vehicle.brand = brand || vehicle.brand;
      vehicle.model = model || vehicle.model;
      vehicle.color = color || vehicle.color;
      vehicle.isElectric = isElectric !== undefined ? isElectric : vehicle.isElectric;
      vehicle.defaultVehicle = defaultVehicle !== undefined ? defaultVehicle : vehicle.defaultVehicle;
  
      await vehicle.save();
      res.status(200).json({ success: true, message: 'Vehicle updated successfully', data: vehicle });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Vehicle number already exists' });
      }
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };

  exports.setDefaultVehicle = async (req, res) => {
    try {
      const { vehicleId } = req.body;
  
      // Validate inputs
      if (!vehicleId) {
        return res.status(400).json({ success: false, message: 'Invalid vehicle ID' });
      }
  
      // Find the vehicle
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
  
      // Verify the vehicle belongs to the user
      if (vehicle.userId !== req.user._id) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Vehicle does not belong to this user' });
      }
  
      // If the vehicle is already the default, no changes needed
      if (vehicle.defaultVehicle) {
        return res.status(200).json({ success: true, message: 'Vehicle is already set as default' });
      }
  
      // Unset defaultVehicle for other vehicles of the same user
      await Vehicle.updateMany(
        { userId:req.user._id, _id: { $ne: vehicleId }, defaultVehicle: true },
        { defaultVehicle: false }
      );
  
      // Set the specified vehicle as default
      vehicle.defaultVehicle = true;
      await vehicle.save();
  
      res.status(200).json({ success: true, message: 'Vehicle set as default successfully', data: vehicle });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };