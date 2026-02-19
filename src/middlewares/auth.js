const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');

const requireAuth = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Não autorizado. Faça login primeiro.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, credits: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
    }
    next();
};

module.exports = { requireAuth, requireAdmin };
