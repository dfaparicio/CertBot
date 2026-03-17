import express from "express";
import cors from "cors";
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import conectarMongo from "./database/config.js";

import authRoute from "./routes/auth.js";
import reporteRoute from "./routes/reporte.js";

import { iniciarDisparador } from "./scrapper/disparador.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Compartir la instancia de io con toda la app
app.set("socketio", io);

conectarMongo().then(() => {
    iniciarDisparador(io); // Enviamos io al disparador
});

app.use(cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'token']
}));
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/reporte", reporteRoute);

const PORT = process.env.PORT || 3000;

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

httpServer.listen(PORT, () => {
    console.info(`${getTimestamp()} \x1b[36m[INIT]\x1b[0m 🚀 Servidor Express y Socket.io iniciados en el puerto ${PORT}`);
});
