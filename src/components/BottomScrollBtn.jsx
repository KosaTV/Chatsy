import React, {useEffect, useState} from "react";
import {useConversation} from "../contexts/ConversationProvider";

const BottomScrollBtn = props => {
	const handleScrollToBottom = e => {
		props.lastMessageRef.current.scrollIntoView({behavior: "smooth", block: "start"});
		props.setIsAllScrolled(true);
	};
	const conversationData = useConversation();

	const [text, setText] = useState();

	useEffect(() => {
		if (props.latestMessage) setText(props.latestMessage.length >= 15 ? props.latestMessage.substr(0, 13) + "..." : props.latestMessage);
	}, [props.latestMessage]);

	useEffect(() => {
		setText("");
	}, [conversationData.selectedContact]);

	useEffect(() => {
		if (props.isAllScrolled) setText("");
	}, [props.isAllScrolled]);

	return (
		<button onClick={handleScrollToBottom} className={`mess-cnt__button ${!props.isAllScrolled ? "mess-cnt__button--show" : ""}`}>
			{text} <i className="mess-cnt__icon fas fa-chevron-down"></i>
		</button>
	);
};

export default BottomScrollBtn;
