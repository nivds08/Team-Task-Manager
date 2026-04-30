const { body } = require("express-validator");

const projectCreateValidator = [
  body("name").trim().isLength({ min: 3, max: 120 }),
  body("description").optional().isLength({ max: 1000 }),
  body("teamMembers").optional().isArray(),
];

const addTeamMemberValidator = [body("userId").isMongoId()];

module.exports = { projectCreateValidator, addTeamMemberValidator };
