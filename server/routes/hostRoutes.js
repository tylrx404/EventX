const express  = require("express");
const router   = express.Router();
const host     = require("../controllers/hostController");
const { verifyToken, hostOnly } = require("../middleware/authMiddleware");

const guard = [verifyToken, hostOnly];

router.get("/host/stats",                       guard, host.getStats);
router.get("/host/events",                      guard, host.getEvents);
router.post("/host/events",                     guard, host.createEvent);
router.put("/host/events/:id",                  guard, host.updateEvent);
router.get("/host/events/:id/participants",     guard, host.getParticipants);
router.put("/host/registrations/:id/score",    guard, host.updateScore);
router.get("/host/analytics",                   guard, host.getAnalytics);
router.get("/host/reports/export", guard, host.exportHostReport);

module.exports = router;