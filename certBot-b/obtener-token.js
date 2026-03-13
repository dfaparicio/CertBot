import { google } from 'googleapis';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob' // Para apps de escritorio
);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('🚀 PASO 1: Entra a este enlace y autoriza el acceso:');
console.log('\x1b[36m%s\x1b[0m', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\n📝 PASO 2: Pega aquí el código que te dio Google: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ ¡ÉXITO! Aquí tienes tu REFRESH TOKEN:');
    console.log('\x1b[32m%s\x1b[0m', tokens.refresh_token);
    console.log('\nCopia este código y pégalo en GOOGLE_REFRESH_TOKEN en tu archivo .env');
  } catch (err) {
    console.error('❌ Error obteniendo el token:', err.message);
  } finally {
    rl.close();
  }
});
