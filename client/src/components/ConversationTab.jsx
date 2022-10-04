import {useConversation} from "../contexts/ConversationProvider";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import {useSystemTools} from "../contexts/SystemProvider";
import chatroomOptions from "../utils/chatroomOptions";
import TabConversationItem from "./TabConversationItem";

function ConversationTab({type}) {
	const systemTools = useSystemTools();
	const conversationData = useConversation();
	const isGroupType = type === "group";
	const conversations = isGroupType ? conversationData.groups : conversationData.friends;

	return (
		<>
			<section className="tab__tab-options">
				{isGroupType ? (
					<>
						<button
							className="button button--secondary tab__button"
							onClick={() =>
								systemTools.setTogglePopup(popups => {
									return {...popups, joinGroup: true};
								})
							}
						>
							<i className="fa fa-plus-square"></i> Join Group
						</button>
						<button
							className="button button--secondary tab__button"
							onClick={() =>
								systemTools.setTogglePopup(popups => {
									return {...popups, createGroup: true};
								})
							}
						>
							<svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M4 8C4 3.58172 7.58172 0 12 0V0C16.4183 0 20 3.58172 20 8V9V9C20 12.866 16.8672 16 13.0012 16C12.6764 16 12.3435 16 12.0011 16C7.58284 16 4 12.4183 4 8V8Z"
									fill="#8730DF"
								/>
								<rect x="13" y="9" width="7" height="7" fill="#8730DF" />
								<g clipPath="url(#clip0_24_38)">
									<path d="M12 3.20001V8.00001M12 8.00001V12.8M12 8.00001H16.8M12 8.00001H7.2" stroke="white" strokeWidth="2" strokeLinecap="round" />
								</g>
								<defs>
									<clipPath id="clip0_24_38">
										<rect width="12" height="12" fill="white" transform="translate(6 2)" />
									</clipPath>
								</defs>
							</svg>
							Create Group
						</button>
					</>
				) : (
					<button
						className="button button--secondary tab__button"
						onClick={() =>
							systemTools.setTogglePopup(popups => {
								return {...popups, addFriend: true};
							})
						}
					>
						<i className="fas fa-user-plus"></i> Add Friend
					</button>
				)}
			</section>
			<TabConversationItem conversations={conversations} type={type} />
		</>
	);
}

export default ConversationTab;
