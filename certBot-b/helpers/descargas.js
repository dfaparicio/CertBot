import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { PDFDocument } from 'pdf-lib';
import { subirADrive } from './googleDrive.js';

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

/**
 * Procesa la subida de un archivo a Google Drive y actualiza el estado del reporte
 */
export const manejarSubidaADrive = async (fullPath, fileName, reporte, contratista) => {
    try {
        console.info(`${getTimestamp()} \x1b[34m[FILE]\x1b[0m 🚀 Preparando subida a Drive: \x1b[36m${fileName}\x1b[0m`);
        const anio = reporte.ano || new Date().getFullYear();
        const mesNombre = reporte.mes_inicio || "Mes_Sin_Definir";
        const supervisor = contratista.supervisorId;
        const supervisorName = supervisor ? `${supervisor.nombre} ${supervisor.apellidos}`.trim() : "Supervisor_General";

        await subirADrive(fullPath, fileName, supervisorName, mesNombre, anio);
        
        reporte.estado_descarga = true;
        await reporte.save();
        console.info(`${getTimestamp()} \x1b[32m[SUCCESS]\x1b[0m ✅ Reporte subido y actualizado en Base de Datos.`);
    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error en el proceso de subida:`, err.message);
    }
};

/**
 * Descomprime un archivo ZIP y procesa cada archivo interno
 */
export const procesarZip = async (fullPath, fileName, downloadPath, nombreLimpio, docNum, reporte, contratista) => {
    console.info(`${getTimestamp()} \x1b[35m[FILE]\x1b[0m 📦 Descomprimiendo archivo ZIP: \x1b[36m${fileName}\x1b[0m`);
    const zip = new AdmZip(fullPath);
    const zipEntries = zip.getEntries();
    
    for (const zipEntry of zipEntries) {
        if (!zipEntry.isDirectory) {
            const entryName = zipEntry.entryName;
            const baseName = path.basename(entryName);
            const extractionPath = path.join(downloadPath, baseName);
            
            zip.extractEntryTo(zipEntry, downloadPath, false, true);
            console.info(`${getTimestamp()} \x1b[34m[FILE]\x1b[0m 📄 Extraído: ${baseName}`);
            
            const fileExt = baseName.split('.').pop().toLowerCase();
            if (fileExt !== 'pdf') continue;

            const finalFileName = `${nombreLimpio}_${docNum}.${fileExt}`;
            const finalFullPath = path.join(downloadPath, finalFileName);

            let actualFinalFileName = finalFileName;
            let actualFinalFullPath = finalFullPath;

            if (fs.existsSync(finalFullPath)) {
                actualFinalFileName = `${nombreLimpio}_${docNum}_V.${fileExt}`;
                actualFinalFullPath = path.join(downloadPath, actualFinalFileName);
            }

            if (fs.existsSync(extractionPath)) {
                fs.renameSync(extractionPath, actualFinalFullPath);
                await manejarSubidaADrive(actualFinalFullPath, actualFinalFileName, reporte, contratista);
            }
        }
    }
    
    try { fs.unlinkSync(fullPath); } catch (e) {}
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
