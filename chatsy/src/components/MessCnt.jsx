import {nanoid} from "nanoid";
import React, {useEffect, useState, useRef, useMemo} from "react";
import Message from "./Message";
import MessageForm from "./MessageForm";
import MessageHeader from "./MessageHeader";
import BottomScrollBtn from "./BottomScrollBtn";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import {useConversation} from "../contexts/ConversationProvider";
import {formatDate} from "../helpers/dateFns";

const maxScrolledDistantFromLastMessage = 200;

function MessCnt(props) {
	const [role, setRole] = useState("");
	const [isAllScrolled, setIsAllScrolled] = useState(true);
	const [latestMessage, setLatestMessage] = useState(undefined);
	const [sessionMessages, setSessionMessages] = useState([]);
	const [databaseMessages, setDatabaseMessages] = useState([]);
	const [scrolled, setScrolled] = useState(false);

	const messCntRef = useRef();
	const conversationData = useConversation();
	const userSettings = useUserSettings();

	const prepareMessages = messages => {
		if (!messages) return;
		return messages.map((mess, i) => {
			let index;
			let previousMessDate;
			if (i === 0) {
				index = conversationData.selectedContact.messages.length - 1;
				if (conversationData.selectedContact.messages.length) previousMessDate = new Date(conversationData.selectedContact.messages[index].createdAt);
			} else {
				index = i - 1;
				previousMessDate = new Date(messages[index].createdAt);
			}

			const messDate = new Date(mess.createdAt);

			const profileData = conversationData.selectedContact.members.find(member => member._id === mess.authorId) || {nick: "Chatsy user", photoURL: null};

			const isNewMessage = !!sessionMessages.length;

			const formattedDate = formatDate(messDate);
			let diff;
			let whetherCreateDate = false;
			if (previousMessDate) {
				diff = messDate - previousMessDate;
				whetherCreateDate = diff > 10 * 60 * 1000;
			} else whetherCreateDate = true;

			let formatedMessDate = whetherCreateDate ? <p className="message-date">{formattedDate}</p> : false;

			if (i !== messages.length - 1) {
				return (
					<React.Fragment key={nanoid()}>
						{formatedMessDate}
						<Message data={mess.message} type={mess.type} author={profileData.nick} photoURL={profileData.photoURL} key={nanoid()} />
					</React.Fragment>
				);
			}
			return (
				<React.Fragment key={nanoid()}>
					{formatedMessDate}
					<Message
						data={mess.message}
						newMessage={isNewMessage}
						type={mess.type}
						author={profileData.nick}
						photoURL={profileData.photoURL}
						key={nanoid()}
						ref={props.lastMessageRef}
					/>
				</React.Fragment>
			);
		});
	};

	useEffect(() => {
		//* --- clear messages ---
		const messages = conversationData.selectedContact.messages;
		const preparedMessages = prepareMessages(messages);

		setDatabaseMessages(preparedMessages);
		setSessionMessages([]);

		//* --- handle scroll ---
		setScrolled(false);
		if (!conversationData.selectedContact.members.length) return;
		const me = conversationData.selectedContact.members.find(member => member._id === userSettings.user._id);
		if (me) setRole(me.role);
	}, [conversationData.selectedContact]);

	useEffect(() => {
		if (!props.lastMessageRef.current) return;
		const messageContainer = messCntRef.current;

		//* When user scrolled messages up but it's still close for auto scroll to scroll it down
		if (messageContainer.scrollHeight - messageContainer.offsetHeight - messageContainer.scrollTop <= maxScrolledDistantFromLastMessage) {
			//* scroll to new message
			props.lastMessageRef.current.scrollIntoView({behavior: "smooth", block: "start"});
			setIsAllScrolled(true);
		} else {
			setIsAllScrolled(false);
			const messages = sessionMessages.filter(mess => mess.authorId !== userSettings.user._id);
			if (!messages.length) return;
			const mess = messages[messages.length - 1];
			if (mess?.type === "message") setLatestMessage(mess.message);
			else if (mess?.type === "like") setLatestMessage("👍");
		}
	}, [sessionMessages]);

	const handleAutoScroll = () => {
		if (sessionMessages.length === 0 && props.lastMessageRef.current) {
			const messageContainer = messCntRef.current;
			messageContainer.scroll(0, messageContainer.scrollHeight - messageContainer.offsetHeight);
			setScrolled(true);
		}
	};

	useEffect(handleAutoScroll, [props.lastMessageRef.current]);

	const handleContainerScroll = e => {
		const messageContainer = messCntRef.current;
		const scrolled = messageContainer.scrollHeight - messageContainer.offsetHeight - messageContainer.scrollTop <= maxScrolledDistantFromLastMessage;

		if (props.lastMessageRef.current && scrolled) {
			setIsAllScrolled(true);
			//* expected delay for hid massage after button will disappear
			setTimeout(() => setLatestMessage(undefined), 100);
		} else if (!scrolled) {
			setIsAllScrolled(false);
		}
	};

	const newMessages = useMemo(() => {
		return prepareMessages(sessionMessages);
	}, [sessionMessages]);

	return (
		<>
			<section className={`mess-cnt ${props.openedMenu ? "mess-cnt--small" : ""}`}>
				<div onScroll={handleContainerScroll} className="mess-cnt__messages" ref={messCntRef}>
					<MessageHeader role={role} />
					{conversationData.conversationLoaded ? (
						<>
							{databaseMessages}
							{newMessages}
							<BottomScrollBtn
								latestMessage={latestMessage}
								lastMessageRef={props.lastMessageRef}
								messCntRef={messCntRef}
								isAllScrolled={isAllScrolled}
								setIsAllScrolled={setIsAllScrolled}
							/>
						</>
					) : (
						<div className="loader-bar"></div>
					)}
				</div>
				<MessageForm sessionMessages={sessionMessages} setSessionMessages={setSessionMessages} />
			</section>
		</>
	);
}

export default MessCnt;
