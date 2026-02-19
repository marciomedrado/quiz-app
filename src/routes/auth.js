const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../db/prisma');

const authSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = authSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Este e-mail já está em uso.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Se for o e-mail definido no .env como admin, cria como admin
        const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role,
                credits: 10 // Créditos iniciais para novos usuários
            }
        });

        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
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
            sameSite: 'strict',
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
