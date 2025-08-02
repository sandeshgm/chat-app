import dotenv from "dotenv";
import express from "express";
import dbConnect from "./DB/dbConnect.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRouters from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
import { app, server } from "./socket/socket.js";
import path from "path";

const __dirname = path.resolve();

dotenv.config();
const PORT = process.env.PORT || 3003;

//database connections
dbConnect();

//middleware
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/user", userRouters);

app.use(express.static(path.join(__dirname, "frontend/dist")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
// });

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

server.listen(PORT, () => {
  console.log(`Listening at ${PORT} `);
});
