import React from "react";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import defaultProfilePhoto from "../assets/imgs/profile.png";

const Message = React.forwardRef((props, ref) => {
	const userSettings = useUserSettings();

	const author = props.author === userSettings.user.nickName ? "you" : props.author;

	return (
		<div ref={ref} className={`message ${author === "you" ? "message--my-mess" : ""} ${props.newMessage ? "message--new" : ""}`}>
			<div className="text-info">
				{props.type === "message" ? <p className="message__text">{props.data}</p> : <div className="message__like" dangerouslySetInnerHTML={{__html: props.data}}></div>}
				<p className="message__author">{author}</p>
			</div>
			<div className="img-info">
				<img src={props.photoURL || defaultProfilePhoto} alt="profile" className="message__img" />
			</div>
		</div>
	);
});

export default Message;
