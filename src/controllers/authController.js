const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const user = await User.create({ name, email, password, role: role || "member" });
  const token = signToken(user._id);

  res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 });

  return res.status(201).json({
    message: "Signup successful",
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user._id);
  res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 });

  return res.json({
    message: "Login successful",
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

const logout = async (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out" });
};

module.exports = { signup, login, me, logout };
