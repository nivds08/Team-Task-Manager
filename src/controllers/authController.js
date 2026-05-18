const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { sessionCookieOptions, clearSessionCookieOptions } = require("../config/authCookie");

const signToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const signup = async (req, res) => {
  const { email, password, role } = req.body;
  const normalizedEmail = email.toLowerCase();

  try {
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const roleName = role || "user";
    const roleRecord = await prisma.role.findUnique({ where: { name: roleName } });
    if (!roleRecord) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        roleId: roleRecord.id,
      },
      include: { role: true },
    });

    const token = signToken(user.id);

    res.cookie("token", token, sessionCookieOptions());

    return res.status(201).json({
      message: "Signup successful",
      user: { id: user.id, email: user.email, role: user.role.name },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Email already registered" });
    }
    throw error;
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { role: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user.id);
  res.cookie("token", token, sessionCookieOptions());

  return res.json({
    message: "Login successful",
    user: { id: user.id, email: user.email, role: user.role.name },
  });
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

const logout = async (req, res) => {
  res.clearCookie("token", clearSessionCookieOptions());
  return res.json({ message: "Logged out" });
};

module.exports = { signup, login, me, logout };
