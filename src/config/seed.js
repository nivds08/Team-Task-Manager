const prisma = require("./prisma");

const seedRoles = async () => {
  await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin" },
  });

  await prisma.role.upsert({
    where: { name: "user" },
    update: {},
    create: { name: "user" },
  });
};

module.exports = { seedRoles };
