const { body } = require("express-validator");

const taskCreateValidator = [
  body("title").trim().isLength({ min: 3, max: 200 }),
  body("description").optional().isLength({ max: 1500 }),
  body("projectId").isInt({ min: 1 }).toInt(),
  body("assignedTo").isInt({ min: 1 }).toInt(),
  body("status").optional().isIn(["todo", "in_progress", "done"]),
  body("dueDate").optional().isISO8601(),
];

const taskStatusValidator = [body("status").isIn(["todo", "in_progress", "done"])];

module.exports = { taskCreateValidator, taskStatusValidator };
