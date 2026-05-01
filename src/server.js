require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const prisma = require("./config/prisma");
const { seedRoles } = require("./config/seed");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Base routes first so deployments and probes get predictable responses
app.get("/", (req, res) => {
  res.type("text/plain").send("Server is live");
});

app.get("/api", (req, res) => {
  res.type("text/plain").send("API is working");
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));

app.get("/login", (req, res) => res.render("auth/login"));
app.get("/signup", (req, res) => res.render("auth/signup"));
app.get("/app", (req, res) => res.render("dashboard/app"));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ message: "Internal server error", error: err.message });
});

const PORT = process.env.PORT;

const bootstrap = async () => {
  if (!PORT) {
    throw new Error("PORT is required in environment variables");
  }

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required in environment variables");
    }

    await prisma.$connect();
    await seedRoles();
    console.log("Connected to PostgreSQL");
  } catch (error) {
    console.error(`Database unavailable at startup: ${error.message}`);
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

bootstrap().catch((error) => {
  console.error("Failed to bootstrap server", error.message);
  process.exit(1);
});
