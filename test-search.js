require('dotenv').config();
const axios = require('axios');

async function test() {
    const API_KEY = process.env.GOOGLE_API_KEY;
    const CX = process.env.GOOGLE_CX;
    const q = 'world map';

    if (!API_KEY || !CX) {
        console.error('GOOGLE_API_KEY ou GOOGLE_CX não encontrados no .env');
        return;
    }

    const queryParams = {
        key: API_KEY,
        cx: CX,
        q: q,
        searchType: 'image',
        num: 10
    };

    console.log('--- DIAGNÓSTICO DE BUSCA ---');
    console.log('---------------------------');

    try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: queryParams
        });
        console.log('STATUS:', response.status);
        console.log('RESULTADOS:', response.data.items ? response.data.items.length : 0);
    } catch (error) {
        console.log('STATUS:', error.response ? error.response.status : 'N/A');
        console.log('MENSAGEM:', error.response ? JSON.stringify(error.response.data.error, null, 2) : error.message);
    }
}

test();
