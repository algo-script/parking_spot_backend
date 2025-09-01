const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();
const { upload } = require('../multer/multerconfig');
const { getUserData } = require('../controllers/admin/userController');




// router.get("/guarddashboard",authenticateToken,authorizeRoles("Admin"),getspotWithCurrentBooking)

router.get("/userdata",authenticateToken,authorizeRoles("Admin"),getUserData)



module.exports = router;