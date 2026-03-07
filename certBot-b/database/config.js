import mongoose from 'mongoose';

const conectarMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CNX);
        console.log('✅ Base de datos online');
    } catch (error) {
        console.error(error);
        throw new Error('Error a la hora de iniciar la base de datos');
    }
};          

export default conectarMongo;
