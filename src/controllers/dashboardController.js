const prisma = require("../config/prisma");

const getDashboard = async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { assignedToId: req.user.id };
  const now = new Date();

  const [tasks, total, todo, inProgress, done, overdue] = await Promise.all([
    prisma.task.findMany({
      where: filter,
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.task.count({ where: filter }),
    prisma.task.count({ where: { ...filter, status: "todo" } }),
    prisma.task.count({ where: { ...filter, status: "in_progress" } }),
    prisma.task.count({ where: { ...filter, status: "done" } }),
    prisma.task.count({ where: { ...filter, status: { not: "done" }, dueDate: { lt: now } } }),
  ]);

  return res.json({
    summary: { total, todo, inProgress, done, overdue },
    tasks,
  });
};

module.exports = { getDashboard };
