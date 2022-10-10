import React from "react";
import logoSVG from "../assets/imgs/logo.svg";

const Loader = ({setLoadContent, loadedData}) => {
	const handleDisappear = e => {
		if (e.animationName === "appear") setLoadContent(true);
	};

	return (
		<section className={`loader-cnt ${loadedData ? "loader-cnt--loaded" : ""}`} onAnimationEnd={handleDisappear}>
			<div className="loader">
				<img src={logoSVG} className="loader__svg" alt="" />
			</div>
		</section>
	);
};

export default Loader;
