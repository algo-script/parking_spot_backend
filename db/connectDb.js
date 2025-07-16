const mongoose = require('mongoose');

const connectDB = async () => {
    try {   
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('MongoDB Connected Successfully...!');
    } catch (err) {
        console.log('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports = { connectDB };
