const User = require("../models/userSchema");
const {Conversation} = require("../models/ConversationSchema");

const getDBClientUser = async id => {
	if (!id) return;
	const user = await User.findById(id);
	return user;
};

module.exports = {getDBClientUser};
