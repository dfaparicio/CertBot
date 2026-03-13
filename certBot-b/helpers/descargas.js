import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { PDFDocument } from 'pdf-lib';
import { subirADrive } from './googleDrive.js';

/**
 * Procesa la subida de un archivo a Google Drive y actualiza el estado del reporte
 */
export const manejarSubidaADrive = async (fullPath, fileName, reporte, contratista) => {
    try {
        const anio = reporte.ano || new Date().getFullYear();
        const mesNombre = reporte.mes_inicio || "Mes_Sin_Definir";
        const supervisor = contratista.supervisorId;
        const supervisorName = supervisor ? `${supervisor.nombre} ${supervisor.apellidos}`.trim() : "Supervisor_General";

        console.log(`☁️ Iniciando subida a Drive para: ${fileName}...`);
        await subirADrive(fullPath, fileName, supervisorName, mesNombre, anio);
        
        reporte.estado_descarga = true;
        await reporte.save();
        console.log(`💾 Reporte actualizado y subido con éxito.`);
    } catch (err) {
        console.error('❌ Error en el proceso de subida:', err.message);
    }
};

/**
 * Descomprime un archivo ZIP y procesa cada archivo interno
 */
export const procesarZip = async (fullPath, fileName, downloadPath, nombreLimpio, docNum, reporte, contratista) => {
    console.log(`📦 Detectado archivo ZIP: ${fileName}. Descomprimiendo...`);
    const zip = new AdmZip(fullPath);
    const zipEntries = zip.getEntries();
    
    for (const zipEntry of zipEntries) {
        if (!zipEntry.isDirectory) {
            const entryName = zipEntry.entryName;
            const extractionPath = path.join(downloadPath, entryName);
            
            // Extrae el archivo
            zip.extractEntryTo(zipEntry, downloadPath, false, true);
            console.log(`📄 Extraído: ${entryName}`);
            
            const fileExt = entryName.split('.').pop();
            const finalFileName = `${nombreLimpio}_${docNum}.${fileExt}`;
            const finalFullPath = path.join(downloadPath, finalFileName);

            // Manejo de colisiones de nombre
            let actualFinalFileName = finalFileName;
            let actualFinalFullPath = finalFullPath;

            if (fs.existsSync(finalFullPath)) {
                actualFinalFileName = `${nombreLimpio}_${docNum}_${entryName}`;
                actualFinalFullPath = path.join(downloadPath, actualFinalFileName);
            }

            fs.renameSync(extractionPath, actualFinalFullPath);
            await manejarSubidaADrive(actualFinalFullPath, actualFinalFileName, reporte, contratista);
        }
    }
    
    // Eliminar el zip original
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
