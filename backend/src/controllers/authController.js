const { createToken, validateAdminCredentials } = require("../services/authService");

const loginAdmin = async (req, res, next) => {
  try {
    const admin = await validateAdminCredentials(req.body);
    const token = createToken(admin);

    res.json({
      token,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
};
