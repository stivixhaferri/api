import moment from 'moment';
import axios from 'axios';
import CarModel from '../models/Car.js';
import BookModel from '../models/Book.js';
import UserModel from '../models/User.js';

// PayPal credentials
const PAYPAL_API = 'https://api-m.paypal.com'; // Change to 'https://api-m.paypal.com' for live
const CLIENT_ID = 'AcdZ2-C-uSdPsCKIS3GOt-ry0xWOKo_HPtt_z9e-dyZA7XVNam3xTJqVrLTpmjHBaKRgF0KAVDf4KgRe';
const CLIENT_SECRET = 'EPu_jKUOE_2VjkZ3fXXmA9jnryJOXwrONrysgQ6_putu8zJoQyk12PJrfi5ppZT-i30vI8JEsfsMEzOt';

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
        const { email, phone, startDate, endDate, message, car_id, total, cardNumber, cardExpiry, cardCvc } = req.body;

        console.log('Request body:', req.body);

        if (!email || !phone || !startDate || !endDate || !car_id || !total || !cardNumber || !cardExpiry || !cardCvc) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

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
        const paymentResponse = await axios.post(`${PAYPAL_API}/v1/payments/payment`, {
            intent: 'sale',
            payer: {
                payment_method: 'credit_card',
                funding_instruments: [{
                    credit_card: {
                        number: cardNumber,
                        type: 'visa', // Adjust based on the card type
                        expire_month: cardExpiry.split('/')[0],
                        expire_year: cardExpiry.split('/')[1],
                        cvv2: cardCvc
                    }
                }]
            },
            transactions: [{
                amount: {
                    total: total,
                    currency: 'EUR' 
                },
                description: `Booking for car: ${car.make} ${car.model} ${car.year} from ${startDate} to ${endDate}`
            }],
            redirect_urls: {
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

        return res.status(200).json({ booking, payment: paymentResponse.data, msg: 'Booking successful' });
    } catch (error) {
        console.error('Error during booking process:', error.response ? error.response.data : error.message);
        return res.status(500).json({ msg: error.message });
    }
};
