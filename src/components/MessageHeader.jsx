import {nanoid} from "nanoid";
import React, {useState, useEffect} from "react";
import chatroomOptions from "../utils/chatroomOptions";
import friendOptions from "../utils/friendOptions";
import {useConversation} from "../contexts/ConversationProvider";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import {useSystemTools} from "../contexts/SystemProvider";
import defaultGroupPhoto from "../assets/imgs/group.png";
import defaultProfilePhoto from "../assets/imgs/profile.png";

function MessageHeader(props) {
	const [defaultOptions, setDefaultOptions] = useState([]);
	const [toggleMenu, setToggleMenu] = useState(false);
	const conversationData = useConversation();
	const systemTools = useSystemTools();
	const userSettings = useUserSettings();
	const [defaultPhoto, setDefaultPhoto] = useState(conversationData.selectedContact.type === "group" ? defaultGroupPhoto : defaultProfilePhoto);

	useEffect(() => {
		if (conversationData.selectedContact.type === "group") {
			if (props.role !== "admin") setDefaultOptions(chatroomOptions.filter(option => option.role === props.role && !option.exceptRole.includes(props.role)));
			else setDefaultOptions(chatroomOptions.filter(option => !option.exceptRole.includes(props.role)));
		}
	}, [props.role, conversationData.selectedContact.type]);

	const handleMenu = e => {
		setToggleMenu(prev => !prev);
	};

	const handleBlur = e => {
		setToggleMenu(false);
	};

	return (
		<header className="mess-header">
			{conversationData.selectedContact.type === "user" && !conversationData.selectedContact.accepted && (
				<div className="info-box">
					<span className="info-box__info">Messages won't be sent till the recipient add you to the friends</span>
				</div>
			)}

			<div className="mess-header-info">
				{conversationData.conversationLoaded ? (
					<>
						<img
							className="mess-header-info__header mess-header-info__header--img"
							src={conversationData.selectedContact.photoURL || defaultPhoto}
							alt="conversation picture"
						/>
						<div className="mess-header-info__text-cnt">
							<h1 className="mess-header-info__header mess-header-info__header--name">{conversationData.selectedContact.name}</h1>
							<h1 className="mess-header-info__header mess-header-info__header--id">{conversationData.selectedContact.id}</h1>
						</div>
					</>
				) : (
					<>
						<div className="figure-placeholder figure-placeholder--medium-circle"></div>
						<div className="mess-header-info__text-cnt">
							<div className="text-placeholder text-placeholder--5 text-placeholder--medium"></div>
							<div className="text-placeholder text-placeholder--10 text-placeholder--medium"></div>
						</div>
					</>
				)}
			</div>

			<>
				<div className="mess-header-options">
					{props.role === "admin" && (
						<button
							onClick={() => {
								defaultOptions
									.find(option => option.name === "addMember")
									.onClick({systemTools, convData: conversationData, id: conversationData.selectedContact, userInfo: userSettings.user});
							}}
							className="button button--secondary mess-header-options__button mess-header-options__button--add-user"
						>
							<i className="fas fa-user-plus"></i>
						</button>
					)}

					{conversationData.selectedContact.type === "user" &&
						friendOptions
							.filter(option => option.name === "callUser")
							.map(option => {
								return (
									<button
										key={nanoid()}
										onClick={e => option.onClick(conversationData, conversationData.selectedContact.id)}
										className="button button--secondary mess-header-options__button"
									>
										{option.icon}
									</button>
								);
							})}

					<div className="dropdown">
						<button className="mess-header-options__button button button--secondary mess-header-options__button--more" onBlur={handleBlur} onClick={handleMenu}>
							<i className="fas fa-ellipsis-v"></i>
						</button>

						<div className={`dropdown-menu ${toggleMenu ? "dropdown-menu--show" : ""}`}>
							{conversationData.selectedContact.type === "group"
								? defaultOptions.map(option => {
										const {id} = conversationData.selectedContact;
										return (
											<div
												key={nanoid()}
												className="dropdown-menu__item"
												data-name={option.name}
												onMouseDown={() => {
													option.onClick({systemTools, convData: conversationData, id, userInfo: userSettings.user});
												}}
											>
												<div className="dropdown-menu__icon">{option.icon}</div>
												<div className="dropdown-menu__content">{option.label}</div>
											</div>
										);
								  })
								: friendOptions.map(option => {
										return (
											<div
												key={nanoid()}
												className="dropdown-menu__item"
												data-name={option.name}
												onMouseDown={() => {
													option.onClick(conversationData, conversationData.selectedContact.id);
												}}
											>
												<div className="dropdown-menu__icon">{option.icon}</div>
												<div className="dropdown-menu__content">{option.label}</div>
											</div>
										);
								  })}
						</div>
					</div>
				</div>
			</>
		</header>
	);
}

export default MessageHeader;
