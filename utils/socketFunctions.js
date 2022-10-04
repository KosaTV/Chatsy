const path = require("path");
const fs = require("fs");
const likeSVG = fs.readFileSync(path.join(__dirname, "../assets/like.svg"), {encoding: "utf8"});
const {Conversation} = require("../models/ConversationSchema");
const mongoose = require("mongoose");
const {getDBClientUser} = require("../utils/dbFunctions");

const socketHandleConnection = async socket => {
	const id = socket.user.id;
	const user = await getDBClientUser(id);
	user.active = true;
	await user.save();
	socket.join(id);
};

const socketHandleDisconnection = async (data, socket) => {
	const id = socket.user.id;
	const user = await getDBClientUser(id);
	user.active = false;
	await user.save();
	socket.leave(id);
};

const socketHandleSendMessage = async ({message: text, conversationId, conversationType, type}, socket) => {
	let conversation;
	let friend = false;
	let conversationOfFriend;
	let membersIds;
	let recipients = [];
	let provider;
	const author = await getDBClientUser(socket.user.id);

	let newMessage = {authorId: author._id, readBy: [], type};
	if (type === "message") newMessage = {...newMessage, message: text};
	else newMessage = {...newMessage, message: likeSVG};

	if (conversationType === "group") {
		provider = conversationId;
		conversation = await Conversation.findById(conversationId);
		membersIds = conversation.members.filter(member => member.ownGroup).map(member => member._id.toString());
		conversation.messages.push(newMessage);
		recipients = membersIds;
		if (!conversation.isNewMessages) conversation.isNewMessages = true;
	} else if (conversationType === "user") {
		provider = socket.user.id;
		conversation = author.friends.find(friend => friend._id.toString() === conversationId);
		friend = await getDBClientUser(conversationId);
		recipients = [socket.user.id, friend._id.toString()];
		conversationOfFriend = friend.friends.find(friend => friend._id.toString() === socket.user.id);
		membersIds = friend.friends.map(friend => friend._id.toString());
		if (!conversationOfFriend) return;
		conversation.messages.push(newMessage);
		conversationOfFriend.messages.push(newMessage);
	}

	const conditions = {
		visible: (conversationType === "group" && !conversation.hidden) || conversationType === "user",
		includesMe: conversationId && membersIds.some(id => id === socket.user.id)
	};

	if (Object.values(conditions).includes(false)) return;

	const docsToSave = conversationType === "group" ? conversation.save() : [author.save(), friend.save()];
	const savedDocs = Array.isArray(docsToSave) ? Promise.all(docsToSave) : docsToSave;
	await savedDocs;

	recipients.forEach(recipient => {
		const newRecipients = recipients.filter(r => r !== recipient);
		newRecipients.push(socket.user.id);
		const currentMessage = conversation.messages[conversation.messages.length - 1];
		socket.broadcast.to(recipient).emit("receive-message", {provider, recipients: newRecipients, conversationId, message: currentMessage, type: conversationType});
	});
};

const socketHandleReadMessage = async ({conversationId, conversationType}, socket) => {
	let conversation;
	let friend = false;
	let conversationOfFriend;
	let membersIds;
	let recipients = [];
	let provider;
	let changed = false;
	const author = await getDBClientUser(socket.user.id);

	const readCurrentMessage = ob => {
		if (!ob.messages.length) return;

		const messageToUpdate = ob.messages[ob.messages.length - 1];

		if (messageToUpdate.readBy.includes(socket.user.id) || messageToUpdate.authorId.toString() === socket.user.id) return;
		messageToUpdate.readBy.push(new mongoose.Types.ObjectId(socket.user.id));
		return messageToUpdate;
	};

	if (conversationType === "group") {
		provider = conversationId;
		conversation = await Conversation.findById(conversationId);
		membersIds = conversation.members.map(member => member._id.toString());
		recipients = membersIds;
		changed = readCurrentMessage(conversation);
		if (!conversation.isNewMessages) conversation.isNewMessages = true;
	} else if (conversationType === "user") {
		provider = socket.user.id;
		conversation = author.friends.find(friend => friend._id.toString() === conversationId);
		friend = await getDBClientUser(conversationId);
		recipients = [socket.user.id, friend._id.toString()];
		conversationOfFriend = friend.friends.find(friend => friend._id.toString() === socket.user.id);
		membersIds = friend.friends.map(friend => friend._id.toString());
		if (!conversationOfFriend) return;
		readCurrentMessage(conversation);
		changed = readCurrentMessage(conversationOfFriend);
	}

	if (!changed) return;

	const conditions = {
		visible: (conversationType === "group" && !conversation.hidden) || conversationType === "user",
		includesMe: conversationId && membersIds.some(id => id === socket.user.id)
	};
	if (Object.values(conditions).includes(false)) return;

	const docsToSave = conversationType === "group" ? conversation.save() : [author.save(), friend.save()];
	const savedDocs = Array.isArray(docsToSave) ? Promise.all(docsToSave) : docsToSave;

	await savedDocs;
	socket.emit("did-read-message", {conversationType, conversationId});
};

const socketHandleGroupModify = async ({recipients, groupId, type}, socket) => {
	switch (type) {
		case "delete-group":
			recipients.forEach(id => {
				socket.broadcast.to(id).emit("group-modify", {conversation: groupId, type});
			});
			return;
		case "delete-group-member":
			recipients.forEach(id => {
				socket.broadcast.to(id).emit("group-modify", {conversation: groupId, type});
			});
			return;
		case "add-group-member":
			return;
		case "change-group-name":
			return recipients.forEach(id => {
				socket.broadcast.to(id).emit("group-modify", {conversation: groupId, type});
			});
		case "change-group-picture":
			return recipients.forEach(id => {
				socket.broadcast.to(id).emit("group-modify", {conversation: groupId, type});
			});
		default:
			return;
	}
};

const socketHandleFriendAction = async ({id, eventType, currentConvesationId}, socket) => {
	if (eventType === "add") {
		const user = await getDBClientUser(id);
		if (user.friends.find(friend => friend._id.toString() === socket.user.id)) socket.broadcast.to(id).emit("friend-action", {id: socket.user.id});
	} else if (eventType === "delete") socket.broadcast.to(id).emit("friend-action", {id: socket.user.id});
};

const socketHandleTypingMessage = async ({id, recipients, type}, socket) => {
	const user = await getDBClientUser(socket.user.id);
	let groupIncludesMe;
	let conversation;
	let members;
	let conversationId;

	if (type === "group") {
		members = "members";
		conversationId = id;
		conversation = await Conversation.findById(id);
	} else {
		members = "friends";
		conversationId = socket.user.id;
		conversation = await getDBClientUser(id);
	}

	groupIncludesMe = conversation && conversation[members].some(user => user._id.toString() === socket.user.id);

	if (!groupIncludesMe) return;

	recipients.forEach(recipient => {
		socket.broadcast.to(recipient).emit("current-typing", {personId: user._id, conversationId});
	});
};

const socketHandleStopTypingMessage = async ({id, recipients, type}, socket) => {
	const user = await getDBClientUser(socket.user.id);
	let conversation;
	let members;

	if (type === "group") {
		members = "members";
		conversationId = id;
		conversation = await Conversation.findById(id);
	} else {
		members = "friends";
		conversationId = socket.user.id;
		conversation = await getDBClientUser(id);
	}

	const groupIncludesMe = conversation && conversation[members].some(user => user._id.toString() === socket.user.id);
	if (!groupIncludesMe) return;

	recipients.forEach(recipient => {
		socket.broadcast.to(recipient).emit("stopped-typing", user._id);
	});
};

const socketHandleUserCall = async (data, socket) => {
	const user = await getDBClientUser(socket.user.id);
	socket.broadcast.to(data.userToCall).emit("call-user", {signal: data.signalData, from: {id: socket.user.id, photoURL: user.photoURL, nickName: user.nickName}});
};

const socketHandleAnswerCall = async (data, socket) => {
	socket.broadcast.to(data.to).emit("call-accepted", data.signal);
};

const socketHandleRejectCall = async (data, socket) => {
	socket.broadcast.to(data.to).emit("call-rejected", {from: socket.user.id});
};

const socketHandleLeaveCall = async (data, socket) => {
	socket.broadcast.to(data.to).emit("call-left", {});
};

const socketHandleCancelCall = async (data, socket) => {
	socket.broadcast.to(data.to).emit("call-canceled", {});
};

module.exports = {
	socketHandleFriendAction,
	socketHandleGroupModify,
	socketHandleReadMessage,
	socketHandleSendMessage,
	socketHandleTypingMessage,
	socketHandleStopTypingMessage,
	socketHandleUserCall,
	socketHandleAnswerCall,
	socketHandleLeaveCall,
	socketHandleDisconnection,
	socketHandleRejectCall,
	socketHandleCancelCall,
	socketHandleConnection
};
