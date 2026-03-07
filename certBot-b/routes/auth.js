import { Router } from 'express';
import { loginSupervisor, loginContratista } from '../controllers/auth.js';
import { registroContratista } from '../controllers/registro.js';
import { validarLogin, validarRegistro } from '../middlewares/validarCampos.js';

const router = Router();

// Ruta para el login del supervisor
router.post('/login', validarLogin, loginSupervisor);

// Ruta para el login del contratista
router.post('/login-contratista', validarLogin, loginContratista);

// Ruta para el registro del contratista
router.post('/registro', validarRegistro, registroContratista);

export default router;
    