import axios from 'axios';
import { escribirHumano } from '../middlewares/automatizacion.js';

export async function resolverCaptcha(page, selectorImg, selectorInput) {
    if (!process.env.TWOCAPTCHA_KEY || process.env.TWOCAPTCHA_KEY === 'TU_CLAVE_DE_2CAPTCHA_AQUI') {
        console.log('⚠️ Sin 2Captcha Key. Saltando resolución automática.');
        return;
    }

    try {
        await page.waitForSelector(selectorImg, { timeout: 10000 });
        const elementoImg = await page.$(selectorImg);
        const imagenBase64 = await elementoImg.screenshot({ encoding: 'base64' });

        const res = await axios.post('https://2captcha.com/in.php', null, {
            params: {
                key: process.env.TWOCAPTCHA_KEY,
                method: 'base64',
                body: imagenBase64,
                json: 1
            }
        });

        if (res.data.status !== 1) {
            console.error('❌ Error al enviar imagen a 2Captcha:', res.data.request);
            return;
        }

        const taskId = res.data.request;
        let respuesta = '';

        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 5000));
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
        }
    } catch (e) {
        console.error('❌ Fallo al resolver captcha:', e.message);
    }
}

export async function resolverReCaptcha(page, siteKey, url) {
    if (!process.env.TWOCAPTCHA_KEY || process.env.TWOCAPTCHA_KEY === 'TU_CLAVE_DE_2CAPTCHA_AQUI') return;

    try {
        console.log('🤖 Solicitando resolución de reCAPTCHA a 2Captcha...');
        const res = await axios.post('https://2captcha.com/in.php', null, {
            params: {
                key: process.env.TWOCAPTCHA_KEY,
                method: 'userrecaptcha',
                googlekey: siteKey,
                pageurl: url,
                json: 1
            }
        });

        if (res.data.status !== 1) {
            console.error('❌ Error al enviar reCAPTCHA:', res.data.request);
            return;
        }

        const taskId = res.data.request;
        let gResponse = '';

        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 5000));
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
        }
    } catch (e) {
        console.error('❌ Error en reCAPTCHA:', e.message);
    }
}
