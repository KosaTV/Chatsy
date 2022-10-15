import React, {useContext, useEffect, useState} from "react";
import io from "socket.io-client";
import {API_URL} from "../helpers/APISettings";

const SocketContext = React.createContext();

const useSocket = () => {
	return useContext(SocketContext);
};

function SocketProvider({id, children}) {
	const [socket, setSocket] = useState();

	useEffect(() => {
		const newSocket = io(API_URL, {
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
