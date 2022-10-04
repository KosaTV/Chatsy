import React, {useState, useRef, useEffect, useCallback} from "react";
import {useConversation} from "../contexts/ConversationProvider";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import {useSocket} from "../contexts/SocketProvider";
import Emoji from "../components/Emoji";
import emojiList from "../helpers/emojiList";
import {ReactComponent as LikeSVG} from "../assets/imgs/like.svg"; //* as a component
import likeSVG from "../assets/imgs/like.svg"; //* as a url
import sendSVG from "../assets/imgs/send.svg";
import {throttle} from "../helpers/performanceFns";

function MessageForm(props) {
	const messageInputRef = useRef();
	const [messageInputValue, setMessageInputValue] = useState("");
	const [sessionReceivedMess, setSessionReceivedMess] = useState([]);
	const conversationData = useConversation();
	const userSettings = useUserSettings();
	const socket = useSocket();
	const [windowOpened, setWindowOpened] = useState(false);
	const [isFocus, setIsFocus] = useState(false);
	const [typingPersons, setTypingPersons] = useState([]);

	const sendTypingInfo = (event, {id, recipients, type}) => {
		socket.emit(event, {id, recipients, type});
	};

	const throttleSendTyping = useCallback(
		throttle(({id, type, recipients}) => {
			sendTypingInfo("typing-mess", {id, type, recipients});
		}, 1000),
		[]
	);

	const throttleStopTyping = useCallback(
		throttle(({id, type, recipients}) => {
			sendTypingInfo("stop-typing-mess", {id, type, recipients});
		}, 1000),
		[]
	);

	// handle typing information
	useEffect(() => {
		const recipients = conversationData.selectedContact.members.map(member => member._id);
		const {type, id} = conversationData.selectedContact;
		(async () => {
			if (isFocus && messageInputValue.length) {
				throttleSendTyping({id, type, recipients});
			} else {
				throttleStopTyping({id, type, recipients});
			}
		})();
	}, [isFocus, messageInputValue]);

	const handleMessageValue = e => {
		setMessageInputValue(messageInputRef.current.value);
	};

	const handleEmojiWindow = e => {
		setWindowOpened(!windowOpened);
	};

	const handleTypingMessage = e => {
		if (e.code === "Enter" && !e.shiftKey) handleTextMessageSend(e);
	};

	const handleTextMessageSend = e => {
		e.preventDefault();
		sendMessage("text");
	};

	useEffect(() => {
		if (sessionReceivedMess.length) {
			const sessionMess = sessionReceivedMess[sessionReceivedMess.length - 1];
			conversationData.setReceivedMessages(messages => {
				return [...messages, {convId: sessionMess.id, message: sessionMess.message.message}];
			});
		}
	}, [sessionReceivedMess]);

	const addMessageToConversation = async message => {
		let id = message.conversationId;
		const isRecipient = message.id;
		const currentDashboard = conversationData.selectedContact;
		if (isRecipient) {
			//* recipient owns friend already

			//* when recipient doesn't have a dashboard view set at sender
			if (currentDashboard.id !== conversationData.selectedContact.id) {
				setSessionReceivedMess(prev => [...prev, {id, message}]);
			}
		}
	};

	const gotMessage = async conversation => {
		const message = conversation.message;
		const type = conversation.type;

		const isCurrentlyViewed = conversationData.selectedContact.id === conversation.provider;

		if (isCurrentlyViewed) {
			props.setSessionMessages([...props.sessionMessages, message]);
			socket.emit("read-message", {conversationType: conversationData.selectedContact.type, conversationId: conversationData.selectedContact.id});
		} else conversationData.sounds.notificationSound.play();
		let titleOfTabToRefresh;
		if (type === "group") {
			conversationData.refreshGroups(); //* it refreshes full content
			titleOfTabToRefresh = "groups";
		} else if (type === "user") {
			conversationData.refreshFriends(); //* it refreshes full content
			titleOfTabToRefresh = "contacts";
		}

		if (
			(!conversationData.toggleMenu && !isCurrentlyViewed) ||
			(conversationData.toggleMenu && titleOfTabToRefresh !== conversationData.tabsNotifications[conversationData.activeTab].title)
		) {
			conversationData.setTabsNotifications(tabsData => {
				return tabsData.map(currentTabData => (currentTabData.title === titleOfTabToRefresh ? {title: titleOfTabToRefresh, notification: true} : currentTabData));
			});
		}
	};

	useEffect(() => {
		if (!socket) return;

		socket.on("receive-message", conversationInfo => {
			gotMessage(conversationInfo);
			addMessageToConversation(conversationInfo);
		});

		socket.on("current-typing", ({personId, conversationId}) => {
			const name = conversationData.selectedContact.members.find(member => member._id === personId)?.nick;

			if (name && !typingPersons.includes(name)) {
				if (conversationData.selectedContact.id === conversationId) {
					conversationData.sounds.textingSound.play();
					setTypingPersons(prev => [...prev, name]);
				} else {
					setTypingPersons(typingPersons.filter(person => name !== person));
				}
			}
		});

		socket.on("stopped-typing", id => {
			const name = conversationData.selectedContact.members.find(member => member._id === id)?.nick;
			if (name && typingPersons.includes(name)) setTypingPersons(typingPersons.filter(person => name !== person));
		});

		socket.on("did-read-message", ({conversationType, conversationId}) => {
			const updateConversationNotification = conversation => {
				const conv = conversation.find(conv => (conv._id || conv.id) === conversationId);
				const modifiedMess = conv.messages[conv.messages.length - 1];
				if (!modifiedMess) return;
				modifiedMess.readBy.push(userSettings.user._id);
				conv.messages.pop();
				conv.messages.push(modifiedMess);
				return conv;
			};

			if (conversationType === "group") {
				updateConversationNotification(conversationData.groups);
				conversationData.setGroups(groups => [...groups]);
			} else if (conversationType === "user") {
				updateConversationNotification(conversationData.friends);
				conversationData.setFriends(friends => [...friends]);
			}
		});
		return () => {
			socket.off("receive-message");
			socket.off("current-typing");
			socket.off("stopped-typing");
			socket.off("did-read-message");
		};
	}, [socket, addMessageToConversation]);

	const createTextMessage = (value = "") => {
		let message = {message: value, authorId: userSettings.user._id, type: "message"};
		props.setSessionMessages([...props.sessionMessages, {...message, createdAt: new Date()}]);
		return message;
	};

	const createLikeMessage = () => {
		let message = {message: LikeSVG, authorId: userSettings.user._id, type: "like"};
		props.setSessionMessages([
			...props.sessionMessages,
			{
				...message,
				message: `<img class="mess-cnt__svg" src=${likeSVG} />`,
				photoURL: userSettings.user.photoURL,
				createdAt: new Date()
			}
		]);
		return message;
	};

	const sendMessage = async type => {
		if (conversationData.selectedContact.type === "user" && !conversationData.selectedContact.accepted) return;

		if ((type === "text" && messageInputValue) || type === "like") {
			const value = messageInputRef.current.value;
			console.log("🚀 ~ file: MessageForm.jsx ~ line 188 ~ sendMessage ~ value", value);

			let message;
			if (type === "text") message = createTextMessage(value);
			else if (type === "like") message = createLikeMessage();

			message = {
				...message,
				conversationType: conversationData.selectedContact.type,
				conversationId: conversationData.selectedContact.id
			};

			//* Adding additional dynamic messages

			socket.emit("send-message", message);
		}

		setMessageInputValue("");
	};

	return (
		<>
			{!!typingPersons.length && (
				<div className="typing-persons">
					{typingPersons.length < 3 ? typingPersons.join(", ") : `${typingPersons[0]}, ${typingPersons[1]}, ${typingPersons[2]} ...`}
					<div className="typing-emoji">
						<div className="typing-emoji__dot typing-emoji__dot--1"></div>
						<div className="typing-emoji__dot typing-emoji__dot--2"></div>
						<div className="typing-emoji__dot typing-emoji__dot--3"></div>
					</div>
				</div>
			)}
			<form className="mess-form" onSubmit={handleTextMessageSend}>
				<div className="mess-form__wrapper">
					{/* <input type="text" placeholder={`Text to ${conversationData.selectedContact.name}`} className="mess-form__input" value={messageInputValue} /> */}
					<textarea
						placeholder={`Text to ${conversationData.selectedContact.name}`}
						onChange={handleMessageValue}
						onKeyDown={handleTypingMessage}
						onFocus={e => setIsFocus(true)}
						onBlur={e => setIsFocus(false)}
						ref={messageInputRef}
						name="message-input"
						className="mess-form__input"
						value={messageInputValue}
					></textarea>
					<Emoji setOpened={setWindowOpened} opened={windowOpened} messageText={messageInputValue} setMessageText={setMessageInputValue} emojis={emojiList} />
					<button type="button" className="mess-form__button mess-form__button--function mess-form__button--ui mess-form__button--centered" onClick={handleEmojiWindow}>
						<i className="far fa-smile"></i>
					</button>
				</div>
				<button type="submit" className="button button--secondary mess-form__button mess-form__button--empty mess-form__button--ui mess-form__button--moving">
					<img className="img img--emoji" src={sendSVG} alt="send" />
				</button>
				<button
					type="button"
					onClick={e => {
						sendMessage("like");
					}}
					className=" button button--secondary mess-form__button mess-form__button--empty mess-form__button--ui mess-form__button--moving"
				>
					<LikeSVG className="mess-form__svg" />
				</button>
			</form>
		</>
	);
}

export default MessageForm;
