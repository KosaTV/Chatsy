const express = require("express");
const router = express.Router();

const {getGroup, leaveGroup, addMemberToGroup, handleCreateGroup, getAllGroups, updateGroup, handleDeleteGroup} = require("../controllers/messagesControllers");
const {verify} = require("../controllers/authenticationControllers");

//* get all group
router.get("/", verify, getAllGroups);

//* create a group
router.post("/", verify, handleCreateGroup);

//* delete a group

router.delete("/:id", verify, handleDeleteGroup);

//* get a group
router.get("/:id", verify, getGroup);

//* update a group
router.patch("/:id", verify, updateGroup);

//* leave a group
router.delete("/:id/members/:memberId", verify, leaveGroup);

module.exports = router;
