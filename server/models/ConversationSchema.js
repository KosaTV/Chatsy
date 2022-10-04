const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
	{
		authorId: {type: mongoose.SchemaTypes.ObjectId, required: true},
		readBy: [mongoose.SchemaTypes.ObjectId],
		message: {type: "String", required: true},
		type: {type: "String", required: true, default: "message"},
		_id: {type: mongoose.SchemaTypes.ObjectId, required: true, default: mongoose.Types.ObjectId()}
	},
	{timestamps: true}
);

const MemberSchema = new Schema(
	{
		role: {type: "String", required: true},
		banned: {type: "Boolean", required: true, default: false},
		ownGroup: {type: Boolean, required: true, default: false},
		_id: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "User"}
	},
	{timestamps: true}
);

const ConversationSchema = new Schema(
	{
		members: [MemberSchema],
		messages: [MessageSchema],
		photoURL: {type: "String", required: false, default: ""},
		private: {type: Boolean, required: true, default: true},
		hidden: {type: "Boolean", required: true, default: false},
		name: {type: "String", required: true}
	},
	{timestamps: true}
);

const Conversation = mongoose.model("conversation", ConversationSchema);

module.exports = {Conversation, MessageSchema, MemberSchema};
