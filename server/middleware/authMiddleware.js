require("dotenv").config();
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "eventx_mmcoe_2026_secret";

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    try { req.user = jwt.verify(token, SECRET); } catch {}
  }
  next();
};

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access required." });
  next();
};

exports.hostOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "host")
    return res.status(403).json({ message: "Host access required." });
  next();
};

exports.adminOrHost = (req, res, next) => {
  if (!req.user || !["admin", "host"].includes(req.user.role))
    return res.status(403).json({ message: "Admin or host access required." });
  next();
};