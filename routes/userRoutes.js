const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const router = express.Router();
const { upload } = require('../multer/multerconfig');
const { registerUser, loginUser, updateUserProfile, getUserProfile, changePassword } = require('../controllers/userController');
const { addParkingSpots, updateParkingSpots, getParkingSpots, updateParkingSpotTimeAvailability, toggleAvailability, findNearbyParkingSpots, getParkingSpotById } = require('../controllers/parkingspotController');
const { addVehicle, getVehiclesByUser, updateVehicle, setDefaultVehicle } = require('../controllers/vehicleController');

//User routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/change-password',authenticateToken,changePassword)
router.get('/get-profile', authenticateToken, getUserProfile);
router.post('/update-profile', authenticateToken,upload.any(), updateUserProfile);

//Parking spot routes
router.post("/addparking-spots",authenticateToken,upload.any(),addParkingSpots)
router.post("/updateparking-spots",authenticateToken,upload.any(),updateParkingSpots)
router.get("/parking-spots",authenticateToken,getParkingSpots);
router.post("/update-time-availability",authenticateToken,updateParkingSpotTimeAvailability);
router.post("/toggle-availability",authenticateToken,toggleAvailability);
router.get("/nearby-spots",optionalAuth,findNearbyParkingSpots);
router.get("/parking-spots/:spotId", getParkingSpotById);

//vehicle routes
router.post("/addvehicle",authenticateToken,addVehicle)
router.get("/getUser-vehicle",authenticateToken,getVehiclesByUser)
router.post("/upadate-vehicle",authenticateToken,updateVehicle)
router.post("/set-defaultvehicle",authenticateToken,setDefaultVehicle)


module.exports = router;


