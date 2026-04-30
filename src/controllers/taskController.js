const Project = require("../models/Project");
const Task = require("../models/Task");

const createTask = async (req, res) => {
  const { title, description, projectId, assignedTo, status, dueDate } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const isAllowed =
    req.user.role === "admin" ||
    project.createdBy.toString() === req.user._id.toString() ||
    project.teamMembers.some((m) => m.toString() === req.user._id.toString());

  if (!isAllowed) {
    return res.status(403).json({ message: "Not allowed to create task in this project" });
  }

  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignedTo,
    status: status || "todo",
    dueDate,
    createdBy: req.user._id,
  });

  return res.status(201).json(task);
};

const getTasks = async (req, res) => {
  const query = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
  const tasks = await Task.find(query)
    .populate("project", "name")
    .populate("assignedTo", "name email role")
    .sort({ createdAt: -1 });

  return res.json(tasks);
};

const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const canUpdate = req.user.role === "admin" || task.assignedTo.toString() === req.user._id.toString();
  if (!canUpdate) return res.status(403).json({ message: "Not allowed to update this task" });

  task.status = status;
  await task.save();

  return res.json(task);
};

module.exports = { createTask, getTasks, updateTaskStatus };
