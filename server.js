const express = require('express');
const cors = require('cors');
var path = require('path');
require('dotenv').config();

const { connectDB } = require('./db/connectDb');
const userRoutes = require('./routes/userRoutes');
const guardRoutes = require('./routes/guardRoutes')
const adminRoutes = require('./routes/adminRoutes')
const { documentsPath } = require('./multer/multerconfig');
// const { documentsPath } = require('./multerconfig/upload')
connectDB();

const app = express();

const PORT = process.env.PORT || 5120;


app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization','refreshToken'],
}));
app.use(express.json());
// app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(documentsPath))


app.use('/api/user', userRoutes);
app.use('/api/guard', guardRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api', sAdminRouter);

app.get('/', (req, res) => res.send('<h1>Parking_Spot Running</h1><p>Welcome to the Parking_Spot server!</p>'));

app.use((err, req, res, next) => res.status(500).send('Something went wrong!'));


app.listen(PORT, () => console.log(`Parking_Spot Server running on port ${PORT}`));
