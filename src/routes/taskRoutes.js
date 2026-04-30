const express = require("express");
const { createTask, getTasks, updateTaskStatus } = require("../controllers/taskController");
const { auth, authorize } = require("../middleware/auth");
const { taskCreateValidator, taskStatusValidator } = require("../validators/taskValidators");
const handleValidation = require("../middleware/validation");

const router = express.Router();

router.use(auth);
router.get("/", getTasks);
router.post("/", authorize("admin"), taskCreateValidator, handleValidation, createTask);
router.patch("/:id/status", taskStatusValidator, handleValidation, updateTaskStatus);

module.exports = router;
