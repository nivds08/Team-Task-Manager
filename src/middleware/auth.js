const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const auth = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;
    const tokenFromHeader = bearer && bearer.startsWith("Bearer ") ? bearer.split(" ")[1] : null;
    const token = req.cookies.token || tokenFromHeader;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient permissions" });
  }
  return next();
};

module.exports = { auth, authorize };
