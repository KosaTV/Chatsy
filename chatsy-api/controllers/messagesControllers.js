const path = require("path");
const User = require("../models/userSchema");
const {Conversation} = require("../models/ConversationSchema");
const mongoose = require("mongoose");
const {getDBClientUser} = require("../utils/dbFunctions");

require("dotenv").config({path: path.join(__dirname, "/.env")});

const handleCreateGroup = async (req, res) => {
	let {name, members} = req.body;
	let currentUser = await getDBClientUser(req.user.id);
	let groupMembers = await members.filter(id => {
		const user = getDBClientUser(id);
		return user && user._id !== req.user.id;
	});

	groupMembers = groupMembers.map(memberId => {
		return {_id: new mongoose.Types.ObjectId(memberId), ownGroup: false, role: "user"};
	});

	const groupId = new mongoose.Types.ObjectId();

	const conversation = new Conversation({
		_id: groupId,
		members: [...groupMembers, {_id: new mongoose.Types.ObjectId(req.user.id), role: "admin", ownGroup: true}],
		name,
		messages: []
	});

	currentUser.groups.push(groupId);
	currentUser
		.save()
		.then(() => {
			conversation
				.save()
				.then(result => {
					res.status(200).send({error: null, id: groupId});
				})
				.catch(err => {
					console.error(err);
					return res.status(400).send({error: "Group can not be created", serverError: err});
				});
		})
		.catch(err => console.log(err));
};

const getGroup = async (req, res) => {
	const group = await Conversation.findById(req.params.id);

	if (!group) {
		const currentUser = await getDBClientUser(req.user.id);
		//* automatically remove group when doesn't exist
		if (currentUser.groups.includes(req.params.id)) {
			currentUser.groups = currentUser.groups.filter(id => id.toString() !== req.params.id);
			await currentUser.save();
		}
		return res.status(404).send({error: "Group not found"});
	}

	const conditions = {
		visible: !group?.hidden,
		includesMe: group?.members.some(user => user._id.toString() === req.user.id) || group._id.toString() === "61799c2d46f5018d737cd7d5"
	};

	if ((group && !Object.values(conditions).includes(false)) || !group?.private) {
		const members = await Promise.all(
			group.members.map(async member => {
				const memberData = await getDBClientUser(member._id);
				if (!memberData) return;
				const {role} = member;
				const {_id, nickName: nick, photoURL} = memberData;

				return {nick, _id, photoURL, role};
			})
		);

		//* Send groupData
		const {_id: id, messages, name, isNewMessages, photoURL} = group;
		return res.status(200).send({id, messages, name, members, isNewMessages, photoURL});
	}
	return res.status(404).send({error: "Group has not been found"});
};

const leaveGroup = async (req, res) => {
	const group = await Conversation.findById(req.params.id);
	const user = await User.findById(req.params.memberId);

	const leavingMember = group?.members.find(user => user._id.toString() === req.params.memberId);
	const conditions = {
		isNotGlobal: group._id.toString() !== "61799c2d46f5018d737cd7d5",
		includesMe: !!leavingMember
	};

	if (group && !Object.values(conditions).includes(false) && leavingMember.role !== "admin") {
		const newMembersList = group.members.filter(user => user._id.toString() !== req.params.memberId);
		const newGroupsList = user.groups.filter(groupId => groupId.toString() !== req.params.id);
		group.members = newMembersList;
		user.groups = newGroupsList;

		await Promise.all([group.save(), user.save()]);
		return res.status(200).send({callbackGroup: "61799c2d46f5018d737cd7d5"});
	}
	return res.status(401).send({error: "You can not leave a group"});
};

const getAllGroups = async (req, res) => {
	try {
		const user = await getDBClientUser(req.user.id);

		const detailGroups = await Promise.all(
			user.groups.map(async groupID => {
				const conversation = await Conversation.findById(groupID);

				return {_id: groupID, photoURL: conversation.photoURL};
			})
		);

		res.status(200).send(detailGroups);
	} catch (err) {
		console.log(err);
		res.status(404).send({error: "not found", serverError: err});
	}
};

const getAllFriends = async (req, res) => {
	const userData = req.user;
	try {
		const user = await getDBClientUser(userData.id);
		const detailFriends = await Promise.all(
			user.friends.map(async friend => {
				const moreDetailsOfFriend = await getDBClientUser(friend._id);
				return {
					_id: friend._id,
					messages: friend.messages,
					isNewMessages: friend.isNewMessages,
					photoURL: moreDetailsOfFriend.photoURL,
					ownName: moreDetailsOfFriend.nickName,
					active: moreDetailsOfFriend.active
				};
			})
		);

		res.status(200).send(detailFriends);
	} catch (err) {
		res.status(404).send({error: "not found", serverError: err});
	}
};

const getFriend = async (req, res) => {
	const user = await getDBClientUser(req.user.id);

	const friend = user.friends.find(friend => friend._id.toString() === req.params.id);
	const moreDataOfFriend = await getDBClientUser(req.params.id);

	const accepted = !!moreDataOfFriend.friends.some(obj => {
		return obj._id.toString() === req.user.id;
	});

	if (friend) {
		//* Send userData
		res.status(200).send({
			id: friend._id,
			name: moreDataOfFriend.nickName,
			messages: friend.messages,
			members: [
				{_id: user._id, role: "user", nick: user.nickName, photoURL: user.photoURL},
				{_id: friend._id, role: "user", nick: moreDataOfFriend.nickName, photoURL: moreDataOfFriend.photoURL}
			],
			photoURL: moreDataOfFriend.photoURL,
			accepted
		});
	} else {
		res.status(404).send({error: "user doesn't exist: "});
	}
};

const addGroup = async (req, res) => {
	const data = req.body;
	if (!mongoose.Types.ObjectId.isValid(data.id)) return res.status(400).send({error: "incorrect id of group: "});
	const user = await getDBClientUser(req.user.id);
	const group = await Conversation.findById(data.id);

	const conditions = {
		visible: !group.hidden,
		includesMe: group.members.some(user => user._id.toString() === req.user.id)
	};

	if (((group && !Object.values(conditions).includes(false)) || !group?.private) && !user.groups.find(id => id.toString() === data.id)) {
		user.groups.push(group._id);
		group.members = group.members.filter(member => member._id.toString() !== req.user.id);
		group.members.push({_id: new mongoose.Types.ObjectId(req.user.id), role: "user", ownGroup: true});

		try {
			await user.save();
			await group.save();
			return res.status(200).send({id: group._id, messages: group.messages, name: group.name, members: group.members});
		} catch (err) {
			return res.status(404).send({error: "Group doesn't include you"});
		}
	} else {
		if (!conditions.includesMe) res.status(406).send({error: "You're not a member of this group"});
		else return res.status(404).send({error: "Group has not been found"});
	}
};

const handleDeleteGroup = async (req, res) => {
	const data = req.params;
	if (!mongoose.Types.ObjectId.isValid(data.id)) return res.status(400).send({error: "incorrect id of group: "});
	const user = await getDBClientUser(req.user.id);
	const group = await Conversation.findById(data.id);

	const conditions = {
		visible: !group.hidden,
		includesMeAsAnAdmin: group.members.some(user => user._id.toString() === req.user.id && user.role === "admin")
	};

	if (((group && !Object.values(conditions).includes(false)) || !group?.private) && user.groups.find(id => id.toString() === data.id)) {
		const members = await Promise.all(
			group.members.map(async member => {
				const newMember = await User.findById(member._id);
				return newMember;
			})
		);

		try {
			members.forEach(async member => {
				member.groups = member.groups = member.groups.filter(groupId => groupId.toString() !== group._id.toString());
				await member.save();
			});

			await group.deleteOne();
			return res.status(200).send({info: "Removed successfully"});
		} catch (err) {
			return res.status(404).send({error: "We can't remove that Group"});
		}
	} else {
		if (!conditions.includesMeAsAnAdmin) res.status(406).send({error: "You don't have a permissions to do it"});
		else return res.status(404).send({error: "Group has not been found"});
	}
};

const updateGroup = async (req, res) => {
	const data = req.body;
	const group = await Conversation.findById(req.params.id);

	let additionalErrors = [];

	if (group._id.toString() === "61799c2d46f5018d737cd7d5" && !data.name) return res.status(400).send({error: "Could not do that operation"});

	if (data.name) group.name = data.name;
	else if (data.newMembers) {
		const conditions = {
			isNotGlobal: group._id.toString() !== "61799c2d46f5018d737cd7d5",
			notIncludesMe: !group.members.find(member => member._id.toString() === data.memberId)
		};

		const isDuplicate = data.newMembers.some(newMember => {
			return group.members.find(member => member._id.toString() === newMember);
		});

		if (!Object.values(conditions).includes(false) && !isDuplicate) {
			const members = data.newMembers.map(id => {
				return {role: "user", ownGroup: false, _id: new mongoose.Types.ObjectId(id)};
			});

			group.members = [...group.members, ...members];
		}
	} else if (data.removeMembers) {
		let membersToRemove = data.removeMembers;
		if (membersToRemove.includes(req.user.id)) membersToRemove = membersToRemove.filter(id => id !== req.user.id);

		let amountOfMembersOverall = group.members;

		membersToRemove.forEach(memberId => {
			amountOfMembersOverall = amountOfMembersOverall.filter(member => {
				return member._id.toString() !== memberId;
			});
		});

		await membersToRemove.forEach(async memberId => {
			const user = await getDBClientUser(memberId);
			user.groups = user.groups.filter(groupId => groupId.toString() !== group._id.toString());
			try {
				await user.save();
			} catch (err) {
				additionalErrors.push("couldn't remove group from user list");
			}
		});

		group.members = amountOfMembersOverall;
	} else if (data.photoURL) {
		group.photoURL = data.photoURL;
	}

	const sendableErrorInfo = {error: "Could not do that operation"};
	if (additionalErrors.length) return res.status(400).send(sendableErrorInfo);

	try {
		await group.save();
		return res.status(200).send({error: null});
	} catch (err) {
		console.log(err);
		return res.status(400).send(sendableErrorInfo);
	}
};

const addFriend = async (req, res) => {
	const data = req.body;
	if (!mongoose.Types.ObjectId.isValid(data.id) || data.id === req.user.id) return res.status(400).send({error: "incorrect id of user: "});

	const user = await getDBClientUser(req.user.id);
	const friend = await getDBClientUser(data.id);

	const includedAlready = user.friends.find(member => member._id.toString() === friend._id.toString());

	if (includedAlready) return res.status(409).send({error: "Friend already owned: "});

	if (friend) {
		user.friends.push({_id: friend._id});
		user
			.save()
			.then(result => {
				res.status(200).send({error: null, id: friend._id});
			})
			.catch(err => console.log("we can not add user to your friend: ", err));
	} else {
		res.status(404).send({error: "user doesn't exist: "});
	}
};

const deleteFriend = async (req, res) => {
	const id = req.params.id;
	const user = await getDBClientUser(req.user.id);

	if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send({error: "incorrect id of user: "});
	const filteredFriends = user.friends.filter(friend => friend._id.toString() !== id);

	user.friends = filteredFriends;
	user
		.save()
		.then(result => {
			res.status(200).send({error: null, id});
		})
		.catch(err => console.log("we can not delete a user from your friends: ", err));
};

const updateUser = async (req, res) => {
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send({error: "incorrect id of user: "});
	const user = await getDBClientUser(req.params.id);
	const data = req.body;
	if (data.photoURL) user.photoURL = data.photoURL;
	else if (data.nickName) user.nickName = data.nickName;

	try {
		await user.save();
		return res.status(200).send({error: null, info: "Data updated successfully"});
	} catch (err) {
		return res.status(404).send({error: "something went wrong"});
	}
};

module.exports = {
	addGroup,
	handleDeleteGroup,
	getGroup,
	updateGroup,
	leaveGroup,
	handleCreateGroup,
	addFriend,
	deleteFriend,
	getAllGroups,
	getFriend,
	getAllFriends,
	updateUser
};
