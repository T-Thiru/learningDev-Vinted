const mongoose = require("mongoose");

const Payment = mongoose.model("Payment", {
  transation: Object,
});

module.exports = Payment;
