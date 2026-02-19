const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');

const roleHierarchy = {
    'USER': 1,
    'ADMIN': 2,
    'SUPERADMIN': 3
};

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

const requireRole = (minRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autorizado.' });
        }

        const userRoleValue = roleHierarchy[req.user.role?.toUpperCase()] || 0;
        const requiredRoleValue = roleHierarchy[minRole.toUpperCase()] || 0;

        if (userRoleValue < requiredRoleValue) {
            return res.status(403).json({ error: `Acesso negado. Requer role ${minRole} ou superior.` });
        }

        next();
    };
};

const requireAdmin = requireRole('ADMIN');
const requireSuperAdmin = requireRole('SUPERADMIN');

module.exports = { requireAuth, requireRole, requireAdmin, requireSuperAdmin };
