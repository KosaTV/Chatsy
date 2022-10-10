const express = require("express");
const router = express.Router();

const {refreshTokenController, verify} = require("../controllers/authenticationControllers");

//* refresh a token
router.put("/token", refreshTokenController);

module.exports = router;
