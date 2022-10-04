const express = require("express");
const router = express.Router();

const {addGroup, getAllFriends, getFriend, addFriend, deleteFriend, updateUser} = require("../controllers/messagesControllers");
const {verify} = require("../controllers/authenticationControllers");

//* add a group to user's list
router.post("/groups", verify, addGroup);

//* update user
router.patch("/:id", verify, updateUser);

//* get all friends
router.get("/friends", verify, getAllFriends);

//* get friend
router.get("/friends/:id", verify, getFriend);

//* add a friend
router.post("/friends", verify, addFriend);

//* delete a friend
router.delete("/friends/:id", verify, deleteFriend);

module.exports = router;
