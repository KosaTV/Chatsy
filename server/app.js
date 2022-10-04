const path = require("path");
require("dotenv").config({path: path.join(__dirname, "/.env")});
const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");

//* --- Controllers ---
const {verifySocket} = require("./controllers/authenticationControllers");
const {socketConnection} = require("./eventHandlers/socketEvents");

//* --- Routers ---
const loginsRouter = require("./routes/loginsRoutes");
const tokensRouter = require("./routes/tokensRoutes");
const groupsRouter = require("./routes/groupsRoutes");
const userRouter = require("./routes/userRoutes");

//* --- App ---

const app = express();

app.use(cors({credentials: true, origin: process.env.BASE_URL}));
const mongoDbURI = process.env.DB_OLD_URI;

const server = http.createServer(app);

mongoose
	.connect(mongoDbURI, {useNewUrlParser: true, useUnifiedTopology: true})
	.then(() => {
		server.listen(PORT, () => {
			console.log(`Server has started on ${PORT} port.`);
		});
	})
	.catch(err => console.log(`something went wrong: ${err}`));

const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({extended: true, limit: "2mb"}));
app.use(express.json({limit: "2mb"}));

const io = require("socket.io")(server, {
	cors: {
		origin: [process.env.BASE_URL]
	}
});

app.use("/", loginsRouter);

app.use("/", tokensRouter);

app.use("/groups", groupsRouter);

app.use("/user", userRouter);

//* socket connection
io.use(verifySocket).on("connection", socketConnection);
