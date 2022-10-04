import React from "react";

const Notification = ({title, text, img}) => {
	return (
		<section className="notification">
			{img && (
				<div className="notification__icon">
					<img src={img} alt="notification icon" />
				</div>
			)}
			<div className="notification__content">
				<h2 className="notification__title">{title}</h2>
				<p className="notification__text">{text}</p>
			</div>
		</section>
	);
};

export default Notification;
