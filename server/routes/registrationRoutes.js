const express = require("express");
const router  = express.Router();
const reg     = require("../controllers/registrationController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register-event",   verifyToken, reg.registerEvent);
router.get("/my-registrations",  verifyToken, reg.myRegistrations);
router.get("/my-events",         verifyToken, reg.myEvents);
router.get("/my-scores",         verifyToken, reg.myScores);
router.get("/certificates",      verifyToken, reg.getCertificates);
router.post("/verify-qr",        verifyToken, reg.verifyQR);

module.exports = router;