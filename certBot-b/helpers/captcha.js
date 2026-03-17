import axios from 'axios';
import FormData from 'form-data';
import { escribirHumano } from './botUtils.js';

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

export async function resolverCaptcha(page, selectorImg, selectorInput, io, reporteId) {
    if (!process.env.TWOCAPTCHA_KEY || process.env.TWOCAPTCHA_KEY === 'TU_CLAVE_DE_2CAPTCHA_AQUI') {
        console.warn(`${getTimestamp()} \x1b[33m[CAPTCHA]\x1b[0m ⚠️ Sin 2Captcha Key. Saltando resolución automática.`);
        return;
    }

    const enviarEstado = (msg) => {
        if (io) io.emit(`status_${reporteId}`, { msg, time: new Date().toLocaleTimeString() });
    };

    try {
        await page.waitForSelector(selectorImg, { timeout: 10000 });
        await page.waitForTimeout(1500); 
        const elementoImg = await page.$(selectorImg);
        
        const buffer = await elementoImg.screenshot();
        
        console.info(`${getTimestamp()} \x1b[35m[CAPTCHA]\x1b[0m 🤖 Enviando captcha a 2Captcha (${buffer.length} bytes)...`);
        enviarEstado("Enviando captcha a 2Captcha...");

        const form = new FormData();
        form.append('key', process.env.TWOCAPTCHA_KEY);
        form.append('method', 'post');
        form.append('file', buffer, { filename: 'captcha.png', contentType: 'image/png' });
        form.append('json', '1');

        const res = await axios.post('https://2captcha.com/in.php', form, {
            headers: form.getHeaders()
        });

        if (res.data.status !== 1) {
            console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error de 2Captcha:`, res.data.request);
            enviarEstado("Error al enviar captcha a resolver.");
            return;
        }

        const taskId = res.data.request;
        let respuesta = '';

        for (let i = 0; i < 30; i++) {
            if (page.isClosed()) {
                console.warn(`${getTimestamp()} \x1b[33m[CAPTCHA]\x1b[0m ⚠️ Navegador cerrado. Cancelando.`);
                return false;
            }
            enviarEstado(`Esperando respuesta de 2Captcha (intento ${i+1})...`);
            await new Promise(r => setTimeout(r, 2500));
            const consulta = await axios.get('https://2captcha.com/res.php', {
                params: {
                    key: process.env.TWOCAPTCHA_KEY,
                    action: 'get',
                    id: taskId,
                    json: 1
                }
            });
            if (consulta.data.status === 1) {
                respuesta = consulta.data.request;
                break;
            }
        }

        if (respuesta) {
            console.info(`${getTimestamp()} \x1b[32m[CAPTCHA]\x1b[0m ✅ Captcha resuelto: \x1b[36m${respuesta}\x1b[0m`);
            enviarEstado("¡Captcha resuelto con éxito!");
            await escribirHumano(page, selectorInput, respuesta);
            return true;
        }
        return false;
    } catch (e) {
        if (e.message.includes('closed')) return false;
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Fallo en captcha:`, e.message);
        return false;
    }
}

export async function resolverReCaptcha(page, siteKey, url, io, reporteId) {
    if (!process.env.TWOCAPTCHA_KEY || process.env.TWOCAPTCHA_KEY === 'TU_CLAVE_DE_2CAPTCHA_AQUI') return false;

    const enviarEstado = (msg) => {
        if (io) io.emit(`status_${reporteId}`, { msg, time: new Date().toLocaleTimeString() });
    };

    try {
        console.log('🤖 Solicitando resolución de reCAPTCHA a 2Captcha...');
        enviarEstado("Enviando reCAPTCHA a 2Captcha...");
        
        const form = new FormData();
        form.append('key', process.env.TWOCAPTCHA_KEY);
        form.append('method', 'userrecaptcha');
        form.append('googlekey', siteKey);
        form.append('pageurl', url);
        form.append('json', '1');

        const res = await axios.post('https://2captcha.com/in.php', form, {
            headers: form.getHeaders()
        });

        if (res.data.status !== 1) {
            console.error('❌ Error al enviar reCAPTCHA:', res.data.request);
            enviarEstado("Error al conectar con 2Captcha.");
            return;
        }

        const taskId = res.data.request;
        let gResponse = '';

        for (let i = 0; i < 60; i++) { 
            if (page.isClosed()) return false;
            enviarEstado(`Esperando respuesta de Google (intento ${i+1}/60)...`);
            await new Promise(r => setTimeout(r, 4000));
            const consulta = await axios.get('https://2captcha.com/res.php', {
                params: {
                    key: process.env.TWOCAPTCHA_KEY,
                    action: 'get',
                    id: taskId,
                    json: 1
                }
            });
            if (consulta.data.status === 1) {
                gResponse = consulta.data.request;
                break;
            }
        }

        if (gResponse) {
            if (page.isClosed()) return false;
            console.log('✅ reCAPTCHA resuelto con 2Captcha.');
            enviarEstado("reCAPTCHA resuelto. Aplicando...");
            
            await page.evaluate((token) => {
                const elements = document.getElementsByName('g-recaptcha-response');
                for (let el of elements) {
                    el.value = token;
                    el.innerHTML = token;
                }
            }, gResponse);
            
            return true;
        }
        return false;
    } catch (e) {
        if (e.message.includes('closed')) return false;
        console.error('❌ Error en reCAPTCHA:', e.message);
        return false;
    }
}
