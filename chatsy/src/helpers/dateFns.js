const addZero = value => {
	return value < 10 ? `0${value}` : value;
};

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const calledWeekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatDate = date => {
	const now = new Date();
	const dateInfo = new Date(date);
	const hours = dateInfo.getHours();
	const minutes = dateInfo.getMinutes();
	let days = dateInfo.getDate();
	let month = dateInfo.getMonth();
	let year = dateInfo.getFullYear();
	const weekDay = dateInfo.getDay();

	let formattedDate;

	if (days === now.getDate() && month === now.getMonth() && year === now.getFullYear()) {
		formattedDate = `${addZero(hours)}:${addZero(minutes)}`;
	} else if (days > now.getDate() - 7 && month === now.getMonth() && year === now.getFullYear()) {
		formattedDate = `${calledWeekDays[weekDay]} ${addZero(hours)}:${addZero(minutes)}`;
	} else {
		formattedDate = `${addZero(days)} ${months[month].substring(0, 3)} ${year} ${addZero(hours)}:${addZero(minutes)}`;
	}

	return formattedDate;
};

export {formatDate, months, calledWeekDays, addZero};
