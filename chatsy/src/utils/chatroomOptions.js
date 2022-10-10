const chatroomOptions = [
	// {
	// 	icon: <i className="fas fa-star"></i>,
	// 	name: "rate",
	// 	label: "add to favourite",
	// 	role: "user",
	// 	exceptRole: [],
	// 	onClick: (convData,{id,memberId}) => {
	//	convData.leaveGroup(...args);
	//}
	// },
	{
		icon: <i className="fas fa-images"></i>,
		name: "changeGroupPicture",
		label: "set group picture",
		role: "admin",
		exceptRole: [],
		onClick: ({systemTools, convData, id, memberId}) => {
			systemTools.setTogglePopup(popups => {
				return {...popups, changeGroupPicture: true};
			});

			systemTools.setPopupFormInfo(popupFormInfo => {
				return {...popupFormInfo, currentGroupInfo: {...convData.selectedContact, action: "groupPicture"}};
			});
		}
	},
	{
		icon: <i className="fas fa-pen"></i>,
		name: "changeName",
		label: "set group name",
		role: "admin",
		exceptRole: [],
		onClick: ({systemTools, convData, id, memberId}) => {
			systemTools.setTogglePopup(popups => {
				return {...popups, modifyGroup: true};
			});

			systemTools.setPopupFormInfo(popupFormInfo => {
				return {...popupFormInfo, currentGroupInfo: {...convData.selectedContact, action: "groupName"}};
			});
		}
	},
	{
		icon: <i className="fas fa-users"></i>,
		name: "infoMembers",
		label: "group info",
		role: "user",
		exceptRole: [],
		onClick: ({systemTools, convData, id, memberId}) => {
			systemTools.setTogglePopup(popups => {
				return {...popups, modifyGroup: true};
			});

			systemTools.setPopupFormInfo(popupFormInfo => {
				return {...popupFormInfo, currentGroupInfo: {...convData.selectedContact, action: "show"}};
			});
		}
	},
	{
		icon: <i className="fas fa-user-friends"></i>,
		name: "addMember",
		label: "add a new member",
		role: "admin",
		exceptRole: [],
		onClick: ({systemTools, convData, id, memberId}) => {
			systemTools.setTogglePopup(popups => {
				return {...popups, modifyGroup: true};
			});

			systemTools.setPopupFormInfo(popupFormInfo => {
				return {...popupFormInfo, currentGroupInfo: {...convData.selectedContact, action: "add"}};
			});
		}
	},
	{
		icon: <i className="fas fa-user-slash"></i>,
		name: "deleteMember",
		label: "delete a member",
		role: "admin",
		exceptRole: [],
		onClick: ({systemTools, convData, id, memberId}) => {
			systemTools.setTogglePopup(popups => {
				return {...popups, modifyGroup: true};
			});

			systemTools.setPopupFormInfo(popupFormInfo => {
				return {...popupFormInfo, currentGroupInfo: {...convData.selectedContact, action: "delete-member"}};
			});
		}
	},
	{
		icon: <i className="fas fa-eraser"></i>,
		name: "deleteGroup",
		label: "delete the group",
		role: "admin",
		exceptRole: [],
		onClick: ({systemTools, convData, id, memberId}) => {
			systemTools.setTogglePopup(popups => {
				return {...popups, deleteGroup: true};
			});

			systemTools.setPopupFormInfo(popupFormInfo => {
				return {...popupFormInfo, currentGroupInfo: {...convData.selectedContact, action: "delete-group"}};
			});
		}
	},
	// {
	// 	icon: <i className="fas fa-ban"></i>,
	// 	name: "ban",
	// 	label: "ban a member",
	// 	role: "admin",
	// 	exceptRole: [],
	// 	onClick: (convData,{id,memberId}) => {
	//	convData.leaveGroup(...args);
	//}
	// },
	// {
	// 	icon: <i className="fas fa-mail-bulk"></i>,
	// 	name: "request",
	// 	label: "request to admin",
	// 	role: "user",
	// 	exceptRole: ["admin"],
	// 	onClick: (convData,{id,memberId}) => {
	//	convData.leaveGroup(...args);
	//}
	// },
	// {
	// 	icon: <i className="far fa-question-circle"></i>,
	// 	name: "seeDetails",
	// 	label: "group info",
	// 	role: "user",
	// 	exceptRole: [],
	// 	onClick: (convData,{id,memberId}) => {
	//	convData.leaveGroup(...args);
	//}
	// },
	{
		icon: <i className="fas fa-sign-out-alt"></i>,
		name: "leaveGroup",
		label: "leave a group",
		role: "user",
		exceptRole: ["admin"],
		onClick: ({systemTools, convData, id, userInfo}) => {
			convData.leaveGroup(id, userInfo._id);
		}
	}
];

export default chatroomOptions;
