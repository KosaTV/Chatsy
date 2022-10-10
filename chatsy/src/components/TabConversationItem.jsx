import React from "react";
import {nanoid} from "nanoid";
import {useConversation} from "../contexts/ConversationProvider";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import {useSystemTools} from "../contexts/SystemProvider";
import defaultGroupPhoto from "../assets/imgs/group.png";
import defaultProfilePhoto from "../assets/imgs/profile.png";
import chatroomOptions from "../utils/chatroomOptions";

const TabConversationItem = ({conversations, type}) => {
	const systemTools = useSystemTools();
	const conversationData = useConversation();
	const userSettings = useUserSettings();
	const isGroupType = type === "group";

	const getPreviewMessage = (msgObj, author = "chatsy user") => {
		let previewMessage = "";
		if (msgObj.type === "message") previewMessage = msgObj.message;
		else previewMessage = "👍";

		if (msgObj.authorId === userSettings.user._id) previewMessage = `you: ${previewMessage}`;
		else if (isGroupType) {
			previewMessage = `${author}: ${previewMessage}`;
		}

		return previewMessage;
	};

	const handleCallUser = e => {
		conversationData.callUser(e.target.closest(".tab-list__item").dataset.id);
	};

	const handleDeleteConversation = !isGroupType
		? e => conversationData.deleteFriend(e.target.closest(".tab-list__item").dataset.id)
		: e => {
				chatroomOptions
					.find(option => option.name === "leaveGroup")
					.onClick({systemTools, convData: conversationData, id: e.target.closest(".tab-list__item").dataset.id, userInfo: userSettings.user});
		  };

	return (
		<ul className="tab-list" onClick={e => conversationData.handleConversation(e, true, type)}>
			{conversations[0] &&
				!conversations[0].error &&
				conversations.map(conversation => {
					if (conversation.error) return;

					let currentConversationData = {};

					if (isGroupType) currentConversationData = {id: conversation.id, name: conversation.name, photoURL: conversation.photoURL || defaultGroupPhoto};
					else {
						currentConversationData = {id: conversation._id, name: conversation.ownName, photoURL: conversation.photoURL || defaultProfilePhoto, active: conversation.active};
					}

					const isRead = conversation.messages.length
						? conversation.messages[conversation.messages.length - 1].readBy.includes(userSettings.user._id) ||
						  conversation.messages[conversation.messages.length - 1].authorId === userSettings.user._id
						: true;

					const lastMessage = conversation.messages[conversation.messages.length - 1];

					let authorOfLastMessage = "";

					if (conversation.members?.length) authorOfLastMessage = conversation.members.find(member => member && member._id === lastMessage?.authorId)?.nick;
					let previewMessage = "";

					if (lastMessage) previewMessage = getPreviewMessage(lastMessage, authorOfLastMessage);

					return (
						<li
							className={`tab-list__item ${currentConversationData.id === conversationData.activeConversationId ? "tab-list__item--active" : ""} ${
								!isRead && currentConversationData.id !== conversationData.selectedContact.id ? "tab-list__item--new" : ""
							}`}
							data-name={currentConversationData.name}
							data-id={currentConversationData.id}
							key={nanoid()}
						>
							<span className="tab-list__item-info">
								<div className="tab-list__photo-cnt">
									<img src={currentConversationData.photoURL} alt="profile" className="tab-list__conversation-photo" />
									{!isGroupType && <span className={`tab-list__active-indicator ${currentConversationData.active ? "tab-list__active-indicator--active" : ""}`}></span>}
								</div>
								<div className="tab-list__content-info">
									<span className="tab-list__item-conversation-name">{currentConversationData.name}</span>
									<span className="tab-list__item-conversation-message">{previewMessage}</span>
								</div>
							</span>

							<div className="tab-list__options-cnt">
								{!isGroupType && (
									<button className="button button--secondary tab-list__option-btn" onClick={handleCallUser}>
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path
												d="M10.554 6.24L7.171 2.335C6.781 1.885 6.066 1.887 5.613 2.341L2.831 5.128C2.003 5.957 1.766 7.188 2.245 8.175C5.10662 14.1 9.88505 18.8851 15.806 21.755C16.792 22.234 18.022 21.997 18.85 21.168L21.658 18.355C22.113 17.9 22.114 17.181 21.66 16.791L17.74 13.426C17.33 13.074 16.693 13.12 16.282 13.532L14.918 14.898C14.8482 14.9712 14.7563 15.0194 14.6564 15.0353C14.5565 15.0512 14.4541 15.0339 14.365 14.986C12.1354 13.7021 10.286 11.8502 9.005 9.619C8.95703 9.52975 8.93966 9.42723 8.95556 9.32716C8.97145 9.22708 9.01974 9.13499 9.093 9.065L10.453 7.704C10.865 7.29 10.91 6.65 10.554 6.239V6.24Z"
												stroke="#8730DF"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</button>
								)}

								<button className="button button--secondary tab-list__option-btn" onClick={handleDeleteConversation}>
									{!isGroupType ? (
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path
												d="M2 6H22M10 11V16M14 11V16M4 6H20L18.42 20.22C18.3658 20.7094 18.1331 21.1616 17.7663 21.49C17.3994 21.8184 16.9244 22 16.432 22H7.568C7.07564 22 6.60056 21.8184 6.23375 21.49C5.86693 21.1616 5.63416 20.7094 5.58 20.22L4 6ZM7.345 3.147C7.50675 2.80397 7.76271 2.514 8.083 2.31091C8.4033 2.10782 8.77474 2 9.154 2H14.846C15.2254 1.99981 15.5971 2.10755 15.9176 2.31064C16.2381 2.51374 16.4942 2.80381 16.656 3.147L18 6H6L7.345 3.147V3.147Z"
												stroke="#8730DF"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									) : (
										<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
											<g clipPath="url(#clip0_65_23)">
												<path
													d="M2.44444 22C1.77222 22 1.19656 21.7609 0.717444 21.2826C0.239148 20.8034 0 20.2278 0 19.5556V2.44444C0 1.77222 0.239148 1.19656 0.717444 0.717444C1.19656 0.239148 1.77222 0 2.44444 0H11V2.44444H2.44444V19.5556H11V22H2.44444ZM15.8889 17.1111L14.2083 15.3389L17.325 12.2222H7.33333V9.77778H17.325L14.2083 6.66111L15.8889 4.88889L22 11L15.8889 17.1111Z"
													fill="#8730DF"
												/>
											</g>
											<defs>
												<clipPath id="clip0_65_23">
													<rect width="22" height="22" fill="white" />
												</clipPath>
											</defs>
										</svg>
									)}
								</button>
							</div>
						</li>
					);
				})}
		</ul>
	);
};

export default TabConversationItem;
