import React, {useState} from "react";
import {nanoid} from "nanoid";

const DropdownMenu = ({direction = "left", listOptions, label}) => {
	const [toggleMenu, setToggleMenu] = useState(false);

	const handleMenu = e => {
		setToggleMenu(prev => !prev);
	};

	const handleBlur = e => {
		setToggleMenu(false);
	};

	return (
		<div className="dropdown">
			<button className="mess-header-options__button button button--secondary mess-header-options__button--more" onBlur={handleBlur} onClick={handleMenu}>
				{label}
			</button>

			<div className={`dropdown-menu ${toggleMenu ? "dropdown-menu--show" : ""} ${direction === "right" ? "dropdown-menu--right-dir" : ""}`}>
				{listOptions
					.filter(option => option?.status !== "hidden")
					.map(option => {
						return (
							<div key={nanoid()} className="dropdown-menu__item" data-name={option.name} onMouseDown={option.onClick}>
								<div className="dropdown-menu__icon">{option.icon}</div>
								<div className="dropdown-menu__content">{option.label}</div>
							</div>
						);
					})}
			</div>
		</div>
	);
};

export default DropdownMenu;
