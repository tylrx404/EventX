const express = require("express");
const router  = express.Router();
const auth    = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", auth.register);
router.post("/login",    auth.login);

router.put("/profile",          verifyToken, auth.updateProfile);
router.put("/profile/password", verifyToken, auth.changePassword);

module.exports = router;