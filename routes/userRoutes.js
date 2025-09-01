const express = require('express');
const { authenticateToken, optionalAuth, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();
const { upload } = require('../multer/multerconfig');
const { registerUser, loginUser, updateUserProfile, getUserProfile, changePassword, addGuardDetails, updateGuardDetails } = require('../controllers/user/userController');
const { addParkingSpots, updateParkingSpots, getParkingSpots, updateParkingSpotTimeAvailability, toggleAvailability, findNearbyParkingSpots, getParkingSpotById } = require('../controllers/user/parkingspotController');
const { addVehicle, getVehiclesByUser, updateVehicle, setDefaultVehicle } = require('../controllers/user/vehicleController');
const { confirmBooking, getuserBooking, cancelBooking, getAvailableTimes } = require('../controllers/user/bookingController');

//User routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/change-password',authenticateToken,authorizeRoles("User","Guard"),changePassword)
router.get('/get-profile', authenticateToken,authorizeRoles("User","Guard","Admin"), getUserProfile);
router.post('/update-profile', authenticateToken,authorizeRoles("User","Guard","Admin"),upload.any(), updateUserProfile);

//Parking spot routes
router.post("/addparking-spots",authenticateToken,authorizeRoles("User"),upload.any(),addParkingSpots)
router.post("/updateparking-spots",authenticateToken,authorizeRoles("User"),upload.any(),updateParkingSpots)
router.get("/parking-spots",authenticateToken,authorizeRoles("User"),getParkingSpots);
router.post("/update-time-availability",authenticateToken,authorizeRoles("User"),updateParkingSpotTimeAvailability);
router.post("/toggle-availability",authenticateToken,authorizeRoles("User"),toggleAvailability);
router.get("/nearby-spots",optionalAuth,findNearbyParkingSpots);
router.get("/parking-spots/:spotId",optionalAuth, getParkingSpotById);
router.post("/add-guarddetails",authenticateToken,authorizeRoles("User"),addGuardDetails);
router.post("/update-guarddetails",authenticateToken,authorizeRoles("User"),updateGuardDetails);

//vehicle routes
router.post("/addvehicle",authenticateToken, authorizeRoles("User"),addVehicle)
router.get("/getUser-vehicle",authenticateToken,authorizeRoles("User"),getVehiclesByUser)
router.post("/upadate-vehicle",authenticateToken,authorizeRoles("User"),updateVehicle)
router.post("/set-defaultvehicle",authenticateToken,authorizeRoles("User"),setDefaultVehicle)

//Booking routes
router.post("/confirmbooking",authenticateToken,authorizeRoles("User"),confirmBooking)
router.get("/getuserBooking",authenticateToken,authorizeRoles("User"),getuserBooking)
router.post("/cancelBooking",authenticateToken,authorizeRoles("User"),cancelBooking)
router.post("/getAvailableTimes",authenticateToken,authorizeRoles("User"),getAvailableTimes)


module.exports = router;


