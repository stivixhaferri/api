import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer'
import CarModel from '../models/Car.js';
import bcrypt from 'bcryptjs'
import CommentModel from '../models/Comment.js';
import BookModel from '../models/Book.js';
import { Resend } from 'resend';
import moment from 'moment'


const sk = process.env.JWT_SECRET;

const resendKey = process.env.RESEND_KEY
const resend = new Resend(`re_KTgUptqo_HjmVkjpR6jWXQxsVKZj9RKQ3`);




// Configure Multer for file uploads
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

// Middleware to handle file uploads and parse form data
const uploadHandler = upload.fields([{ name: 'cover' }, { name: 'images' } ]);

// Post Car Route
export const postCar = async (req, res) => {
   
    uploadHandler(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        // Extract token from headers
        const token = req.headers.token;

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

            if(user.status != 'true'){
                return res.json({msg: 'You Can not Access', status: 700})
            }

             // Extract file data from req.files
             const cover = req.files.cover ? req.files.cover[0] : null;
             const license = req.files.license ? req.files.license[0] : null;
             const images = req.files.images ? req.files.images : [];
             

            // Extract form data from req.body
            const {title,  make, model, year,  transmission, fuel, rate, city, start_date , end_date , location, description } = req.body;
          
        

            // Build URLs for uploaded files
            const coverImageUrl = cover ? `http://localhost:8000/uploads/${cover.filename}` : '';
            const imageUrls = images.map(image => `http://localhost:8000/uploads/${image.filename}`);
            
            // Save car data to MongoDB
            const car = new CarModel({
                title,
                make,
                model,
                year,
                transmission: transmission,
                fuel,
                rate,
                city,
                start_date,
                end_date,
                location,
                description,
                cover: coverImageUrl,
              
                images: imageUrls,
                userId: decoded.userId,
                
            });

            await car.save();

            res.status(200).json({ message: 'Car created successfully.' });

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    });
};




export const getUser = async (req, res) => {
    const token = req.headers.token;
    
    if (!token) {
        return res.status(400).json({ msg: 'No Token Provided' });
    }

    try {
       
        const decoded = jwt.verify(token, sk);

       
        const userId = decoded.userId;

      
        const user = await UserModel.findById(userId)

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

       
        res.status(200).json({ user });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: error.message });
    }
};

// Register user
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        

        // Create new user
        const newUser = new UserModel({
            username,
            email,
            password,
        });

        // Save user to database
        const savedUser = await newUser.save();

        // Create JWT token
        const token = jwt.sign({ userId: savedUser._id }, sk, { expiresIn: '1h' });

        // Set cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });

        // Send response
        res.status(200).json({ msg: 'User registered successfully', user: savedUser });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: error.message });
    }
};


export const logout = async (req, res) => {
    try {
        // Clear the 'jwt' cookie by setting an empty value and an immediate expiry date
        res.cookie('jwt', '', {
            httpOnly: true,
            expires: new Date(0),
            sameSite: 'none',
            secure: true,  // Add secure flag if using HTTPS
        });

        // Respond with a JSON message indicating successful logout
        res.status(200).json({ msg: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ msg: 'Logout failed' });
    }
};




export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
      
        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required' });
        }
        
        // Find user by email
        const user = await UserModel.findOne({email:  email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid email or password' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign({ userId: user._id }, sk, { expiresIn: '1h' });

        // Set cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge:24 * 60 * 60 * 1000
        });

        // Send response
        res.status(200).json({ msg: 'User logged in successfully', user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: error.message });
    }
};


export const getCars = async (req ,res) => {
    try{
        const cars = await CarModel.find({});

        if(!cars){
            return res.json({msg: 'No Cars Found', status: 404})
        }


        return res.json({data: cars , status: 500})

    }catch(error){
        return res.json({msg: error, status: 500})
    }
}


export const getMyCars = async (req, res) => {
    const token = req.headers.token;

    if (!token) {
        return res.status(400).json({ msg: 'No Token Provided' });
    }

    try {
        const decoded = jwt.verify(token, sk);
        const userId = decoded.userId;
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const myCars = await CarModel.find({ userId: userId });

        return res.status(200).json({ myCars });
    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
};


export const reserveDate = async (req, res) => {
    try {
        const { id, date } = req.body;

        const car = await CarModel.findById(id);
       
        if (!car) {
            return res.status(404).json({ msg: 'Car Not Found', status: 404 });
        }

        car.other.push(date);
       
        const updatedCar = await car.save();
       
        return res.status(200).json({ msg: 'Success', status: 200 });
    } catch (error) {
        console.error('Error in reserveDate:', error);
        return res.status(500).json({ msg: 'Internal Server Error', status: 500 });
    }
};




export const getMyCar = async (req, res) => {
    const id = req.headers.token;
    
    try {
        const car = await CarModel.find({_id: id});

        if (!car) {
            return res.json({ msg: 'No car found!', status: 404 });
        }

        return res.json({ data: car, status: 200 });
    } catch (error) {
        return res.json({ msg: error.message, status: 500 });
    }
};



export const postComment = async (req , res) => {
    try{
        const {username , rate , comment , car_id } = req.body;

       


        const post_comment = await CommentModel.create({
            username,
            comment,
            rate,
            car_id
        })
        await post_comment.save();
        return res.json({msg: 'Success', status: 200})
    }catch(error){
        return res.json({msg: error , status: 500})
    }
}



export const getComments = async (req, res) => {
    const id = req.headers.token;

    if(!id){
        return res.json({msg: 'Comments not found' , status: 404})
    }
    try{
        const comments = await CommentModel.find({car_id: id});

        if(!comments){
            return res.json({msg: 'Comments not found' , status: 404})
        }

        return res.json({data: comments , status: 200})
        
    }catch(error){
        return res.json({msg: error, status: 500})
    }
}



export const book = async (req, res) => {
    try {
        const { email, phone, startDate, endDate, message, car_id, total } = req.body;

        console.log('Request body:', req.body);

        if (!email || !phone || !startDate || !endDate || !car_id || !total) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

        const car = await CarModel.findById(car_id);

        if (!car) {
            return res.status(404).json({ msg: 'No Car Found' });
        }

        const user = await UserModel.findById(car.userId);
        if (!user) {
            return res.status(405).json({ msg: 'No User Found' });
        }

        // Generate array of dates between startDate and endDate
        const start = moment(startDate);
        const end = moment(endDate);
        const dateArray = [];
        
        let currentDate = start;

        while (currentDate <= end) {
            dateArray.push(currentDate.format('YYYY-MM-DD'));
            currentDate = currentDate.add(1, 'days');
        }



        (async function () {
            const { data, error } = await resend.emails.send({
              from: 'Acme <onboarding@resend.dev>',
              to: [`stivixhaferri01@gmail.com`],
              subject: `ART`,
              html: `<strong>${email} booked your car:  ${car.make} ${car.model} ${car.year} <br/> from date: ${startDate} to ${endDate}. <br/> Client Email: ${email}, Phone Number: ${phone} <br/> Price: ${total}</strong>`,
            });
          
            if (error) {
              return console.error({ error });
            }
          
            console.log({ data });
          })();
        // Add these dates to the car's `other` array
        car.other = [...car.other, ...dateArray];
        await car.save();

        // Create the booking
        const booking = await BookModel.create({
            email,
            phone,
            startDate,
            endDate,
            message,
            total,
            car_id
        });

        return res.status(200).json({ booking, msg: 'Booking successful' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ msg: error.message });
    }
};



export const disableCar = async (req, res) => {
    const id = req.headers.token;

    if (!id) {
        return res.json({msg: 'No token found'});
    }

    try {
        const car = await CarModel.findOneAndUpdate(
            { _id: id },
            { $set: { disable: 'true' } },
            { new: true }
        );

        if (!car) {
            return res.json({status: 404, msg: 'Car not found'});
        }

        return res.json({status: 200, msg: 'Success', car});
    } catch (error) {
        console.error(error);
        return res.json({status: 500, msg: 'Server error'});
    }
};




export const enableCar = async (req, res) => {
    const id = req.headers.token;

    if (!id) {
        return res.json({msg: 'No token found'});
    }

    try {
        const car = await CarModel.findOneAndUpdate(
            { _id: id },
            { $set: { disable: 'false' } },
            { new: true }
        );

        if (!car) {
            return res.json({status: 404, msg: 'Car not found'});
        }

        return res.json({status: 200, msg: 'Success', car});
    } catch (error) {
        console.error(error);
        return res.json({status: 500, msg: 'Server error'});
    }
};




export const random = async (req, res) => {
    try {
        // Get all cars from the database
        const cars = await CarModel.find({});

        // Check the number of cars
        const totalCars = cars.length;

        // If there are no cars, return an empty array
        if (totalCars === 0) {
            return res.json({ cars: [], msg: 'No cars available', status: 200 });
        }

        // Shuffle the cars array
        const shuffledCars = cars.sort(() => 0.5 - Math.random());

        // Get up to 3 random cars
        const randomCars = shuffledCars.slice(0, 3);

        return res.json({ cars: randomCars, status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return res.json({ msg: 'error', status: 500 });
    }
};


export const bookings = async (req, res) => {
    const id = req.headers.id;
  
    if (!id) {
      return res.status(400).json({ msg: 'No ID', status: 400 });
    }
  
    try {
      const bookings = await BookModel.find({ car_id: id });
      return res.status(200).json({ bookings, status: 200 });
    } catch (error) {
      return res.status(500).json({ msg: error.message, status: 500 });
    }
  };



export const contactUs = async (req, res) => {
    try{
        const {name , email , number , message} = req.body;

        (async function () {
            const { data, error } = await resend.emails.send({
              from: 'Acme <onboarding@resend.dev>',
              to: [`stivixhaferri01@gmail.com`],
              subject: `ART Contact US Message`,
              html: `<strong>Name: ${name}   Email: ${email} <br/> Phone ${number} <br/> Message: ${message} </strong>`,
            });
          
            if (error) {
              return console.error({ error });
            }
          
            console.log({ data });
          })();

          return res.json({msg: 'Success', status: 200})

    }catch(error){
        return res.json({msg: error , status: 500})
    }
}