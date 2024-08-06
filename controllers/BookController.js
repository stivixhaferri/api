// import moment from 'moment';
// import axios from 'axios';
// import CarModel from '../models/Car.js';
// import BookModel from '../models/Book.js';
// import UserModel from '../models/User.js';
// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'stivixhaferri01@gmail.com',
//     pass: `bbgd dkcs zoem hvmr` 
//   }
// });

// // PayPal credentials
// const PAYPAL_API = 'https://api-m.paypal.com'; // Live environment
// const CLIENT_ID = 'Af5oAH4IGvBf74g0OZxQjIu03shlNAehWefT7bcnzSKLbI2C51-808rOsjy71-Dspj4yNJwjOLG7eI6u'; 
// const CLIENT_SECRET = 'EKxhQi-nN_7w_1MqjophSvpwwGh32HScavUuWEzIQGGdeBQImmedn1SKWM-wEwrFinu5LhAzgF0H1d85'; 

// const getAccessToken = async () => {
//   try {
//     console.log('Requesting PayPal access token...');
//     const response = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, 'grant_type=client_credentials', {
//       headers: {
//         'Accept': 'application/json',
//         'Accept-Language': 'en_US',
//         'Content-Type': 'application/x-www-form-urlencoded'
//       },
//       auth: {
//         username: CLIENT_ID,
//         password: CLIENT_SECRET
//       }
//     });
//     console.log('PayPal access token obtained successfully.');
//     return response.data.access_token;
//   } catch (error) {
//     console.error('Error getting PayPal access token:', error.response ? error.response.data : error.message);
//     throw error;
//   }
// };

// const getPayPalOrderId = async (orderId) => {
//   try {
//     const accessToken = await getAccessToken();
//     const response = await axios.get(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${accessToken}`
//       }
//     });
//     const retrievedOrderId = response.data.id;
//     return retrievedOrderId;
//   } catch (error) {
//     console.error('Error retrieving PayPal order ID:', error.response ? error.response.data : error.message);
//     throw error;
//   }
// };

// export const bookNow = async (req, res) => {
//   try {
//     const {email, phone, startDate, endDate, message, car_id, total, cardNumber, cardExpiry, cardCvc} = req.body;

//     console.log('Static data being used:', { email, phone, startDate, endDate, message, car_id, total, cardNumber, cardExpiry, cardCvc });

//     const car = await CarModel.findById(car_id);
//     if (!car) {
//       console.error('No car found with ID:', car_id);
//       return res.status(404).json({ msg: 'No Car Found' });
//     }

//     const user = await UserModel.findById(car.userId);
//     if (!user) {
//       console.error('No user found with ID:', car.userId);
//       return res.status(405).json({ msg: 'No User Found' });
//     }

//     // Generate array of dates between startDate and endDate
//     const start = moment(startDate);
//     const end = moment(endDate);
//     const dateArray = [];
    
//     let currentDate = start;
//     while (currentDate <= end) {
//       dateArray.push(currentDate.format('YYYY-MM-DD'));
//       currentDate = currentDate.add(1, 'days');
//     }
    

//     const accessToken = await getAccessToken();

    
//     const paymentResponse = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, {
//       intent: 'CAPTURE',
//       purchase_units: [{
//         amount: {
//           currency_code: 'EUR',
//           value: total
//         },
//         description: `Booking for car: ${car.make} ${car.model} ${car.year} from ${startDate} to ${endDate}`
//       }],
//       application_context: {
//         return_url: 'https://albaniarentaltourism.com/success',
//         cancel_url: 'https://albaniarentaltourism.com/cancel'
//       }
//     }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${accessToken}`
//       }
//     });

//     console.log('PayPal payment created successfully:', paymentResponse.data);

//     // Get the PayPal order ID
//     const orderId = paymentResponse.data.id;
//     const retrievedOrderId = await getPayPalOrderId(orderId);
    

   




//     car.other = [...car.other, ...dateArray];
//     await car.save();
//     console.log('Car dates updated successfully.');
    
//     // Create the booking
//     const booking = await BookModel.create({
//       email,
//       phone,
//       startDate,
//       endDate,
//       message,
//       total,
//       car_id
//     });
//     console.log('Booking created successfully:', booking);

//     // Send email to the seller
//     const sellerEmail = user.email; // Assuming the seller's email is stored in the user document
//     const discountedTotal = (total * 0.9).toFixed(2);

//     const mailOptions = {
//       from: 'stivixhaferri01@gmail.com',
//       to: sellerEmail,
//       subject: 'New Car Booking Notification',
//       text: `
//         Hello from Albania Rental Tourism,

//         A new booking has been made for your car. Here are the details:

//         Car: ${car.make} ${car.model} ${car.year}
//         Booking Dates: ${startDate} to ${endDate}
//         Total Amount: €${discountedTotal}
       

//         Client Details:
//         Email: ${email}
//         Phone: ${phone}

//         Message: ${message}

//         Thank you,
//         Your Car Rental Team
//       `
//     };

//     await transporter.sendMail(mailOptions);


//     return res.status(200).json({ 
//     //   booking, 
//       booking: paymentResponse.data, 
//     //   paypalOrderId: retrievedOrderId, 
//       msg: 'Booking successful' 
//     });
//   } catch (error) {
//     console.error('Error during booking process:', error.response ? error.response.data : error.message);
//     return res.status(500).json({ msg: error.message });
//   }
// };



import moment from 'moment';
import axios from 'axios';
import CarModel from '../models/Car.js';
import BookModel from '../models/Book.js';
import UserModel from '../models/User.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'stivixhaferri01@gmail.com',
    pass: 'your-email-password' // Consider using environment variables for sensitive data
  }
});

// PayPal credentials
const PAYPAL_API = 'https://api-m.paypal.com'; // Live environment
const CLIENT_ID = 'your-client-id'; 
const CLIENT_SECRET = 'your-client-secret'; 

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

const createOrder = async (accessToken, total, description) => {
  try {
    const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: total.toFixed(2) // Ensure the total is correctly formatted
        },
        description
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
    return response.data;
  } catch (error) {
    console.error('Error creating PayPal order:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const captureOrder = async (accessToken, orderId) => {
  try {
    const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error capturing PayPal order:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const bookNow = async (req, res) => {
  try {
    const { email, phone, startDate, endDate, message, car_id, total } = req.body;

    const car = await CarModel.findById(car_id);
    if (!car) return res.status(404).json({ msg: 'No Car Found' });

    const user = await UserModel.findById(car.userId);
    if (!user) return res.status(404).json({ msg: 'No User Found' });

    const start = moment(startDate);
    const end = moment(endDate);
    const dateArray = [];
    let currentDate = start;
    while (currentDate <= end) {
      dateArray.push(currentDate.format('YYYY-MM-DD'));
      currentDate = currentDate.add(1, 'days');
    }

    const accessToken = await getAccessToken();

    const paymentResponse = await createOrder(accessToken, total, `Booking for car: ${car.make} ${car.model} ${car.year} from ${startDate} to ${endDate}`);
    const orderId = paymentResponse.id;
    await captureOrder(accessToken, orderId);

    car.other = [...car.other, ...dateArray];
    await car.save();

    const booking = await BookModel.create({
      email,
      phone,
      startDate,
      endDate,
      message,
      total,
      car_id
    });

    const sellerEmail = user.email; 
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

    return res.status(200).json({ booking: paymentResponse, msg: 'Booking successful' });
  } catch (error) {
    console.error('Error during booking process:', error.response ? error.response.data : error.message);
    return res.status(500).json({ msg: 'Error processing booking' });
  }
};
