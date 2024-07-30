import moment from 'moment';
import axios from 'axios';
import CarModel from '../models/Car.js';
import BookModel from '../models/Book.js';
import UserModel from '../models/User.js';

// PayPal credentials
const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Change to 'https://api-m.paypal.com' for live
const CLIENT_ID = 'AREeG_yknX_zw5tXJ527HXbLSrx3IBfuqr5jUa6hgPM22mHZjPxW8IqSckhM3HMe539Qi2dwsfgjjI7w';
const CLIENT_SECRET = 'AREeG_yknX_zw5tXJ527HXbLSrx3IBfuqr5jUa6hgPM22mHZjPxW8IqSckhM3HMe539Qi2dwsfgjjI7w';

const getAccessToken = async () => {
  try {
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

        // Get PayPal access token
        const accessToken = await getAccessToken();

        // Create a payment with PayPal
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

        // Send the email
        // (Assuming resend client or similar service is configured)
        const emailResponse = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: ['stivixhaferri01@gmail.com'],
            subject: `AlbaniaRentalTourism (ART)`,
            html: `<strong>${email} booked your car: ${car.make} ${car.model} ${car.year} <br/> from date: ${startDate} to ${endDate}. <br/> Client Email: ${email}, Phone Number: ${phone} <br/> Price: ${total * 0.9}</strong>`,
        });

        console.log('Email response:', emailResponse);

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

        return res.status(200).json({ booking, payment: paymentResponse.data, msg: 'Booking successful' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ msg: error.message });
    }
};
