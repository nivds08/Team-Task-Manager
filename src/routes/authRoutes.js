const express = require("express");
const { signup, login, me, logout } = require("../controllers/authController");
const { signupValidator, loginValidator } = require("../validators/authValidators");
const handleValidation = require("../middleware/validation");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signupValidator, handleValidation, signup);
router.post("/login", loginValidator, handleValidation, login);
router.get("/me", auth, me);
router.post("/logout", auth, logout);

module.exports = router;
