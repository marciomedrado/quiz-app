require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Database and Services
const prisma = require('./src/db/prisma');
const { spendCredits } = require('./src/services/creditService');
const { requireAuth, requireAdmin } = require('./src/middlewares/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet({
    contentSecurityPolicy: false, // Permitir CDNs e fontes externas para este app simples
}));
app.use(cookieParser());
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.static(__dirname));

// Rate Limiting for Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // limite de 20 tentativas por IP
    message: { error: 'Muitas tentativas de acesso. Tente novamente em 15 minutos.' }
});

// Routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const creditRoutes = require('./src/routes/credits');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/credits', creditRoutes);

// Endpoint for Proxy Image Search
app.post('/api/image-search', requireAuth, async (req, res) => {
    const { q } = req.body;

    if (!q) {
        return res.status(400).json({ error: 'Termo de busca (q) é obrigatório.' });
    }

    const API_KEY = process.env.GOOGLE_API_KEY;
    const CX = process.env.GOOGLE_CX;

    if (!API_KEY || !CX) {
        return res.status(500).json({
            error: 'Servidor não configurado: GOOGLE_API_KEY ou GOOGLE_CX ausentes no arquivo .env local.'
        });
    }

    try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: API_KEY,
                cx: CX,
                q: q,
                searchType: 'image',
                num: 1
            }
        });

        const data = response.data;
        if (data.items) {
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
        const apiError = error.response?.data?.error;
        res.status(error.response?.status || 500).json({ error: apiError?.message || error.message });
    }
});

// Protected Generation Endpoints (Consuming Credits)
app.post('/api/chat', requireAuth, async (req, res) => {
    try {
        const { model, messages, temperature, response_format } = req.body;
        const API_KEY = process.env.OPENAI_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Servidor OpenAI não configurado.' });
        }

        // Spend 1 credit for quiz generation
        await spendCredits(req.user.id, 1, `Geração de Quiz (${model || 'gpt-4o'})`);

        console.log(`🤖 [USER: ${req.user.email}] Chamada de Chat OpenAI (${model})...`);

        let finalTemperature = temperature || 0.7;
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
        console.error('❌ Error in /api/chat:', error.message);
        res.status(error.status || 400).json({ error: error.message });
    }
});

app.post('/api/generate-image-openai', requireAuth, async (req, res) => {
    try {
        const { prompt } = req.body;
        const API_KEY = process.env.OPENAI_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Servidor OpenAI não configurado.' });
        }

        // Spend 1 credit
        await spendCredits(req.user.id, 1, 'Geração de Imagem DALL-E 3');

        console.log(`🎨 [USER: ${req.user.email}] Gerando imagem com DALL-E 3`);

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
        res.status(error.status || 400).json({ error: error.message });
    }
});

app.post('/api/generate-image-google', requireAuth, async (req, res) => {
    try {
        const { prompt } = req.body;
        const API_KEY = process.env.GOOGLE_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Servidor Google Imagen não configurado.' });
        }

        // Spend 1 credit
        await spendCredits(req.user.id, 1, 'Geração de Imagem Google Imagen 3');

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`, {
            instances: [{ prompt: prompt }],
            parameters: { sampleCount: 1, aspectRatio: "1:1" }
        });

        res.json(response.data);
    } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
    }
});

// Admin Shutdown
app.post('/api/shutdown', requireAuth, requireAdmin, (req, res) => {
    console.log('🛑 Servidor encerrando via solicitação administrativa...');
    res.json({ message: 'Servidor desligando...' });
    setTimeout(() => process.exit(0), 500);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rotas para páginas estáticas (Login, Cadastro)
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));

const { exec } = require('child_process');

app.listen(PORT, () => {
    console.log('================================================');
    console.log(`🚀 Quiz Generator Server is running!`);
    console.log(`🔗 Local interface: http://localhost:${PORT}`);
    console.log('================================================');
    console.log('Certifique-se de que o arquivo .env está configurado corretamente.');
    console.log('================================================');

    const url = `http://localhost:${PORT}/login`;
    const startCommand = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    // exec(`${startCommand} ${url}`); // Comentado para automatização não interromper
});
