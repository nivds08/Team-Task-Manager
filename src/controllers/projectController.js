const prisma = require("../config/prisma");

const createProject = async (req, res) => {
  const { name, description, teamMembers = [] } = req.body;
  const memberIds = [...new Set([req.user.id, ...teamMembers])];

  const existingMembers = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true },
  });
  const members = existingMembers.map((member) => member.id);

  const project = await prisma.project.create({
    data: {
      name,
      description,
      createdById: req.user.id,
      teamMembers: {
        connect: members.map((id) => ({ id })),
      },
    },
    include: {
      createdBy: { select: { id: true, email: true } },
      teamMembers: { select: { id: true, email: true, role: { select: { name: true } } } },
    },
  });

  return res.status(201).json(project);
};

const getProjects = async (req, res) => {
  const where =
    req.user.role === "admin"
      ? {}
      : {
          OR: [{ createdById: req.user.id }, { teamMembers: { some: { id: req.user.id } } }],
        };

  const projects = await prisma.project.findMany({
    where,
    include: {
      createdBy: { select: { id: true, email: true } },
      teamMembers: { select: { id: true, email: true, role: { select: { name: true } } } },
    },
  });
  return res.json(projects);
};

const addTeamMember = async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.body.userId);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { teamMembers: { select: { id: true } } },
  });
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (!project.teamMembers.some((member) => member.id === userId)) {
    await prisma.project.update({
      where: { id },
      data: { teamMembers: { connect: { id: userId } } },
    });
  }

  const updatedProject = await prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, email: true } },
      teamMembers: { select: { id: true, email: true, role: { select: { name: true } } } },
    },
  });

  return res.json(updatedProject);
};

module.exports = { createProject, getProjects, addTeamMember };
