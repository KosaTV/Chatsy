import React from "react";
import defaultProfilePhoto from "../assets/imgs/profile.png";
import {useConversation} from "../contexts/ConversationProvider";

const ReceivingCallPopup = ({show, onRejectButton, onAcceptButton}) => {
	const conversationData = useConversation();
	return (
		<>
			{show && (
				<div className="call-popup">
					<button className="call-popup__close-popup" onClick={onRejectButton}>
						<i className="fas fa-times"></i>
					</button>
					<img src={conversationData.caller.photoURL || defaultProfilePhoto} alt="caller" className="call-popup__profile-img" />
					<span className="call-popup__caller-name">{conversationData.caller.nickName}</span>
					<span className="call-popup__call-type">Video call</span>
					<div className="call-popup__options">
						<button className="call-popup__fn-btn call-popup__fn-btn--reject" onClick={onRejectButton}>
							<i style={{transform: "rotate(135deg)"}} className="fas fa-phone-alt"></i>
						</button>
						<button className="call-popup__fn-btn call-popup__fn-btn--accept" onClick={onAcceptButton}>
							<i className="fas fa-phone-alt"></i>
						</button>
					</div>
				</div>
			)}
		</>
	);
};

export default ReceivingCallPopup;
