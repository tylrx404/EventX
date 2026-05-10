const express      = require("express");
const router       = express.Router();
const controller   = require("../controllers/adminController");
const eventCtrl    = require("../controllers/eventController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

// Middleware bundle to ensure only authorized admins can access these routes
const guard = [verifyToken, adminOnly];

/** * DASHBOARD & ANALYTICS 
 **/
router.get("/admin/stats", guard, controller.getStats);
router.get("/admin/analytics", guard, controller.getAnalytics);

/** * EVENT MANAGEMENT 
 * Note: Uses eventController for core logic, adminController for list views
 **/
router.get("/admin/events", guard, controller.getEvents);
router.put("/admin/events/:id", guard, eventCtrl.updateEvent);
router.delete("/admin/events/:id", guard, eventCtrl.deleteEvent);

/** * APPROVAL PIPELINE 
 **/
router.get("/admin/approvals", guard, controller.getApprovals);
router.put("/admin/approvals/:eventId", guard, controller.reviewApproval);

/** * PARTICIPANTS & SCORING 
 **/
router.get("/admin/participants", guard, controller.getParticipants);
router.put("/admin/registrations/:id/score", guard, controller.updateScore);
router.post("/admin/verify-qr", guard, controller.verifyQR);

/** * REPORTING & EXPORTS 
 **/
// Master report of all students participating across all events
router.get("/admin/export/all", guard, controller.exportAll); 
// Specific report for a single event
router.get("/admin/export/:event_id", guard, controller.exportEvent);

module.exports = router;