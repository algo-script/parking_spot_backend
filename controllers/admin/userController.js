const moment = require("moment");
const User = require("../../model/user");
const ParkingSpot = require("../../model/parkingSpot");
// const generateToken = require("../../utils/helperFunctions");

exports.getUserData = async (req, res) => {
  try {
      // Extract query parameters
      const {
          page = 1,
          limit = 10,
          name,
          email,
          mobile,
          dateFrom,
          dateTo
      } = req.query;

      // Calculate pagination values
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build filter object
      let filter = { role: 'User' };

      // Add text-based filters if provided
      if (name) {
          filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search
      }
      
      if (email) {
          filter.email = { $regex: email, $options: 'i' }; // Case-insensitive search
      }
      
      if (mobile) {
          filter.mobile = { $regex: mobile, $options: 'i' }; // Case-insensitive search
      }

      // Date filtering using Moment.js
      if (dateFrom || dateTo) {
          filter.createdAt = {};
          
          if (dateFrom) {
              // Start of the day for dateFrom
              filter.createdAt.$gte = moment(dateFrom).startOf('day').toDate();
          }
          
          if (dateTo) {
              // End of the day for dateTo
              filter.createdAt.$lte = moment(dateTo).endOf('day').toDate();
          }
      } else {
          // Default: Get users from the last month
          const oneMonthAgo = moment().subtract(1, 'months').startOf('day').toDate();
          filter.createdAt = { $gte: oneMonthAgo };
      }

      // Execute query with filters and pagination
      const users = await User.find(filter)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum);

      // Get total count for pagination
      const totalItems = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalItems / limitNum);

      res.status(200).json({
          success: true,
          data: users,
          pagination: {
              currentPage: pageNum,
              itemsPerPage: limitNum,
              totalItems,
              totalPages
          }
      });
  } catch (error) {
      console.error("Error getUserData:", error);
      res.status(500).json({
          success: false,
          message: "Failed to getUserData",
          error: error.message,
      });
  }
};

exports.getGaurdData = async (req, res) => {
    try {
        // Extract query parameters
        const {
            page = 1,
            limit = 10,
            name,
            email,
            mobile,
            dateFrom,
            dateTo
        } = req.query;
  
        // Calculate pagination values
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
  
        // Build filter object
        let filter = { role: 'Guard' };
  
        // Add text-based filters if provided
        if (name) {
            filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search
        }
        
        if (email) {
            filter.email = { $regex: email, $options: 'i' }; // Case-insensitive search
        }
        
        if (mobile) {
            filter.mobile = { $regex: mobile, $options: 'i' }; // Case-insensitive search
        }
  
        // Date filtering using Moment.js
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            
            if (dateFrom) {
                // Start of the day for dateFrom
                filter.createdAt.$gte = moment(dateFrom).startOf('day').toDate();
            }
            
            if (dateTo) {
                // End of the day for dateTo
                filter.createdAt.$lte = moment(dateTo).endOf('day').toDate();
            }
        } else {
            // Default: Get users from the last month
            const oneMonthAgo = moment().subtract(1, 'months').startOf('day').toDate();
            filter.createdAt = { $gte: oneMonthAgo };
        }
  
        // Execute query with filters and pagination
        const users = await User.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
  
        // Get total count for pagination
        const totalItems = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / limitNum);
  
        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                currentPage: pageNum,
                itemsPerPage: limitNum,
                totalItems,
                totalPages
            }
        });
    } catch (error) {
        console.error("Error getUserData:", error);
        res.status(500).json({
            success: false,
            message: "Failed to getUserData",
            error: error.message,
        });
    }
  };