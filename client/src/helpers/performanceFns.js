const debounce = (fn, delay = 300) => {
	let timeOut;
	return function () {
		if (timeOut) clearTimeout(timeOut);
		timeOut = setTimeout(() => {
			const that = this;
			const args = arguments;
			fn.apply(that, args);
		}, delay);
	};
};

const throttle = (fn, delay = 300) => {
	let lastCalled = 0;
	return function () {
		const now = new Date().getTime();
		if (now - lastCalled < delay) return;
		const that = this;
		const args = arguments;
		lastCalled = now;
		fn.apply(that, args);
	};
};

export {debounce, throttle};
