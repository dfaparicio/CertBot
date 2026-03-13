import axios from 'axios';
import FormData from 'form-data';
import { escribirHumano } from '../middlewares/automatizacion.js';

export async function resolverCaptcha(page, selectorImg, selectorInput) {
    if (!process.env.TWOCAPTCHA_KEY || process.env.TWOCAPTCHA_KEY === 'TU_CLAVE_DE_2CAPTCHA_AQUI') {
        console.log('⚠️ Sin 2Captcha Key. Saltando resolución automática.');
        return;
    }

    try {
        await page.waitForSelector(selectorImg, { timeout: 10000 });
        await page.waitForTimeout(1500); // Pequeña espera para asegurar que la imagen cargue
        const elementoImg = await page.$(selectorImg);
        
        // Capturamos como buffer (archivo binario) para evitar problemas de base64
        const buffer = await elementoImg.screenshot();
        
        console.log(`🤖 Enviando captcha a 2Captcha (${buffer.length} bytes)...`);

        const form = new FormData();
        form.append('key', process.env.TWOCAPTCHA_KEY);
        form.append('method', 'post');
        form.append('file', buffer, { filename: 'captcha.png', contentType: 'image/png' });
        form.append('json', '1');

        const res = await axios.post('https://2captcha.com/in.php', form, {
            headers: form.getHeaders()
        });

        if (res.data.status !== 1) {
            console.error('❌ Error de 2Captcha:', res.data.request);
            return;
        }

        const taskId = res.data.request;
        let respuesta = '';

        for (let i = 0; i < 30; i++) {
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
            if (consulta.data.request !== 'CAPCHA_NOT_READY') {
                console.error('❌ Error en 2Captcha:', consulta.data.request);
                break;
            }
        }

        if (respuesta) {
            console.log('🤖 Captcha Resuelto por 2Captcha:', respuesta);
            await escribirHumano(page, selectorInput, respuesta);
            return true;
        }
        return false;
    } catch (e) {
        console.error('❌ Fallo al resolver captcha:', e.message);
        return false;
    }
}

export async function resolverReCaptcha(page, siteKey, url) {
    if (!process.env.TWOCAPTCHA_KEY || process.env.TWOCAPTCHA_KEY === 'TU_CLAVE_DE_2CAPTCHA_AQUI') return false;

    try {
        console.log('🤖 Solicitando resolución de reCAPTCHA a 2Captcha...');
        
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
            return;
        }

        const taskId = res.data.request;
        let gResponse = '';

        for (let i = 0; i < 40; i++) {
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
            if (consulta.data.request !== 'CAPCHA_NOT_READY') {
                console.error('❌ Error en 2Captcha reCAPTCHA:', consulta.data.request);
                break;
            }
        }

        if (gResponse) {
            console.log('✅ reCAPTCHA resuelto con 2Captcha.');
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
        console.error('❌ Error en reCAPTCHA:', e.message);
        return false;
    }
}
