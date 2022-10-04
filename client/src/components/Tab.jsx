import {nanoid} from "nanoid";
import React, {useEffect, useState} from "react";
import {useConversation} from "../contexts/ConversationProvider";

const Tab = ({id, children, openedMenu, setOpenedMenu}) => {
	const [tabsData, setTabsData] = useState([]);
	const conversationData = useConversation();
	const data = [];

	const handleTab = e => {
		const tab = e.target.closest(".tab-link");
		if (tab && tab.dataset.index) {
			const index = +tab.dataset.index;
			conversationData.setActiveTab(index);

			const requestUpdate = tab.classList.contains("tab-link--search");
			const requestGroupsUpdate = tab.classList.contains("tab-link--groups");
			const requestContactsUpdate = tab.classList.contains("tab-link--contacts");

			if (requestUpdate || requestContactsUpdate) conversationData.refreshFriends();
			else if (requestUpdate || requestGroupsUpdate) conversationData.refreshGroups();

			if (!openedMenu) setOpenedMenu(true);
		}
	};

	useEffect(() => {
		if (conversationData.activeTab) {
			const tabDataNotification = conversationData.tabsNotifications.find(tabData => tabData.title === tabsData[conversationData.activeTab].title);

			if (tabDataNotification?.notification && conversationData.toggleMenu) {
				conversationData.setTabsNotifications(tabsNotifications => {
					return tabsNotifications.map(currentTabData =>
						currentTabData.title === tabsData[conversationData.activeTab].title ? {title: tabsData[conversationData.activeTab].title, notification: false} : currentTabData
					);
				});
			}
		}
	}, [conversationData.toggleMenu, conversationData.activeTab]);

	useEffect(() => {
		React.Children.forEach(children, element => {
			if (!React.isValidElement(element)) return;
			const {
				props: {
					tab: {content, icon, title}
				}
			} = element;
			data.push({icon, content, title});
		});

		setTabsData(data);
	}, [children]);

	return (
		<>
			<ul className={`menu ${openedMenu ? "menu--opened" : ""}`} onClick={handleTab}>
				{tabsData.map((tab, i) => (
					<li className="menu__item" key={nanoid()}>
						<a href={`#${tab.title}`} data-index={i} className={`tab-link ${conversationData.activeTab === i ? "tab-link--active" : ""} tab-link--${tab.title}`}>
							{tab.icon}
							{conversationData.tabsNotifications.find(notData => notData.title === tab.title)?.notification && <span className="tab-link--notification"></span>}
						</a>
					</li>
				))}
			</ul>
			<section className="nav__content">{tabsData.length && tabsData[conversationData.activeTab].content}</section>
		</>
	);
};

const TabPane = ({children}) => {
	return {children};
};

Tab.TabPane = TabPane;

export default Tab;
