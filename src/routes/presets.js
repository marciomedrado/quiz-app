const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { requireAuth } = require('../middlewares/auth');

// Get all presets for the logged in user
router.get('/', requireAuth, async (req, res) => {
    try {
        const presets = await prisma.stylePreset.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        // Decode style from JSON string
        const formattedPresets = presets.map(p => ({
            id: p.id,
            name: p.name,
            style: JSON.parse(p.style)
        }));
        res.json(formattedPresets);
    } catch (error) {
        console.error('Error fetching presets:', error);
        res.status(500).json({ error: 'Erro ao carregar presets' });
    }
});

// Create a new preset
router.post('/', requireAuth, async (req, res) => {
    const { name, style } = req.body;
    if (!name || !style) {
        return res.status(400).json({ error: 'Nome e estilo são obrigatórios' });
    }

    try {
        const preset = await prisma.stylePreset.create({
            data: {
                name,
                style: JSON.stringify(style),
                userId: req.user.id
            }
        });
        res.json({
            id: preset.id,
            name: preset.name,
            style: JSON.parse(preset.style)
        });
    } catch (error) {
        console.error('Error creating preset:', error);
        res.status(500).json({ error: 'Erro ao salvar preset' });
    }
});

// Delete a preset
router.delete('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        // Ensure it belongs to the user
        const preset = await prisma.stylePreset.findFirst({
            where: { id, userId: req.user.id }
        });

        if (!preset) {
            return res.status(404).json({ error: 'Preset não encontrado' });
        }

        await prisma.stylePreset.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting preset:', error);
        res.status(500).json({ error: 'Erro ao deletar preset' });
    }
});

module.exports = router;
