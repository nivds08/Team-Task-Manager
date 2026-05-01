const prisma = require("../config/prisma");

const createTask = async (req, res) => {
  const { title, description, projectId, assignedTo, status, dueDate } = req.body;
  const projectIdNumber = Number(projectId);
  const assignedToId = Number(assignedTo);

  const project = await prisma.project.findUnique({
    where: { id: projectIdNumber },
    include: { teamMembers: { select: { id: true } } },
  });
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const isAllowed =
    req.user.role === "admin" ||
    project.createdById === req.user.id ||
    project.teamMembers.some((member) => member.id === req.user.id);

  if (!isAllowed) {
    return res.status(403).json({ message: "Not allowed to create task in this project" });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId: projectIdNumber,
      assignedToId,
      status: status || "todo",
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: req.user.id,
    },
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, email: true, role: { select: { name: true } } } },
      createdBy: { select: { id: true, email: true } },
    },
  });

  return res.status(201).json(task);
};

const getTasks = async (req, res) => {
  const where = req.user.role === "admin" ? {} : { assignedToId: req.user.id };
  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, email: true, role: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(tasks);
};

const updateTaskStatus = async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return res.status(404).json({ message: "Task not found" });

  const canUpdate = req.user.role === "admin" || task.assignedToId === req.user.id;
  if (!canUpdate) return res.status(403).json({ message: "Not allowed to update this task" });

  const updatedTask = await prisma.task.update({
    where: { id },
    data: { status },
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, email: true, role: { select: { name: true } } } },
    },
  });

  return res.json(updatedTask);
};

module.exports = { createTask, getTasks, updateTaskStatus };
