const friendOptions = [
	{
		icon: <i className="fas fa-trash-alt"></i>,
		name: "deleteFriend",
		label: "delete a friend",
		role: "admin",
		exceptRole: [],
		onClick: (convData, id) => {
			convData.deleteFriend(id);
		}
	},
	{
		icon: <i className="fas fa-phone-alt"></i>,
		name: "callUser",
		label: "call the friend",
		role: "admin",
		exceptRole: [],
		onClick: (convData, id) => {
			convData.callUser(id);
		}
	}
];

export default friendOptions;
