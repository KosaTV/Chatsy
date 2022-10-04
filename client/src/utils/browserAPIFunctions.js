const getUserMediaDevices = async getListOfDevices => {
	const mediaDevices = navigator.mediaDevices;
	if (!mediaDevices || !mediaDevices.enumerateDevices) return getListOfDevices([]);
	let result;
	await mediaDevices.enumerateDevices().then(devices => {
		result = getListOfDevices(devices.filter(device => device.kind === "videoinput" || device.kind === "audioinput"));
	});

	return result;
};

const getUserMediaDevicesStream = async (devices, cb) => {
	const params = [null, null];
	await navigator.mediaDevices
		.getUserMedia(devices)
		.then(result => (params[1] = result))
		.catch(err => (params[0] = err));

	return cb(...params);
};

export {getUserMediaDevices, getUserMediaDevicesStream};
