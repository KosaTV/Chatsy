import React, {useState} from "react";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import chatsyLogo from "../assets/imgs/logo.svg";
import bannerImg from "../assets/imgs/banner_2.png";

//* --- Imgs ---
// import chattingImg from "../assets/imgs/chatting.svg";
// import pathImg from "../assets/imgs/path_1.svg";

function Form(props) {
	const [formData, setFormData] = useState({
		email: "",
		password: ""
	});

	const userSettings = useUserSettings();

	const handleSubmit = e => {
		e.preventDefault();
		if (formData.email.length && formData.password.length) userSettings.userLogin(formData);
	};

	const handleInput = e => {
		const input = e.target;
		setFormData({...formData, [input.name]: input.value});
	};

	return (
		<>
			<div className="content">
				<form onSubmit={handleSubmit} className="form">
					<header className="header">
						<nav>
							<div className="logo">
								<a href="/" className="logo__link">
									<img src={chatsyLogo} className="logo__img" alt="logo" />
									Chatsy
								</a>
							</div>
						</nav>
					</header>
					<section className="form__data">
						<h1 className="header__sub-title">Sign in</h1>
						<p className="header__text">Login with your data, that you entered during your registration.</p>
						{userSettings.user && userSettings.user.error && (
							<span className="form__error incorrect-login-data">
								<span className="form__error-icon">!</span>
								{userSettings.user.error}
							</span>
						)}
						<div className="form__row">
							<label className="form__label" htmlFor="email">
								Email:
							</label>
							<input
								autoComplete="email"
								required
								className="input form__input"
								type="email"
								id="email"
								name="email"
								placeholder="me@example.com"
								value={formData.email}
								onChange={handleInput}
							/>
						</div>

						<div className="form__row">
							<label className="form__label" htmlFor="password">
								Password:
							</label>
							<input
								required
								className="input form__input"
								type="password"
								autoComplete="current-password"
								placeholder="●●●●●●●●"
								id="password"
								name="password"
								value={formData.password}
								onChange={handleInput}
							/>
						</div>

						<div className="form__row form__row--options form__row--away">
							<a className="link form__link" href="/sign-up">
								Register
							</a>
							<button className="button form__button" type="submit">
								Sign In
							</button>
						</div>
					</section>
				</form>
			</div>
			<section className="img-section">
				<img src={bannerImg} className="img-section__img" alt="" />
			</section>

			<footer className="footer">Chatsy 2022 &copy;</footer>
		</>
	);
}

export default Form;
