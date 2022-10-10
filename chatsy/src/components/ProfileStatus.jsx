import React, {useState, useRef, useEffect} from "react";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import profileImg from "../assets/imgs/profile.png";
import DropdownMenu from "./DropdownMenu";
import userOptions from "../utils/userOptions";
import {useSocket} from "../contexts/SocketProvider";
import {useSystemTools} from "../contexts/SystemProvider";

function ProfileStatus(props) {
	const userSettings = useUserSettings();
	const [selectedPicture, setSelectedPicture] = useState("");
	const fileInputRef = useRef();
	const socket = useSocket();
	const [modifiedUserOptions, setModifiedUserOptions] = useState([]);
	const systemTools = useSystemTools();

	const openFileUploaderMenu = e => {
		fileInputRef.current.click();
	};

	const handleProfilePictureSelector = e => {
		const fileInput = e.target;
		const reader = new FileReader();
		const file = fileInput.files[0];
		reader.readAsDataURL(file);
		let photoURL;

		reader.addEventListener("load", e => {
			photoURL = reader.result;
			setSelectedPicture(photoURL);
			userSettings.handleServerData("PATCH", `/user/${userSettings.user._id}`, JSON.stringify({photoURL}));
		});
	};

	const handleSignOut = e => {
		userOptions.find(option => option.name === "signOut").onClick(userSettings, socket);
	};

	useEffect(() => {
		setModifiedUserOptions(() => {
			const options = userOptions.map(option => {
				switch (option.name) {
					case "changePicture":
						option.onClick = openFileUploaderMenu;
						break;
					case "changeNick":
						const onClickMethod = () => {
							systemTools.setTogglePopup(popups => {
								return {...popups, changeUserNickName: true};
							});
						};
						option.onClick = onClickMethod;
						break;
					default:
						break;
				}

				return option;
			});

			return options;
		});
	}, []);
	return (
		<header className="nav__profile">
			<div className="nav__img-cnt">
				<img src={selectedPicture || userSettings.user.photoURL || profileImg} className="nav__img" alt="profile" onClick={openFileUploaderMenu} />
				<span className="nav__image-uploader-field">
					<i className="fas fa-camera"></i>
				</span>
			</div>
			<input id="profile-img" type="file" accept="image/png,image/jpeg" className="nav__img-file-input" ref={fileInputRef} onChange={handleProfilePictureSelector} />

			<div className="nav__name">
				<div className="nav__profile-content">
					<h1 className="user-name user-name--capital">{userSettings.user.nickName.charAt(0)}</h1>
					<h2 className="user-name">{userSettings.user.nickName.substr(1)}</h2>
				</div>

				<div className="nav__profile-options">
					<DropdownMenu direction="right" label={<i className="fas fa-cog"></i>} listOptions={modifiedUserOptions} />
					<button className="button button--secondary nav__button" onClick={handleSignOut}>
						<i className="fas fa-sign-out-alt"></i>
					</button>
				</div>
			</div>
		</header>
	);
}

export default ProfileStatus;
