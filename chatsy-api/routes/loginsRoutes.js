const express = require("express");
const router = express.Router();

const {registerValidationSchema, createUser, userLogin, verify, userLogout, userLoginAutomatically} = require("../controllers/authenticationControllers");

//* Login a user
router.post("/sign-up", registerValidationSchema, createUser);

//* Login a user
router.post("/login", userLogin);

router.post("/auto-login", userLoginAutomatically);

//* logout a user
router.get("/logout", verify, userLogout);

module.exports = router;
