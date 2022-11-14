const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const validator = require("validator");
const router = express.Router();
const User = require("../models/User");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.files?.picture);
    const user = await User.findOne({ email: req.body.email });
    const avatar = req.files?.picture;

    if (user) {
      res.status(409).json({ message: "This email already has an account" });
    } else {
      if (req.body.email && req.body.password && req.body.username) {
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.body.password + salt).toString(encBase64);

        const newUser = new User({
          email: req.body.email,
          token: token,
          hash: hash,
          salt: salt,
          account: {
            username: req.body.username,
          },
          newsletter: req.body.newsletter,
        });

        if (avatar) {
          const avatarToBe = await cloudinary.uploader.upload(
            convertToBase64(avatar),
            { folder: `/vinted/users/${newUser._id}` }
          );

          Object.assign(newUser.account, {
            avatar: {
              picture: avatarToBe,
            },
          });
        }

        await newUser.save();
        res.status(200).json({
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        res.status(400).json({ message: "Missing parameters" });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const loginUser = await User.findOne({ email: email });

    if (loginUser) {
      const hash = SHA256(password + loginUser.salt).toString(encBase64);

      if (hash === loginUser.hash) {
        res.json({
          id: loginUser.id,
          token: loginUser.token,
          account: {
            username: loginUser.account.username,
          },
        });
      } else {
        res.json({
          error: "unauthorized",
        });
      }
    } else {
      res.json({
        error: "invalid email",
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
