import {useState, useEffect} from "react";

const saveValueInLocalStorage = (key, value) => {
	localStorage.setItem(key, value);
};

const useLocalStorage = (key, initialValue) => {
	const [value, setValue] = useState(() => {
		const jsonValue = localStorage.getItem(key);
		if (jsonValue) return jsonValue;
		else {
			if (!initialValue) return "";
			else if (typeof initialValue === "function") return initialValue();
			return initialValue;
		}
	});

	useEffect(() => {
		saveValueInLocalStorage(key, value);
	}, [key, value]);

	return [value, setValue];
};

export default useLocalStorage;
