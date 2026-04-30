const Task = require("../models/Task");

const getDashboard = async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
  const now = new Date();

  const [tasks, total, todo, inProgress, done, overdue] = await Promise.all([
    Task.find(filter).populate("project", "name").populate("assignedTo", "name email").sort({ dueDate: 1 }),
    Task.countDocuments(filter),
    Task.countDocuments({ ...filter, status: "todo" }),
    Task.countDocuments({ ...filter, status: "in_progress" }),
    Task.countDocuments({ ...filter, status: "done" }),
    Task.countDocuments({ ...filter, status: { $ne: "done" }, dueDate: { $lt: now } }),
  ]);

  return res.json({
    summary: { total, todo, inProgress, done, overdue },
    tasks,
  });
};

module.exports = { getDashboard };
