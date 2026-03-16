// Mapa de códigos de documentos (Se mantiene igual)
export const DOC_CODES = {
    'Aportes en Línea': { 'Cédula de ciudadania': '1', 'Cédula de Ciudadanía': '1', 'Cédula de extranjería': '2', 'Cédula de Extranjería': '2', 'Tarjeta de identidad': '3', 'NIT': '4' },
    'Mi Planilla': { 'Cédula de ciudadania': 'CC', 'Cédula de Ciudadanía': 'CC', 'Cédula de extranjería': 'CE', 'Cédula de Extranjería': 'CE', 'Tarjeta de identidad': 'TI', 'NIT': 'NI' },
    'SOI': { 'Cédula de ciudadania': '1', 'Cédula de Ciudadanía': '1', 'Cédula de extranjería': '3', 'Cédula de Extranjería': '3', 'Tarjeta de identidad': '6', 'NIT': '2' },
    'Asopagos': { 'Cédula de ciudadania': 'CC', 'Cédula de Ciudadanía': 'CC', 'Cédula de extranjería': 'CE', 'Cédula de Extranjería': 'CE', 'Tarjeta de identidad': 'TI', 'NIT': 'NI', 'Pasaporte': 'PA' }
};

/**
 * Genera una espera aleatoria entre min y max milisegundos
 */
export const esperarAleatorio = (min = 500, max = 1500) =>
    new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

/**
 * Escribe texto simulando pulsaciones de teclas humanas
 */
export async function escribirHumano(page, selector, texto) {
    if (!texto) return;
    try {
        await page.focus(selector);
        await page.type(selector, texto.toString(), { delay: Math.random() * (120 - 40) + 40 });
        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m ⌨️ Escribiendo: \x1b[36m${texto}\x1b[0m`);
    } catch (e) {
        console.warn(`${getTimestamp()} \x1b[33m[BOT]\x1b[0m ⚠️ No se pudo escribir en el selector: ${selector}`);
    }
}
