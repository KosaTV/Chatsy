const {verifySocket} = require("../controllers/authenticationControllers");
const {
	socketHandleFriendAction,
	socketHandleGroupModify,
	socketHandleReadMessage,
	socketHandleSendMessage,
	socketHandleTypingMessage,
	socketHandleStopTypingMessage,
	socketHandleUserCall,
	socketHandleAnswerCall,
	socketHandleLeaveCall,
	socketHandleDisconnection,
	socketHandleConnection,
	socketHandleRejectCall,
	socketHandleCancelCall
} = require("../utils/socketFunctions");

const handleSocketEvent = (socket, data, cb) => {
	verifySocket(socket, () => {
		cb(data, socket);
	});
};

const socketConnection = socket => {
	socketHandleConnection(socket);

	//* socket events
	socket.on("send-message", async data => handleSocketEvent(socket, data, socketHandleSendMessage));
	socket.on("read-message", async data => handleSocketEvent(socket, data, socketHandleReadMessage));
	socket.on("typing-mess", async data => handleSocketEvent(socket, data, socketHandleTypingMessage));
	socket.on("stop-typing-mess", async data => handleSocketEvent(socket, data, socketHandleStopTypingMessage));
	socket.on("friend-action", async data => handleSocketEvent(socket, data, socketHandleFriendAction));
	socket.on("group-modify", async data => handleSocketEvent(socket, data, socketHandleGroupModify));
	socket.on("call-user", async data => handleSocketEvent(socket, data, socketHandleUserCall));
	socket.on("call-accepted", async data => handleSocketEvent(socket, data, socketHandleAnswerCall));
	socket.on("call-rejected", async data => handleSocketEvent(socket, data, socketHandleRejectCall));
	socket.on("call-left", async data => handleSocketEvent(socket, data, socketHandleLeaveCall));
	socket.on("call-canceled", async data => handleSocketEvent(socket, data, socketHandleCancelCall));

	//* socket disconnection
	socket.on("disconnect", async data => handleSocketEvent(socket, data, socketHandleDisconnection));
};

module.exports = {socketConnection};
