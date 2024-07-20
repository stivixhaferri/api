import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connect from './config/db.js';
import cookieParser from 'cookie-parser';
import { register  ,random , contactUs  ,disableCar  , enableCar, getUser ,book , getComments , logout ,postCar, postComment , login , getCars , getMyCars , reserveDate , getMyCar}  from './controllers/CarController.js';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';


dotenv.config();

await connect();


const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});




const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
};

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use('/uploads', express.static('uploads'));

// Set up multer for file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB file size limit for uploads
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files are allowed.'), false);
        }
    }
});

const uploadHandler = upload.fields([{ name: 'card_id' }]);


//api routes
app.post('/api/register', uploadHandler)
app.post('/api/register', authLimiter ,  register);
app.use('/api/login', authLimiter);
app.post('/api/login', login)
app.get('/api/getuser', getUser)
app.post('/api/logout', logout)
app.post('/api/post', postCar)
app.post('/api/reserve', reserveDate)
app.get('/api/cars', getCars);
app.get('/api/mycars', getMyCars);
app.get('/api/mycar', getMyCar);
app.post('/api/postcomment', authLimiter , postComment);
app.get('/api/comments', getComments);
app.post('/api/book' , book);
app.get('/api/disable' , disableCar);
app.get('/api/random', random)
app.get('/api/enable', enableCar);
app.post('/api/contact', authLimiter , contactUs)

const PORT = process.env.PORT || 8001;
app.listen(PORT , () => {
    console.log(`Server is running on port ${PORT}`)
})

