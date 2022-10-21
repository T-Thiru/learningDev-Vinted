const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());

const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const userRoutes = require("./routes/userRoutes");
const offerRoutes = require("./routes/offerRoutes");
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({
    message: "not available routes",
  });
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
