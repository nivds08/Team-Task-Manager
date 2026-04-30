const express = require("express");
const { createProject, getProjects, addTeamMember } = require("../controllers/projectController");
const { auth, authorize } = require("../middleware/auth");
const { projectCreateValidator, addTeamMemberValidator } = require("../validators/projectValidators");
const handleValidation = require("../middleware/validation");

const router = express.Router();

router.use(auth);
router.get("/", getProjects);
router.post("/", authorize("admin"), projectCreateValidator, handleValidation, createProject);
router.patch("/:id/team", authorize("admin"), addTeamMemberValidator, handleValidation, addTeamMember);

module.exports = router;
