//* --- Dependencies ---
import React from "react";

//* --- Components ---
import Form from "./Form";
import ChatRoom from "./ChatRoom";

//* --- Contexts ---
import {ConversationContextProvider} from "../contexts/ConversationProvider";
import {SocketProvider} from "../contexts/SocketProvider";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import {SystemContextProvider} from "../contexts/SystemProvider";

function HomePage(props) {
	const userSettings = useUserSettings();

	return (
		<>
			{userSettings.user?._id ? (
				<SocketProvider id={userSettings.user._id} accessToken={userSettings.user.accessToken}>
					<ConversationContextProvider>
						<SystemContextProvider>
							<ChatRoom />
						</SystemContextProvider>
					</ConversationContextProvider>
				</SocketProvider>
			) : userSettings.user?.waiting ? (
				""
			) : (
				<Form id={userSettings.ID} setID={userSettings.setID} />
			)}
		</>
	);
}

export default HomePage;
