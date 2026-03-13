import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de OAuth2
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Busca una carpeta por nombre dentro de un padre. Si no existe, la crea.
 */
const obtenerOCrearCarpeta = async (nombre, parentId) => {
    try {
        const query = `name = '${nombre}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const res = await drive.files.list({ 
            q: query, 
            fields: 'files(id)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        if (res.data.files.length > 0) {
            return res.data.files[0].id;
        }

        // Si no existe, la creamos
        const fileMetadata = {
            name: nombre,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        };
        const folder = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
            supportsAllDrives: true
        });
        return folder.data.id;
    } catch (error) {
        console.error(`Error buscando/creando carpeta ${nombre}:`, error.message);
        throw error;
    }
};

/**
 * Sube el archivo a la estructura: Año > Mes > Supervisor
 */
export const subirADrive = async (filePath, fileName, supervisorName, mes, anio) => {
    try {
        const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        // 1. Obtener o crear carpeta del Año (ej: 2026)
        const anioId = await obtenerOCrearCarpeta(anio.toString(), rootId);

        // 2. Obtener o crear carpeta del Mes (ej: Enero)
        const mesId = await obtenerOCrearCarpeta(mes, anioId);

        // 3. Obtener o crear carpeta del Supervisor (ej: Carlos_Perez_Rodriguez)
        const supervisorId = await obtenerOCrearCarpeta(supervisorName.replace(/ /g, '_'), mesId);

        // 4. Subir el archivo
        const fileMetadata = {
            name: fileName,
            parents: [supervisorId],
        };

        const media = {
            mimeType: 'application/pdf',
            body: fs.createReadStream(filePath),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
            supportsAllDrives: true
        });

        console.log(`✅ Archivo subido a Drive personales: ${fileName} en carpeta ${supervisorName}`);
        return response.data;
    } catch (error) {
        console.error('❌ Error subiendo a Google Drive PERSONAL:', error.message);
        throw error;
    }
};
