//* --- Dependencies ---
import React from "react";
import ReactDOM from "react-dom";
import {Route, BrowserRouter} from "react-router-dom";

//* --- Styles ---
import "./sass/style.scss";

//* --- Components ---
import HomePage from "./components/HomePage";
import SignUpForm from "./components/SignUpForm";

//* --- Contexts ---
import {UserSettingsProvider} from "./contexts/UserSettingsProvider";

function App(props) {
	return (
		<BrowserRouter>
			<UserSettingsProvider>
				<Route exact path="/" component={HomePage} />
				<Route exact path="/sign-up" component={SignUpForm} />
			</UserSettingsProvider>
		</BrowserRouter>
	);
}

ReactDOM.render(<App />, document.querySelector("#root"));
