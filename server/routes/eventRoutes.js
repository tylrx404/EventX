const express = require("express");
const router  = express.Router();
const event   = require("../controllers/eventController");
const { verifyToken, adminOnly, optionalAuth } = require("../middleware/authMiddleware");

router.get("/events/upcoming", optionalAuth, event.getUpcomingEvents);
router.get("/events",          optionalAuth, event.getEvents);
router.get("/events/:id",      optionalAuth, event.getEventById);

router.post("/admin/events", verifyToken, adminOnly, event.createEvent);

module.exports = router;