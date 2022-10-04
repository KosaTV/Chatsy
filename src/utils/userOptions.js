const userOptions = [
	{
		icon: <i className="fas fa-pencil-alt"></i>,
		name: "changeNick",
		label: "change nickname",
		onClick: () => {}
	},
	{
		icon: <i className="fas fa-camera"></i>,
		name: "changePicture",
		label: "change profile picture",
		onClick: () => {}
	},
	{
		icon: <i className="fas fa-sign-out-alt"></i>,
		name: "signOut",
		label: "Sign Out",
		status: "hidden",
		onClick: async (userSettings, socket) => {
			socket.disconnect();
			const data = await userSettings.handleServerData("GET", "/logout");
			if (!data.error) {
				userSettings.setIsOldUser("");
				return userSettings.setUser();
			}
		}
	}
];

export default userOptions;
