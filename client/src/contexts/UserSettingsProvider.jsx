import React, {useContext, useState, useEffect} from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import JWTDecode from "jwt-decode";

const UserSettings = React.createContext({});

const useUserSettings = () => {
	return useContext(UserSettings);
};

function UserSettingsProvider({children}) {
	const [user, setUser] = useState({waiting: true, error: false});
	const [isOldUser, setIsOldUser] = useLocalStorage("session");
	const [token, setToken] = useLocalStorage("chatsy-token");

	const loginAutomatically = async () => {
		let error = false;
		const data = await handleServerData("POST", "/auto-login", JSON.stringify({token}));
		if (!data.error) return setUser(data.user);
		if (isOldUser === "old") error = data.error.message ? data.error.message : data.error;

		return setUser({waiting: false, error});
	};

	useEffect(() => {
		(async () => {
			loginAutomatically();
		})();
	}, []);

	const refreshToken = async () => {
		const refreshedToken = JSON.stringify({refreshedToken: user.refreshedToken});
		const data = await fetch("refresh", {
			method: "POST",
			headers: {Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${user.accessToken}`},
			body: refreshedToken
		});
		return data;
	};

	const isTokenExpired = token => {
		const currentTime = new Date().getTime();
		const decodedToken = JWTDecode(token);
		return decodedToken.exp * 1000 < currentTime;
	};

	const handleServerData = async (method, endpoint, data = "{}", checkToken = true) => {
		const headers = {Accept: "application/json", "Content-Type": "application/json", Authorization: token};
		const fullInfo = {
			method,
			headers,
			credentials: "include",
			body: JSON.stringify({...JSON.parse(data), chatsyToken: token})
		};

		const {body, ...getInfo} = fullInfo;
		let finallObject = method === "POST" || method === "PUT" || method === "PATCH" ? fullInfo : getInfo;

		const result = await fetch(`http://localhost:5000${endpoint}`, finallObject);

		const parsedResult = result.json();

		return parsedResult;
	};

	const userLogin = async formData => {
		let response;

		try {
			response = await handleServerData("POST", "/login", JSON.stringify(formData), false);

			if (!response.error) {
				setIsOldUser("old");
				setToken(response.token);
				return setUser({...response.user});
			}

			return setUser(prev => {
				return {...prev, error: response.error};
			});
		} catch (err) {
			return err;
		}
	};

	return <UserSettings.Provider value={{user, setUser, userLogin, handleServerData, isOldUser, setIsOldUser}}>{children}</UserSettings.Provider>;
}

export {UserSettingsProvider, useUserSettings};
