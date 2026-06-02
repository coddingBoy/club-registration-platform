const express = require("express");
const { loginAdmin, loginParent } = require("../controllers/authController");

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/parent/login", loginParent);

module.exports = router;
