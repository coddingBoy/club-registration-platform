const cors = require("cors");
const express = require("express");
const fs = require("fs");
const path = require("path");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const registrationRoutes = require("./routes/registrationRoutes");

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/registrations", registrationRoutes);

const frontendDistPath = path.join(process.cwd(), "..", "frontend", "dist");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(errorHandler);

module.exports = app;
