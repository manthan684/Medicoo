require("dotenv").config();
const express = require("express"); 
const cors = require("cors");
const mongoose = require("mongoose");
const shoproutes = require("./routes/shoproutes");
const medicineroutes = require("./routes/medicineroutes");
const stockInroutes = require("./routes/stockroutes");
const batchRoutes = require("./routes/batchroutes");
const supplyroutes = require("./routes/supplyroutes");
const authroutes = require("./routes/authroutes");
const { protect } = require("./middleware/authmiddleware");
const alertroutes = require("./routes/alertroutes");
const dashboardroutes = require("./routes/dashboardroutes");
const app = express();
app.use(cors()); // lets react to this server 
app.use(express.json());  //lets the server read json sent to it 
app.use("/api/batches", protect, batchRoutes);
app.use("/api/supply", protect, supplyroutes);
app.use("/api/dashboard", protect, dashboardroutes);
app.use("/api/alerts", protect, alertroutes);
app.use("/api/auth", authroutes);
const PORT = process.env.PORT || 5000;

app.use("/api/shops", protect, shoproutes);
app.use("/api/medicines", protect, medicineroutes);
app.use("/api/stockin", protect, stockInroutes);
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT , () => 
        console.log(`Server is running on port ${PORT}`));
})
.catch((err) => console.log("Database error:" , err.message));