const path = require("path");
require("dotenv").config({path: path.join(__dirname, "/.env")});
const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const {Conversation} = require("../models/ConversationSchema");
const jwt = require("jsonwebtoken");
const {body, validationResult} = require("express-validator");

let refreshedTokens = [];

const generateAccessToken = user => {
	const secretKey = process.env.TOKEN_SECRET;
	const expiration = process.env.TOKEN_EXPIRES;
	return jwt.sign({id: user._id}, secretKey, {
		expiresIn: `${expiration}d`
	});
};

const generateRefreshToken = user => {
	const secretKey = process.env.REFRESH_TOKEN_SECRET;

	return jwt.sign({id: user._id}, secretKey);
};

const userLogin = async (req, res) => {
	const userExists = await User.findOne({email: req.body.email});

	let passwordCorrect;
	if (userExists) passwordCorrect = await bcrypt.compare(req.body.password, userExists.password);

	if (passwordCorrect) {
		const token = generateAccessToken(userExists);
		const refreshedToken = generateRefreshToken(userExists);

		refreshedTokens.push(refreshedToken);
		const {password, chatsyToken, ...userData} = userExists._doc;

		const response = {
			user: userData
		};

		userExists.chatsyToken = token;
		try {
			await userExists.save();

			res
				.status(200)
				.cookie("chatsy_token", token, {sameSite: "strict", path: "/", expires: new Date(new Date().getTime + 60000 * 1000), httpOnly: true})
				.cookie("chatsy_refreshToken", refreshedToken, {sameSite: "strict", path: "/", expires: new Date(new Date().getTime + 1440000000 * 1000), httpOnly: true})
				.send(response);

			console.log("data sent");
			return;
		} catch (err) {
			res.status(404).send({error: "not found"});
		}
	}

	return res.status(401).send({error: "Password or login are not correct"});
};

const userLoginAutomatically = async (req, res) => {
	if (!req.cookies) return;

	const token = req.cookies.chatsy_token;

	if (token) {
		const payload = getPayloadFromToken(token);
		if (payload.error) {
			res.status(403).send({error: "Token is not valid"});
		} else {
			req.user = payload.content;
			const user = await User.findById(req.user.id);
			const {password, ...userData} = user._doc;

			const response = {
				user: userData
			};

			if (user.chatsyToken === token) return res.status(200).send(response);
			res.status(404).send({error: "Log out occured, try login again"});
		}
	} else {
		res.status(401).send({error: "Log out occured, try login again"});
	}
};

const getPayloadFromToken = token => {
	let payload;
	jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
		if (err) payload = {error: true, content: err};
		else payload = {error: false, content: user};
	});

	return payload;
};

const verify = (req, res, next) => {
	const token = req.cookies.chatsy_token;

	if (token) {
		const payload = getPayloadFromToken(token);

		if (payload.error) {
			res.status(403).send({error: "Token is not valid"});
		} else {
			req.user = payload.content;
			next();
		}
	} else {
		res.status(401).send({error: "You're not authenticated"});
	}
};

const verifySocket = async (socket, next) => {
	if (!(socket.handshake.query || socket.handshake.query.id)) return next(new Error("Token is not valid"));
	const user = await User.findById(socket.handshake.query.id);

	if (user) {
		const token = user.chatsyToken;

		const payload = getPayloadFromToken(token);

		if (payload.error) {
			return new Error("Token is not valid");
		} else {
			socket.user = payload.content;
			next();
		}
	} else {
		return next(new Error("You're not authenticated"));
	}
};

const refreshTokenController = (req, res) => {
	const refreshToken = req.body.refreshedToken;
	const refreshedSecretKey = process.env.REFRESH_TOKEN_SECRET;
	if (!refreshToken) return res.status(401).send({error: "You're not authenticated"});
	if (!refreshedTokens.includes(refreshToken)) return res.status(403).send({error: "Token is not valid"});

	jwt.verify(refreshToken, refreshedSecretKey, (err, user) => {
		refreshedTokens = refreshedTokens.filter(token => {
			return token !== refreshToken;
		});

		const newAccessToken = generateAccessToken(user);
		const newRefreshedToken = generateRefreshToken(user);

		refreshedTokens.push(newRefreshedToken);

		res.status(200).send({accessToken: newAccessToken, refreshedToken: newRefreshedToken});
	});
};

const userLogout = async (req, res) => {
	refreshedTokens = refreshedTokens.filter(refreshToken => refreshToken !== req.cookies.chatsy_refreshToken);

	const user = await User.findById(req.user.id);
	user.chatsyToken = "";

	try {
		user.save();
	} catch (err) {
		res.status(404).send({error: "not found"});
	}

	res.status(200).clearCookie("chatsy_token").clearCookie("chatsy_refreshToken");
	return res.status(200).send({error: false, info: "You logged out successfully"});
};

const registerValidationSchema = [
	body("name", "Name is incorrect").exists({checkFalsy: true}),
	body("lastName", "Last Name is incorrect").exists({checkFalsy: true}),
	body("email", "Email is incorrect").exists({checkFalsy: true}).isEmail(),
	body("nickName", "NickName should contain from 4 to 10 characters").exists().isLength({min: 4, max: 10}),
	body("password", "Password should contain at least 8 chars").exists().isLength({min: 8})
];

const createUser = async (req, res) => {
	let reqData = req.body;
	const birth = new Date(reqData.birth);

	const userExist = await User.find({$or: [{email: req.body.email}, {nickName: req.body.nickName}]});
	const errors = validationResult(req);
	if (userExist.length) return res.status(409).send({error: "User with that email or nickname already exists"});
	if (birth instanceof Date && !isNaN(birth.valueOf()) && new Date().getFullYear() - birth.getFullYear() < 18)
		return res.status(409).send({error: "Your birth date doesn't meet requirements"});
	if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

	bcrypt.hash(reqData.password, 12).then(hash => {
		const user = new User({
			...reqData,
			nickName: reqData.nickName,
			password: hash,
			chatsyToken: "",
			photoURL: "",
			friends: [],
			groups: []
		});

		//* --- adding new user to default group ---

		Conversation.findById("61799c2d46f5018d737cd7d5").then(group => {
			group.members.push({_id: user._id, role: "user", ownGroup: true});
			user.groups.push(group._id);
			group.save();
			user
				.save()
				.then(() => {
					res.status(200).send({error: false, href: "/"});
				})
				.catch(err => {
					res.status(400).send({error: "Data are not correct"});
				});
		});
	});
};

module.exports = {
	createUser,
	userLogin,
	userLoginAutomatically,
	verify,
	verifySocket,
	userLogout,
	refreshTokenController,
	registerValidationSchema
};
