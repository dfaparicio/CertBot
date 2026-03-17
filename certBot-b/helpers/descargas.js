import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { PDFDocument } from 'pdf-lib';
import { subirADrive } from './googleDrive.js';

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

/**
 * Procesa la subida de un archivo a Google Drive y opcionalmente actualiza el estado del reporte
 */
export const manejarSubidaADrive = async (fullPath, fileName, reporte, contratista, actualizarEstado = false) => {
    try {
        console.info(`${getTimestamp()} \x1b[34m[FILE]\x1b[0m 🚀 Preparando subida a Drive: \x1b[36m${fileName}\x1b[0m`);
        
        let mesNumero = parseInt(reporte.mes_inicio, 10) || new Date().getMonth() + 1;
        let anio = parseInt(reporte.ano, 10) || new Date().getFullYear();

        mesNumero++;
        if (mesNumero > 12) {
            mesNumero = 1;
            anio++;
        }

        const mesNombre = MESES[mesNumero - 1];
        const supervisor = contratista.supervisorId;
        const supervisorName = supervisor ? `${supervisor.nombre} ${supervisor.apellidos}`.trim() : "Supervisor_General";

        await subirADrive(fullPath, fileName, supervisorName, mesNombre, anio);
        
        if (actualizarEstado) {
            reporte.estado_descarga = true;
            reporte.estado = 'Aprobado';
            await reporte.save();
            console.info(`${getTimestamp()} \x1b[32m[SUCCESS]\x1b[0m ✅ Reporte subido y actualizado en Base de Datos.`);
        } else {
            console.info(`${getTimestamp()} \x1b[32m[SUCCESS]\x1b[0m ✅ Reporte subido a Drive (Estado DB sin cambios).`);
        }
    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error en el proceso de subida:`, err.message);
        throw err; // Re-lanzar para control centralizado
    }
};

/**
 * Descomprime un archivo ZIP y procesa cada archivo interno
 */
export const procesarZip = async (fullPath, fileName, downloadPath, nombreLimpio, docNum, reporte, contratista, actualizarEstado = false) => {
    console.info(`${getTimestamp()} \x1b[35m[FILE]\x1b[0m 📦 Descomprimiendo archivo ZIP: \x1b[36m${fileName}\x1b[0m`);
    
    try {
        const zip = new AdmZip(fullPath);
        const zipEntries = zip.getEntries();
        
        for (const zipEntry of zipEntries) {
            if (!zipEntry.isDirectory) {
                const entryName = zipEntry.entryName;
                const baseName = path.basename(entryName);
                
                // Extraer el archivo individualmente. 
                // El tercer parámetro 'false' hace que no mantenga la estructura de carpetas interna,
                // dejando el archivo directamente en downloadPath.
                zip.extractEntryTo(zipEntry, downloadPath, false, true);
                
                const extractionPath = path.join(downloadPath, baseName);
                console.info(`${getTimestamp()} \x1b[34m[FILE]\x1b[0m 📄 Procesado desde ZIP: ${baseName}`);
                
                const fileExt = baseName.split('.').pop().toLowerCase();
                if (fileExt !== 'pdf') {
                    // Si no es PDF, lo borramos tras extraerlo si no nos sirve
                    if (fs.existsSync(extractionPath)) try { fs.unlinkSync(extractionPath); } catch(e) {}
                    continue;
                }

                const finalFileName = `${nombreLimpio}_${docNum}.${fileExt}`;
                const finalFullPath = path.join(downloadPath, finalFileName);

                let actualFinalFileName = finalFileName;
                let actualFinalFullPath = finalFullPath;

                // Evitar colisiones si hay varios PDFs (aunque SOI suele traer uno solo)
                if (fs.existsSync(finalFullPath)) {
                    actualFinalFileName = `${nombreLimpio}_${docNum}_V.${fileExt}`;
                    actualFinalFullPath = path.join(downloadPath, actualFinalFileName);
                }

                if (fs.existsSync(extractionPath)) {
                    fs.renameSync(extractionPath, actualFinalFullPath);
                    console.info(`${getTimestamp()} \x1b[32m[FILE]\x1b[0m ✅ PDF extraído y renombrado: ${actualFinalFileName}`);
                    await manejarSubidaADrive(actualFinalFullPath, actualFinalFileName, reporte, contratista, actualizarEstado);
                }
            }
        }
        
        // Limpiar el ZIP original
        if (fs.existsSync(fullPath)) {
            try { fs.unlinkSync(fullPath); } catch (e) {}
            console.info(`${getTimestamp()} \x1b[34m[FILE]\x1b[0m 🗑️ Archivo ZIP original eliminado.`);
        }
    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error al procesar el ZIP:`, err.message);
        throw err;
    }
};

/**
 * Convierte un buffer de imagen a un PDF y lo guarda
 */
export const convertirImagenAPDF = async (imageBuffer, outputPath) => {
    try {
        const pdfDoc = await PDFDocument.create();
        const image = await pdfDoc.embedPng(imageBuffer).catch(async () => {
            return await pdfDoc.embedJpg(imageBuffer);
        });

        const { width, height } = image.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: width,
            height: height,
        });

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, pdfBytes);
        return true;
    } catch (err) {
        console.error('❌ Error al convertir imagen a PDF:', err.message);
        return false;
    }
};
