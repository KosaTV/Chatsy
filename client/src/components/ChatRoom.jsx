import React, {useState, useRef, useEffect} from "react";
import Loader from "./Loader";
import Menu from "./Menu";
import MessCnt from "./MessCnt";
import {useConversation} from "../contexts/ConversationProvider";

function ChatRoom(props) {
	const conversationData = useConversation();

	const [loadContent, setLoadContent] = useState(false);
	const lastMessageRef = useRef();

	useEffect(() => {
		conversationData.handleConversation("61799c2d46f5018d737cd7d5");
	}, []);

	return (
		<>
			{!loadContent && <Loader loadedData={!!conversationData.selectedContact} setLoadContent={setLoadContent} />}
			{conversationData.selectedContact && (
				<section className="chat-room">
					<Menu openedMenu={conversationData.toggleMenu} setOpenedMenu={conversationData.setToggleMenu} lastMessageRef={lastMessageRef} />
					<MessCnt openedMenu={conversationData.toggleMenu} lastMessageRef={lastMessageRef} setOpenedMenu={conversationData.setToggleMenu} />
				</section>
			)}
		</>
	);
}

export default ChatRoom;
