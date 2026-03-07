import express from "express";
import cors from "cors";
import "dotenv/config";
import conectarMongo from "./database/config.js";

import authRoute from "./routes/auth.js";
import reporteRoute from "./routes/reporte.js";

const app = express();
conectarMongo();
app.use(cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'token']
}));
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/reporte", reporteRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🔥 Servidor escuchando en el puerto ${PORT}`);
});
