import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = 'mongodb+srv://stivixhaferri01:SLUTKOoW1PZdudZl@cluster0.hwkgbyk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const connect = async () => {
  try {
    await mongoose.connect(uri, {
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err);
    process.exit(1); 
  }
};

export default connect;

