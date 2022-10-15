import React, {useState, useContext, useEffect, useRef} from "react";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import {useSocket} from "../contexts/SocketProvider";
import notificationSoundURL from "../assets/sounds/notification.mp3";
import textingSoundURL from "../assets/sounds/texting.mp3";
import callSoundURL from "../assets/sounds/call.mp3";
import callingSoundURL from "../assets/sounds/calling.mp3";
import callerLeftSoundURL from "../assets/sounds/caller_left.mp3";
import callAcceptedSoundURL from "../assets/sounds/call_accepted.mp3";
import callRejectedSoundURL from "../assets/sounds/call_rejected.mp3";
import errorSoundURL from "../assets/sounds/error.mp3";
import {getUserMediaDevices, getUserMediaDevicesStream} from "../utils/browserAPIFunctions";
import Peer from "simple-peer";
import process from "process";

window.process = process;
window.global = window;
window.buffer = [];

const ConversationContext = React.createContext({});

const useConversation = () => {
	return useContext(ConversationContext);
};

function ConversationContextProvider({children}) {
	const [selectedContact, setSelectedContact] = useState(undefined);
	const [conversationLoaded, setConversationLoaded] = useState(false);
	const [receivedMessages, setReceivedMessages] = useState([]);
	const [activeConversationId, setActiveConversationId] = useState("");
	const [friends, setFriends] = useState([]);
	const [groups, setGroups] = useState([]);
	const [activeTab, setActiveTab] = useState(0);

	const [sounds, setSounds] = useState({
		textingSound: new Audio(textingSoundURL),
		notificationSound: new Audio(notificationSoundURL),
		callSound: new Audio(callSoundURL),
		callingSound: new Audio(callingSoundURL),
		callerLeftSound: new Audio(callerLeftSoundURL),
		callAcceptedSound: new Audio(callAcceptedSoundURL),
		callRejectedSound: new Audio(callRejectedSoundURL),
		errorSound: new Audio(errorSoundURL)
	});

	const [userStream, setUserStream] = useState();
	const [callerSignal, setCallerSignal] = useState(null);
	const [caller, setCaller] = useState(null);
	const [callMaking, setCallMaking] = useState(false);
	const [recipient, setRecipient] = useState(null);
	const [startedCalling, setStartedCalling] = useState(false);
	const myCameraVideo = useRef();
	const friendCameraVideo = useRef();
	const connectionRef = useRef();

	const [videoSettings, setVideoSettings] = useState({muted: false, video: true, friendMuted: false});
	const [toggleMenu, setToggleMenu] = useState(false);
	const [tabsNotifications, setTabsNotifications] = useState([
		{title: "search", notification: false, index: 0},
		{title: "contacts", notification: false, index: 1},
		{title: "groups", notification: false, index: 2},
		{title: "settings", notification: false, index: 3}
	]);

	const userSettings = useUserSettings();
	const socket = useSocket();

	useEffect(() => {
		refreshGroups();
		refreshFriends();
		setSounds(sounds => {
			const loopedCallSound = sounds.callSound;
			loopedCallSound.loop = true;

			const loopedCallingSound = sounds.callingSound;
			loopedCallingSound.loop = true;

			return {...sounds, loopedCallSound, loopedCallingSound};
		});
		sounds.callSound.loop = true;
	}, []);

	useEffect(() => {
		if (!socket) return;
		socket.on("group-modify", data => {
			switch (true) {
				case data.type === "delete-group" || data.type === "delete-group-member":
					if (selectedContact.id === data.conversation) handleConversation("61799c2d46f5018d737cd7d5");
					refreshGroups();
					return;
				case data.type === "add-group-member":
					return;
				case data.type === "change-group-name" || data.type === "change-group-picture":
					if (selectedContact.id === data.conversation) handleConversation(data.conversation);
					refreshGroups();
					return;
				default:
					return;
			}
		});

		socket.on("friend-action", data => {
			if (selectedContact.id === data.id) handleConversation(data.id, true, "user");
		});

		socket.on("call-left", data => {
			setCallerSignal(null);
			setRecipient(null);
			sounds.callerLeftSound.play();
			connectionRef.current.destroy();
		});

		socket.on("call-user", data => {
			appearReceivingCallPopup({caller: data.from, callerSignal: data.signal});
		});

		socket.on("call-rejected", data => {
			setCallMaking(null);
			setCaller(null);
			sounds.callingSound.pause();
			sounds.callRejectedSound.play();
			setSounds(sounds => {
				const restartedCallingSound = sounds.callingSound;
				restartedCallingSound.currentTime = 0;
				return {...sounds, restartedCallingSound};
			});
			connectionRef.current.destroy();
		});

		socket.on("call-canceled", data => {
			disappearReceivingCallPopup();
		});

		return () => {
			socket.off("group-modify");
			socket.off("friend-action");
			socket.off("call-user");
			socket.off("call-rejected");
			socket.off("call-canceled");
			socket.off("call-left");
		};
	}, [socket, selectedContact]);

	const getUserStream = (err, stream) => {
		setUserStream(stream);
		myCameraVideo.current.srcObject = stream;
		return {error: err, stream: stream};
	};

	useEffect(() => {
		(async () => {
			const result = await getUserMediaDevicesStream({video: true, audio: true}, getUserStream);
			if (!result.error) return;

			const reserveDevices = await getUserMediaDevicesStream({video: false, audio: true}, getUserStream);
			if (!reserveDevices.error) return;

			return console.error("we could not get any media device");
		})();
	}, []);

	const callUser = userId => {
		if (startedCalling) return;
		setStartedCalling(true);

		let peer = new Peer({
			initiator: true,
			trickle: false,
			stream: userStream
		});
		connectionRef.current = peer;

		const userInfo = friends.find(friend => friend._id === userId);

		peer.on("signal", data => {
			sounds.callingSound.play();
			setCallMaking({id: userId, ownName: userInfo.ownName, photoURL: userInfo.photoURL});
			setStartedCalling(false);
			socket.emit("call-user", {
				userToCall: userId,
				signalData: data
			});
		});

		peer.on("stream", stream => {
			friendCameraVideo.current.srcObject = stream;
		});

		peer.on("close", () => {
			socket.off("call-accepted");
		});

		socket.on("call-accepted", signal => {
			sounds.callingSound.pause();
			sounds.callAcceptedSound.play();
			setSounds(sounds => {
				const restartedCallingSound = sounds.callingSound;
				restartedCallingSound.currentTime = 0;
				return {...sounds, restartedCallingSound};
			});
			setCallerSignal(signal); //* not neccessary for person who started call
			setRecipient(userId);
			setCallMaking(null);
			peer.signal(signal);
		});
	};

	const acceptCall = () => {
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: userStream
		});

		connectionRef.current = peer;
		sounds.callAcceptedSound.play();

		peer.on("signal", data => {
			socket.emit("call-accepted", {signal: data, to: caller.id});
			setRecipient(caller.id);
			sounds.callSound.currentTime = 0;
			sounds.callSound.pause();
		});

		peer.on("stream", stream => {
			friendCameraVideo.current.srcObject = stream;
		});

		peer.signal(callerSignal);

		setCaller(null);
	};

	const leaveVideoCall = () => {
		connectionRef.current.destroy();

		sounds.callerLeftSound.play();
		const sendTo = recipient;
		socket.emit("call-left", {to: sendTo});
		setCallerSignal(null);
		setRecipient(null);
	};

	const cancelVideoCall = () => {
		connectionRef.current.destroy();

		sounds.callingSound.pause();
		setSounds(sounds => {
			const restartedCallingSound = sounds.callingSound;
			restartedCallingSound.currentTime = 0;
			return {...sounds, restartedCallingSound};
		});
		setCallMaking(null);
		setStartedCalling(false);
		socket.emit("call-canceled", {to: callMaking.id});
	};

	const rejectCall = () => {
		setCallerSignal(null);
		setCaller(null);
		disappearReceivingCallPopup();
		socket.emit("call-rejected", {to: caller.id});
	};

	const getGroup = async id => {
		let data;

		try {
			const result = await userSettings.handleServerData("GET", `/groups/${id}`);

			data = result;
		} catch (err) {
			console.log("Have not found", err);
		}
		return data;
	};

	const leaveGroup = async (id, memberId = undefined) => {
		let data;
		try {
			const result = await userSettings.handleServerData("delete", `/groups/${id}/members/${memberId}`);
			data = result;
			refreshGroups();
			handleConversation("61799c2d46f5018d737cd7d5");
		} catch (err) {
			console.log("Have not found", err);
		}
		return data;
	};

	const addMemberToGroup = async (id, memberId) => {
		let data;

		try {
			const sendData = JSON.stringify({id, memberId});
			const result = await userSettings.handleServerData("POST", `/groups/${id}/members`, sendData);
			data = result;
		} catch (err) {
			console.log("Have not found", err);
		}
		return data;
	};

	const getFriend = async id => {
		try {
			const result = await userSettings.handleServerData("GET", `/user/friends/${id}`);
			const data = result;
			return data;
		} catch (err) {
			console.log("Have not found", err);
		}
	};

	const getGroups = async () => {
		try {
			const result = await userSettings.handleServerData("GET", `/groups`);
			return result;
		} catch (err) {
			return err;
		}
	};

	const addGroup = async id => {
		try {
			const sendData = JSON.stringify({id});
			const result = await userSettings.handleServerData("POST", `/user/groups`, sendData);
			return result;
		} catch (err) {
			console.log("Have not found", err);
			return err;
		}
	};

	const getFriends = async e => {
		try {
			const result = await userSettings.handleServerData("GET", `/user/friends`);
			return result;
		} catch (err) {
			console.log("Have not found", err);
			return err;
		}
	};

	const addFriend = async id => {
		try {
			const sendData = JSON.stringify({id});
			const result = await userSettings.handleServerData("POST", `/user/friends`, sendData);
			socket.emit("friend-action", {id, eventType: "add"});
			return result;
		} catch (err) {
			console.log("Have not found", err);
			return err;
		}
	};

	const toggleMicUserVideo = async () => {
		const result = await getUserMediaDevices(devices => {
			const webcam = devices.find(device => device.kind === "audioinput");
			if (!webcam) return false;
			return webcam;
		});
		if (!result) return;

		setUserStream(stream => {
			stream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
			return stream;
		});

		setVideoSettings(videoSettings => {
			return {...videoSettings, muted: !userStream.getAudioTracks()[0].enabled};
		});
	};

	const toggleVideoUserVideo = async () => {
		const result = await getUserMediaDevices(devices => {
			const microphone = devices.find(device => device.kind === "videoinput");
			if (!microphone) return false;
			return microphone;
		});
		if (!result) return;

		setUserStream(stream => {
			stream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
			return stream;
		});

		setVideoSettings(videoSettings => {
			return {...videoSettings, video: userStream.getVideoTracks()[0].enabled};
		});
	};

	const appearReceivingCallPopup = ({caller, callerSignal}) => {
		sounds.callSound.play();

		setCaller(caller);
		setCallerSignal(callerSignal);
	};

	const disappearReceivingCallPopup = () => {
		sounds.callSound.currentTime = 0;

		setCaller(null);
		setCallerSignal(null);
		sounds.callSound.pause();
	};

	const deleteFriend = async id => {
		try {
			const result = await userSettings.handleServerData("DELETE", `/user/friends/${id}`);

			refreshFriends();
			handleConversation("61799c2d46f5018d737cd7d5");

			socket.emit("friend-action", {id, eventType: "delete"});

			return result;
		} catch (err) {
			console.log("request failed", err);
			return err;
		}
	};

	const handleConversation = async (groupData, open = true, type = "group") => {
		let id;
		let data;

		if (open && matchMedia("(max-width: 549px)").matches) setToggleMenu(false);

		if (groupData.target) {
			id = groupData.target.dataset.id;
			if (!groupData.target.matches(".tab-list__item")) return;
			if (id && id === selectedContact.id) return;
			if (open) setConversationLoaded(false);
		} else id = groupData;

		if (type === "group") data = await getGroup(id);
		else if (type === "user") data = await getFriend(id);

		if (!open) return data;

		setActiveConversationId(id);
		//* --- when you open conversation ---
		setConversationLoaded(true);

		setSelectedContact({...data, type, members: data.members.filter(member => member)}); //* remove not existing users
		if (socket) socket.emit("read-message", {conversationType: type, conversationId: id});
	};

	const refreshFriends = async () => {
		const friends = await getFriends();
		setFriends(friends);
	};

	const refreshGroups = async () => {
		const groups = await getGroups();

		if (groups.error) return;
		const detailedGroups = groups.map(async group => {
			const detailedGroup = await handleConversation(group._id, false);
			return detailedGroup;
		});

		const groupsDataFinished = await Promise.all(detailedGroups);

		setGroups(groups => groupsDataFinished);
	};

	return (
		<ConversationContext.Provider
			value={{
				activeTab,
				caller,
				setActiveTab,
				handleConversation,
				conversationLoaded,
				tabsNotifications,
				setTabsNotifications,
				refreshGroups,
				refreshFriends,
				callUser,
				acceptCall,
				leaveVideoCall,
				rejectCall,
				addGroup,
				getGroup,
				setGroups,
				leaveGroup,
				addMemberToGroup,
				groups,
				addFriend,
				deleteFriend,
				getFriends,
				setFriends,
				friends,
				selectedContact,
				setSelectedContact,
				activeConversationId,
				receivedMessages,
				setReceivedMessages,
				setToggleMenu,
				toggleMenu,
				myCameraVideo,
				friendCameraVideo,
				videoSettings,
				callMaking,
				startedCalling,
				recipient,
				cancelVideoCall,
				setVideoSettings,
				toggleMicUserVideo,
				toggleVideoUserVideo,
				sounds
			}}
		>
			{children}
		</ConversationContext.Provider>
	);
}

export {ConversationContextProvider, useConversation};
