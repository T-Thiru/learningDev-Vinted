const express = require("express");
const fileUpload = require("express-fileupload");
require("dotenv").config();
const cloudinary = require("cloudinary").v2;
// const validator = require("validator");
const router = express.Router();
const User = require("../models/User");
const Offer = require("../models/Offer");
const Payment = require("../models/Payment");
const isAuthenticated = require("../middlewares/isAuthauticated");
const stripe = require("stripe")(process.env.STRIPE_API_SECRET);
const { $where } = require("../models/User");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const user = req.user;
      // console.log(user);
      console.log(req.body);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const pics = Object.values(req.files);
      console.log(pics[1]);

      const offer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { marque: brand },
          { taille: size },
          { etat: condition },
          { color: color },
          { emplacement: city },
        ],
        owner: user._id,
      });

      if (pics) {
        const pictureUploaded = pics.map((picture) => {
          return cloudinary.uploader.upload(convertToBase64(picture), {
            folder: `/vinted/offers/${offer._id}`,
          });
        });

        const result = await Promise.all(pictureUploaded);

        console.log(result);

        Object.assign(offer, {
          product_image: result[0],
          product_pictures: result,
        });
      }
      await offer.save();
      const finalOffer = await offer.populate("owner");
      res.json(finalOffer);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.put("/offer/update", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    console.log(req.body);
    const { id, price, description } = req.body;
    const offerToUpdate = await Offer.findByIdAndUpdate(
      id,
      {
        product_price: price,
        product_description: description,
      },
      { new: true }
    );
    // console.log(offerToUpdate);
    res.json({ uptdated: offerToUpdate });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete(
  "/offer/delete",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    console.log(req.body);
    // const offerToDelete = await Offer.findById(req.body.id);
    // console.log(offerToDelete);

    await cloudinary.api.delete_all_resources(`/vinted/offers/${req.body.id}`);
    await cloudinary.api.delete_folder(`/vinted/offers/${req.body.id}`);

    await Offer.findByIdAndDelete({ _id: req.body.id });
    res.json({ message: "OK deleted" });
    try {
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.post("/test", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    console.log(req.body);

    res.json({
      message: "ok test",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    let filters = {};

    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filters.product_price = {
        $gte: req.query.priceMin,
      };
    }

    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }

    let sort = {};

    if (req.query.sort === "price-desc") {
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") {
      sort = { product_price: 1 };
    }

    let page;
    if (Number(req.query.page) < 1) {
      page = 1;
    } else {
      page = Number(req.query.page);
    }

    let limit = Number(req.query.limit);

    const offers = await Offer.find(filters)
      .populate("owner")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await Offer.countDocuments(filters);

    res.json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate("owner");
    res.json(offer);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});

router.post("/payment", async (req, res) => {
  try {
    console.log(req.body);
    const stripeToken = req.body.stripeToken;
    const offer = await Offer.findById(req.body.offerId).populate("owner");
    // const user = await User.findById(req.body.client);
    // Créer la transaction
    console.log(offer);
    const response = await stripe.charges.create({
      amount: offer.product_price * 100,
      currency: "eur",
      description: offer.product_name,
      source: stripeToken,
    });
    console.log(response.status);

    // TODO
    // Sauvegarder la transaction dans une BDD MongoDB

    const payment = new Payment({
      transation: response,
    });
    await payment.save();

    res.json(response);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
