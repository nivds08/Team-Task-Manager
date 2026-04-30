const { body } = require("express-validator");

const signupValidator = [
  body("name").trim().isLength({ min: 2, max: 100 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("role").optional().isIn(["admin", "member"]),
];

const loginValidator = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
];

module.exports = { signupValidator, loginValidator };
