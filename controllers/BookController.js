import moment from 'moment';
import axios from 'axios';
import CarModel from '../models/Car.js';
import BookModel from '../models/Book.js';
import UserModel from '../models/User.js';
import nodemailer from 'nodemailer'


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'stivixhaferri01@gmail.com',
      pass: `bbgd dkcs zoem hvmr` 
    }
  });

// PayPal credentials
const PAYPAL_API = 'https://api-m.paypal.com'; // Live environment
const CLIENT_ID = 'AcdZ2-C-uSdPsCKIS3GOt-ry0xWOKo_HPtt_z9e-dyZA7XVNam3xTJqVrLTpmjHBaKRgF0KAVDf4KgRe'; // Live Client ID
const CLIENT_SECRET = 'EPu_jKUOE_2VjkZ3fXXmA9jnryJOXwrONrysgQ6_putu8zJoQyk12PJrfi5ppZT-i30vI8JEsfsMEzOt'; // Live Client Secret

const getAccessToken = async () => {
  try {
    console.log('Requesting PayPal access token...');
    const response = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      auth: {
        username: CLIENT_ID,
        password: CLIENT_SECRET
      }
    });
    console.log('PayPal access token obtained successfully.');
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const bookNow = async (req, res) => {
  try {
    // Static data
    const email = "stivixhaferri01@gmail.com";
    const phone = "+1234567890";
    const startDate = "2024-08-01";
    const endDate = "2024-08-05";
    const message = "Looking forward to this rental!";
    const car_id = "66a74212ca6f3e1f2d10fe7a";
    const total = "0.02"; // Ensure this is a numeric string or number as required
    // const cardNumber = "4111111111111111"; // Use a valid test card number
    // const cardExpiry = "06/28";
    // const cardCvc = "123"; // Use a valid CVV for the card
    const cardNumber = "4324781000249263"
    const cardExpiry = "06/28"
    const cardCvc = "908"

    console.log('Static data being used:', { email, phone, startDate, endDate, message, car_id, total, cardNumber, cardExpiry, cardCvc });

    const car = await CarModel.findById(car_id);
    if (!car) {
      console.error('No car found with ID:', car_id);
      return res.status(404).json({ msg: 'No Car Found' });
    }

    const user = await UserModel.findById(car.userId);
    if (!user) {
      console.error('No user found with ID:', car.userId);
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
    console.log('Generated date array:', dateArray);

    // Get PayPal access token
    const accessToken = await getAccessToken();

    // Create a payment with PayPal
    console.log('Creating PayPal payment...');
    const paymentResponse = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: total
        },
        description: `Booking for car: ${car.make} ${car.model} ${car.year} from ${startDate} to ${endDate}`
      }],
      application_context: {
        return_url: 'https://albaniarentaltourism.com/success',
        cancel_url: 'https://albaniarentaltourism.com/cancel'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('PayPal payment created successfully:', paymentResponse.data);

    // Add these dates to the car's `other` array
    car.other = [...car.other, ...dateArray];
    await car.save();
    console.log('Car dates updated successfully.');

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
    console.log('Booking created successfully:', booking);


    // Send email to the seller
    const sellerEmail = user.email; // Assuming the seller's email is stored in the user document
    const discountedTotal = (total * 0.9).toFixed(2);

    const mailOptions = {
      from: 'stivixhaferri01@gmail.com',
      to: sellerEmail,
      subject: 'New Car Booking Notification',
      text: `
        Hello from Albania Rental Tourism,

        A new booking has been made for your car. Here are the details:

        Car: ${car.make} ${car.model} ${car.year}
        Booking Dates: ${startDate} to ${endDate}
        Total Amount: €${discountedTotal}
       

        Client Details:
        Email: ${email}
        Phone: ${phone}

        Message: ${message}

        Thank you,
        Your Car Rental Team
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Notification email sent to the seller.');

    return res.status(200).json({ booking, payment: paymentResponse.data, msg: 'Booking successful' });
  } catch (error) {
    console.error('Error during booking process:', error.response ? error.response.data : error.message);
    return res.status(500).json({ msg: error.message });
  }
};
