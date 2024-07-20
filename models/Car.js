import mongoose from "mongoose";

const carSchema  = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    make: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    seats: {
        type: Number,
        required: false
    },
    transmission: { // Corrected the typo
        type: String,
        required: true
    },
    fuel: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    cover: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    rate: {
        type: Number,
        required: true
    },
    other:{
        type:[String],
        required:false
    },
    start_date:{
        type:String,
        required:false
    },
    end_date:{
        type:String,
        required:false
    },
    views:{
        type:Number,
        required:false,
        default: 1
    },
    disable:{
        type:String,

        default: 'false'
    }
},{timestamps: true});

const CarModel = mongoose.model("Cars", carSchema);

export default CarModel;
