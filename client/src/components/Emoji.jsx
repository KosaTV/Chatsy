import React, {useMemo} from "react";
import {nanoid} from "nanoid";

function Emoji(props) {
	const copyEmoji = e => {
		if (e.target.closest(".emoji")) {
			const value = e.target.innerHTML;
			props.setMessageText(props.messageText + value);
		}
	};

	const handleClose = e => {
		if (!e.target.closest(".window")) props.setOpened(false);
	};

	const generateEmojis = useMemo(() => {
		return props.emojis.map(emoji => {
			return (
				<button key={nanoid()} className="emoji" type="button">
					{emoji}
				</button>
			);
		});
	}, [props.emojis]);

	return (
		<div className={`window ${props.opened ? "window--opened" : ""}`} onBlur={handleClose} onClick={copyEmoji}>
			{generateEmojis}
		</div>
	);
}

export default Emoji;
