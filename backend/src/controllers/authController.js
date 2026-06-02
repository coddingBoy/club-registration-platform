const {
  createToken,
  validateAdminCredentials,
  validateParentCredentials,
} = require("../services/authService");

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

const loginParent = async (req, res, next) => {
  try {
    const user = await validateParentCredentials(req.body);
    const token = createToken(user);

    res.json({
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  loginParent,
};
