const multer = require("multer");
const path = require('path');
const fs = require('fs');

const documentsPath = path.join(__dirname,'..','..','..', 'parkingspotimages');
if (!fs.existsSync(documentsPath)) {
  fs.mkdirSync(documentsPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, documentsPath); 
      
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}_${file.originalname}`;
      cb(null, uniqueName);
    },
  });

const upload = multer({ storage });

module.exports = { upload,documentsPath }