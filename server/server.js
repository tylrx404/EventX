require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const bodyParser = require("body-parser");
const path       = require("path");

const authRoutes         = require("./routes/authRoutes");
const eventRoutes        = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const hostRoutes         = require("./routes/hostRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());

app.use(bodyParser.json({ limit: "15mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "15mb" }));

app.use(express.static(path.join(__dirname, "../client")));

app.use("/api", authRoutes);
app.use("/api", eventRoutes);
app.use("/api", registrationRoutes);
app.use("/api", adminRoutes);
app.use("/api", hostRoutes);
app.use("/api", notificationRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith("/api"))
    return res.status(404).json({ message: "Route not found." });

  res.sendFile(path.join(__dirname, "../client/pages/login.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`  EventX server running on http://localhost:${PORT}`));