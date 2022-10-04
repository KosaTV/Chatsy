import {nanoid} from "nanoid";
import React, {useContext, useState, useRef} from "react";
import MiniTable from "../components/MiniTable";
import Popup from "../components/Popup";
import {useConversation} from "../contexts/ConversationProvider";
import {useSocket} from "../contexts/SocketProvider";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import testImg from "../assets/imgs/profile.png";
import ReceivingCallPopup from "../components/ReceivingCallPopup";
import SendingCallPopup from "../components/SendingCallPopup";
import VideoChat from "../components/VideoChat";

const SystemContext = React.createContext({});

const useSystemTools = () => {
	return useContext(SystemContext);
};

function SystemContextProvider({children}) {
	const conversationData = useConversation();
	const userSettings = useUserSettings();
	const uploadedImageRef = useRef();
	const DnDFieldRef = useRef();
	const socket = useSocket();

	const [togglePopup, setTogglePopup] = useState(data => {
		return {
			addFriend: false,
			createGroup: false,
			modifyGroup: false,
			changeGroupPicture: false,
			changeUserNickName: false,
			joinGroup: false,
			addMember: false,
			deleteMember: false,
			deleteGroup: false,
			...data
		};
	});

	const initialPopupData = {
		groupName: "",
		nickName: "",
		groupID: "",
		contactID: "",
		userIds: "",
		members: [],
		membersIds: [],
		currentGroupInfo: {}
	};

	const [popupFormInfo, setPopupFormInfo] = useState(initialPopupData);
	const fileInputRef = useRef();

	const resetPopupData = () => {
		setPopupFormInfo(initialPopupData);
	};

	const handleMembersList = e => {
		e.preventDefault();
		const items = [...e.target.querySelectorAll(".table__item")];
		const members = items.map(item => {
			return {
				name: item.querySelector(".table__item-label").innerText,
				id: item.querySelector(".table__item-label").dataset.id,
				checked: !!item.querySelector("input[type=checkbox]:checked")
			};
		});

		let membersIds = popupFormInfo.userIds.split(",");

		setPopupFormInfo(data => {
			return {...data, members, membersIds};
		});
		setTogglePopup(popups => {
			return {...popups, addMember: false, deleteMember: false};
		});
	};

	const handleTextInputPopup = e => {
		const name = e.target.name;
		setPopupFormInfo({...popupFormInfo, [name]: e.target.value});
	};

	const openAddMembers = e => {
		if (!(popupFormInfo.members.length || popupFormInfo.membersIds.length)) {
			let members = conversationData.friends.map(member => {
				return {name: member.ownName, id: member._id, checked: false};
			});

			if (Object.entries(popupFormInfo.currentGroupInfo).length) {
				members = members.filter(member => !popupFormInfo.currentGroupInfo.members.some(contMemb => member.id === contMemb._id));
			}

			setPopupFormInfo(data => {
				return {
					...data,
					members
				};
			});
		}

		setTogglePopup(popups => {
			return {...popups, addMember: true};
		});
	};

	const openDeleteMembers = e => {
		if (!(popupFormInfo.members.length || popupFormInfo.membersIds.length)) {
			const members = popupFormInfo.currentGroupInfo.members.map(member => {
				return {name: member.nick, id: member._id, checked: false};
			});

			setPopupFormInfo(data => {
				return {
					...data,
					members
				};
			});
		}

		setTogglePopup(popups => {
			return {...popups, deleteMember: true};
		});
	};

	const handleJoinGroup = async e => {
		e.preventDefault();

		const groupId = popupFormInfo.groupID;

		try {
			const groupData = await conversationData.addGroup(groupId);

			if (!groupData.error) {
				setTogglePopup(popups => {
					return {...popups, joinGroup: false};
				});

				conversationData.refreshGroups();
				conversationData.handleConversation(groupData.id);
			}
		} catch (err) {
			console.log("can not join to that group", err);
		}
	};

	const getImageDatabase64 = async image => {
		const reader = new FileReader();

		reader.readAsDataURL(image);
		let photoURL;

		await new Promise(resolve => {
			const onLoad = e => {
				reader.removeEventListener("load", onLoad);
				photoURL = reader.result;
				resolve();
			};
			reader.addEventListener("load", onLoad);
		});

		return photoURL;
	};

	const handleGroupPicture = async e => {
		e.preventDefault();

		const photoURL = uploadedImageRef.current.src;

		try {
			const result = await userSettings.handleServerData("PATCH", `/groups/${conversationData.selectedContact.id}`, JSON.stringify({photoURL}));
			if (!result.error) {
				setTogglePopup(popups => {
					return {...popups, changeGroupPicture: false};
				});

				socket.emit("group-modify", {
					recipients: conversationData.selectedContact.members.map(member => member._id),
					groupId: conversationData.selectedContact.id,
					type: "change-group-picture"
				});
			}
		} catch (err) {
			console.log("image too large or incorrect");
		}
	};

	const handleNickChange = async e => {
		e.preventDefault();
		try {
			const result = await userSettings.handleServerData("PATCH", `/user/${userSettings.user._id}`, JSON.stringify({nickName: popupFormInfo.nickName}));

			if (!result.error) {
				userSettings.setUser(userInfo => {
					return {...userInfo, nickName: popupFormInfo.nickName};
				});
				setTogglePopup(popups => {
					return {...popups, changeUserNickName: false};
				});
			}
		} catch (err) {
			console.log("something went wrong");
		}
	};

	const handlePictureShowOnUpload = photoURL => {
		uploadedImageRef.current.src = photoURL;
	};

	const handlePictureDrop = async e => {
		e.preventDefault();

		let file;
		if (e.currentTarget?.type === "file") {
			file = fileInputRef.current.files[0];
		} else {
			file = e.dataTransfer.files[0];
		}

		DnDFieldRef.current.classList.remove("dnd-field--drag-over");
		DnDFieldRef.current.classList.add("dnd-field--dropped");

		const photoURL = await getImageDatabase64(file);
		handlePictureShowOnUpload(photoURL);
	};

	const handlePictureDragOver = e => {
		e.preventDefault();
		DnDFieldRef.current.classList.add("dnd-field--drag-over");
	};

	const handlePictureDragFinish = e => {
		DnDFieldRef.current.classList.remove("dnd-field--drag-over");
	};

	const openPictureUploader = e => {
		fileInputRef.current.click();
	};

	const handleAddFriend = async e => {
		e.preventDefault();

		const friendId = popupFormInfo.contactID;

		try {
			const friendData = await conversationData.addFriend(friendId);

			if (!friendData.error) {
				setTogglePopup(popups => {
					return {...popups, addFriend: false};
				});
				conversationData.refreshFriends();
			}
		} catch (err) {
			console.log("can not add that friend", err);
		}
	};

	const handleCreateGroup = async e => {
		e.preventDefault();

		try {
			const membersIds = [...popupFormInfo.members.filter(member => member.checked).map(member => member.id), ...popupFormInfo.membersIds];
			const sendData = JSON.stringify({name: popupFormInfo.groupName, members: membersIds});
			const result = await userSettings.handleServerData("POST", "/groups", sendData);
			const groupData = await result;

			if (!groupData.error) {
				resetPopupData();

				setTogglePopup(popups => {
					return {...popups, createGroup: false};
				});

				conversationData.refreshGroups();
				conversationData.handleConversation(groupData.id);
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleDeleteGroup = async e => {
		e.preventDefault();

		try {
			const id = popupFormInfo.currentGroupInfo.id;
			const result = await userSettings.handleServerData("DELETE", `/groups/${id}`);

			const groupData = await result;

			if (!groupData.error) {
				resetPopupData();
				setTogglePopup(popups => {
					return {...popups, deleteGroup: false};
				});

				conversationData.refreshGroups();
				conversationData.handleConversation("61799c2d46f5018d737cd7d5");

				socket.emit("group-modify", {
					recipients: popupFormInfo.currentGroupInfo.members.map(member => member._id),
					groupId: popupFormInfo.currentGroupInfo.id,
					type: "delete-group"
				});
			}
		} catch (err) {
			console.error(err);
		}
	};

	const getCheckedData = data => {
		return data.filter(data => data.checked);
	};

	const handleModifyGroup = async e => {
		e.preventDefault();
		let data = {eventType: null, recipients: []};
		try {
			if (popupFormInfo.currentGroupInfo.action === "groupName") {
				data.eventType = "change-group-name";
				data.recipients = conversationData.selectedContact.members.map(member => {
					return member._id;
				});
				data.name = popupFormInfo.currentGroupInfo.name;
			} else if (popupFormInfo.currentGroupInfo.action === "add") {
				data.eventType = "add-group-member";
				data.newMembers = getCheckedData(popupFormInfo.members).map(member => {
					return member.id;
				});
				data.recipients = data.newMembers;
			} else if (popupFormInfo.currentGroupInfo.action === "delete-member") {
				data.eventType = "delete-group-member";
				data.removeMembers = getCheckedData(popupFormInfo.members).map(member => member.id);
				data.recipients = data.removeMembers;
			}

			const id = popupFormInfo.currentGroupInfo.id;
			const result = await userSettings.handleServerData("PATCH", `/groups/${id}`, JSON.stringify({...data}));
			const groupData = await result;
			if (groupData.error) return;

			socket.emit("group-modify", {recipients: data.recipients, groupId: popupFormInfo.currentGroupInfo.id, type: data.eventType});

			resetPopupData();
			setTogglePopup(popups => {
				return {...popups, modifyGroup: false};
			});

			conversationData.refreshGroups();
			conversationData.handleConversation(id);
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<SystemContext.Provider value={{togglePopup, setTogglePopup, setPopupFormInfo, popupFormInfo}}>
			<ReceivingCallPopup onAcceptButton={e => conversationData.acceptCall()} onRejectButton={e => conversationData.rejectCall()} show={conversationData.caller} />
			<SendingCallPopup onCancelButton={e => conversationData.cancelVideoCall()} show={conversationData.callMaking || conversationData.startedCalling} />
			<VideoChat userSourceRef={conversationData.myCameraVideo} friendSourceRef={conversationData.friendCameraVideo} show={conversationData.recipient} />

			<Popup id="createGroup" open={togglePopup.createGroup} onClose={resetPopupData} toggle={setTogglePopup} title="Create Group">
				<form onSubmit={handleCreateGroup} className="popup__form">
					<input className="input popup__input" type="text" name="groupName" onChange={handleTextInputPopup} placeholder="type name of group" />
					<div className="popup__table">
						<header>
							<h1 className="members__header">Members</h1>
						</header>
						<section className="members__list">
							<li className="popup__table-item">You</li>
							{popupFormInfo.members
								.filter(member => {
									return member.checked;
								})
								.map(member => {
									return (
										<li key={nanoid()} className="popup__table-item" data-id={member.id}>
											{member.name}
										</li>
									);
								})}
							{popupFormInfo.membersIds.map(member => {
								return (
									<li key={nanoid()} className="popup__table-item" data-id={member}>
										<span className="popup__table-item popup__table-item--higlight">ID:</span> {member}
									</li>
								);
							})}
						</section>
					</div>
					<button className="button button--secondary popup__button" type="button" onClick={openAddMembers}>
						Add members
					</button>
					<button className="button  popup__button">Create</button>
				</form>
			</Popup>

			<Popup id="modifyGroup" open={togglePopup.modifyGroup} onClose={resetPopupData} toggle={setTogglePopup} title="Modify Group">
				<form onSubmit={handleModifyGroup} className="popup__form">
					{popupFormInfo.currentGroupInfo.action === "groupName" ? (
						<input
							className="input popup__input"
							onChange={e =>
								setPopupFormInfo(popupFormInfo => {
									return {...popupFormInfo, currentGroupInfo: {...popupFormInfo.currentGroupInfo, name: e.target.value}};
								})
							}
							type="text"
							name="groupName"
							value={popupFormInfo.currentGroupInfo.name}
						/>
					) : (
						<h1 className="popup__header">{popupFormInfo.currentGroupInfo.name}</h1>
					)}

					{popupFormInfo.currentGroupInfo.action === "show" && (
						<div className="popup__table">
							<header>
								<h1 className="members__header">Members</h1>
							</header>
							<section className="members__list">
								<li className="popup__table-item">You</li>
								{popupFormInfo.currentGroupInfo.members
									.filter(member => member._id !== userSettings.user._id)
									.map(member => {
										return (
											<li key={nanoid()} className="popup__table-item" data-id={member._id}>
												{member.nick}
											</li>
										);
									})}
							</section>
						</div>
					)}

					{popupFormInfo.currentGroupInfo.action === "add" && (
						<div className="popup__table">
							<header>
								<h1 className="members__header">New members</h1>
							</header>
							<section className="members__list"></section>
							{popupFormInfo.members
								.filter(member => member.checked)
								.map(member => {
									return (
										<li key={nanoid()} className="popup__table-item" data-id={member.id}>
											{member.name}
										</li>
									);
								})}
							{popupFormInfo.membersIds.map(member => {
								return (
									<li key={nanoid()} className="popup__table-item" data-id={member}>
										<span className="popup__table-item popup__table-item--higlight">ID:</span> {member}
									</li>
								);
							})}
						</div>
					)}

					{popupFormInfo.currentGroupInfo.action === "delete-member" && (
						<div className="popup__table">
							<header>
								<h1 className="members__header">Members to be deleted</h1>
							</header>
							<section className="members__list"></section>
							{popupFormInfo.members
								.filter(member => member.checked)
								.map(member => {
									return (
										<li key={nanoid()} className="popup__table-item" data-id={member.id}>
											{member.name}
										</li>
									);
								})}
							{popupFormInfo.membersIds.map(member => {
								return (
									<li key={nanoid()} className="popup__table-item" data-id={member}>
										<span className="popup__table-item popup__table-item--higlight">ID:</span> {member}
									</li>
								);
							})}
						</div>
					)}

					{popupFormInfo.currentGroupInfo.action !== "show" && (
						<>
							{popupFormInfo.currentGroupInfo.action !== "groupName" && (
								<button
									className="button button--secondary popup__button"
									type="button"
									onClick={popupFormInfo.currentGroupInfo.action === "add" ? openAddMembers : openDeleteMembers}
								>
									Open list
								</button>
							)}

							<button className="button  popup__button" type="submit">
								Set
							</button>
						</>
					)}
				</form>
			</Popup>

			<Popup id="addMember" title="Add members" open={togglePopup.addMember} toggle={setTogglePopup}>
				<form className="popup__form popup__form--list" onSubmit={handleMembersList}>
					<label htmlFor="userIds" className="global-label">
						If you want to add someone other:
					</label>
					<input
						className="input popup__input add-members-users-id"
						defaultValue={popupFormInfo.membersIds.concat()}
						type="text"
						name="userIds"
						id="userIds"
						onChange={handleTextInputPopup}
						placeholder="id1,id2,id3..."
					/>
					<MiniTable list={popupFormInfo.members} submitTextBtn="Set" />
				</form>
			</Popup>

			<Popup id="deleteMember" title="Delete members" open={togglePopup.deleteMember} toggle={setTogglePopup}>
				<form className="popup__form popup__form--list" onSubmit={handleMembersList}>
					<MiniTable list={popupFormInfo.members.filter(member => member.id !== userSettings.user._id)} submitTextBtn="Set" />
				</form>
			</Popup>

			<Popup id="joinGroup" open={togglePopup.joinGroup} toggle={setTogglePopup} title="Join Group">
				<form onSubmit={handleJoinGroup} className="popup__form">
					<input className="input popup__input" type="text" name="groupID" onChange={handleTextInputPopup} placeholder="type id of group" />
					<button className="button popup__button" type="submit">
						Join
					</button>
				</form>
			</Popup>

			<Popup id="addFriend" open={togglePopup.addFriend} toggle={setTogglePopup} title="Add Friend">
				<form onSubmit={handleAddFriend} className="popup__form">
					<input className="popup__input" type="text" name="contactID" onChange={handleTextInputPopup} placeholder="type id of user" />
					<button className="button popup__button">Add</button>
				</form>
			</Popup>

			<Popup id="changeGroupPicture" open={togglePopup.changeGroupPicture} toggle={setTogglePopup} title="Change Group Picture">
				<form onSubmit={handleGroupPicture} className="popup__form">
					<div
						className="dnd-field"
						ref={DnDFieldRef}
						onDragOver={handlePictureDragOver}
						onDragLeave={handlePictureDragFinish}
						onDragEnd={handlePictureDragFinish}
						onDrop={handlePictureDrop}
						onClick={openPictureUploader}
					>
						<span className="dnd-field__text">Drag your picture or click here</span>
						<div className="dnd-field__thumbnail">
							<img className="dnd-field__thumbnail-img" ref={uploadedImageRef} src="" alt="uploaded file" />
						</div>
						<input className="dnd-field__file-input" type="file" accept="image/png,image/jpeg" id="group-image-file-input" onChange={handlePictureDrop} ref={fileInputRef} />
					</div>
					<button className="button popup__button">Change</button>
				</form>
			</Popup>

			<Popup id="changeUserNickName" open={togglePopup.changeUserNickName} toggle={setTogglePopup} title="Change Nickname">
				<form onSubmit={handleNickChange} className="popup__form">
					<input className="input popup__input" type="text" name="nickName" onChange={handleTextInputPopup} placeholder="type your new nickname" />
					<button className="button  popup__button">Change</button>
				</form>
			</Popup>

			<Popup id="deleteGroup" open={togglePopup.deleteGroup} toggle={setTogglePopup} title="Delete Group">
				<form onSubmit={handleDeleteGroup} className="popup__form">
					<div className="popup__table">
						<header>
							<h1 className="popup__content-title">That group is going to be deleted</h1>
						</header>
						<button className="button popup__button">Got it</button>
						<button type="button" className="button popup__button button--secondary" data-popup-close={true}>
							Close
						</button>
					</div>
				</form>
			</Popup>
			{children}
		</SystemContext.Provider>
	);
}

export {SystemContextProvider, useSystemTools};
