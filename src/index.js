const express = require("express");
const bodyParser = require("body-parser");

const homeRoute = require("./routes/home_route");
const dialogflowRoute = require("./routes/dialogflow_route");

const app = express();
app.use(bodyParser.json());

// Routes
app.use("/", homeRoute);
app.use("/webhook", dialogflowRoute);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Webhook running on port ${PORT}`));