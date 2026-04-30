const Project = require("../models/Project");
const User = require("../models/User");

const createProject = async (req, res) => {
  const { name, description, teamMembers = [] } = req.body;
  const members = [...new Set([req.user._id.toString(), ...teamMembers])];

  const project = await Project.create({
    name,
    description,
    createdBy: req.user._id,
    teamMembers: members,
  });

  return res.status(201).json(project);
};

const getProjects = async (req, res) => {
  const query =
    req.user.role === "admin"
      ? {}
      : { $or: [{ createdBy: req.user._id }, { teamMembers: req.user._id }] };

  const projects = await Project.find(query).populate("createdBy", "name email").populate("teamMembers", "name email role");
  return res.json(projects);
};

const addTeamMember = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (!project.teamMembers.some((memberId) => memberId.toString() === userId)) {
    project.teamMembers.push(userId);
    await project.save();
  }

  return res.json(project);
};

module.exports = { createProject, getProjects, addTeamMember };
