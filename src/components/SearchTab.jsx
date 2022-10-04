import React, {useState, useEffect} from "react";
import {useConversation} from "../contexts/ConversationProvider";
import TabConversationItem from "./TabConversationItem";

function SearchTab(props) {
	const conversationData = useConversation();
	const handleSubmit = e => {
		e.preventDefault();
	};

	const [searchValue, setSearchValue] = useState("");
	const [groups, setGroups] = useState(conversationData.groups);
	const [friends, setFriends] = useState(conversationData.friends);

	const handleSearching = e => {
		const value = e.target.value;
		setSearchValue(value);
	};

	useEffect(() => {}, [conversationData.friends]);

	useEffect(() => {
		setGroups(conversationData.groups.filter(group => group.name.toLowerCase().includes(searchValue.toLowerCase())));

		setFriends(conversationData.friends.filter(friend => friend.ownName.toLowerCase().includes(searchValue.toLowerCase())));
	}, [searchValue, conversationData.friends, conversationData.groups]);

	return (
		<>
			<form onSubmit={handleSubmit}>
				<div className="tab__tab-options">
					<input type="search" placeholder="Search contacts" value={searchValue} onChange={handleSearching} className="tab__input" />
				</div>
			</form>
			<section className="tab-list">
				<div>
					<section>
						<h3 className="tab-list__header">Groups</h3>
						<TabConversationItem conversations={groups} type="group" />
					</section>
					<section>
						<h3 className="tab-list__header">Friends</h3>
						<TabConversationItem conversations={friends} type="user" />
					</section>
				</div>
			</section>
		</>
	);
}

export default SearchTab;
