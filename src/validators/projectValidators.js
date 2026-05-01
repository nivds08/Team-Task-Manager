const { body } = require("express-validator");

const projectCreateValidator = [
  body("name").trim().isLength({ min: 3, max: 120 }),
  body("description").optional().isLength({ max: 1000 }),
  body("teamMembers").optional().isArray(),
  body("teamMembers.*").optional().isInt({ min: 1 }).toInt(),
];

const addTeamMemberValidator = [body("userId").isInt({ min: 1 }).toInt()];

module.exports = { projectCreateValidator, addTeamMemberValidator };
