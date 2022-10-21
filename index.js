const express = require("express");

const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const app = express();
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/vintedAuth");

cloudinary.config({
  cloud_name: "dvvgqedzk",
  api_key: "627814132946492",
  api_secret: "jFPeM1f8PPGW1TjUb3sj_OiQmek",
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

app.listen(3000, () => {
  console.log("Server has started");
});
