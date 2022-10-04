const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {Conversation, MessageSchema} = require("./ConversationSchema");

const friendSchema = new Schema(
	{
		_id: {
			type: mongoose.SchemaTypes.ObjectId,
			required: true,
			ref: "User"
		},
		messages: [MessageSchema],
		isNewMessages: {type: "Boolean", default: false, required: true}
	},
	{timestamps: true}
);

const userSchema = new Schema(
	{
		name: {type: "String", required: true},
		lastName: {type: "String", required: true},
		nickName: {type: "String", required: true},
		photoURL: {type: "String", required: false},
		friends: [friendSchema],
		groups: [{type: mongoose.SchemaTypes.ObjectId, required: true, ref: Conversation}],
		email: {type: "String", required: true, lowercase: true},
		password: {type: "String", require: true},
		chatsyToken: {type: "String", require: true},
		active: {type: "Boolean", require: true, default: false},
		birth: {
			type: "Date",
			require: true,
			validate: {
				validator: date => {
					const now = new Date();
					const years = now.getFullYear() - date.getFullYear();
					return years > 0 && years < 135;
				}
			}
		},
		gender: {type: "String", require: false}
	},
	{timestamps: true}
);

const User = mongoose.model("User", userSchema);

module.exports = User;
