import React from "react";
import defaultProfilePhoto from "../assets/imgs/profile.png";
import {useConversation} from "../contexts/ConversationProvider";

const ReceivingCallPopup = ({show, onCancelButton}) => {
	const conversationData = useConversation();
	return (
		<>
			{show && (
				<div className="call-popup">
					<img src={conversationData.callMaking.photoURL || defaultProfilePhoto} alt="caller" className="call-popup__profile-img" />
					<span className="call-popup__caller-name">{conversationData.callMaking.ownName}</span>
					<span className="call-popup__call-type">{conversationData.startedCalling ? "Establishing the connection..." : "Calling..."}</span>
					<div className="call-popup__options">
						<button className="call-popup__fn-btn call-popup__fn-btn--reject" onClick={onCancelButton}>
							<i style={{transform: "rotate(135deg)"}} className="fas fa-phone-alt"></i>
						</button>
					</div>
				</div>
			)}
		</>
	);
};

export default ReceivingCallPopup;
