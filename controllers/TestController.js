import express from "express";
import connect from "../config/db.js";
import CarModel from "../models/Car.js";


export async function changeLocations(req, res) {
    try{
        const newLocation = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d47934.10796158665!2d19.817823200000003!3d41.3331847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1350310470fac5db%3A0x40092af10653720!2sTirana!5e0!3m2!1sen!2s!4v1722538617487!5m2!1sen!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';

        // Update all cars' location
        const result = await CarModel.updateMany({}, { $set: { location: newLocation } });
    
        res.status(200).json({
          message: 'All cars updated successfully',
          modifiedCount: result.nModified,
        });
    }catch(error){
        return res.json({status: 500, msg: error})
    }
}