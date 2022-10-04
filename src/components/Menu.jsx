import React, {useState, useRef, useEffect} from "react";
import Tab from "./Tab";
import ProfileStatus from "./ProfileStatus";

//* --- Contexts ---
import {useConversation} from "../contexts/ConversationProvider";

//* --- Tabs ---
import SearchTab from "./SearchTab";
// import ContactsTab from "./ContactsTab";
import ConversationTab from "./ConversationTab";
import SettingsTab from "./SettingsTab";

function Menu(props) {
	const [tabs, setTabs] = useState([]);
	const menuRef = useRef();
	const conversationData = useConversation();

	//* on received messages:
	useEffect(() => {
		conversationData.receivedMessages.forEach((conversationWithNewMessages, i) => {
			//* find groups which are not marked as new Messages and get it.
			const filteredGroups = conversationData.groups.map(group => {
				if (!group.isNewMessages && group.id === conversationWithNewMessages.convId) {
					return {...group, isNewMessages: true};
				}
				return group;
			});

			//* change conversationData.groups when it's gonna be last loop - just last loop includes very new info
			if (i === conversationData.receivedMessages.length - 1) conversationData.setGroups(filteredGroups);
		});
	}, [conversationData.receivedMessages]);

	useEffect(() => {
		setTabs([
			{
				title: "search",
				content: <SearchTab />,
				icon: <i className="fas fa-search"></i>
			},
			{
				title: "contacts",
				content: <ConversationTab type="user" lastMessageRef={props.lastMessageRef} setMessages={props.setMessages} messages={props.messages} />,
				icon: <i className="fas fa-address-book"></i>
			},
			{
				title: "groups",
				content: <ConversationTab type="group" setMessages={props.setMessages} messages={props.messages} />,
				icon: <i className="fas fa-user-friends"></i>
			},
			{title: "settings", content: <SettingsTab />, icon: <i className="fas fa-cog"></i>}
		]);
	}, []);

	const toggleMenu = e => {
		props.setOpenedMenu(!props.openedMenu);
	};

	return (
		<nav className={`nav ${props.openedMenu ? "nav--opened" : ""}`} ref={menuRef}>
			<ProfileStatus />
			<button className={`nav__toggle ${props.openedMenu ? "nav__toggle--toggled" : ""}`} onClick={toggleMenu}>
				<i className="fas fa-arrow-circle-right"></i>
			</button>
			<Tab openedMenu={props.openedMenu} setOpenedMenu={props.setOpenedMenu} tabsNotification={conversationData.tabsNotifications}>
				{tabs.map(tab => (
					<Tab.TabPane tab={tab} key={tab.title} />
				))}
			</Tab>
		</nav>
	);
}

export default Menu;
