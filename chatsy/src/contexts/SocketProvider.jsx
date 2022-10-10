import React, {useContext, useEffect, useState} from "react";
import io from "socket.io-client";

const SocketContext = React.createContext();

const useSocket = () => {
	return useContext(SocketContext);
};

function SocketProvider({id, children}) {
	const [socket, setSocket] = useState();

	useEffect(() => {
		const newSocket = io("https://chatsyapp-server.herokuapp.com", {
			transports: ["websocket"],
			query: {
				id
			}
		});

		setSocket(newSocket);

		return () => newSocket.disconnect();
	}, [id]);

	return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export {SocketProvider, useSocket};
