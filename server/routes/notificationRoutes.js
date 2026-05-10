const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/notifications",             verifyToken, controller.getNotifications);
router.put("/notifications/read-all",    verifyToken, controller.readAll);
router.put("/notifications/read/:id",    verifyToken, controller.readOne);

module.exports = router;