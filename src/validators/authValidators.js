const { body } = require("express-validator");

const signupValidator = [
  body("email").isEmail().normalizeEmail(),
  body("password").trim().notEmpty().withMessage("Password is required"),
  body("role").optional().isIn(["admin", "user"]),
];

const loginValidator = [
  body("email").isEmail().normalizeEmail(),
  body("password").trim().notEmpty().withMessage("Password is required"),
];

module.exports = { signupValidator, loginValidator };
