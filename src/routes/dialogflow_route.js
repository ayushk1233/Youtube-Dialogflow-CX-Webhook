const express = require("express");
const router = express.Router();
const { handlePropertySearch } = require("../controllers/export_controller");

router.post("/", async (req, res) => {
  try {
    console.log("🔥 Webhook request:", JSON.stringify(req.body, null, 2));
    
    // Debug parameters before processing
    const params = req.body.queryResult?.parameters || {};
    console.log("Raw parameters:", params);
    console.log("BHK config:", params["bhk-config"]);
    console.log("Location:", params.location);
    console.log("Budget:", params.budget);
    console.log("Property type:", params["property-type"]);
    
    const response = await handlePropertySearch(req.body);
    console.log("Response:", response);
    res.json(response);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    console.error("Error stack:", err.stack);
    res.json({
      fulfillmentMessages: [
        { text: { text: ["⚠️ Sorry, something went wrong in the webhook."] } },
      ],
    });
  }
});

module.exports = router;
