const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("✅ Real Estate Webhook for Dialogflow ES is running!");
});

module.exports = router;
