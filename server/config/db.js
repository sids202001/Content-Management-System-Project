const mongoose = require('mongoose');
const connectDB = async () => {
  
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect('mongodb+srv://sawantsiddhesh2:a8uRPg5Cz8LiuxRa@cluster0.6t6jx52.mongodb.net/');
    console.log(`Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
  }

}

module.exports = connectDB;
