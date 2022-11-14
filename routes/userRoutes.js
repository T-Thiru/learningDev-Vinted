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
    const { username, email, password, newsletter } = req.body;

    if (validator.isEmail(email)) {
      const checkUser = await User.findOne({ email: email });
      //console.log(checkUser);
      if (checkUser) {
        return res.json({
          message: "email already used",
        });
      }
      if (!username) {
        return res.json({
          message: "please enter username",
        });
      }

      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);

      const user = new User({
        email: email,
        account: {
          username: username,
        },
        newsletter: newsletter,
        token: token,
        hash: hash,
        salt: salt,
      });

      if (req.files.picture) {
        const avatarToBe = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture),
          { folder: `/vinted/users/${user._id}` }
        );

        Object.assign(user.account, {
          avatar: {
            picture: avatarToBe,
          },
        });
      }

      await user.save();
      res.json({
        id: user.id,
        token: user.token,
        account: {
          username: user.account.username,
          avatar: {
            picture: user.account.avatar.picture,
          },
        },
      });
    } else {
      res.json({
        error: "invalid email adress",
      });
    }
  } catch (error) {
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
