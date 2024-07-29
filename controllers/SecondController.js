import multer from 'multer';
import { getStorage, uploadBytes, ref, getDownloadURL } from 'firebase/storage';
import UserModel from '../models/User.js';
import CarModel from '../models/Car.js';
import jwt from 'jsonwebtoken';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDgLE7NJIFOu7FZNJyU6GhQRGTxuGfdcS4",
    authDomain: "albaniarentaltourism-240a2.firebaseapp.com",
    projectId: "albaniarentaltourism-240a2",
    storageBucket: "albaniarentaltourism-240a2.appspot.com",
    messagingSenderId: "196771392121",
    appId: "1:196771392121:web:6d3e0c1dd79bf1dd07c2a8",
    measurementId: "G-4BQJ12M88W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);  // Initialize Firebase Storage

// Configure Multer
const storageConfig = multer.memoryStorage();  // Use memory storage
const upload = multer({ storage: storageConfig }).fields([
    { name: 'cover', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]);

const sk = process.env.JWT_SECRET

// Post Car Route
export const postCar = async (req, res) => {
    // Apply multer middleware manually
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        }

        // Extract token from headers
        const token = req.headers['x-auth-token'] || req.headers.token;

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        try {
            // Verify the token and get user data
            const decoded = jwt.verify(token, sk);
            req.user = decoded;

            const userId = req.user.id;
            const user = await UserModel.findById(decoded.userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            if (user.status !== 'true') {
                return res.status(403).json({ msg: 'You Cannot Access', status: 700 });
            }

            // Extract file data from req.files
            const cover = req.files.cover ? req.files.cover[0] : null;
            const images = req.files.images ? req.files.images : [];

            // Upload files to Firebase Storage
            const coverRef = cover ? ref(storage, `cars/${userId}/${cover.originalname}`) : null;
            const coverUpload = coverRef ? await uploadBytes(coverRef, cover.buffer) : null;
            const imageUploads = await Promise.all(images.map(image => 
                uploadBytes(ref(storage, `cars/${userId}/${image.originalname}`), image.buffer)
            ));

            // Build URLs for uploaded files
            const coverImageUrl = coverUpload ? await getDownloadURL(coverRef) : '';
            const imageUrls = await Promise.all(imageUploads.map(upload => getDownloadURL(ref(storage, `cars/${userId}/${upload.metadata.name}`))));

            // Extract form data from req.body
            const { title, make, model, year, transmission, fuel, rate, city, start_date, end_date, location, description } = req.body;

            // Save car data to MongoDB
            const car = new CarModel({
                title,
                make,
                model,
                year,
                transmission,
                fuel,
                rate,
                city,
                start_date,
                end_date,
                location,
                description,
                cover: coverImageUrl,
                images: imageUrls,
                userId,
            });

            await car.save();

            res.status(200).json({ message: 'Car created successfully.' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred: ' + error.message });
        }
    });
};
