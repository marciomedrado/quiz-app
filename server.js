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
const { spendCredits, logUsage } = require('./src/services/creditService');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('./src/middlewares/auth');
const { calculateCredits, calculateTextCostUsd, calculateImageCostUsd, pricing } = require('./src/config/pricing');
const bcrypt = require('bcryptjs');

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

// Routes
const billingRoutes = require('./src/routes/billing');
app.use('/api/billing', billingRoutes);

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
const adminRoutes = require('./src/routes/admin');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/billing', billingRoutes); // Checkout route

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

        // Pre-check balance (at least minimum credits)
        if (req.user.credits < pricing.settings.MIN_CREDITS_PER_ACTION) {
            return res.status(402).json({ error: 'Créditos insuficientes para esta operação.' });
        }

        console.log(`🤖 [USER: ${req.user.email}] Chamada de Chat OpenAI (${model || 'gpt-4o'})...`);

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

        const data = response.data;
        const usage = data.usage;

        if (usage) {
            const costUsd = calculateTextCostUsd(model || 'gpt-4o', usage.prompt_tokens, usage.completion_tokens);
            const { credits, finalChargeUsd } = calculateCredits(costUsd);

            await spendCredits(req.user.id, credits, `Geração de Quiz (${model || 'gpt-4o'})`);
            await logUsage({
                userId: req.user.id,
                model: model || 'gpt-4o',
                inputTokens: usage.prompt_tokens,
                outputTokens: usage.completion_tokens,
                costUsd,
                finalChargeUsd,
                creditsCharged: credits,
                referenceAction: 'quiz_generation'
            });

            data.billing = { creditsCharged: credits, remainingCredits: req.user.credits - credits };
        }

        res.json(data);
    } catch (error) {
        console.error('❌ Error in /api/chat:', error.response?.data || error.message);
        res.status(error.response?.status || 400).json({ error: error.response?.data?.error?.message || error.message });
    }
});

app.post('/api/generate-image-openai', requireAuth, async (req, res) => {
    try {
        const { prompt, quality, size } = req.body;
        const API_KEY = process.env.OPENAI_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Servidor OpenAI não configurado.' });
        }

        // Pre-check balance
        const estimatedCostUsd = calculateImageCostUsd('openai', { quality, size });
        const { credits: estimatedCredits } = calculateCredits(estimatedCostUsd);

        if (req.user.credits < estimatedCredits) {
            return res.status(402).json({ error: 'Créditos insuficientes para gerar esta imagem.' });
        }

        console.log(`🎨 [USER: ${req.user.email}] Gerando imagem com DALL-E 3`);

        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: size || "1024x1024",
            quality: quality || "standard"
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const costUsd = calculateImageCostUsd('openai', { quality, size });
        const { credits, finalChargeUsd } = calculateCredits(costUsd);

        await spendCredits(req.user.id, credits, 'Geração de Imagem DALL-E 3');
        await logUsage({
            userId: req.user.id,
            model: 'dall-e-3',
            imagesCount: 1,
            costUsd,
            finalChargeUsd,
            creditsCharged: credits,
            referenceAction: 'image_generation_openai'
        });

        const data = response.data;
        data.billing = { creditsCharged: credits };
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 400).json({ error: error.response?.data?.error?.message || error.message });
    }
});

app.post('/api/generate-image-google', requireAuth, async (req, res) => {
    try {
        const { prompt, quality } = req.body;
        const API_KEY = process.env.GOOGLE_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Servidor Google Imagen não configurado.' });
        }

        const costUsd = calculateImageCostUsd('google', { quality });
        const { credits, finalChargeUsd } = calculateCredits(costUsd);

        if (req.user.credits < credits) {
            return res.status(402).json({ error: 'Créditos insuficientes.' });
        }

        console.log(`🎨 [USER: ${req.user.email}] Gerando imagem com Google Imagen 3`);

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`, {
            instances: [{ prompt: prompt }],
            parameters: { sampleCount: 1, aspectRatio: "1:1" }
        });

        await spendCredits(req.user.id, credits, 'Geração de Imagem Google Imagen 3');
        await logUsage({
            userId: req.user.id,
            model: 'imagen-3.0',
            imagesCount: 1,
            costUsd,
            finalChargeUsd,
            creditsCharged: credits,
            referenceAction: 'image_generation_google'
        });

        const data = response.data;
        data.billing = { creditsCharged: credits };
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 400).json({ error: error.response?.data?.error?.message || error.message });
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
app.get('/admin', requireAuth, requireAdmin, (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/pricing', (req, res) => res.sendFile(path.join(__dirname, 'pricing.html')));
app.get('/billing/success', (req, res) => res.send('<h1>Pagamento Concluído!</h1><p>Seus créditos foram adicionados. Você pode voltar ao app.</p><script>setTimeout(()=>window.location.href="/", 3000)</script>'));
app.get('/billing/cancel', (req, res) => res.redirect('/pricing?error=cancelado'));
app.get('/api/models', (req, res) => {
    const { textModels } = require('./src/config/pricing').pricing;
    const models = Object.keys(textModels).map(id => ({
        id,
        name: textModels[id].name || id
    }));
    res.json(models);
});

const { exec } = require('child_process');

const seedSuperAdmin = async () => {
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    const initialCredits = parseInt(process.env.SUPERADMIN_INITIAL_CREDITS) || 1000;

    if (!email || !password) {
        console.log('ℹ️ SUPERADMIN_EMAIL ou PASSWORD não configurados. Pulando seed.');
        return;
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        const hashedPassword = await bcrypt.hash(password, 10);

        if (!existingUser) {
            await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    role: 'SUPERADMIN',
                    credits: initialCredits
                }
            });
            console.log(`✅ Superadmin criado: ${email}`);
        } else if (existingUser.role !== 'SUPERADMIN') {
            await prisma.user.update({
                where: { email },
                data: { role: 'SUPERADMIN' }
            });
            console.log(`✅ Role do usuário ${email} atualizado para SUPERADMIN`);
        }
    } catch (error) {
        console.error('❌ Erro no seed de superadmin:', error.message);
    }
};

app.listen(PORT, async () => {
    // 1. Verify DB Integrity
    try {
        const tableCheck = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='User';`;
        if (!tableCheck || tableCheck.length === 0) {
            console.error('\n❌ CRITICAL ERROR: Database tables do not exist.');
            console.error('   The application is connected to a DB file that has not been migrated.');
            console.error('   Please run: npx prisma migrate reset --force\n');
            process.exit(1);
        }
    } catch (e) {
        console.error('❌ Failed to connect to DB:', e.message);
        process.exit(1);
    }

    await seedSuperAdmin();
    console.log('================================================');
    console.log(`🚀 Quiz Generator Server is running!`);
    console.log(`🔗 Local interface: http://localhost:${PORT}`);
    console.log('================================================');
    console.log('Certifique-se de que o arquivo .env está configurado corretamente.');
    console.log('================================================');

    const url = `http://localhost:${PORT}/login`;
    // exec(`start ${url}`); // Comentado
});
