const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const validator = require("validator");
const router = express.Router();
const User = require("../models/User");
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthauticated");
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
      //   console.log(user);
      //   console.log(req.body);
      //   console.log(req.files.picture);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const picture = req.files?.pic;

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

      if (picture) {
        const pictureUploaded = await cloudinary.uploader.upload(
          convertToBase64(picture),
          { folder: `/vinted/offers/${offer._id}` }
        );
        //   console.log(pictureUploaded);
        Object.assign(offer, {
          product_image: pictureUploaded,
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
    console.log(req.query);
    const { title, priceMin, priceMax, numberOfElements, pageNumber, sort } =
      req.query;

    const regex = new RegExp(title, "i");

    // const filters = {};

    const offers = await Offer.find({
      $or: [
        { product_name: regex },
        { product_price: { $gte: Number(priceMin), $lte: Number(priceMax) } },
      ],

      $or: [{ product_price: priceMin }, { product_price: priceMax }],
    })
      .sort({ product_price: sort })
      .limit(numberOfElements)
      .skip(pageNumber * numberOfElements - numberOfElements)
      .select("product_name product_price");
    res.json({ "elements found": offers.length, offers: offers });

    // res.json({ message: "Ok offers" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    console.log(req.path);
    const offer = await Offer.findById(req.path.replace("/offer/", ""))
      .populate("owner")
      .select("username");
    console.log(offer);
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
