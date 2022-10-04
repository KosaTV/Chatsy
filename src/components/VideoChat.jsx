import React, {useState, useEffect} from "react";
import {useConversation} from "../contexts/ConversationProvider";

const VideoChat = ({show, userSourceRef, friendSourceRef}) => {
	const conversationData = useConversation();

	const toggleFriendMute = e => {
		conversationData.setVideoSettings(videoSettings => {
			return {...videoSettings, friendMuted: !videoSettings.friendMuted};
		});
	};

	return (
		<>
			<div className={`video-chat-cnt ${show && "video-chat-cnt--active"}`}>
				<div className="video-cnt">
					<div className="video-cnt__header">
						<span className="video-cnt__block video-cnt__block--info">You</span>
					</div>

					<video autoPlay muted={true} ref={userSourceRef} className="video-cnt__video"></video>
					<span className={`video-cnt--camera-disabled-info ${!conversationData.videoSettings.video && "video-cnt--camera-disabled-info-show"}`}>Your camera is disabled</span>

					<div className="video-cnt__options">
						<button className="video-cnt__block video-cnt__block--button" onClick={conversationData.toggleVideoUserVideo}>
							{conversationData.videoSettings.video ? <i className="fas fa-video"></i> : <i className="fas fa-video-slash"></i>}
						</button>
						<button className="video-cnt__block video-cnt__block--button" onClick={conversationData.toggleMicUserVideo}>
							{conversationData.videoSettings.muted ? <i className="fas fa-microphone-slash"></i> : <i className="fas fa-microphone"></i>}
						</button>
						<button className="video-cnt__block video-cnt__block--button video-cnt__block--danger" onClick={conversationData.leaveVideoCall}>
							<i style={{transform: "rotate(135deg)"}} className="fas fa-phone-alt"></i>
						</button>
					</div>
				</div>
				<div className="video-cnt">
					<video muted={conversationData.videoSettings.friendMuted} autoPlay ref={friendSourceRef} className="video-cnt__video"></video>
					<div className="video-cnt__header">
						<span className="video-cnt__block video-cnt__block--info">Friend</span>
						<button className="video-cnt__block video-cnt__block--button" onClick={toggleFriendMute}>
							{!conversationData.videoSettings.friendMuted ? <i className="fas fa-volume-down"></i> : <i className="fas fa-volume-mute"></i>}
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default VideoChat;
