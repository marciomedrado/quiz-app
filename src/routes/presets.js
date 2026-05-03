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

// Delete a preset (Style)
router.delete('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const preset = await prisma.stylePreset.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!preset) return res.status(404).json({ error: 'Preset não encontrado' });
        await prisma.stylePreset.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting style preset:', error);
        res.status(500).json({ error: 'Erro ao deletar preset' });
    }
});

// --- CONFIG PRESETS ---

// Get all config presets
router.get('/config/all', requireAuth, async (req, res) => {
    try {
        const presets = await prisma.configPreset.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        const formattedPresets = presets.map(p => ({
            id: p.id,
            name: p.name,
            config: JSON.parse(p.config)
        }));
        res.json(formattedPresets);
    } catch (error) {
        console.error('Error fetching config presets:', error);
        res.status(500).json({ error: 'Erro ao carregar presets de configuração' });
    }
});

// Create config preset
router.post('/config', requireAuth, async (req, res) => {
    const { name, config } = req.body;
    if (!name || !config) return res.status(400).json({ error: 'Nome e configuração são obrigatórios' });

    try {
        const preset = await prisma.configPreset.create({
            data: {
                name,
                config: JSON.stringify(config),
                userId: req.user.id
            }
        });
        res.json({
            id: preset.id,
            name: preset.name,
            config: JSON.parse(preset.config)
        });
    } catch (error) {
        console.error('Error creating config preset:', error);
        res.status(500).json({ error: 'Erro ao salvar preset de configuração' });
    }
});

// Delete config preset
router.delete('/config/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const preset = await prisma.configPreset.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!preset) return res.status(404).json({ error: 'Preset de configuração não encontrado' });
        await prisma.configPreset.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting config preset:', error);
        res.status(500).json({ error: 'Erro ao deletar preset de configuração' });
    }
});

// Update a style preset
router.put('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { name, style } = req.body;
    try {
        const preset = await prisma.stylePreset.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!preset) return res.status(404).json({ error: 'Preset não encontrado' });

        const updated = await prisma.stylePreset.update({
            where: { id },
            data: {
                name: name || preset.name,
                style: style ? JSON.stringify(style) : preset.style
            }
        });
        res.json({
            id: updated.id,
            name: updated.name,
            style: JSON.parse(updated.style)
        });
    } catch (error) {
        console.error('Error updating style preset:', error);
        res.status(500).json({ error: 'Erro ao atualizar preset' });
    }
});

// Update config preset
router.put('/config/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { name, config } = req.body;
    try {
        const preset = await prisma.configPreset.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!preset) return res.status(404).json({ error: 'Preset de configuração não encontrado' });

        const updated = await prisma.configPreset.update({
            where: { id },
            data: {
                name: name || preset.name,
                config: config ? JSON.stringify(config) : preset.config
            }
        });
        res.json({
            id: updated.id,
            name: updated.name,
            config: JSON.parse(updated.config)
        });
    } catch (error) {
        console.error('Error updating config preset:', error);
        res.status(500).json({ error: 'Erro ao atualizar preset de configuração' });
    }
});

module.exports = router;
