import React from "react";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import userOptions from "../utils/userOptions";
import {useSocket} from "../contexts/SocketProvider";

function SettingsTab(props) {
	const userSettings = useUserSettings();
	const socket = useSocket();

	const handleSignOut = e => {
		userOptions.find(option => option.name === "signOut").onClick(userSettings, socket);
	};

	return (
		<>
			<section className="tab__tab-options">
				<button className="button button--secondary tab__button" onClick={handleSignOut}>
					<i className="fas fa-sign-out-alt"></i> Sign Out
				</button>
			</section>
			<section className="account-info">
				<header className="account-info__header">
					<h1 className="account-info__title">My profile</h1>
				</header>
				<div className="account-info__content">
					<div className="row">
						<div className="row__name">Name:</div>
						<div className="row__value">{userSettings.user.name}</div>
					</div>
					<div className="row">
						<div className="row__name">Last name:</div>
						<div className="row__value">{userSettings.user.lastName}</div>
					</div>
					<div className="row">
						<div className="row__name">Nickname:</div>
						<div className="row__value">{userSettings.user.nickName}</div>
					</div>
					<div className="row">
						<div className="row__name">My id:</div>
						<div className="row__value">{userSettings.user._id}</div>
					</div>
					<div className="row">
						<div className="row__name">E-mail:</div>
						<div className="row__value">{userSettings.user.email}</div>
					</div>
					<div className="row">
						<div className="row__name">Birth:</div>
						<div className="row__value">
							{new Date(userSettings.user.birth).getFullYear()}-{(new Date(userSettings.user.birth).getMonth() + 1).toString().padStart(2, "0")}-
							{new Date(userSettings.user.birth).getDate().toString().padStart(2, "0")}
						</div>
					</div>
				</div>
			</section>
		</>
	);
}

export default SettingsTab;
