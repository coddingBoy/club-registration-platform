const cors = require("cors");
const express = require("express");
const fs = require("fs");
const path = require("path");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const academyRoutes = require("./routes/academyRoutes");

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/academy", academyRoutes);
app.use("/uploads", (_req, res) => {
  res.status(404).json({ message: "Not found" });
});

const frontendDistPath = path.join(process.cwd(), "..", "frontend", "dist");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(errorHandler);

module.exports = app;
