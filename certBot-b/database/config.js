import mongoose from 'mongoose';

const conectarMongo = async () => {
    const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;
    try {
        await mongoose.connect(process.env.MONGODB_CNX);
        const host = mongoose.connection.host;
        console.info(`${getTimestamp()} \x1b[32m[SUCCESS]\x1b[0m 🍃 Conexión establecida con MongoDB (\x1b[36m${process.env.MONGODB_CNX}\x1b[0m)`);
    } catch (error) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Fallo crítico al conectar con la base de datos:`, error.message);
        throw new Error('Error a la hora de iniciar la base de datos');
    }
};          

export default conectarMongo;
