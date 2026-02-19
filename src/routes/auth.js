const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const z = require('zod');
const prisma = require('../db/prisma');

const authSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = authSchema.parse(req.body);

        const passwordHash = await bcrypt.hash(password, 10);

        // Se for o e-mail definido no .env como admin, cria como ADMIN
        // Caso contrário, USER. (Valores devem ser UPPERCASE para o enum Prisma)
        const role = email === process.env.ADMIN_EMAIL ? 'ADMIN' : 'USER';

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role,
                credits: 10
            }
        });

        res.status(201).json({ ok: true });
    } catch (error) {
        console.error("❌ REGISTER ERROR:", error.code, error.message, error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }

        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Este e-mail já está em uso.' });
        }

        res.status(500).json({ error: 'Erro interno ao criar usuário.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = authSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
        });

        res.json({ message: 'Login realizado com sucesso!' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout realizado com sucesso!' });
});

module.exports = router;
