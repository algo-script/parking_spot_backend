const express = require('express');
const { authenticateToken, optionalAuth, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();
const { upload } = require('../multer/multerconfig');
const { getspotWithCurrentBooking } = require('../controllers/guard/parkingspotController');
const { competeBooking, verifyBooking, confirmEntry, recentAndUpcomingBooking } = require('../controllers/guard/bookingController');


router.get("/guarddashboard",authenticateToken,authorizeRoles("Guard"),getspotWithCurrentBooking)



router.post("/complete-booking",authenticateToken,authorizeRoles("Guard"),competeBooking)
router.post("/verify-booking",authenticateToken,authorizeRoles("Guard"),verifyBooking)
router.post("/confirm-entry",authenticateToken,authorizeRoles("Guard"),confirmEntry)

router.get("/booking-details",authenticateToken,authorizeRoles("Guard"),recentAndUpcomingBooking)

module.exports = router;