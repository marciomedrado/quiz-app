require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Endpoint for Proxy Image Search
app.post('/api/image-search', async (req, res) => {
    const { q } = req.body;

    if (!q) {
        return res.status(400).json({ error: 'Termo de busca (q) é obrigatório.' });
    }

    const API_KEY = process.env.GOOGLE_API_KEY;
    const CX = process.env.GOOGLE_CX;

    // Log check (without exposing keys)
    if (!API_KEY || !CX) {
        console.error('❌ Erro: Configuração ausente. GOOGLE_API_KEY ou GOOGLE_CX não definidos no arquivo .env');
        return res.status(500).json({
            error: 'Servidor não configurado: GOOGLE_API_KEY ou GOOGLE_CX ausentes no arquivo .env local.'
        });
    }

    const envConfig = require('dotenv').config();
    const envLoaded = !envConfig.error;

    try {
        const queryParams = {
            key: API_KEY,
            cx: CX,
            q: q,
            searchType: 'image',
            num: 1
        };

        console.log('--- DIAGNÓSTICO DE SEGURANÇA ---');
        console.log(`envLoaded: ${envLoaded}`);
        console.log(`GOOGLE_API_KEY definida: ${!!process.env.GOOGLE_API_KEY}`);
        console.log(`GOOGLE_CX definido: ${!!process.env.GOOGLE_CX}`);
        console.log('-------------------------------');

        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: queryParams
        });

        const data = response.data;

        if (data.items) {
            // Filter only necessary fields to reduce payload and keep it clean
            const filteredItems = data.items.map(item => ({
                link: item.link,
                displayLink: item.displayLink,
                contextLink: item.image?.contextLink,
                mime: item.mime,
                title: item.title,
                thumbnailLink: item.image?.thumbnailLink
            }));
            res.json({ items: filteredItems });
        } else {
            res.json({ items: [] });
        }
    } catch (error) {
        // Detailed logging on server console
        const apiError = error.response?.data?.error;
        console.error('❌ Google Search API Error:', JSON.stringify(apiError || error.message, null, 2));

        const status = error.response?.status || 500;
        const message = apiError?.message || error.message;

        res.status(status).json({ error: message });
    }
});

// Serve the index.html on the root
// Endpoint for Google Imagen Image Generation
app.post('/api/generate-image-google', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt é obrigatório.' });
    }

    const API_KEY = process.env.GOOGLE_API_KEY;

    if (!API_KEY) {
        console.error('❌ Erro: Configuração ausente. GOOGLE_API_KEY não definido no arquivo .env');
        return res.status(500).json({
            error: 'Servidor não configurado: GOOGLE_API_KEY ausente no arquivo .env local.'
        });
    }

    try {
        console.log(`🎨 Gerando imagem com Imagen 3 para: "${prompt.substring(0, 50)}..."`);

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`, {
            instances: [
                { prompt: prompt }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1"
            }
        });

        res.json(response.data);
    } catch (error) {
        const apiError = error.response?.data?.error;
        console.error('❌ Google Imagen API Error:', JSON.stringify(apiError || error.message, null, 2));

        const status = error.response?.status || 500;
        const message = apiError?.message || error.message;

        res.status(status).json({ error: message });
    }
});

// Endpoint for OpenAI DALL-E Image Generation
app.post('/api/generate-image-openai', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt é obrigatório.' });
    }

    const API_KEY = process.env.OPENAI_API_KEY;

    if (!API_KEY) {
        console.error('❌ Erro: Configuração ausente. OPENAI_API_KEY não definido no arquivo .env');
        return res.status(500).json({
            error: 'Servidor não configurado: OPENAI_API_KEY ausente no arquivo .env local.'
        });
    }

    try {
        console.log(`🎨 Gerando imagem com DALL-E 3 para: "${prompt.substring(0, 50)}..."`);

        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024"
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        const apiError = error.response?.data?.error;
        console.error('❌ OpenAI API Error:', JSON.stringify(apiError || error.message, null, 2));

        const status = error.response?.status || 500;
        const message = apiError?.message || error.message;

        res.status(status).json({ error: message });
    }
});

// Endpoint for OpenAI Chat Completion
app.post('/api/chat', async (req, res) => {
    const { model, messages, temperature, response_format } = req.body;

    const API_KEY = process.env.OPENAI_API_KEY;

    if (!API_KEY) {
        console.error('❌ Erro: Configuração ausente. OPENAI_API_KEY não definido no arquivo .env');
        return res.status(500).json({
            error: 'Servidor não configurado: OPENAI_API_KEY ausente no arquivo .env local.'
        });
    }

    try {
        console.log(`🤖 Chamada de Chat OpenAI (${model})...`);

        let finalTemperature = temperature || 0.7;

        // Modelos GPT-5 e o1 exigem temperatura 1 (ou omissão do parâmetro)
        if (model && (model.includes('gpt-5') || model.startsWith('o1'))) {
            finalTemperature = 1;
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: model || "gpt-4o",
            messages: messages,
            temperature: finalTemperature,
            response_format: response_format
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        const apiError = error.response?.data?.error;
        console.error('❌ OpenAI Chat Error:', JSON.stringify(apiError || error.message, null, 2));

        const status = error.response?.status || 500;
        const message = apiError?.message || error.message;

        res.status(status).json({ error: message });
    }
});

// Endpoint to Shutdown Server
app.post('/api/shutdown', (req, res) => {
    console.log('🛑 Servidor encerrando via solicitação do usuário...');
    res.json({ message: 'Servidor desligando...' });

    // Aguarda um breve momento para enviar a resposta antes de matar o processo
    setTimeout(() => {
        process.exit(0);
    }, 500);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const { exec } = require('child_process');

app.listen(PORT, () => {
    console.log('================================================');
    console.log(`🚀 Quiz Generator Server is running!`);
    console.log(`🔗 Local interface: http://localhost:${PORT}`);
    console.log('================================================');
    console.log('Certifique-se de que o arquivo .env contém:');
    console.log('OPENAI_API_KEY, GOOGLE_API_KEY e GOOGLE_CX.');
    console.log('================================================');

    // Abre o navegador automaticamente
    const url = `http://localhost:${PORT}`;
    const startCommand = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    exec(`${startCommand} ${url}`);
});
