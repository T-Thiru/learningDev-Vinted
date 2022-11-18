const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());

const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

mongoose.connect(process.env.MONGODB_URI);

const userRoutes = require("./routes/userRoutes");
const offerRoutes = require("./routes/offerRoutes");
app.use(userRoutes);
app.use(offerRoutes);

const { createAgent } = require("@forestadmin/agent");
const {
  createMongooseDataSource,
} = require("@forestadmin/datasource-mongoose");
// Retrieve your mongoose connection
const connection = require("./node_modules/mongoose");

// Create your Forest Admin agent
// This must be called BEFORE all other middleware on the app
createAgent({
  authSecret: process.env.FOREST_AUTH_SECRET,
  envSecret: process.env.FOREST_ENV_SECRET,
  isProduction: process.env.NODE_ENV === "production",
})
  // Create your Mongoose datasource
  .addDataSource(createMongooseDataSource(connection))
  // Replace "myExpressApp" by your Express application
  .mountOnExpress(app)
  .start();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

app.all("*", (req, res) => {
  res.status(404).json({
    message: "not available routes",
  });
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
