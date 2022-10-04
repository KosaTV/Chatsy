import React, {useLayoutEffect, useState} from "react";
import {useUserSettings} from "../contexts/UserSettingsProvider";
import chatsyLogo from "../assets/imgs/logo.svg";
import bannerImg from "../assets/imgs/banner.png";
import {months} from "../helpers/dateFns";

function Form(props) {
	const [days, setDays] = useState([]);
	const [years, setYears] = useState([]);

	useLayoutEffect(() => {
		for (let i = 1; i <= 31; i++) {
			setDays(prev => [...prev, i]);
		}

		for (let i = new Date().getFullYear(); i >= 1905; i--) {
			setYears(prev => [...prev, i]);
		}
	}, []);

	const [birthData, setBirthData] = useState({
		year: new Date().getFullYear(),
		month: months[new Date().getMonth()],
		day: days[new Date().getDate() - 1]
	});

	const [formData, setFormData] = useState({
		name: "",
		lastName: "",
		nickName: "",
		email: "",
		password: "",
		birth: new Date(
			birthData.year,
			months.findIndex(month => month === birthData.month),
			birthData.day
		)
	});

	const userSettings = useUserSettings();

	const handleSubmit = async e => {
		e.preventDefault();

		const day = birthData.day;
		const month = months.findIndex(month => month === birthData.month);
		const year = birthData.year;

		const date = new Date();

		date.setDate(day);
		date.setMonth(month);
		date.setFullYear(year);

		const fullData = {
			...formData,
			birth: date
		};

		try {
			const response = await userSettings.handleServerData("POST", "/sign-up", JSON.stringify(fullData), false);

			if (response.error) {
				userSettings.setUser(prev => {
					return {...prev, error: Array.isArray(response.error) ? response.error[0].msg : response.error};
				});
				return;
			}
			await userSettings.userLogin({email: formData.email, password: formData.password});
			window.location = response.href;
		} catch (err) {
			console.log(err);
		}
	};

	const handleInput = e => {
		const input = e.target;
		setFormData({...formData, [input.name]: input.value});
	};

	const handleBirthData = e => {
		const select = e.target;

		setBirthData({...birthData, [select.name]: select.value});
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
						<h1 className="header__sub-title">Sign Up</h1>
						<p className="header__text">Create account for free and chat like you want.</p>
						{userSettings.user && userSettings.user.error && (
							<span className="form__error incorrect-login-data">
								<span className="form__error-icon">!</span>
								{userSettings.user.error}
							</span>
						)}
						<div className="multiple-cnt">
							<div className="form__row">
								<label className="form__label" htmlFor="name">
									Name:
								</label>
								<input
									required
									className="input form__input multiple-cnt__input"
									type="text"
									id="name"
									name="name"
									autoComplete="name"
									placeholder="My Name"
									value={formData.name}
									onChange={handleInput}
								/>
							</div>

							<div className="form__row">
								<label className="form__label" htmlFor="lastName">
									Last Name:
								</label>
								<input
									required
									autoComplete="family-name"
									className="input form__input multiple-cnt__input"
									type="text"
									id="lastName"
									name="lastName"
									placeholder="My Last name"
									value={formData.lastName}
									onChange={handleInput}
								/>
							</div>
						</div>
						<div className="form__row">
							<label className="form__label" htmlFor="nickName">
								Nickname:
							</label>
							<input
								required
								className="input form__input"
								type="text"
								id="nickName"
								name="nickName"
								autoComplete="nickname"
								placeholder="My nickname"
								value={formData.nickName}
								onChange={handleInput}
							/>
						</div>
						<div className="form__row">
							<label className="form__label" htmlFor="email">
								Email:
							</label>
							<input
								required
								className="input form__input"
								type="email"
								id="email"
								name="email"
								autoComplete="email"
								placeholder="example@domain.com"
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
								autoComplete="new-password"
								placeholder="●●●●●●●●"
								id="password"
								name="password"
								value={formData.password}
								onChange={handleInput}
							/>
						</div>
						<div className="form__row">
							<fieldset className="form__group">
								<legend className="form__label form__label--small">Date of Birth:</legend>
								<div className="multiple-cnt">
									<div className="form__row">
										<label className="form__label form__label--small form__label--interactive" htmlFor="month">
											Month:
										</label>
										<select required className="form__select select" id="month" name="month" value={birthData.month} onChange={handleBirthData}>
											{months.map(month => {
												return (
													<option key={month} value={month}>
														{month}
													</option>
												);
											})}
										</select>
									</div>
									<div className="form__row">
										<label className="form__label form__label--small form__label--interactive" htmlFor="days">
											Days:
										</label>
										<select required className="form__select select" id="days" name="day" value={birthData.day} onChange={handleBirthData}>
											{days.map(day => {
												return (
													<option key={day} value={day}>
														{day}
													</option>
												);
											})}
										</select>
									</div>
									<div className="form__row">
										<label className="form__label form__label--small form__label--interactive" htmlFor="years">
											Years:
										</label>
										<select required className="form__select select" value={birthData.year} onChange={handleBirthData} id="years" name="year">
											{years.map(year => {
												return (
													<option key={year} value={year}>
														{year}
													</option>
												);
											})}
										</select>
									</div>
								</div>
							</fieldset>
						</div>
						<div className="form__row">
							<button className="button form__button form__button--long" type="submit">
								Sign Up
							</button>
							<a className="link form__link form__link--normal" href="/">
								I have an account already
							</a>
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
