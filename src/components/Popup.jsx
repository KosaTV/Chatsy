import React from "react";
import {useEffect} from "react";
import ReactDOM from "react-dom";

const PopupSyntax = props => {
	const closePopup = e => {
		if (e.target.classList.contains("popup-bg") || e.target.closest(".popup__close") || e.target.dataset.popupClose) {
			props.toggle(popups => {
				return {...popups, [props.id]: false};
			});
			if (props.onClose) props.onClose();
		}
	};

	return (
		props.open && (
			<>
				<div onClick={closePopup} className="popup-bg">
					<div className="popup">
						<div className="top-bar">
							<div className="popup__title">{props.title || "Popup"}</div>
							<button className="popup__close">
								<i className="fas fa-times"></i>
							</button>
						</div>
						<div className="popup__content">{props.children}</div>
					</div>
				</div>
			</>
		)
	);
};

const Popup = props => {
	return ReactDOM.createPortal(<PopupSyntax {...props} />, document.body);
};

export default Popup;
