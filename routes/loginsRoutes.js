const express = require("express");
const router = express.Router();

const {give, registerValidationSchema, createUser, userLogin, verify, userLogout, userLoginAutomatically} = require("../controllers/authenticationControllers");

router.get("/give", give);

//* Login a user
router.post("/sign-up", registerValidationSchema, createUser);

//* Login a user
router.post("/login", userLogin);

router.get("/auto-login", userLoginAutomatically);

//* logout a user
router.get("/logout", verify, userLogout);

module.exports = router;
