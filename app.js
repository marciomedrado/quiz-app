// ===================================
// QUIZ GENERATOR - APPLICATION LOGIC
// ===================================

// ===================================
// STATE MANAGEMENT
// ===================================
const DEFAULT_CARD_STYLE = {
    fontFamilyNumber: "'Inter', sans-serif",
    fontSizeNumber: 100,
    fontFamilyQuestion: "'Inter', sans-serif",
    fontSizeQuestion: 100,
    fontFamilyAlternatives: "'Inter', sans-serif",
    fontSizeAlternatives: 100,
    fontFamilyJustification: "'Inter', sans-serif",
    fontSizeJustification: 100,
    colorPrimary: '#6366f1',
    colorAccent: '#a855f7',
    colorCardBg: '#1e1e2e',
    colorTextNumber: '#ffffff',
    colorTextQuestion: '#ffffff',
    colorTextAlternatives: '#ffffff',
    colorTextJustification: '#ffffff',
    colorCorrect: '#22c55e',
    colorCorrectBorder: '#22c55e',
    colorJustificationBg: '#166534',
    colorJustificationBorder: '#22c55e',
    bgImage: '',
    bgOpacity: 0.5,
    bgImageOpacity: 1.0,
    numberFormat: 'question',
    globalAltBgOpacity: 0.05,
    globalAltBorderOpacity: 0.1,
    globalAltBgColor: '#ffffff',
    globalAltBorderColor: '#ffffff',
    radiusNumber: 15,
    radiusAlternatives: 20,
    widthAlternatives: 100,
    radiusJustification: 20,
    widthJustification: 100,
    fioVisible: false,
    fioColor: '#ffffff',
    radiusFio: 10,
    fioOffset: 10,
    fioThickness: 1,
    yOffsetNumber: -20,
    yOffsetQuestion: -28,
    yOffsetAlternatives: -20,
    yOffsetAlternativesImage: -22,
    yOffsetJustification: 0,
    yOffsetImage: -16,
    layout: 'default',
    justificationVisible: true
};

const DEFAULT_TIMING = {
    intro: 15,
    cta: 5,
    statement: 4,
    alternatives: 4,
    timer: 5,
    answer: 15,
    outro: 10
};

const state = {
    apiKey: localStorage.getItem('openai_api_key') || '',
    model: localStorage.getItem('openai_model') || 'gpt-4o',
    imageProvider: localStorage.getItem('image_provider') || 'openai',
    aiImagesEnabled: false,
    generatedQuiz: null,
    currentConfig: null,
    isGenerating: false,
    cardStyle: (() => {
        const saved = JSON.parse(localStorage.getItem('card_style'));
        return saved ? { ...DEFAULT_CARD_STYLE, ...saved } : { ...DEFAULT_CARD_STYLE };
    })(),
    sync_global: false,
    brainstormHistory: [],
    lastNarrativeData: null,
    timing: (() => {
        const saved = JSON.parse(localStorage.getItem('quiz_timing'));
        return saved ? { ...DEFAULT_TIMING, ...saved } : { ...DEFAULT_TIMING };
    })(),
    currentUser: null
};


// ===================================
// DOM ELEMENTS
// ===================================
const elements = {
    // Settings Modal
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettings'),
    cancelSettingsBtn: document.getElementById('cancelSettings'),

    // API Configuration
    modelSelect: document.getElementById('model'),
    imageProviderSelect: document.getElementById('imageProvider'),
    saveApiKeyBtn: document.getElementById('saveApiKey'),

    // Quiz Configuration
    languageSelect: document.getElementById('language'),
    themeInput: document.getElementById('theme'),
    difficultySelect: document.getElementById('difficulty'),
    formatSelect: document.getElementById('format'),
    numQuestionsInput: document.getElementById('numQuestions'),
    numAlternativesSelect: document.getElementById('numAlternatives'),
    detailsTextarea: document.getElementById('details'),

    // Narrative Configuration
    channelNameInput: document.getElementById('channelName'),
    narratorToneSelect: document.getElementById('narratorTone'),
    customToneInput: document.getElementById('customTone'),
    customToneGroup: document.getElementById('customToneGroup'),
    narrativeQuestionFormatSelect: document.getElementById('narrativeQuestionFormat'),
    narrativeAlternativeFormatSelect: document.getElementById('narrativeAlternativeFormat'),
    narrativeAnswerFormatSelect: document.getElementById('narrativeAnswerFormat'),
    narrativeJustificationFormatSelect: document.getElementById('narrativeJustificationFormat'),

    // Search Modal
    imageSearchModal: document.getElementById('imageSearchModal'),
    closeImageSearchBtn: document.getElementById('closeImageSearch'),
    imageSearchInput: document.getElementById('imageSearchInput'),
    executeImageSearchBtn: document.getElementById('executeImageSearch'),
    imageSearchResults: document.getElementById('imageSearchResults'),

    // Actions
    generateQuizBtn: document.getElementById('generateQuiz'),
    clearFormBtn: document.getElementById('clearForm'),

    // Results
    statusContainer: document.getElementById('statusContainer'),
    resultsSection: document.getElementById('resultsSection'),
    quizSummary: document.getElementById('quizSummary'),
    questionsContainer: document.getElementById('questionsContainer'),
    exportCSVBtn: document.getElementById('exportCSV'),
    exportJSONBtn: document.getElementById('exportJSON'),
    copyToClipboardBtn: document.getElementById('copyToClipboard'),
    exportAllQuestionImagesBtn: document.getElementById('exportAllQuestionImages'),
    exportAllAnswerImagesBtn: document.getElementById('exportAllAnswerImages'),
    exportSearchTermsBtn: document.getElementById('exportSearchTerms'),
    exportAllTogetherBtn: document.getElementById('exportAllTogether'),
    generateNarrativeBtn: document.getElementById('generateNarrative'),
    bulkImportImagesBtn: document.getElementById('bulkImportImages'),
    bulkImageInput: document.getElementById('bulkImageInput'),
    exportMetadataBtn: document.getElementById('exportMetadata'),
    importMetadataBtn: document.getElementById('importMetadata'),
    importMetadataTopBtn: document.getElementById('importMetadataTop'),
    importProjectHomeBtn: document.getElementById('importProjectHome'),
    metadataInput: document.getElementById('metadataInput'),
    bulkImportBackgroundsBtn: document.getElementById('bulkImportBackgrounds'),
    bulkBackgroundInput: document.getElementById('bulkBackgroundInput'),

    // Style Modal
    styleModal: document.getElementById('styleModal'),
    openStyleModalBtn: document.getElementById('openStyleModal'),
    closeStyleModalBtn: document.getElementById('closeStyleModal'),
    cancelStylesBtn: document.getElementById('cancelStyles'),
    saveStylesBtn: document.getElementById('saveStyles'),
    resetStylesBtn: document.getElementById('resetStyles'),

    // Number Controls
    cardNumberFormatSelect: document.getElementById('cardNumberFormat'),
    cardFontFamilyNumberSelect: document.getElementById('cardFontFamilyNumber'),
    cardFontSizeNumberInput: document.getElementById('cardFontSizeNumber'),
    fontSizeNumberValueSpan: document.getElementById('fontSizeNumberValue'),
    cardColorTextNumberInput: document.getElementById('cardColorTextNumber'),

    // Question Controls
    cardFontFamilyQuestionSelect: document.getElementById('cardFontFamilyQuestion'),
    cardFontSizeQuestionInput: document.getElementById('cardFontSizeQuestion'),
    fontSizeQuestionValueSpan: document.getElementById('fontSizeQuestionValue'),
    cardColorTextQuestionInput: document.getElementById('cardColorTextQuestion'),
    cardRadiusNumberInput: document.getElementById('cardRadiusNumber'),
    radiusNumberValueSpan: document.getElementById('radiusNumberValue'),

    // Alternatives Controls
    cardFontFamilyAlternativesSelect: document.getElementById('cardFontFamilyAlternatives'),
    cardFontSizeAlternativesInput: document.getElementById('cardFontSizeAlternatives'),
    fontSizeAlternativesValueSpan: document.getElementById('fontSizeAlternativesValue'),
    cardColorTextAlternativesInput: document.getElementById('cardColorTextAlternatives'),
    cardRadiusAlternativesInput: document.getElementById('cardRadiusAlternatives'),
    radiusAlternativesValueSpan: document.getElementById('radiusAlternativesValue'),

    // Justification Controls
    cardFontFamilyJustificationSelect: document.getElementById('cardFontFamilyJustification'),
    cardFontSizeJustificationInput: document.getElementById('cardFontSizeJustification'),
    fontSizeJustificationValueSpan: document.getElementById('fontSizeJustificationValue'),
    cardColorTextJustificationInput: document.getElementById('cardColorTextJustification'),
    cardRadiusJustificationInput: document.getElementById('cardRadiusJustification'),
    radiusJustificationValueSpan: document.getElementById('radiusJustificationValue'),
    cardColorCorrectInput: document.getElementById('cardColorCorrect'),
    cardColorCorrectBorderInput: document.getElementById('cardColorCorrectBorder'),
    cardColorJustificationBgInput: document.getElementById('cardColorJustificationBg'),
    cardColorJustificationBorderInput: document.getElementById('cardColorJustificationBorder'),
    cardFioVisibleCheckbox: document.getElementById('cardFioVisible'),
    cardFioColorInput: document.getElementById('cardFioColor'),
    cardRadiusFioInput: document.getElementById('cardRadiusFio'),
    radiusFioValueSpan: document.getElementById('radiusFioValue'),
    cardFioOffsetInput: document.getElementById('cardFioOffset'),
    fioOffsetValueSpan: document.getElementById('fioOffsetValue'),
    cardFioThicknessInput: document.getElementById('cardFioThickness'),
    fioThicknessValueSpan: document.getElementById('fioThicknessValue'),
    cardWidthAlternativesInput: document.getElementById('cardWidthAlternatives'),
    widthAlternativesValueSpan: document.getElementById('widthAlternativesValue'),
    cardWidthJustificationInput: document.getElementById('cardWidthJustification'),
    widthJustificationValueSpan: document.getElementById('widthJustificationValue'),

    cardColorPrimaryInput: document.getElementById('cardColorPrimary'),
    cardColorAccentInput: document.getElementById('cardColorAccent'),
    cardColorBgInput: document.getElementById('cardColorBg'),
    cardBgImageInput: document.getElementById('cardBgImage'),
    cardBgOpacityInput: document.getElementById('cardBgOpacity'),
    bgOpacityValueSpan: document.getElementById('bgOpacityValue'),
    cardBgImageOpacityInput: document.getElementById('cardBgImageOpacity'),
    bgImageOpacityValueSpan: document.getElementById('bgImageOpacityValue'),
    cardBgUploadInput: document.getElementById('cardBgUpload'),
    cardPreviewLayoutSelect: document.getElementById('cardPreviewLayout'),
    cardPreviewScreenSelect: document.getElementById('cardPreviewScreen'),
    cardPreviewAlternativesSelect: document.getElementById('cardPreviewAlternatives'),
    cardPreviewWrapper: document.getElementById('cardPreviewWrapper'),

    // Global Box Controls
    globalAltBgOpacityInput: document.getElementById('globalAltBgOpacity'),
    globalAltBorderOpacityInput: document.getElementById('globalAltBorderOpacity'),
    globalAltBgColorInput: document.getElementById('globalAltBgColor'),
    globalAltBorderColorInput: document.getElementById('globalAltBorderColor'),
    globalAltBgOpacityValueSpan: document.getElementById('globalAltBgOpacityValue'),
    globalAltBorderOpacityValueSpan: document.getElementById('globalAltBorderOpacityValue'),

    // Vertical Offset Controls
    cardYOffsetNumberInput: document.getElementById('cardYOffsetNumber'),
    yOffsetNumberValueSpan: document.getElementById('yOffsetNumberValue'),
    cardYOffsetQuestionInput: document.getElementById('cardYOffsetQuestion'),
    yOffsetQuestionValueSpan: document.getElementById('yOffsetQuestionValue'),
    cardYOffsetAlternativesInput: document.getElementById('cardYOffsetAlternatives'),
    yOffsetAlternativesValueSpan: document.getElementById('yOffsetAlternativesValue'),
    cardYOffsetAlternativesImageInput: document.getElementById('cardYOffsetAlternativesImage'),
    yOffsetAlternativesImageValueSpan: document.getElementById('yOffsetAlternativesImageValue'),
    cardYOffsetJustificationInput: document.getElementById('cardYOffsetJustification'),
    yOffsetJustificationValueSpan: document.getElementById('yOffsetJustificationValue'),
    cardYOffsetImageInput: document.getElementById('cardYOffsetImage'),
    yOffsetImageValueSpan: document.getElementById('yOffsetImageValue'),

    // Timing Elements
    timingModal: document.getElementById('timingModal'),
    openTimingModalBtn: document.getElementById('openTimingModal'),
    closeTimingModalBtn: document.getElementById('closeTimingModal'),
    saveTimingBtn: document.getElementById('saveTimingBtn'),
    resetTimingBtn: document.getElementById('resetTimingBtn'),
    timeIntroInput: document.getElementById('timeIntro'),
    timeCTAInput: document.getElementById('timeCTA'),
    timeStatementInput: document.getElementById('timeStatement'),
    timeAlternativesInput: document.getElementById('timeAlternatives'),
    timeTimerInput: document.getElementById('timeTimer'),
    timeAnswerInput: document.getElementById('timeAnswer'),
    timeOutroInput: document.getElementById('timeOutro'),

    // Preset Controls
    presetNameInput: document.getElementById('presetNameInput'),
    savePresetBtn: document.getElementById('savePresetBtn'),
    presetsList: document.getElementById('presetsList'),

    // Brainstorm Elements
    brainstormModal: document.getElementById('brainstormModal'),
    openBrainstormBtn: document.getElementById('openBrainstorm'),
    closeBrainstormBtn: document.getElementById('closeBrainstorm'),
    brainstormInput: document.getElementById('brainstormInput'),
    sendBrainstormBtn: document.getElementById('sendBrainstorm'),
    brainstormChatHistory: document.getElementById('brainstormChatHistory'),

    // Shutdown
    shutdownBtn: document.getElementById('shutdownBtn'),

    // Regenerate Elements
    regenerateModal: document.getElementById('regenerateModal'),
    closeRegenerateModalBtn: document.getElementById('closeRegenerateModal'),
    regeneratePromptInput: document.getElementById('regeneratePrompt'),
    regenerateCustomBtn: document.getElementById('regenerateCustomBtn'),
    regenerateRandomBtn: document.getElementById('regenerateRandomBtn'),

    // Auth & User
    userInfo: document.getElementById('userInfo'),
    userEmail: document.getElementById('userEmail'),
    userCredits: document.getElementById('userCredits'),
    logoutBtn: document.getElementById('logoutBtn'),
    adminBtn: document.getElementById('adminBtn')
};

// ===================================
// INITIALIZATION
// ===================================
function init() {
    // Load saved configuration
    elements.modelSelect.value = state.model;
    elements.imageProviderSelect.value = state.imageProvider;

    // Event listeners
    if (elements.saveApiKeyBtn) elements.saveApiKeyBtn.addEventListener('click', saveApiConfiguration);
    if (elements.generateQuizBtn) elements.generateQuizBtn.addEventListener('click', generateQuiz);
    if (elements.clearFormBtn) elements.clearFormBtn.addEventListener('click', clearForm);
    if (elements.exportCSVBtn) elements.exportCSVBtn.addEventListener('click', exportToCSV);
    if (elements.exportJSONBtn) elements.exportJSONBtn.addEventListener('click', exportToJSON);
    if (elements.copyToClipboardBtn) elements.copyToClipboardBtn.addEventListener('click', copyToClipboard);
    if (elements.exportAllQuestionImagesBtn) elements.exportAllQuestionImagesBtn.addEventListener('click', exportAllQuestionImages);
    if (elements.exportAllAnswerImagesBtn) elements.exportAllAnswerImagesBtn.addEventListener('click', exportAllAnswerImages);
    if (elements.exportSearchTermsBtn) elements.exportSearchTermsBtn.addEventListener('click', exportSearchTerms);
    if (elements.exportAllTogetherBtn) elements.exportAllTogetherBtn.addEventListener('click', exportAllTogether);
    if (elements.exportAllTogetherBtn) elements.exportAllTogetherBtn.addEventListener('click', exportAllTogether);
    if (elements.generateNarrativeBtn) elements.generateNarrativeBtn.addEventListener('click', generateNarrative);

    const productionPackageBtn = document.getElementById('exportProductionPackage');
    if (productionPackageBtn) productionPackageBtn.addEventListener('click', packProductionAssets);

    const capcutBtn = document.getElementById('exportCapCut');
    if (capcutBtn) capcutBtn.addEventListener('click', exportCapCutProject);

    if (elements.bulkImportImagesBtn) elements.bulkImportImagesBtn.addEventListener('click', () => elements.bulkImageInput.click());
    if (elements.bulkImageInput) elements.bulkImageInput.addEventListener('change', bulkImportImages);
    if (elements.exportMetadataBtn) elements.exportMetadataBtn.addEventListener('click', exportMetadata);
    if (elements.importMetadataBtn) elements.importMetadataBtn.addEventListener('click', () => elements.metadataInput.click());
    if (elements.importMetadataTopBtn) elements.importMetadataTopBtn.addEventListener('click', () => elements.metadataInput.click());
    if (elements.metadataInput) elements.metadataInput.addEventListener('change', importMetadata);
    if (elements.bulkImportBackgroundsBtn) elements.bulkImportBackgroundsBtn.addEventListener('click', () => elements.bulkBackgroundInput.click());
    if (elements.bulkBackgroundInput) elements.bulkBackgroundInput.addEventListener('change', bulkImportBackgrounds);
    if (elements.importProjectHomeBtn) elements.importProjectHomeBtn.addEventListener('click', () => elements.metadataInput.click());

    // Format change handler
    if (elements.formatSelect) elements.formatSelect.addEventListener('change', handleFormatChange);

    // Modal event listeners
    if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', openSettings);
    if (elements.shutdownBtn) elements.shutdownBtn.addEventListener('click', handleShutdown);
    if (elements.closeSettingsBtn) elements.closeSettingsBtn.addEventListener('click', closeSettings);
    if (elements.cancelSettingsBtn) elements.cancelSettingsBtn.addEventListener('click', closeSettings);
    if (elements.settingsModal) {
        const overlay = elements.settingsModal.querySelector('.modal-overlay');
        if (overlay) overlay.addEventListener('click', closeSettings);
    }

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.settingsModal && !elements.settingsModal.classList.contains('hidden')) {
            closeSettings();
        }
    });

    // Toggle custom tone input
    window.toggleCustomTone = function (value) {
        if (value === 'Personalizado') {
            if (elements.customToneGroup) elements.customToneGroup.classList.remove('hidden');
        } else {
            if (elements.customToneGroup) elements.customToneGroup.classList.add('hidden');
        }
    };
    // Initial call for custom tone visibility
    if (elements.narratorToneSelect) {
        toggleCustomTone(elements.narratorToneSelect.value);
        elements.narratorToneSelect.addEventListener('change', (e) => toggleCustomTone(e.target.value));
    }

    // Style Modal event listeners
    if (elements.openStyleModalBtn) elements.openStyleModalBtn.addEventListener('click', openStyleModal);
    if (elements.closeStyleModalBtn) elements.closeStyleModalBtn.addEventListener('click', closeStyleModal);
    if (elements.cancelStylesBtn) elements.cancelStylesBtn.addEventListener('click', closeStyleModal);
    if (elements.saveStylesBtn) elements.saveStylesBtn.addEventListener('click', saveStyles);
    if (elements.resetStylesBtn) elements.resetStylesBtn.addEventListener('click', resetStyles);
    if (elements.savePresetBtn) elements.savePresetBtn.addEventListener('click', savePreset);
    if (elements.styleModal) {
        const overlay = elements.styleModal.querySelector('.modal-overlay');
        if (overlay) overlay.addEventListener('click', closeStyleModal);
    }

    loadPresets();
    populateFontSelects();
    initStyleEventListeners();
    initBrainstormListeners();
    initRegenerateListeners();
    initTimingListeners();
    injectGoogleFonts(); // Inject fonts for html2canvas

    // Auth & User Initialization
    checkAuth();
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', handleLogout);

    console.log('Quiz Generator initialized');
}

async function checkAuth() {
    try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
            state.currentUser = await response.json();
            updateUserInfo();
        } else {
            const path = window.location.pathname;
            if (path !== '/login' && path !== '/register' && path !== '/login.html' && path !== '/register.html') {
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

function updateUserInfo() {
    if (state.currentUser && elements.userInfo) {
        elements.userInfo.classList.remove('hidden');
        elements.userEmail.textContent = state.currentUser.email;
        elements.userCredits.textContent = state.currentUser.credits;
        if (state.currentUser.role === 'admin') {
            elements.adminBtn.classList.remove('hidden');
        }
    }
}

async function handleLogout() {
    if (confirm('Deseja realmente sair?')) {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    }
}

function initStyleEventListeners() {
    const styleInputs = [
        elements.cardNumberFormatSelect,
        elements.cardFontFamilyNumberSelect, elements.cardFontSizeNumberInput, elements.cardColorTextNumberInput,
        elements.cardFontFamilyQuestionSelect, elements.cardFontSizeQuestionInput, elements.cardColorTextQuestionInput,
        elements.cardFontFamilyAlternativesSelect, elements.cardFontSizeAlternativesInput, elements.cardColorTextAlternativesInput,
        elements.cardFontFamilyJustificationSelect, elements.cardFontSizeJustificationInput, elements.cardColorTextJustificationInput,
        elements.cardColorCorrectInput, elements.cardColorCorrectBorderInput, elements.cardColorJustificationBgInput, elements.cardColorJustificationBorderInput,
        elements.cardColorPrimaryInput, elements.cardColorAccentInput, elements.cardColorBgInput,
        elements.cardBgImageInput, elements.cardBgOpacityInput, elements.cardBgImageOpacityInput,
        elements.cardPreviewLayoutSelect, elements.cardPreviewScreenSelect, elements.cardPreviewAlternativesSelect,
        elements.globalAltBgOpacityInput, elements.globalAltBorderOpacityInput,
        elements.globalAltBgColorInput, elements.globalAltBorderColorInput,
        elements.cardRadiusNumberInput, elements.cardRadiusAlternativesInput, elements.cardWidthAlternativesInput, elements.cardRadiusJustificationInput, elements.cardWidthJustificationInput,
        elements.narrativeJustificationFormatSelect,
        elements.cardFioVisibleCheckbox, elements.cardFioColorInput, elements.cardRadiusFioInput, elements.cardFioOffsetInput, elements.cardFioThicknessInput,
        elements.cardYOffsetNumberInput, elements.cardYOffsetQuestionInput, elements.cardYOffsetAlternativesInput, elements.cardYOffsetAlternativesImageInput, elements.cardYOffsetJustificationInput, elements.cardYOffsetImageInput
    ];

    styleInputs.forEach(el => {
        if (el) el.addEventListener('input', updateStylePreview);
    });

    // Update range value displays
    const rangeMappings = [
        { el: elements.cardFontSizeNumberInput, span: elements.fontSizeNumberValueSpan },
        { el: elements.cardFontSizeQuestionInput, span: elements.fontSizeQuestionValueSpan },
        { el: elements.cardFontSizeAlternativesInput, span: elements.fontSizeAlternativesValueSpan },
        { el: elements.cardFontSizeJustificationInput, span: elements.fontSizeJustificationValueSpan },
        { el: elements.cardBgOpacityInput, span: elements.bgOpacityValueSpan },
        { el: elements.cardBgImageOpacityInput, span: elements.bgImageOpacityValueSpan },
        { el: elements.cardRadiusNumberInput, span: elements.radiusNumberValueSpan },
        { el: elements.cardRadiusAlternativesInput, span: elements.radiusAlternativesValueSpan },
        { el: elements.cardWidthAlternativesInput, span: elements.widthAlternativesValueSpan },
        { el: elements.cardRadiusJustificationInput, span: elements.radiusJustificationValueSpan },
        { el: elements.cardWidthJustificationInput, span: elements.widthJustificationValueSpan },
        { el: elements.cardRadiusFioInput, span: elements.radiusFioValueSpan },
        { el: elements.cardFioOffsetInput, span: elements.fioOffsetValueSpan },
        { el: elements.cardFioThicknessInput, span: elements.fioThicknessValueSpan },
        { el: elements.globalAltBgOpacityInput, span: elements.globalAltBgOpacityValueSpan },
        { el: elements.globalAltBorderOpacityInput, span: elements.globalAltBorderOpacityValueSpan },
        { el: elements.cardYOffsetNumberInput, span: elements.yOffsetNumberValueSpan },
        { el: elements.cardYOffsetQuestionInput, span: elements.yOffsetQuestionValueSpan },
        { el: elements.cardYOffsetAlternativesInput, span: elements.yOffsetAlternativesValueSpan },
        { el: elements.cardYOffsetAlternativesImageInput, span: elements.yOffsetAlternativesImageValueSpan },
        { el: elements.cardYOffsetJustificationInput, span: elements.yOffsetJustificationValueSpan },
        { el: elements.cardYOffsetImageInput, span: elements.yOffsetImageValueSpan }
    ];

    rangeMappings.forEach(m => {
        if (m.el && m.span) {
            m.el.addEventListener('input', (e) => {
                m.span.textContent = e.target.value;
            });
        }
    });

    if (elements.cardBgUploadInput) {
        elements.cardBgUploadInput.addEventListener('change', handleBgUpload);
    }

    // Global Alternatives Real-time propagation
    if (elements.globalAltBgOpacityInput && elements.globalAltBorderOpacityInput) {
        const updateAllBoxes = () => {
            if (!state.generatedQuiz) return;
            const bgVal = elements.globalAltBgOpacityInput.value;
            const borderVal = elements.globalAltBorderOpacityInput.value;
            const cards = document.querySelectorAll('.question-card');
            cards.forEach((card, i) => {
                const question = state.generatedQuiz.questions[i];
                if (question.altBgOpacity === undefined) {
                    card.style.setProperty('--alt-bg-opacity', bgVal);
                }
                if (question.altBorderOpacity === undefined) {
                    card.style.setProperty('--alt-border-opacity', borderVal);
                }
            });
        };
        elements.globalAltBgOpacityInput.addEventListener('input', updateAllBoxes);
        elements.globalAltBorderOpacityInput.addEventListener('input', updateAllBoxes);
    }
}

function populateFontSelects() {
    const fonts = [
        { value: "'Inter', sans-serif", label: "Inter (Padrão)" },
        { value: "'Outfit', sans-serif", label: "Outfit" },
        { value: "'Poppins', sans-serif", label: "Poppins" },
        { value: "'Roboto', sans-serif", label: "Roboto" },
        { value: "'Montserrat', sans-serif", label: "Montserrat" },
        { value: "'Playfair Display', serif", label: "Playfair Display (Elegante)" }
    ];

    const selectors = document.querySelectorAll('.font-selector-ajax');
    selectors.forEach(select => {
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font.value;
            option.textContent = font.label;
            select.appendChild(option);
        });
    });
}

// ===================================
// SETTINGS MODAL CONTROLS
// ===================================
function openSettings() {
    elements.settingsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeSettings() {
    elements.settingsModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
}

// ===================================
// SHUTDOWN
// ===================================
async function handleShutdown() {
    if (confirm('Tem certeza que deseja sair e desligar o servidor?')) {
        try {
            // Tenta fechar a janela antes de matar o servidor
            const response = await fetch('/api/shutdown', { method: 'POST' });

            // UI Feedback
            if (response.ok) {
                document.body.innerHTML = `
                    <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; color: #fff; font-family: sans-serif;">
                        <h1 style="color: #ef4444;">🛑 Servidor Desligado</h1>
                        <p>Você pode fechar esta janela agora.</p>
                        <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #333; color: white; border: 1px solid #555; cursor: pointer;">Fechar Janela</button>
                    </div>
                `;

                // Tenta fechar a janela automaticamente, embora navegadores modernos bloqueiem isso se não foi aberto por script
                window.close();
            }
        } catch (error) {
            console.error('Erro ao desligar servidor:', error);
            alert('Erro ao tentar desligar o servidor.');
        }
    }
}

// ===================================
// STYLE PRESETS
// ===================================
function getCurrentStyle() {
    return {
        numberFormat: elements.cardNumberFormatSelect.value,
        fontFamilyNumber: elements.cardFontFamilyNumberSelect.value,
        fontSizeNumber: parseInt(elements.cardFontSizeNumberInput.value),
        fontFamilyQuestion: elements.cardFontFamilyQuestionSelect.value,
        fontSizeQuestion: parseInt(elements.cardFontSizeQuestionInput.value),
        fontFamilyAlternatives: elements.cardFontFamilyAlternativesSelect.value,
        fontSizeAlternatives: parseInt(elements.cardFontSizeAlternativesInput.value),
        fontFamilyJustification: elements.cardFontFamilyJustificationSelect.value,
        fontSizeJustification: parseInt(elements.cardFontSizeJustificationInput.value),
        colorPrimary: elements.cardColorPrimaryInput.value,
        colorAccent: elements.cardColorAccentInput.value,
        colorCardBg: elements.cardColorBgInput.value,
        colorTextNumber: elements.cardColorTextNumberInput.value,
        colorTextQuestion: elements.cardColorTextQuestionInput.value,
        colorTextAlternatives: elements.cardColorTextAlternativesInput.value,
        colorTextJustification: elements.cardColorTextJustificationInput.value,
        colorCorrect: elements.cardColorCorrectInput.value,
        colorCorrectBorder: elements.cardColorCorrectBorderInput.value,
        colorJustificationBg: elements.cardColorJustificationBgInput.value,
        colorJustificationBorder: elements.cardColorJustificationBorderInput.value,
        bgImage: elements.cardBgImageInput.value.trim(),
        bgOpacity: parseFloat(elements.cardBgOpacityInput.value),
        bgImageOpacity: parseFloat(elements.cardBgImageOpacityInput.value),
        globalAltBgOpacity: parseFloat(elements.globalAltBgOpacityInput.value),
        globalAltBorderOpacity: parseFloat(elements.globalAltBorderOpacityInput.value),
        globalAltBgColor: elements.globalAltBgColorInput.value,
        globalAltBorderColor: elements.globalAltBorderColorInput.value,
        radiusNumber: parseInt(elements.cardRadiusNumberInput.value),
        radiusAlternatives: parseInt(elements.cardRadiusAlternativesInput.value),
        widthAlternatives: parseInt(elements.cardWidthAlternativesInput.value),
        radiusJustification: parseInt(elements.cardRadiusJustificationInput.value),
        widthJustification: parseInt(elements.cardWidthJustificationInput.value),
        fioVisible: elements.cardFioVisibleCheckbox.checked,
        fioColor: elements.cardFioColorInput.value,
        radiusFio: parseInt(elements.cardRadiusFioInput.value),
        fioOffset: parseInt(elements.cardFioOffsetInput.value),
        fioThickness: parseInt(elements.cardFioThicknessInput.value),
        yOffsetNumber: parseInt(elements.cardYOffsetNumberInput.value),
        yOffsetQuestion: parseInt(elements.cardYOffsetQuestionInput.value),
        yOffsetAlternatives: parseInt(elements.cardYOffsetAlternativesInput.value),
        yOffsetAlternativesImage: parseInt(elements.cardYOffsetAlternativesImageInput.value),
        yOffsetJustification: parseInt(elements.cardYOffsetJustificationInput.value),
        yOffsetImage: parseInt(elements.cardYOffsetImageInput.value),
        layout: elements.cardPreviewLayoutSelect.value
    };
}

function updateUIFromStyle(style) {
    elements.cardNumberFormatSelect.value = style.numberFormat || "question";
    elements.cardFontFamilyNumberSelect.value = style.fontFamilyNumber || "'Inter', sans-serif";
    elements.cardFontSizeNumberInput.value = style.fontSizeNumber || 100;
    elements.fontSizeNumberValueSpan.textContent = style.fontSizeNumber || 100;
    elements.cardColorTextNumberInput.value = style.colorTextNumber || '#ffffff';

    elements.cardFontFamilyQuestionSelect.value = style.fontFamilyQuestion || "'Inter', sans-serif";
    elements.cardFontSizeQuestionInput.value = style.fontSizeQuestion || 100;
    elements.fontSizeQuestionValueSpan.textContent = style.fontSizeQuestion || 100;
    elements.cardColorTextQuestionInput.value = style.colorTextQuestion || '#ffffff';

    elements.cardFontFamilyAlternativesSelect.value = style.fontFamilyAlternatives || "'Inter', sans-serif";
    elements.cardFontSizeAlternativesInput.value = style.fontSizeAlternatives || 100;
    elements.fontSizeAlternativesValueSpan.textContent = style.fontSizeAlternatives || 100;
    elements.cardColorTextAlternativesInput.value = style.colorTextAlternatives || '#ffffff';

    elements.cardFontFamilyJustificationSelect.value = style.fontFamilyJustification || "'Inter', sans-serif";
    elements.cardFontSizeJustificationInput.value = style.fontSizeJustification || 100;
    elements.fontSizeJustificationValueSpan.textContent = style.fontSizeJustification || 100;
    elements.cardRadiusJustificationInput.value = style.radiusJustification || 20;
    elements.radiusJustificationValueSpan.textContent = style.radiusJustification || 20;
    elements.cardColorTextJustificationInput.value = style.colorTextJustification || '#ffffff';
    elements.cardColorCorrectInput.value = style.colorCorrect || '#22c55e';
    elements.cardColorCorrectBorderInput.value = style.colorCorrectBorder || style.colorCorrect || '#22c55e';
    elements.cardColorJustificationBgInput.value = style.colorJustificationBg || '#166534';
    elements.cardColorJustificationBorderInput.value = style.colorJustificationBorder || '#22c55e';

    elements.cardRadiusNumberInput.value = style.radiusNumber || 15;
    elements.radiusNumberValueSpan.textContent = style.radiusNumber || 15;

    elements.cardRadiusAlternativesInput.value = style.radiusAlternatives || 20;
    elements.radiusAlternativesValueSpan.textContent = style.radiusAlternatives || 20;

    elements.cardFioVisibleCheckbox.checked = style.fioVisible || false;
    elements.cardFioColorInput.value = style.fioColor || '#ffffff';
    elements.cardRadiusFioInput.value = style.radiusFio || 20;
    elements.radiusFioValueSpan.textContent = style.radiusFio || 20;
    elements.cardFioOffsetInput.value = style.fioOffset || 30;
    elements.fioOffsetValueSpan.textContent = style.fioOffset || 30;
    elements.cardFioThicknessInput.value = style.fioThickness || 4;
    elements.fioThicknessValueSpan.textContent = style.fioThickness || 4;

    elements.cardColorPrimaryInput.value = style.colorPrimary;
    elements.cardColorAccentInput.value = style.colorAccent;
    elements.cardColorBgInput.value = style.colorCardBg;
    elements.cardBgImageInput.value = style.bgImage || '';
    elements.cardBgOpacityInput.value = style.bgOpacity || 0.5;
    elements.bgOpacityValueSpan.textContent = style.bgOpacity || 0.5;
    elements.cardBgImageOpacityInput.value = style.bgImageOpacity || 1.0;
    elements.bgImageOpacityValueSpan.textContent = style.bgImageOpacity || 1.0;
    elements.cardBgUploadInput.value = '';

    elements.globalAltBgOpacityInput.value = style.globalAltBgOpacity ?? 0.05;
    elements.globalAltBorderOpacityInput.value = style.globalAltBorderOpacity ?? 0.1;
    elements.globalAltBgColorInput.value = style.globalAltBgColor ?? '#ffffff';
    elements.globalAltBorderColorInput.value = style.globalAltBorderColor ?? '#ffffff';

    elements.cardWidthAlternativesInput.value = style.widthAlternatives || 100;
    elements.widthAlternativesValueSpan.textContent = style.widthAlternatives || 100;
    elements.cardWidthJustificationInput.value = style.widthJustification || 100;
    elements.widthJustificationValueSpan.textContent = style.widthJustification || 100;

    elements.cardYOffsetNumberInput.value = style.yOffsetNumber ?? 0;
    elements.yOffsetNumberValueSpan.textContent = style.yOffsetNumber ?? 0;
    elements.cardYOffsetQuestionInput.value = style.yOffsetQuestion ?? 0;
    elements.yOffsetQuestionValueSpan.textContent = style.yOffsetQuestion ?? 0;
    elements.cardYOffsetAlternativesInput.value = style.yOffsetAlternatives ?? 0;
    elements.yOffsetAlternativesValueSpan.textContent = style.yOffsetAlternatives ?? 0;
    elements.cardYOffsetAlternativesImageInput.value = style.yOffsetAlternativesImage ?? 0;
    elements.yOffsetAlternativesImageValueSpan.textContent = style.yOffsetAlternativesImage ?? 0;
    elements.cardYOffsetJustificationInput.value = style.yOffsetJustification ?? 0;
    elements.yOffsetJustificationValueSpan.textContent = style.yOffsetJustification ?? 0;
    elements.cardYOffsetImageInput.value = style.yOffsetImage ?? 0;
    elements.yOffsetImageValueSpan.textContent = style.yOffsetImage ?? 0;

    if (elements.cardPreviewLayoutSelect) {
        elements.cardPreviewLayoutSelect.value = style.layout || 'default';
    }
}

function savePreset() {
    const nameInput = elements.presetNameInput;
    const name = nameInput.value.trim();
    if (!name) {
        showStatus('Por favor, insira um nome para o preset', 'error');
        return;
    }

    const currentStyle = getCurrentStyle();
    const presets = JSON.parse(localStorage.getItem('style_presets') || '[]');
    presets.push({ name, style: currentStyle });
    localStorage.setItem('style_presets', JSON.stringify(presets));

    nameInput.value = '';
    loadPresets();
    showStatus(`✅ Preset "${name}" salvo com sucesso!`, 'success');
}

function loadPresets() {
    const presets = JSON.parse(localStorage.getItem('style_presets') || '[]');
    const list = elements.presetsList;
    if (!list) return;

    if (presets.length === 0) {
        list.innerHTML = '<div style="text-align: center; font-size: 0.75rem; color: var(--text-tertiary); padding: 5px;">Nenhum preset salvo</div>';
        return;
    }

    list.innerHTML = '';
    presets.forEach((preset, index) => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.innerHTML = `
            <div class="preset-info" onclick="applyPreset(${index})">
                <span class="preset-name">${preset.name}</span>
            </div>
            <div class="preset-actions">
                <button class="btn-preset-delete" onclick="deletePreset(event, ${index})" title="Excluir preset">✕</button>
            </div>
        `;
        list.appendChild(item);
    });
}

window.applyPreset = function (index) {
    const presets = JSON.parse(localStorage.getItem('style_presets') || '[]');
    const preset = presets[index];
    if (!preset) return;

    state.cardStyle = { ...state.cardStyle, ...preset.style };
    updateUIFromStyle(state.cardStyle);
    updateStylePreview();
    showStatus(`✨ Preset "${preset.name}" aplicado!`, 'success');
};

window.deletePreset = function (event, index) {
    event.stopPropagation();
    const presets = JSON.parse(localStorage.getItem('style_presets') || '[]');
    const presetName = presets[index].name;

    if (confirm(`Deseja excluir o preset "${presetName}"?`)) {
        presets.splice(index, 1);
        localStorage.setItem('style_presets', JSON.stringify(presets));
        loadPresets();
        showStatus(`🗑️ Preset "${presetName}" excluído.`, 'info');
    }
};

// ===================================
// STYLE MODAL CONTROLS
// ===================================
function openStyleModal() {
    updateUIFromStyle(state.cardStyle);

    elements.styleModal.classList.remove('hidden');
    updateStylePreview();
}

function handleBgUpload(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit for local storage safety
            showStatus('⚠️ Imagem muito grande! Use arquivos menores que 2MB.', 'error');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const dataUrl = event.target.result;
            elements.cardBgImageInput.value = dataUrl;
            // Clear file input so same file can be re-uploaded if needed
            // e.target.value = ''; 
            updateStylePreview();
        };
        reader.readAsDataURL(file);
    }
}

function closeStyleModal() {
    elements.styleModal.classList.add('hidden');
}

function saveStyles() {
    state.cardStyle = getCurrentStyle();

    localStorage.setItem('card_style', JSON.stringify(state.cardStyle));

    // Refresh the results panel if a quiz exists
    if (state.generatedQuiz) {
        // Quando salvamos as configurações globais, limpamos os estilos individuais 
        // para garantir que todos adotem o novo "Master Style"
        state.generatedQuiz.questions.forEach(q => {
            delete q.bgBrightness;
            delete q.bgOpacity;
            delete q.bgOverlayOpacity;
            delete q.altBgOpacity;
            delete q.altBorderOpacity;
            delete q.altBgColor;
            delete q.altBorderColor;
            delete q.altTextColor;
            // Opcional: Manter q.backgroundImage, q.questionLayout, q.answerLayout 
            // se o usuário quiser preservar as fotos mas com o novo estilo de cores/fontes.
            // Para total consistência como solicitado:
        });
        displayQuiz(state.generatedQuiz, state.currentConfig);
    }

    showStatus('✅ Estilo visual salvo com sucesso!', 'success');
    closeStyleModal();
}

function resetStyles() {
    if (confirm('Deseja restaurar o estilo padrão?')) {
        updateUIFromStyle(DEFAULT_CARD_STYLE);
        updateStylePreview();
    }
}

function updateStylePreview() {
    const previewStyles = getCurrentStyle();


    const layout = elements.cardPreviewLayoutSelect.value;
    const screenType = elements.cardPreviewScreenSelect.value;
    const alternativesCount = parseInt(elements.cardPreviewAlternativesSelect.value) || 4;
    const showAnswer = screenType === 'answer';
    const mockImageUrl = layout === 'image-right' ? 'https://m.media-amazon.com/images/I/81-C7B9AZFL.jpg' : '';

    // Create dynamic alternatives based on count
    const mockAlternatives = [];
    const letters = ['A', 'B', 'C', 'D', 'E'];
    for (let i = 0; i < alternativesCount; i++) {
        let text = `Alternativa ${letters[i]}`;
        if (i === 1) text += ' (Correta)';
        mockAlternatives.push(text);
    }

    // Create a mock question for preview
    const mockQuestion = {
        number: 1,
        statement: 'Este é um exemplo de como sua pergunta aparecerá no vídeo.',
        alternatives: mockAlternatives,
        correctAnswer: mockAlternatives[1], // Alternativa B is always correct in preview
        justification: 'Esta é a explicação que aparece na tela de resposta. O estilo aqui é controlado pela seção de Justificativa.',
        questionLayout: layout,
        questionImageUrl: mockImageUrl,
        answerLayout: layout,
        answerImageUrl: mockImageUrl
    };

    const card = createExportCard(mockQuestion, showAnswer, previewStyles, elements.languageSelect.value);
    elements.cardPreviewWrapper.innerHTML = '';
    elements.cardPreviewWrapper.appendChild(card);

    // REAL-TIME PROPAGATION TO ALL GENERATED CARDS
    if (state.generatedQuiz) {
        const cards = document.querySelectorAll('.question-card-wrapper');
        cards.forEach(card => {
            // Update corner radius variables
            card.style.setProperty('--radius-num', `${previewStyles.radiusNumber}px`);
            card.style.setProperty('--radius-alt', `${previewStyles.radiusAlternatives}px`);
            card.style.setProperty('--alt-width', `${previewStyles.widthAlternatives}%`);
            card.style.setProperty('--radius-just', `${previewStyles.radiusJustification}px`);
            card.style.setProperty('--just-width', `${previewStyles.widthJustification}%`);

            // Propagate other global styles
            card.style.setProperty('--alt-bg-opacity', previewStyles.globalAltBgOpacity);
            card.style.setProperty('--alt-border-opacity', previewStyles.globalAltBorderOpacity);
            const altBgRgb = hexToRgbComponents(previewStyles.globalAltBgColor);
            const altBorderRgb = hexToRgbComponents(previewStyles.globalAltBorderColor);
            card.style.setProperty('--alt-bg-rgb', altBgRgb);
            card.style.setProperty('--alt-border-rgb', altBorderRgb);

            card.style.setProperty('--color-primary', previewStyles.colorPrimary);
            card.style.setProperty('--color-accent', previewStyles.colorAccent);
            card.style.setProperty('--card-bg-custom', previewStyles.colorCardBg);
            card.style.setProperty('--color-text-num', previewStyles.colorTextNumber);
            card.style.setProperty('--color-text-q', previewStyles.colorTextQuestion);
            card.style.setProperty('--color-text-alt', previewStyles.colorTextAlternatives);
            card.style.setProperty('--color-text-just', previewStyles.colorTextJustification);
            card.style.setProperty('--color-correct', previewStyles.colorCorrect);
            card.style.setProperty('--color-correct-border', previewStyles.colorCorrectBorder);
            card.style.setProperty('--color-just-bg', previewStyles.colorJustificationBg);
            card.style.setProperty('--color-just-border', previewStyles.colorJustificationBorder);

            // Propagate font families
            card.style.setProperty('--font-num', previewStyles.fontFamilyNumber);
            card.style.setProperty('--font-q', previewStyles.fontFamilyQuestion);
            card.style.setProperty('--font-alt', previewStyles.fontFamilyAlternatives);
            card.style.setProperty('--font-just', previewStyles.fontFamilyJustification);

            const scaleNum = (previewStyles.fontSizeNumber || 100) / 100;
            const scaleQ = (previewStyles.fontSizeQuestion || 100) / 100;
            const scaleAlt = (previewStyles.fontSizeAlternatives || 100) / 100;
            const scaleJust = (previewStyles.fontSizeJustification || 100) / 100;

            card.style.setProperty('--font-size-num', `${13 * scaleNum}px`);
            card.style.setProperty('--font-size-q', `${17 * scaleQ}px`);
            card.style.setProperty('--font-size-alt', `${11 * scaleAlt}px`);
            card.style.setProperty('--font-size-just', `${11 * scaleJust}px`);

            // Propagate Vertical Position (Y-Offsets)
            card.style.setProperty('--y-offset-num', `${previewStyles.yOffsetNumber}px`);
            card.style.setProperty('--y-offset-q', `${previewStyles.yOffsetQuestion}px`);
            card.style.setProperty('--y-offset-alt', `${previewStyles.yOffsetAlternatives}px`);
            card.style.setProperty('--y-offset-alt-img', `${previewStyles.yOffsetAlternativesImage}px`);
            card.style.setProperty('--y-offset-just', `${previewStyles.yOffsetJustification}px`);
            card.style.setProperty('--y-offset-img', `${previewStyles.yOffsetImage}px`);

            // Propagate layout class
            if (previewStyles.layout === 'image-right') {
                card.classList.add('layout-image-right');
            } else if (previewStyles.layout === 'default') {
                // If global is default, we could either remove it or keep individual. 
                // But for "global sync" feel, we usually follow the global choice.
                card.classList.remove('layout-image-right');
            }

            // Update Fio visibility and properties
            let fio = card.querySelector('.card-fio');
            if (previewStyles.fioVisible) {
                if (!fio) {
                    fio = document.createElement('div');
                    fio.className = 'card-fio';
                    card.insertBefore(fio, card.firstChild);
                }
                fio.style.opacity = '1';
                card.style.setProperty('--fio-color', previewStyles.fioColor);
                card.style.setProperty('--radius-fio', `${previewStyles.radiusFio}px`);
                card.style.setProperty('--fio-offset', `${previewStyles.fioOffset}px`);
                card.style.setProperty('--fio-top', `${previewStyles.fioOffset}px`);
                card.style.setProperty('--fio-left', `${previewStyles.fioOffset}px`);
                card.style.setProperty('--fio-right', `${previewStyles.fioOffset}px`);
                card.style.setProperty('--fio-bottom', `${previewStyles.fioOffset}px`);
                card.style.setProperty('--fio-thickness', `${previewStyles.fioThickness}px`);
            } else if (fio) {
                fio.style.opacity = '0';
            }
        });
    }
}

// ===================================
// API CONFIGURATION
// ===================================
function saveApiConfiguration() {
    const model = elements.modelSelect.value;
    const provider = elements.imageProviderSelect.value;

    localStorage.setItem('openai_model', model);
    localStorage.setItem('image_provider', provider);

    state.model = model;
    state.imageProvider = provider;

    showStatus('Configuração salva com sucesso!', 'success');
    closeSettings();
}

// ===================================
// QUIZ GENERATION
// ===================================
async function generateQuiz() {
    const theme = elements.themeInput.value.trim();
    if (!theme) {
        showStatus('Por favor, insira um tema para o quiz', 'error');
        return;
    }

    const numQuestions = parseInt(elements.numQuestionsInput.value);
    if (numQuestions < 5 || numQuestions > 100) {
        showStatus('O número de questões deve estar entre 5 e 100', 'error');
        return;
    }

    // Prepare quiz configuration
    const config = {
        language: elements.languageSelect.value,
        theme: theme,
        difficulty: elements.difficultySelect.value,
        format: elements.formatSelect.value,
        numQuestions: numQuestions,
        numAlternatives: parseInt(elements.numAlternativesSelect.value),
        details: elements.detailsTextarea.value.trim()
    };

    // Set loading state
    state.isGenerating = true;
    elements.generateQuizBtn.disabled = true;
    elements.generateQuizBtn.innerHTML = '<span class="loading-spinner"></span> Gerando Quiz...';

    try {
        showStatus('🤖 Gerando quiz com IA... Isso pode levar alguns momentos.', 'success');

        const quiz = await callOpenAI(config);

        // Sanitize strings
        quiz.title = (quiz.title || '').trim();
        quiz.introduction = (quiz.introduction || '').trim();
        quiz.questions.forEach(q => {
            q.statement = (q.statement || '').trim();
            q.justification = (q.justification || '').trim();
            q.alternatives = q.alternatives.map(a => (a || '').trim());
            q.correctAnswer = (q.correctAnswer || '').trim();
        });

        state.generatedQuiz = quiz;
        state.currentConfig = config;

        displayQuiz(quiz, config);
        showStatus('✅ Quiz gerado com sucesso!', 'success');

    } catch (error) {
        console.error('Error generating quiz:', error);
        showStatus(`❌ Erro ao gerar quiz: ${error.message}`, 'error');
    } finally {
        state.isGenerating = false;
        elements.generateQuizBtn.disabled = false;
        elements.generateQuizBtn.innerHTML = '✨ Gerar Quiz';
        checkAuth(); // Refresh credits
    }
}

// ===================================
// OPENAI API INTEGRATION
// ===================================
async function callOpenAI(config) {
    const systemPrompt = buildSystemPrompt(config);
    const userPrompt = buildUserPrompt(config);

    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: state.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro na API OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return JSON.parse(content);
}

function buildSystemPrompt(config) {
    const language = config.language || 'Português';

    return `Você é um especialista em criar quizzes educacionais estruturados para vídeos.

OBJETIVO CRÍTICO: Todo o conteúdo gerado DEVE estar no idioma: ${language}.

MISSÃO: Criar quizzes focados em memorização, desafio cognitivo, retenção de audiência, aprendizado progressivo e clareza absoluta no idioma ${language}.

REGRAS OBRIGATÓRIAS:

1. FORMATO DE RESPOSTA:
   - Responda APENAS com JSON válido
   - Estrutura: { "title": "...", "introduction": "...", "questions": [...] }
   - TODOS os valores de texto devem estar em ${language}.

2. TÍTULO DO QUIZ:
   - Formato (traduzido para ${language}): "[Palavra para Quiz] [NÚMERO] [TEMA] – [ÁREA] | [Palavra para Nível] [DIFICULDADE]"
   - Exemplo (em Português): "Quiz 20 Capitais da Europa – Geografia | Nível Difícil"
   - Adapte os termos "Quiz" e "Nível" para o idioma ${language}.

3. INTRODUÇÃO NARRADA (obrigatória em ${language}):
   - Explicar quantas perguntas o desafio terá
   - Como o participante deve jogar
   - Que é um desafio de memória e conhecimento
   - Use um tom convidativo e profissional no idioma ${language}.

4. ESTRUTURA DE CADA QUESTÃO (Todos os campos em ${language}):
   {
     "number": 1,
     "statement": "Pergunta clara e direta",
     "questionImagePrompt": "SEARCH TERM (Question): Use the EXACT NAME or Keyword in ENGLISH (Ex: 'Brazil', 'Mickey Mouse', 'Chair'). If the character/subject repeats in the quiz, REPEAT THE SEARCH TERM exactly. Always use ENGLISH.",
     "alternatives": ["A) ...", "B) ...", "C) ...", "D) ..."],
     "correctAnswer": "A) ...",
     "answerImagePrompt": "SEARCH TERM (Answer): Always in ENGLISH. 1 or 2 keywords. Ex: 'Eiffel Tower', 'Lion', 'Albert Einstein'.",
     "justification": "Explicação breve e educativa em ${language}",
     "narrative": "Texto para locução da questão, narrando enunciado, alternativas e resposta, tudo em ${language}"
   }

5. QUALIDADE DAS QUESTÕES:
   - Enunciado simples e direto
   - Alternativas plausíveis (não óbvias)
   - Apenas uma correta
   - Alternar posição da resposta correta
   - Linguagem neutra no idioma ${language}
   - Tom calmo, claro, educativo e desafiador

6. FEEDBACK:
   - Sempre mostrar claramente a resposta correta
   - Reforçar o aprendizado em ${language}
   - Adicionar curiosidade curta quando relevante

7. O QUE NÃO FAZER:
   - Não transformar em aula
   - Não explicar excessivamente
   - Não fugir do tema
   - Não usar linguagem vaga
   - Nunca professoral ou infantil
   - CRÍTICO: A imagem da pergunta (questionImagePrompt) NUNCA deve revelar a resposta correta.
   
8. NÍVEIS DE DIFICULDADE (Siga rigorosamente):
   - Iniciante: Perguntas diretas, fato isolado, resposta óbvia para quem conhece o básico.
   - Básico: Conhecimento comum, exige memória simples e leve atenção.
   - Intermediário: Requer comparação, datas, relações ou pequenas inferências. Não é só decorar.
   - Avançado: Exige contexto, perguntas interpretativas, múltiplos conceitos (causa/consequência).
   - Especialista: Conhecimento técnico, termos específicos, exceções. Exige domínio real.
   - Mestre: Questões com "pegadinhas" justas, inferência alta, conexões indiretas, raciocínio estratégico.
   - Extremo / Desafio Supremo: Quase acadêmico, paradoxos, comparações históricas/filosóficas complexas.`;
}

function buildUserPrompt(config) {
    let prompt = `Crie um quiz com as seguintes especificações:

IDIOMA DE SAÍDA: ${config.language} (IMPORTANTE: Todo o texto gerado deve estar neste idioma)
TEMA: ${config.theme} (Se o tema estiver em outro idioma, traduza para ${config.language})
NÍVEL DE DIFICULDADE: ${config.difficulty} (Traduza este nível para o idioma ${config.language})
FORMATO: ${config.format} (Traduza este formato para o idioma ${config.language})
NÚMERO DE QUESTÕES: ${config.numQuestions}
NÚMERO DE ALTERNATIVAS: ${config.numAlternatives}`;

    if (config.details) {
        prompt += `\nDETALHES ADICIONAIS: ${config.details} (Considere estes detalhes e traduza conforme necessário)`;
    }

    prompt += `\n\nGere o quiz completo em formato JSON seguindo EXATAMENTE a estrutura especificada no prompt do sistema, garantindo que NENHUMA parte do conteúdo (título, intro, perguntas, alternativas, justificativa, narrativa) permaneça em Português se o idioma solicitado for outro.`;

    return prompt;
}

// ===================================
// DISPLAY QUIZ
// ===================================
const i18n = {
    'Português': {
        question: 'Questão',
        pergunta: 'Pergunta',
        csv: ['Número', 'Enunciado', 'Prompt Imagem Enunciado', 'Alternativas', 'Resposta Correta', 'Prompt Imagem Resposta', 'Justificativa', 'Narrativa']
    },
    'English': {
        question: 'Question',
        pergunta: 'Problem',
        csv: ['Number', 'Statement', 'Question Image Prompt', 'Alternatives', 'Correct Answer', 'Answer Image Prompt', 'Justification', 'Narrative']
    },
    'Español': {
        question: 'Pregunta',
        pergunta: 'Cuestión',
        csv: ['Número', 'Enunciado', 'Prompt Imagen Enunciado', 'Alternativas', 'Respuesta Correcta', 'Prompt Imagen Respuesta', 'Justificación', 'Narrativa']
    },
    'Français': {
        question: 'Question',
        pergunta: 'Problème',
        csv: ['Numéro', 'Énoncé', 'Prompt Image Énoncé', 'Alternatives', 'Réponse Correcte', 'Prompt Image Réponse', 'Justification', 'Narrative']
    },
    'Deutsch': {
        question: 'Frage',
        pergunta: 'Problem',
        csv: ['Nummer', 'Aussage', 'Promp Image Aussage', 'Alternativen', 'Richtige Antwort', 'Prompt Image Antwort', 'Begründung', 'Narrative']
    },
    'Italiano': {
        question: 'Domanda',
        pergunta: 'Problema',
        csv: ['Numero', 'Enunciato', 'Prompt Immagine Enunciato', 'Alternative', 'Risposta Corretta', 'Prompt Immagine Risposta', 'Giustificazione', 'Narrativa']
    },
    '日本語': {
        question: '質問',
        pergunta: '問題',
        csv: ['番号', '問題内容', '質問画像のプロンプト', '選択肢', '正解', '回答画像のプロンプト', '解説', 'ナレーション']
    },
    '中文': {
        question: '问题',
        pergunta: '题目',
        csv: ['编号', '题干', '题目图片提示词', '选项', '正确答案', '回答图片提示词', '解析', '解说词']
    }
};

function formatQuestionNumber(number, format, language) {
    if (format === 'none') return number;

    const lang = language || 'Português';
    const trans = i18n[lang] || i18n['Português'];
    const prefix = format === 'pergunta' ? trans.pergunta : trans.question;

    return `${prefix} ${number}`;
}

function displayQuiz(quiz, config = state.currentConfig) {
    // Update summary
    if (config && elements.quizSummary) {
        elements.quizSummary.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span>${quiz.questions.length} questões sobre ${config.theme || ''} - Nível ${config.difficulty || ''}</span>
                <button class="btn btn-secondary btn-sm" onclick="clearAllBackgrounds()" style="font-size: 12px; padding: 4px 12px; opacity: 0.8;">🗑️ Limpar Fundos</button>
            </div>
        `;
    }

    // Clear previous results
    elements.questionsContainer.innerHTML = '';

    // Create Anchor Navigation (logo abaixo do Layout Global)
    const navBar = document.createElement('div');
    navBar.className = 'quiz-anchor-nav';
    navBar.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin: 0 0 20px 0;
        padding: 10px;
        background: rgba(0,0,0,0.2);
        border-radius: 8px;
        border: 1px solid var(--glass-border);
    `;

    quiz.questions.forEach((_, index) => {
        const link = document.createElement('button');
        link.className = 'btn btn-sm btn-secondary';
        link.textContent = index + 1;
        link.style.cssText = `
            min-width: 30px;
            padding: 2px 6px;
            font-size: 0.8rem;
        `;
        link.onclick = () => {
            const card = document.querySelector(`.question-card-wrapper[data-question-index="${index}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Visual highlight effect
                card.style.transition = 'box-shadow 0.3s';
                card.style.boxShadow = '0 0 0 2px var(--color-primary)';
                setTimeout(() => card.style.boxShadow = '', 1500);
            }
        };
        navBar.appendChild(link);
    });

    elements.questionsContainer.appendChild(navBar);

    // Display introduction
    const introCard = document.createElement('div');
    introCard.className = 'question-card';
    introCard.innerHTML = `
        <h3 style="color: var(--color-primary-light); margin-bottom: var(--space-md);">
            ${quiz.title || 'Quiz'}
        </h3>
        <p style="color: var(--text-secondary); font-size: var(--font-size-lg); line-height: 1.8;">
            ${quiz.introduction || ''}
        </p>
    `;
    elements.questionsContainer.appendChild(introCard);


    quiz.questions.forEach((question, index) => {
        const questionCard = createQuestionCard(question, index, config?.language);
        elements.questionsContainer.appendChild(questionCard);
    });

    // Show results section
    elements.resultsSection.classList.remove('hidden');

    // Scroll to results
    // elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Ensure global layout buttons match the current style state
    const currentLayout = state.cardStyle.layout || 'default';
    const btnDefault = document.getElementById('globalLayoutDefault');
    const btnImageRight = document.getElementById('globalLayoutImageRight');
    if (btnDefault && btnImageRight) {
        if (currentLayout === 'default') {
            btnDefault.classList.add('active');
            btnImageRight.classList.remove('active');
        } else {
            btnDefault.classList.remove('active');
            btnImageRight.classList.add('active');
        }
    }
}

function handleLayoutChange(index, layout, type) {
    state.generatedQuiz.questions[index][`${type}Layout`] = layout;
    displayQuiz(state.generatedQuiz, state.currentConfig);
}

// ===================================
// BACKGROUND MANAGEMENT FUNCTIONS
// ===================================
function updateCardBackground(questionIndex) {
    const wrapper = document.querySelector(`.question-card-wrapper[data-question-index="${questionIndex}"]`);
    const input = wrapper.querySelector('.card-bg-input');
    input.click();
}

function handleCardBackgroundUpdate(questionIndex, input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageUrl = e.target.result;
            state.generatedQuiz.questions[questionIndex].backgroundImage = imageUrl;

            // Refresh the specific card or the whole quiz
            displayQuiz(state.generatedQuiz, state.currentConfig);
            showStatus('✅ Background atualizado com sucesso!', 'success');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function removeCardBackground(questionIndex) {
    const q = state.generatedQuiz.questions[questionIndex];
    delete q.backgroundImage;
    delete q.bgBrightness;
    delete q.bgOpacity;
    delete q.bgOverlayOpacity;
    displayQuiz(state.generatedQuiz, state.currentConfig);
    showStatus('✅ Background removido!', 'success');
}

function clearAllBackgrounds() {
    if (!state.generatedQuiz) return;

    if (confirm('Tem certeza que deseja remover TODOS os backgrounds individuais?')) {
        state.generatedQuiz.questions.forEach(q => {
            delete q.backgroundImage;
            delete q.bgBrightness;
            delete q.bgOpacity;
            delete q.bgOverlayOpacity;
        });
        displayQuiz(state.generatedQuiz, state.currentConfig);
        showStatus('✅ Todos os backgrounds foram removidos!', 'success');
    }
}
function applyGlobalLayout(layout) {
    if (!state.generatedQuiz || !state.currentConfig) return;

    state.generatedQuiz.questions.forEach(q => {
        q.questionLayout = layout;
        q.answerLayout = layout;
    });

    displayQuiz(state.generatedQuiz, state.currentConfig);

    const btnDefault = document.getElementById('globalLayoutDefault');
    const btnImageRight = document.getElementById('globalLayoutImageRight');

    // Update Master Style State to keep it in sync
    state.cardStyle.layout = layout;
    if (elements.cardPreviewLayoutSelect) {
        elements.cardPreviewLayoutSelect.value = layout;
    }
    localStorage.setItem('card_style', JSON.stringify(state.cardStyle));

    if (btnDefault && btnImageRight) {
        if (layout === 'default') {
            btnDefault.classList.add('active');
            btnImageRight.classList.remove('active');
        } else {
            btnDefault.classList.remove('active');
            btnImageRight.classList.add('active');
        }
    }
    const layoutLabel = layout === 'default' ? 'Padrão' : 'Imagem à Direita';
    showStatus(`✅ Layout global atualizado para: ${layoutLabel}`, 'success');
}

function enableAIImages() {
    const confirmed = confirm("⚠️ Tem certeza de que quer habilitar geração de imagens por IA?\n\nIsso gera custos que podem ser altos em sua conta OpenAI ou Google.");

    if (confirmed) {
        state.aiImagesEnabled = true;
        if (state.generatedQuiz && state.currentConfig) {
            displayQuiz(state.generatedQuiz, state.currentConfig);
        }
        showStatus('🛡️ Geração de imagens por IA habilitada.', 'success');
    }
}

function createQuestionCard(question, index, language = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'question-card-wrapper';
    wrapper.dataset.questionIndex = index;

    const styles = state.cardStyle;
    const lang = language || state.currentConfig?.language || 'Português';
    const layout = question.questionLayout || 'default';
    const imageUrl = question.questionImageUrl;

    const formattedNumber = formatQuestionNumber(question.number, styles.numberFormat, lang);

    // Apply custom styles via CSS variables
    wrapper.style.setProperty('--radius-num', `${styles.radiusNumber}px`);
    wrapper.style.setProperty('--radius-alt', `${styles.radiusAlternatives}px`);
    wrapper.style.setProperty('--alt-width', `${styles.widthAlternatives}%`);
    wrapper.style.setProperty('--radius-just', `${styles.radiusJustification}px`);
    wrapper.style.setProperty('--just-width', `${styles.widthJustification}%`);

    wrapper.style.setProperty('--color-primary', styles.colorPrimary);
    wrapper.style.setProperty('--color-accent', styles.colorAccent);
    wrapper.style.setProperty('--card-bg-custom', styles.colorCardBg);
    wrapper.style.setProperty('--color-text-num', styles.colorTextNumber);
    wrapper.style.setProperty('--color-text-q', styles.colorTextQuestion);
    wrapper.style.setProperty('--color-text-alt', styles.colorTextAlternatives);
    wrapper.style.setProperty('--color-text-just', styles.colorTextJustification);
    wrapper.style.setProperty('--color-correct', styles.colorCorrect);
    wrapper.style.setProperty('--color-correct-border', styles.colorCorrectBorder);
    wrapper.style.setProperty('--color-just-bg', styles.colorJustificationBg);
    wrapper.style.setProperty('--color-just-border', styles.colorJustificationBorder);

    wrapper.style.setProperty('--font-num', styles.fontFamilyNumber);
    wrapper.style.setProperty('--font-q', styles.fontFamilyQuestion);
    wrapper.style.setProperty('--font-alt', styles.fontFamilyAlternatives);
    wrapper.style.setProperty('--font-just', styles.fontFamilyJustification);

    const scaleNum = (styles.fontSizeNumber || 100) / 100;
    const scaleQ = (styles.fontSizeQuestion || 100) / 100;
    const scaleAlt = (styles.fontSizeAlternatives || 100) / 100;
    const scaleJust = (styles.fontSizeJustification || 100) / 100;

    wrapper.style.setProperty('--font-size-num', `${13 * scaleNum}px`);
    wrapper.style.setProperty('--font-size-q', `${17 * scaleQ}px`);
    wrapper.style.setProperty('--font-size-alt', `${11 * scaleAlt}px`);
    wrapper.style.setProperty('--font-size-just', `${11 * scaleJust}px`);

    // Vertical Position (Y-Offsets)
    wrapper.style.setProperty('--y-offset-num', `${styles.yOffsetNumber}px`);
    wrapper.style.setProperty('--y-offset-q', `${styles.yOffsetQuestion}px`);
    wrapper.style.setProperty('--y-offset-alt', `${styles.yOffsetAlternatives}px`);
    wrapper.style.setProperty('--y-offset-alt-img', `${styles.yOffsetAlternativesImage}px`);
    wrapper.style.setProperty('--y-offset-just', `${styles.yOffsetJustification}px`);
    wrapper.style.setProperty('--y-offset-img', `${styles.yOffsetImage}px`);

    // Background Image & Overlay
    const bgImage = question.backgroundImage || styles.bgImage;
    let backgroundHTML = '';
    if (bgImage) {
        const isIndividual = !!question.backgroundImage;
        const bgOpacity = question.bgOpacity ?? (isIndividual ? 1.0 : (styles.bgImageOpacity || 1.0));
        const bgBrightness = question.bgBrightness ?? 1.0;
        const bgOverlayOpacity = question.bgOverlayOpacity ?? styles.bgOpacity;

        backgroundHTML = `
            <div class="card-bg-image" style="background-image: url('${bgImage}'); opacity: ${bgOpacity}; filter: brightness(${bgBrightness});"></div>
            <div class="card-bg-overlay" style="background-color: rgba(0,0,0,${bgOverlayOpacity});"></div>
        `;
    }

    const alternativesList = question.alternatives
        .map((alt, idx) => {
            const isCorrect = alt === question.correctAnswer;
            return `<div class="export-card-alternative ${isCorrect ? 'correct' : ''}" data-alt-index="${idx}">${alt}</div>`;
        })
        .join('');

    const globalLayout = styles.layout || 'default';
    const activeLayout = globalLayout;

    wrapper.innerHTML = `
        <div class="question-controls">
            <div class="control-group">
                <button class="btn-control" onclick="updateCardBackground(${index})" title="Trocar fundo deste card">🖼️ Fundo</button>
                ${question.backgroundImage ? `<button class="btn-control" onclick="removeCardBackground(${index})" title="Remover fundo individual">🗑️ Fundo</button>` : ''}
                <input type="file" class="card-bg-input" accept="image/*" style="display: none;" onchange="handleCardBackgroundUpdate(${index}, this)">
            </div>
            <div class="control-group">
                <button class="btn-control" onclick="updateCardImage(${index})" title="Trocar imagem lateral">🔄 Imagem</button>
                <input type="file" class="card-image-input" accept="image/*" style="display: none;" onchange="handleCardImageUpdate(${index}, this)">
            </div>
            <div class="control-group">
                <button class="btn-control btn-regenerate" onclick="openRegenerateModal(${index})" title="Regenerar questão com IA" style="background: rgba(255, 150, 0, 0.2); color: #ffad33; border: 1px solid rgba(255, 150, 0, 0.3);">⚡ Regenerar</button>
            </div>
            <div class="control-group">
                <button class="btn-control btn-toggle-answer" onclick="toggleAnswer(${index})">👁️ Resposta</button>
                <button class="btn-control btn-edit-toggle" onclick="toggleEditMode(${index})">✏️ Editar</button>
            </div>

            <div class="control-group">
                <button class="btn-control" onclick="exportIsolatedQuestion(${index})" title="Exportar apenas esta questão como PNG">📥 Q</button>
                <button class="btn-control" onclick="exportIsolatedAnswer(${index})" title="Exportar apenas esta resposta como PNG">📥 R</button>
            </div>
            
            <!-- Ajustes em Tempo Real (Fora da Edição) -->
            <div class="control-group" style="margin-left: auto; border-left: 1px solid var(--glass-border); padding-left: var(--space-sm); display: flex; flex-direction: column; gap: 4px; min-width: 440px;">
                <!-- Linha 1: Background -->
                <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                    <div style="font-size: 10px; color: var(--color-primary-light); font-weight: 700; width: 45px; flex-shrink: 0;">FUNDO:</div>
                    <div style="display: flex; flex-grow: 1; gap: 10px; justify-content: space-between;">
                        <div class="form-group" style="gap: 1px; flex-direction: row; align-items: center;">
                            <label style="font-size: 9px; color: var(--text-tertiary); width: 42px;">Brilho (<span class="bg-brightness-value">${question.bgBrightness || 1.0}</span>)</label>
                            <input type="range" class="edit-bg-brightness" min="0.2" max="2.0" step="0.1" value="${question.bgBrightness || 1.0}" 
                                   oninput="updateRealTimeStyle(${index}, 'fundo', 'bgBrightness', this.value)" style="width: 45px; height: 3px;">
                        </div>
                        <div class="form-group" style="gap: 1px; flex-direction: row; align-items: center;">
                            <label style="font-size: 9px; color: var(--text-tertiary); width: 42px;">Opac. (<span class="bg-opacity-value">${question.bgOpacity ?? (question.backgroundImage ? 1.0 : (styles.bgImageOpacity || 1.0))}</span>)</label>
                            <input type="range" class="edit-bg-opacity" min="0" max="1.0" step="0.1" value="${question.bgOpacity ?? (question.backgroundImage ? 1.0 : (styles.bgImageOpacity || 1.0))}" 
                                   oninput="updateRealTimeStyle(${index}, 'fundo', 'bgOpacity', this.value)" style="width: 45px; height: 3px;">
                        </div>
                        <div class="form-group" style="gap: 1px; flex-direction: row; align-items: center;">
                            <label style="font-size: 9px; color: var(--text-tertiary); width: 42px;">Overlay (<span class="bg-overlay-value">${question.bgOverlayOpacity ?? styles.bgOpacity}</span>)</label>
                            <input type="range" class="edit-bg-overlay" min="0" max="1.0" step="0.1" value="${question.bgOverlayOpacity ?? styles.bgOpacity}" 
                                   oninput="updateRealTimeStyle(${index}, 'fundo', 'bgOverlayOpacity', this.value)" style="width: 45px; height: 3px;">
                        </div>
                    </div>
                </div>
                <!-- Linha 2: Boxes das Alternativas -->
                <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                    <div style="font-size: 10px; color: var(--color-accent); font-weight: 700; width: 45px; flex-shrink: 0;">ALTS:</div>
                    <div style="display: flex; flex-grow: 1; gap: 10px; justify-content: flex-start; align-items: center;">
                        <div class="form-group" style="gap: 1px; flex-direction: row; align-items: center;">
                            <label style="font-size: 9px; color: var(--text-tertiary); width: 35px;">Fundo (<span class="alt-bg-opacity-value">${question.altBgOpacity ?? styles.globalAltBgOpacity ?? 0.05}</span>)</label>
                            <input type="range" class="edit-alt-bg-opacity" min="0" max="1.0" step="0.05" value="${question.altBgOpacity ?? styles.globalAltBgOpacity ?? 0.05}" 
                                   oninput="updateRealTimeStyle(${index}, 'alts', 'altBgOpacity', this.value)" style="width: 45px; height: 3px;">
                        </div>
                        <div class="form-group" style="gap: 1px; flex-direction: row; align-items: center;">
                            <label style="font-size: 9px; color: var(--text-tertiary); width: 35px;">Borda (<span class="alt-border-opacity-value">${question.altBorderOpacity ?? styles.globalAltBorderOpacity ?? 0.1}</span>)</label>
                            <input type="range" class="edit-alt-border-opacity" min="0" max="1.0" step="0.05" value="${question.altBorderOpacity ?? styles.globalAltBorderOpacity ?? 0.1}" 
                                   oninput="updateRealTimeStyle(${index}, 'alts', 'altBorderOpacity', this.value)" style="width: 45px; height: 3px;">
                        </div>
                        <div class="form-group" style="gap: 3px; flex-direction: row; align-items: center;">
                            <label style="font-size: 9px; color: var(--text-tertiary);">Box:</label>
                            <input type="color" class="edit-alt-bg-color" value="${question.altBgColor || styles.globalAltBgColor || '#ffffff'}" 
                                   oninput="updateRealTimeStyle(${index}, 'alts', 'altBgColor', this.value)" style="width: 16px; height: 16px; padding: 0; border: 1px solid var(--glass-border); background: none; cursor: pointer;">
                        </div>
                        <div class="form-group" style="gap: 3px; flex-direction: row; align-items: center;">
                            <label style="font-size: 9px; color: var(--text-tertiary);">Borda:</label>
                            <input type="color" class="edit-alt-border-color" value="${question.altBorderColor || styles.globalAltBorderColor || '#ffffff'}" 
                                   oninput="updateRealTimeStyle(${index}, 'alts', 'altBorderColor', this.value)" style="width: 16px; height: 16px; padding: 0; border: 1px solid var(--glass-border); background: none; cursor: pointer;">
                        </div>
                        <div class="form-group" style="gap: 3px; flex-direction: row; align-items: center;">
                            <label style="font-size: 9px; color: var(--text-tertiary);">Fonte:</label>
                            <input type="color" class="edit-alt-text-color" value="${question.altTextColor || styles.colorTextAlternatives}" 
                                   oninput="updateRealTimeStyle(${index}, 'alts', 'altTextColor', this.value)" style="width: 16px; height: 16px; padding: 0; border: 1px solid var(--glass-border); background: none; cursor: pointer;">
                        </div>
                    </div>
                </div>
            </div>
            <!-- Global Sync Checkbox -->
            <div class="control-group" style="padding-left: var(--space-sm); border-left: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; min-width: 40px;">
                <input type="checkbox" class="sync-global-checkbox" ${state.sync_global ? 'checked' : ''} onchange="toggleGlobalSync(this.checked, ${index})" 
                       title="Sincronização GLOBAL: Qualquer alteração afetará todos os cards ignorando travas individuais" 
                       style="cursor: pointer; width: 22px; height: 22px; accent-color: var(--color-primary);">
            </div>
        </div>

        <div class="question-card ui-card-clone ${activeLayout === 'image-right' ? 'layout-image-right' : ''}" 
             style="--color-primary: ${styles.colorPrimary}; 
                    --color-accent: ${styles.colorAccent}; 
                    --card-bg-custom: ${styles.colorCardBg};
                    --font-num: ${styles.fontFamilyNumber || "'Inter', sans-serif"};
                    --font-q: ${styles.fontFamilyQuestion || "'Inter', sans-serif"};
                    --font-alt: ${styles.fontFamilyAlternatives || "'Inter', sans-serif"};
                    --font-just: ${styles.fontFamilyJustification || "'Inter', sans-serif"};
                    --font-size-num: ${13 * scaleNum}px;
                    --font-size-q: ${17 * scaleQ}px;
                    --font-size-alt: ${11 * scaleAlt}px;
                    --font-size-just: ${11 * scaleJust}px;
                    --color-text-num: ${styles.colorTextNumber};
                    --color-text-q: ${styles.colorTextQuestion};
                    --color-text-alt: ${question.altTextColor || styles.colorTextAlternatives};
                    --color-text-just: ${styles.colorTextJustification || '#ffffff'};
                    --color-correct: ${styles.colorCorrect || '#22c55e'};
                    --color-correct-border: ${styles.colorCorrectBorder || styles.colorCorrect || '#22c55e'};
                    --color-just-bg: ${styles.colorJustificationBg || '#166534'};
                    --color-just-border: ${styles.colorJustificationBorder || '#22c55e'};
                    --radius-num: ${styles.radiusNumber ?? 15}px;
                    --radius-alt: ${styles.radiusAlternatives ?? 20}px;
                    --alt-width: ${styles.widthAlternatives ?? 100}%;
                    --radius-just: ${styles.radiusJustification ?? 20}px;
                    --just-width: ${styles.widthJustification ?? 100}%;
                    --fio-color: ${styles.fioColor || '#ffffff'};
                    --radius-fio: ${styles.radiusFio ?? 20}px;
                    --fio-offset: ${styles.fioOffset ?? 30}px;
                    --fio-top: ${styles.fioOffset ?? 30}px;
                    --fio-left: ${styles.fioOffset ?? 30}px;
                    --fio-right: ${styles.fioOffset ?? 30}px;
                    --fio-bottom: ${styles.fioOffset ?? 30}px;
                    --fio-thickness: ${styles.fioThickness ?? 4}px;
                    --alt-bg-opacity: ${question.altBgOpacity ?? styles.globalAltBgOpacity ?? 0.05};
                    --alt-border-opacity: ${question.altBorderOpacity ?? styles.globalAltBorderOpacity ?? 0.1};
                    --alt-bg-rgb: ${hexToRgbComponents(question.altBgColor || styles.globalAltBgColor || '#ffffff')};
                    --alt-border-rgb: ${hexToRgbComponents(question.altBorderColor || styles.globalAltBorderColor || '#ffffff')};
                    --y-offset-num: ${styles.yOffsetNumber ?? 0}px;
                    --y-offset-q: ${styles.yOffsetQuestion ?? 0}px;
                    --y-offset-alt: ${styles.yOffsetAlternatives ?? 0}px;
                    --y-offset-alt-img: ${styles.yOffsetAlternativesImage ?? 0}px;
                    --y-offset-just: ${styles.yOffsetJustification ?? 0}px;
                    --y-offset-img: ${styles.yOffsetImage ?? 0}px;">
            
            ${backgroundHTML}
            ${styles.fioVisible ? `<div class="card-fio" style="opacity: 1;"></div>` : ''}
            
            <div class="export-card-content">
                <div class="export-card-header">
                    <div class="export-card-number">${formattedNumber}</div>
                </div>
                
                <div class="export-card-main-content">
                    <div class="export-card-text-content">
                        <div class="export-card-question">${question.statement}</div>
                        <div class="export-card-alternatives">
                            ${alternativesList}
                        </div>
                        ${(elements.narrativeJustificationFormatSelect.value === 'both' || elements.narrativeJustificationFormatSelect.value === 'print-only') ? `
                        <div class="answer-section-ui hidden">
                            <div class="export-card-justification" style="text-align: center !important; word-spacing: normal !important; white-space: normal !important;">${cleanText(question.justification)}</div>
                        </div>` : ''}
                    </div>
                    
                    ${layout === 'image-right' && imageUrl ? `
                        <div class="export-card-image-container">
                            <img src="${imageUrl}" alt="Imagem" class="export-card-image">
                        </div>
                    ` : layout === 'image-right' ? `
                        <div class="export-card-image-container">
                            <div class="image-placeholder">Sem imagem</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <div class="question-edit-mode hidden">
            <!-- Edit mode structure remains unchanged for functional purposes -->
            <div class="form-group">
                <label class="form-label">Pergunta</label>
                <textarea class="form-textarea edit-question" rows="3">${question.statement}</textarea>
            </div>

        <div class="form-group">
            <label class="form-label">Alternativas</label>
            ${question.alternatives.map((alt, idx) => `
                    <input type="text" class="form-input edit-alternative" data-alt-index="${idx}" value="${alt}" style="margin-bottom: var(--space-xs);">
                `).join('')}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div class="settings-column">
                <h4 style="margin-bottom: var(--space-sm); color: var(--primary-light);">🖼️ Imagem da Pergunta</h4>
                <div class="form-group">
                    <label class="form-label">Layout</label>
                    <select class="form-select edit-question-layout" onchange="handleLayoutChange(${index}, this.value, 'question')">
                        <option value="default" ${!question.questionLayout || question.questionLayout === 'default' ? 'selected' : ''}>Padrão (sem imagem)</option>
                        <option value="image-right" ${question.questionLayout === 'image-right' ? 'selected' : ''}>Imagem à Direita</option>
                    </select>
                </div>

                <div class="image-section ${!question.questionLayout || question.questionLayout === 'default' ? 'hidden' : ''}" id="imageSectionQuestion${index}">
                    <div class="form-group">
                        <div class="image-preview-container question-preview-container">
                            ${question.questionImageUrl ? `<img src="${question.questionImageUrl}" alt="Preview" class="image-preview question-preview">` : '<div class="image-placeholder">Sem imagem</div>'}
                        </div>
                        <div class="form-group">
                            <label class="form-label">Termo de Busca/Prompt (Pergunta)</label>
                            <textarea class="form-textarea edit-question-image-prompt" rows="2" placeholder="Descreva a imagem para a pergunta...">${question.questionImagePrompt || ''}</textarea>
                        </div>
                        <div class="btn-group">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="uploadImage(${index}, 'question')">📁 Upload</button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="openGoogleImageSearch(${index}, 'question')">🔍 Busca Google</button>
                            <button type="button" class="btn btn-primary btn-sm" onclick="generateImageWithIA(${index}, 'question')" ${!state.aiImagesEnabled ? 'disabled' : ''}>🎨 Gerar IA</button>
                            ${!state.aiImagesEnabled ? `<button type="button" class="btn btn-secondary btn-sm" onclick="enableAIImages()">🔓 Habilitar</button>` : ''}
                            ${question.questionImageUrl ? `<button type="button" class="btn btn-secondary btn-sm" onclick="removeImage(${index}, 'question')">🗑️</button>` : ''}
                        </div>
                        <input type="file" id="imageUploadQuestion${index}" accept="image/*" style="display: none;" onchange="handleImageUpload(${index}, this, 'question')">
                    </div>
                </div>
            </div>

            <div class="settings-column">
                <h4 style="margin-bottom: var(--space-sm); color: var(--success);">🖼️ Imagem da Resposta</h4>
                <div class="form-group">
                    <label class="form-label">Layout</label>
                    <select class="form-select edit-answer-layout" onchange="handleLayoutChange(${index}, this.value, 'answer')">
                        <option value="default" ${!question.answerLayout || question.answerLayout === 'default' ? 'selected' : ''}>Padrão (sem imagem)</option>
                        <option value="image-right" ${question.answerLayout === 'image-right' ? 'selected' : ''}>Imagem à Direita</option>
                    </select>
                </div>

                <div class="image-section ${!question.answerLayout || question.answerLayout === 'default' ? 'hidden' : ''}" id="imageSectionAnswer${index}">
                    <div class="form-group">
                        <div class="image-preview-container answer-preview-container">
                            ${question.answerImageUrl ? `<img src="${question.answerImageUrl}" alt="Preview" class="image-preview answer-preview">` : '<div class="image-placeholder">Sem imagem</div>'}
                        </div>
                        <div class="form-group">
                            <label class="form-label">Termo de Busca/Prompt (Resposta)</label>
                            <textarea class="form-textarea edit-answer-image-prompt" rows="2" placeholder="Descreva a imagem para a resposta...">${question.answerImagePrompt || ''}</textarea>
                        </div>
                        <div class="btn-group">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="uploadImage(${index}, 'answer')">📁 Upload</button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="openGoogleImageSearch(${index}, 'answer')">🔍 Busca Google</button>
                            <button type="button" class="btn btn-primary btn-sm" onclick="generateImageWithIA(${index}, 'answer')" ${!state.aiImagesEnabled ? 'disabled' : ''}>🎨 Gerar IA</button>
                            ${!state.aiImagesEnabled ? `<button type="button" class="btn btn-secondary btn-sm" onclick="enableAIImages()">🔓 Habilitar</button>` : ''}
                            ${question.answerImageUrl ? `<button type="button" class="btn btn-secondary btn-sm" onclick="removeImage(${index}, 'answer')">🗑️</button>` : ''}
                        </div>
                        <input type="file" id="imageUploadAnswer${index}" accept="image/*" style="display: none;" onchange="handleImageUpload(${index}, this, 'answer')">
                    </div>
                </div>
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Resposta Correta</label>
            <select class="form-select edit-correct-answer">
                ${question.alternatives.map((alt) => `
                        <option value="${alt}" ${alt === question.correctAnswer ? 'selected' : ''}>${alt}</option>
                    `).join('')}
            </select>
        </div>

        <div class="form-group">
            <label class="form-label">Justificativa</label>
            <textarea class="form-textarea edit-justification" rows="3">${question.justification}</textarea>
        </div>

        <div class="btn-group">
            <button class="btn btn-success" onclick="saveQuestion(${index})">💾 Salvar</button>
            <button class="btn btn-secondary" onclick="cancelEdit(${index})">❌ Cancelar</button>
        </div>
    </div>
    `;

    return wrapper;
}

// ===================================
// EXPORT FUNCTIONS
// ===================================
function exportToCSV() {
    if (!state.generatedQuiz) {
        showStatus('Nenhum quiz gerado para exportar', 'error');
        return;
    }

    const quiz = state.generatedQuiz;
    const lang = state.currentConfig?.language || 'Português';
    const headers = i18n[lang]?.csv || i18n['Português'].csv;

    let csv = headers.join(',') + '\n';

    quiz.questions.forEach(q => {
        const row = [
            q.number,
            `"${escapeCSV(q.statement.trim())}"`,
            `"${escapeCSV((q.questionImagePrompt || '').trim())}"`,
            `"${escapeCSV(q.alternatives.map(a => a.trim()).join('; '))}"`,
            `"${escapeCSV(q.correctAnswer.trim())}"`,
            `"${escapeCSV((q.answerImagePrompt || '').trim())}"`,
            `"${escapeCSV(q.justification.trim())}"`,
            `"${escapeCSV((q.narrative || '').trim())}"`
        ];
        csv += row.join(',') + '\n';
    });

    downloadFile(csv, 'quiz.csv', 'text/csv');
    showStatus('✅ Quiz exportado para CSV!', 'success');
}

function exportToJSON() {
    if (!state.generatedQuiz) {
        showStatus('Nenhum quiz gerado para exportar', 'error');
        return;
    }

    const json = JSON.stringify(state.generatedQuiz, null, 2);
    downloadFile(json, 'quiz.json', 'application/json');
    showStatus('✅ Quiz exportado para JSON!', 'success');
}

async function generateNarrative() {
    if (!state.generatedQuiz) {
        showStatus('Gere um quiz primeiro antes de criar a narrativa', 'error');
        return;
    }

    showStatus('🎙️ Gerando narrativa com IA... Isso pode levar alguns momentos.', 'success');
    elements.generateNarrativeBtn.disabled = true;

    try {
        const prompt = buildNarrativePrompt();
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: state.model,
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erro na API');
        }

        const narrativeData = JSON.parse(data.choices[0].message.content);

        // Store for production package export
        state.lastNarrativeData = narrativeData;

        exportToSRT(narrativeData);

        showStatus('✅ Narrativa gerada e exportada com sucesso!', 'success');
    } catch (error) {
        console.error('Narrative Generation Error:', error);
        showStatus(`❌ Erro ao gerar narrativa: ${error.message} `, 'error');
    } finally {
        elements.generateNarrativeBtn.disabled = false;
    }
}

// ===================================
// METADATA BACKUP AND RECOVERY
// ===================================
function exportMetadata() {
    if (!state.generatedQuiz) {
        showStatus('❌ Nenhum quiz para exportar', 'error');
        return;
    }

    try {
        const backup = {
            version: '1.2',
            timestamp: new Date().toISOString(),
            quiz: state.generatedQuiz,
            config: state.currentConfig,
            style: state.cardStyle,
            timing: state.timing
        };

        const json = JSON.stringify(backup, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `quiz_backup_${timestamp}.json`;

        downloadFile(json, filename, 'application/json');
        showStatus('✅ Backup exportado com sucesso!', 'success');
    } catch (error) {
        console.error('Export Metadata Error:', error);
        showStatus(`❌ Erro ao exportar backup: ${error.message} `, 'error');
    }
}

async function importMetadata(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showStatus('⏳ Importando backup...', 'info');

        const text = await file.text();
        const data = JSON.parse(text);

        let quizToRestore = null;

        // Detection: Backup Wrapper vs Raw Quiz
        if (data.version && data.quiz) {
            // Full Backup Format
            quizToRestore = data.quiz;
            if (data.config) state.currentConfig = data.config;
            if (data.style) {
                state.cardStyle = { ...state.cardStyle, ...data.style };
                updateUIFromStyle(state.cardStyle);
            }
            if (data.timing) state.timing = data.timing;
        } else if (data.questions && Array.isArray(data.questions)) {
            // Raw Quiz JSON Format
            quizToRestore = data;
        } else {
            throw new Error('Formato de arquivo não reconhecido');
        }

        // Restore quiz to state
        state.generatedQuiz = quizToRestore;

        // Ensure results section is visible BEFORE rendering to avoid layout issues
        elements.resultsSection.classList.remove('hidden');

        // Display the restored quiz
        displayQuiz(quizToRestore, state.currentConfig);

        showStatus(`✅ Backup importado com sucesso! (${quizToRestore.questions.length} questões)`, 'success');
        console.log('Quiz restored successfully:', quizToRestore);

        // Reset file input
        event.target.value = '';
    } catch (error) {
        console.error('Import Metadata Error:', error);
        showStatus(`❌ Erro ao importar backup: ${error.message} `, 'error');
    }
}

function buildNarrativePrompt() {
    const channelName = elements.channelNameInput.value.trim() || 'meu canal';
    const tone = elements.narratorToneSelect.value === 'Personalizado'
        ? elements.customToneInput.value.trim()
        : elements.narratorToneSelect.value;

    // Check if we should narrate alternatives based on the dropdown choice
    const includeAlternatives = elements.narrativeAlternativeFormatSelect.value !== 'omit';

    // Check if we should narrate justification based on the dropdown choice
    const includeJustification = elements.narrativeJustificationFormatSelect.value === 'both' || elements.narrativeJustificationFormatSelect.value === 'read-only';

    const quiz = state.generatedQuiz;

    const language = state.currentConfig?.language || 'Português';

    const system = `Você é um roteirista especializado em canais de Quiz no YouTube.
Sua tarefa é criar um roteiro de narração completo e envolvente para um vídeo.
IMPORTANTE: Todo o texto gerado DEVE estar no idioma: ${language}.
O tom de voz deve ser: ${tone}.

    ESTILO DE FORMATAÇÃO DAS QUESTÕES:
    - Número da Questão: ${elements.narrativeQuestionFormatSelect.value === 'flourished' ? 'Falar de forma variada e floreada (ex: "E agora a primeira pergunta...", "Vamos para a questão dois...", etc)' : elements.narrativeQuestionFormatSelect.value === 'full' ? 'Falar o nome completo (ex: "Questão 1")' : elements.narrativeQuestionFormatSelect.value === 'number-only' ? 'Falar apenas o número' : 'Omitir o número e ir direto ao enunciado'}.
    - Alternativas: ${elements.narrativeAlternativeFormatSelect.value === 'full' ? 'Mencionar a letra e o conteúdo (ex: "Alternativa A: [conteúdo]")' : elements.narrativeAlternativeFormatSelect.value === 'letter-only' ? 'Mencionar apenas a letra (ex: "A: [conteúdo]")' : elements.narrativeAlternativeFormatSelect.value === 'content-only' ? 'NUNCA introduza com "As alternativas são" ou frases similares. Mencione apenas o conteúdo em formato de pergunta fluida usando "ou" entre as opções (ex: "Brasil ou Argentina?", "Cão, Gato ou Pássaro?").' : 'Omitir a leitura das alternativas'}.
    - Regra Crucial: NUNCA inicie a leitura das alternativas com frases como "As alternativas são:", "As opções são:" ou qualquer introdução similar. Vá direto ao conteúdo.
    - Resposta: ${elements.narrativeAnswerFormatSelect.value === 'full' ? 'Falar completo (ex: "Resposta: Alternativa A - [conteúdo]")' : elements.narrativeAnswerFormatSelect.value === 'almost-full' ? 'Falar quase tudo (ex: "Resposta: letra A - [conteúdo]")' : elements.narrativeAnswerFormatSelect.value === 'keyword-only' ? 'Dizer apenas a palavra "Resposta" antes da resposta correta' : 'Dizer apenas o conteúdo da resposta, sem anúncios prévios'}.
    - Justificativa: ${includeJustification ? 'NUNCA diga a palavra "Justificativa". Apenas diga o texto da justificativa logo após a resposta.' : 'NÃO mencione a justificativa na narração.'}

    REGRAS GERAIS:
    1. Comece com uma introdução calorosa apropriada para o idioma ${language}, mencionando que o usuário está no canal "${channelName}".
    2. Explique brevemente o quiz no idioma ${language}: ${quiz.questions.length} questões, ${elements.numAlternativesSelect.value} alternativas por questão e o tema "${quiz.title}".
    3. Estimule o engajamento em ${language}: peça para anotarem os acertos, deixarem nos comentários de onde estão falando e se inscreverem no canal.
    4. Para cada pergunta, narre o enunciado ${includeAlternatives ? 'e as alternativas' : ''}, e depois a resposta ${includeJustification ? 'com a justificativa' : ''}, tudo em ${language}, respeitando o ESTILO DE FORMATAÇÃO escolhido acima.
    5. NÃO use frases de transição genéricas como "Próxima questão" (use o estilo de número escolhido).
    6. Antes da ÚLTIMA questão, crie um CTA (Call to Action) simpático e envolvente em ${language} pedindo para curtir e se inscrever.
    7. Após a ÚLTIMA questão, crie um texto de finalização (outro) em ${language} com um convite para compartilhar o vídeo e uma despedida como "Até o próximo vídeo" (traduza para ${language}).
    8. Retorne os dados em formato JSON seguindo esta estrutura:
    {
        "intro": "Texto completo da introdução",
        "preLastQuestionCTA": "Texto do CTA simpático antes da última questão",
        "questions": [
            {
                "number": 1,
                "statementNarrative": "Texto para ler o enunciado (incluindo o número no estilo escolhido)",
                "alternativesNarrative": "Texto para ler as alternativas (ou vazio se omitido)",
                "answerNarrative": "Texto para ler a resposta e justificativa (sem dizer a palavra 'justificativa')"
            }
        ],
        "outro": "Texto completo da finalização do vídeo"
    } `;

    const user = `Gere a narrativa para este quiz:
    Título: ${quiz.title}
    Questões: ${JSON.stringify(quiz.questions.map(q => ({
        number: q.number,
        statement: q.statement,
        alternatives: q.alternatives,
        correctAnswer: q.correctAnswer,
        justification: q.justification
    })))
        } `;

    return { system, user };
}

function formatSRTTime(seconds) {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    const timeStr = date.toISOString().substr(11, 8); // HH:MM:SS
    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
    return `${timeStr},${ms}`;
}

function exportToSRT(narrativeData) {
    const includeAlternatives = elements.narrativeAlternativeFormatSelect.value !== 'omit';
    let srtContent = '';
    let currentTime = 0;
    let index = 1;

    const t = state.timing;

    // 1. Intro
    srtContent += `${index++}\n`;
    srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.intro)}\n`;
    srtContent += `${narrativeData.intro}\n\n`;
    currentTime += t.intro;

    narrativeData.questions.forEach((q, i) => {
        // CTA antes da última questão
        if (i === narrativeData.questions.length - 1 && narrativeData.preLastQuestionCTA) {
            srtContent += `${index++}\n`;
            srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.cta)}\n`;
            srtContent += `${narrativeData.preLastQuestionCTA}\n\n`;
            currentTime += t.cta;
        }

        // 2. Enunciado
        srtContent += `${index++}\n`;
        srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.statement)}\n`;
        srtContent += `${q.statementNarrative}\n\n`;
        currentTime += t.statement;

        if (includeAlternatives) {
            // 3. Alternativas
            srtContent += `${index++}\n`;
            srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.alternatives)}\n`;
            srtContent += `${q.alternativesNarrative}\n\n`;
            currentTime += t.alternatives;
        }

        // 4. Cronômetro - Texto vazio ou "..."
        if (t.timer > 0) {
            srtContent += `${index++}\n`;
            srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.timer)}\n`;
            srtContent += `...\n\n`;
            currentTime += t.timer;
        }

        // 5. Resposta e Justificativa
        srtContent += `${index++}\n`;
        srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.answer)}\n`;
        srtContent += `${q.answerNarrative}\n\n`;
        currentTime += t.answer;
    });

    // 6. Outro
    if (narrativeData.outro) {
        srtContent += `${index++}\n`;
        srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.outro)}\n`;
        srtContent += `${narrativeData.outro}\n\n`;
    }

    const blob = new Blob([srtContent], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'narrativa_quiz.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportSearchTerms() {
    if (!state.generatedQuiz) {
        showStatus('Nenhum quiz gerado para exportar', 'error');
        return;
    }

    if (typeof XLSX === 'undefined') {
        showStatus('Biblioteca SheetJS não carregada. Verifique sua conexão.', 'error');
        return;
    }

    const quiz = state.generatedQuiz;

    // 1. Prepare Data
    const headers = [
        'Número da questão',
        'Termo de busca para enunciado',
        'Termo de busca para resposta',
        'Enunciado',
        'Resposta'
    ];

    const data = [headers];

    quiz.questions.forEach(q => {
        data.push([
            q.number || '',
            q.questionImagePrompt || '',
            q.answerImagePrompt || '',
            q.statement || '',
            q.correctAnswer || ''
        ]);
    });

    // 2. Create Workbook and Worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Adjust column widths (optional but nice)
    const wscols = [
        { wch: 15 }, // Number
        { wch: 40 }, // Prompt Q
        { wch: 40 }, // Prompt A
        { wch: 50 }, // Statement
        { wch: 30 }  // Answer
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Termos de Busca");

    // 3. Generate Filename
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const safeTitle = (quiz.title || 'quiz').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `termos_busca_quiz_${safeTitle}_${timestamp}.xlsx`;

    // 4. Download
    try {
        XLSX.writeFile(wb, filename);
        showStatus('✅ Termos de busca exportados para Excel com sucesso!', 'success');
    } catch (err) {
        console.error('Excel Export Error:', err);
        showStatus('❌ Erro ao exportar Excel: ' + err.message, 'error');
    }
}

function copyToClipboard() {
    if (!state.generatedQuiz) {
        showStatus('Nenhum quiz gerado para copiar', 'error');
        return;
    }

    const text = formatQuizForClipboard(state.generatedQuiz);

    navigator.clipboard.writeText(text).then(() => {
        showStatus('✅ Quiz copiado para a área de transferência!', 'success');
    }).catch(err => {
        showStatus('❌ Erro ao copiar: ' + err.message, 'error');
    });
}

function formatQuizForClipboard(quiz) {
    let text = `${quiz.title} \n\n`;
    text += `${quiz.introduction} \n\n`;
    text += '='.repeat(60) + '\n\n';

    quiz.questions.forEach(q => {
        text += `QUESTÃO ${q.number} \n`;
        text += `${q.statement} \n\n`;
        text += `Alternativas: \n`;
        q.alternatives.forEach(alt => {
            text += `  ${alt} \n`;
        });
        text += `\nResposta Correta: ${q.correctAnswer} \n`;
        text += `Justificativa: ${q.justification.trim()} \n`;
        text += '\n' + '-'.repeat(60) + '\n\n';
    });

    return text;
}

// ===================================
// UTILITY FUNCTIONS
// ===================================
async function packProductionAssets() {
    if (!state.generatedQuiz) {
        showStatus('❌ Nenhum quiz gerado para exportar pacote', 'error');
        return;
    }

    try {
        const zip = new JSZip();
        const quiz = state.generatedQuiz;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const folderName = `Quiz_Production_${timestamp}`;
        const root = zip.folder(folderName);

        showStatus('📦 Iniciando empacotamento de produção...', 'info');

        // 1. CSV
        const lang = state.currentConfig?.language || 'Português';
        const headers = i18n[lang]?.csv || i18n['Português'].csv;
        let csv = headers.join(',') + '\n';
        quiz.questions.forEach(q => {
            const row = [
                q.number,
                `"${escapeCSV(q.statement.trim())}"`,
                `"${escapeCSV((q.questionImagePrompt || '').trim())}"`,
                `"${escapeCSV(q.alternatives.map(a => a.trim()).join('; '))}"`,
                `"${escapeCSV(q.correctAnswer.trim())}"`,
                `"${escapeCSV((q.answerImagePrompt || '').trim())}"`,
                `"${escapeCSV(q.justification.trim())}"`,
                `"${escapeCSV((q.narrative || '').trim())}"`
            ];
            csv += row.join(',') + '\n';
        });
        root.file('1-Dados_Quiz.csv', csv);

        // 2. JSON
        const json = JSON.stringify(quiz, null, 2);
        root.file('2-Dados_Brutos.json', json);

        // 3. Termos de Busca (Excel)
        if (typeof XLSX !== 'undefined') {
            const excelHeaders = [
                'Número da questão',
                'Termo de busca para enunciado',
                'Termo de busca para resposta',
                'Enunciado',
                'Resposta'
            ];
            const excelData = [excelHeaders];

            quiz.questions.forEach(q => {
                excelData.push([
                    q.number || '',
                    q.questionImagePrompt || '',
                    q.answerImagePrompt || '',
                    q.statement || '',
                    q.correctAnswer || ''
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(excelData);

            // Adjust column widths
            const wscols = [
                { wch: 15 }, // Number
                { wch: 40 }, // Prompt Q
                { wch: 40 }, // Prompt A
                { wch: 50 }, // Statement
                { wch: 30 }  // Answer
            ];
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, "Termos de Busca");

            // Generate binary data
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            root.file('3-Termos_Busca.xlsx', excelBuffer);
        } else {
            // Fallback to TXT if XLSX lib fails
            let terms = '';
            quiz.questions.forEach(q => {
                terms += `Q${q.number} IMG: ${q.questionImagePrompt || ''}\n`;
                terms += `Q${q.number} RESP: ${q.answerImagePrompt || ''}\n`;
            });
            root.file('3-Termos_Busca.txt', terms);
        }

        // 4. Conteúdo Clipboard (TXT)
        const clipboardText = formatQuizForClipboard(quiz);
        root.file('4-Conteudo_Clipboard.txt', clipboardText);

        // 5. Imagens (Screenshots)
        const imgFolder = root.folder('5-Imagens_Exportadas');
        const cards = document.querySelectorAll('.question-card-wrapper');

        showStatus('🖼️ Renderizando imagens para o pacote...', 'info');

        for (let i = 0; i < cards.length; i++) {
            const cardWrapper = cards[i];
            const q = quiz.questions[i];

            // Render Question
            // Ensure question mode
            const answerSection = cardWrapper.querySelector('.export-card-answer-section');
            if (answerSection) answerSection.classList.add('hidden');

            // Wait for DOM update
            await new Promise(r => setTimeout(r, 100));

            const exportCard = cardWrapper.querySelector('.ui-card-clone');
            if (exportCard) {
                const canvasQ = await html2canvas(exportCard, { scale: 2, useCORS: true, backgroundColor: null });
                const blobQ = await new Promise(resolve => canvasQ.toBlob(resolve, 'image/png'));
                imgFolder.file(`Slide_${String(i + 1).padStart(2, '0')}_Pergunta.png`, blobQ);
            }

            // Render Answer
            if (answerSection) answerSection.classList.remove('hidden');
            // Wait for DOM
            await new Promise(r => setTimeout(r, 100));

            if (exportCard) {
                const canvasA = await html2canvas(exportCard, { scale: 2, useCORS: true, backgroundColor: null });
                const blobA = await new Promise(resolve => canvasA.toBlob(resolve, 'image/png'));
                imgFolder.file(`Slide_${String(i + 1).padStart(2, '0')}_Resposta.png`, blobA);
            }

            // Reset to initial state (Hide answer)
            if (answerSection) answerSection.classList.add('hidden');
        }

        // 6. Narrativa (Se disponível ou gerar na hora)
        // Check if we have narrative data in question objects, or generate simple text
        // If not generated, we can't fully create SRT without calling API.
        // We will check if 'narrative' field exists in questions.
        // If generatedNarrative function was called previously, we might not have stored the FULL JSON structure needed for SRT export function.
        // However, exportToSRT depends on 'narrativeData' object which is local to the function.
        // We need to re-generate or assume the 'narrative' field in questions is enough for a basic TXT, or skip.
        // Ideally, we should store the last generated narrativeData in state.

        if (state.lastNarrativeData) {
            const srtContent = generateSRTString(state.lastNarrativeData);
            root.file('6-Narrativa.srt', srtContent);
        } else {
            root.file('6-Narrativa_Aviso.txt', 'Narrativa ainda não foi gerada via botão "Gerar Narrativa". Gere-a primeiro para incluir no pacote.');
        }

        // Generate Zip
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `${folderName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(zipUrl);

        showStatus('✅ Pacote de Produção exportado com sucesso!', 'success');

    } catch (error) {
        console.error('Production Package Error:', error);
        showStatus(`❌ Erro ao criar pacote: ${error.message}`, 'error');
    }
}

// Helper to generate SRT string from data (checking logic from exportToSRT)
function generateSRTString(narrativeData) {
    const includeAlternatives = elements.narrativeAlternativeFormatSelect.value !== 'omit';
    let srtContent = '';
    let currentTime = 0;
    let index = 1;
    const t = state.timing;

    // Intro
    srtContent += `${index++}\n`;
    srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.intro)}\n`;
    srtContent += `${narrativeData.intro}\n\n`;
    currentTime += t.intro;

    narrativeData.questions.forEach((q, i) => {
        if (i === narrativeData.questions.length - 1 && narrativeData.preLastQuestionCTA) {
            srtContent += `${index++}\n`;
            srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.cta)}\n`;
            srtContent += `${narrativeData.preLastQuestionCTA}\n\n`;
            currentTime += t.cta;
        }
        srtContent += `${index++}\n`;
        srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.statement)}\n`;
        srtContent += `${q.statementNarrative}\n\n`;
        currentTime += t.statement;

        if (includeAlternatives) {
            srtContent += `${index++}\n`;
            srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.alternatives)}\n`;
            srtContent += `${q.alternativesNarrative}\n\n`;
            currentTime += t.alternatives;
        }

        if (t.timer > 0) {
            srtContent += `${index++}\n`;
            srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.timer)}\n`;
            srtContent += `...\n\n`;
            currentTime += t.timer;
        }

        srtContent += `${index++}\n`;
        srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.answer)}\n`;
        srtContent += `${q.answerNarrative}\n\n`;
        currentTime += t.answer;
    });

    if (narrativeData.outro) {
        srtContent += `${index++}\n`;
        srtContent += `${formatSRTTime(currentTime)} --> ${formatSRTTime(currentTime + t.outro)}\n`;
        srtContent += `${narrativeData.outro}\n\n`;
    }
    return srtContent;
}

function escapeCSV(str) {
    if (!str) return '';
    return str.replace(/"/g, '""');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function showStatus(message, type = 'success') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;

    elements.statusContainer.innerHTML = '';
    elements.statusContainer.appendChild(statusDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        statusDiv.style.animation = 'fadeInUp 0.4s ease-out reverse';
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 400);
    }, 5000);
}

function clearForm() {
    elements.themeInput.value = '';
    elements.detailsTextarea.value = '';
    elements.numQuestionsInput.value = '10';
    elements.languageSelect.value = 'Português';
    elements.difficultySelect.value = 'Médio';
    elements.formatSelect.value = 'Rápido';
    elements.numAlternativesSelect.value = '4';

    showStatus('Formulário limpo', 'success');
}

function handleFormatChange() {
    const format = elements.formatSelect.value;

    if (format === 'Rápido') {
        elements.numQuestionsInput.value = '10';
        elements.numQuestionsInput.max = '10';
    } else if (format === 'Longo') {
        elements.numQuestionsInput.value = '20';
        elements.numQuestionsInput.max = '100';
    } else if (format === 'Série') {
        elements.numQuestionsInput.value = '15';
        elements.numQuestionsInput.max = '50';
    }
}

// ===================================
// QUESTION EDITING FUNCTIONS
// ===================================
function toggleAnswer(questionIndex) {
    const wrapper = document.querySelector(`.question-card-wrapper[data-question-index="${questionIndex}"]`);
    if (!wrapper) return;

    const answerSection = wrapper.querySelector('.answer-section-ui');
    const toggleBtn = wrapper.querySelector('.btn-toggle-answer');
    const imageContainer = wrapper.querySelector('.export-card-image-container');
    const question = state.generatedQuiz.questions[questionIndex];

    if (answerSection.classList.contains('hidden')) {
        // Show answer
        answerSection.classList.remove('hidden');
        toggleBtn.textContent = '🙈 Ocultar Resposta';
        toggleBtn.classList.add('active');

        // Swap to answer image if available
        if (imageContainer && question.answerImageUrl) {
            imageContainer.innerHTML = `<img src="${question.answerImageUrl}" alt="Imagem da resposta" class="export-card-image">`;
        }
    } else {
        // Hide answer
        answerSection.classList.add('hidden');
        toggleBtn.textContent = '👁️ Resposta';
        toggleBtn.classList.remove('active');

        // Swap back to question image
        if (imageContainer) {
            if (question.questionImageUrl) {
                imageContainer.innerHTML = `<img src="${question.questionImageUrl}" alt="Imagem da questão" class="export-card-image">`;
            } else {
                imageContainer.innerHTML = '<div class="image-placeholder">Sem imagem</div>';
            }
        }
    }
}

function toggleEditMode(questionIndex) {
    const wrapper = document.querySelector(`.question-card-wrapper[data-question-index="${questionIndex}"]`);
    if (!wrapper) return;

    const uiCard = wrapper.querySelector('.ui-card-clone');
    const editMode = wrapper.querySelector('.question-edit-mode');

    if (uiCard && editMode) {
        if (editMode.classList.contains('hidden')) {
            editMode.classList.remove('hidden');
            uiCard.classList.add('hidden');
        } else {
            editMode.classList.add('hidden');
            uiCard.classList.remove('hidden');
        }
    }
}

function updateCardImage(questionIndex) {
    const wrapper = document.querySelector(`.question-card-wrapper[data-question-index="${questionIndex}"]`);
    if (!wrapper) return;
    const fileInput = wrapper.querySelector('.card-image-input');
    if (fileInput) fileInput.click();
}

function handleCardImageUpdate(questionIndex, input) {
    const file = input.files[0];
    if (!file) return;

    const wrapper = document.querySelector(`.question-card-wrapper[data-question-index="${questionIndex}"]`);
    if (!wrapper || !state.generatedQuiz) return;

    const question = state.generatedQuiz.questions[questionIndex];
    const answerSection = wrapper.querySelector('.answer-section-ui');
    const isShowingAnswer = answerSection && !answerSection.classList.contains('hidden');
    const imageContainer = wrapper.querySelector('.export-card-image-container');

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageUrl = e.target.result;

        if (isShowingAnswer) {
            question.answerImageUrl = imageUrl;
        } else {
            question.questionImageUrl = imageUrl;
        }

        // Update the displayed image in the UI card
        if (imageContainer) {
            imageContainer.innerHTML = `<img src="${imageUrl}" alt="${isShowingAnswer ? 'Imagem da resposta' : 'Imagem da questão'}" class="export-card-image">`;
        }

        showStatus(`✅ Imagem ${isShowingAnswer ? 'da resposta' : 'do enunciado'} da Questão ${questionIndex + 1} atualizada!`, 'success');

        // No need for displayQuiz here if we just update the image directly, 
        // but displayQuiz will ensure everything is in sync if needed.
    };
    reader.readAsDataURL(file);
    input.value = '';
}

function handleLayoutChange(index, layout, type) {
    const typeTitle = type === 'question' ? 'Question' : 'Answer';
    const imageSection = document.getElementById(`imageSection${typeTitle}${index}`);
    if (imageSection) {
        if (layout === 'default') {
            imageSection.classList.add('hidden');
        } else {
            imageSection.classList.remove('hidden');
        }
    }
}

function uploadImage(index, type) {
    const typeTitle = type === 'question' ? 'Question' : 'Answer';
    const input = document.getElementById(`imageUpload${typeTitle}${index}`);
    if (input) input.click();
}

function handleImageUpload(index, input, type) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const imageUrl = e.target.result;
        updateImagePreview(index, imageUrl, type);
    };
    reader.readAsDataURL(file);
}

function removeImage(index, type) {
    updateImagePreview(index, null, type);
}

function updateImagePreview(index, imageUrl, type) {
    const card = document.querySelector(`[data-question-index="${index}"]`);
    if (!card) return;

    const typeLower = type.toLowerCase();
    const previewContainer = card.querySelector(`.${typeLower}-preview-container`);
    if (!previewContainer) return;

    if (imageUrl) {
        previewContainer.innerHTML = `<img src="${imageUrl}" alt="Preview" class="image-preview ${typeLower}-preview" data-url="${imageUrl}">`;
    } else {
        previewContainer.innerHTML = '<div class="image-placeholder">Sem imagem</div>';
    }
}

async function generateImageWithIA(index, type) {
    const provider = state.imageProvider || 'openai';

    if (provider === 'google') {
        return await generateImageWithGoogle(index, type);
    } else {
        return await generateImageWithDallE(index, type);
    }
}

async function generateImageWithGoogle(index, type) {
    const card = document.querySelector(`[data-question-index="${index}"]`);
    if (!card) return;

    const typeLower = type.toLowerCase();
    const typeLabel = type === 'question' ? 'da pergunta' : 'da resposta';

    const questionText = card.querySelector('.edit-question').value.trim();
    const manualPrompt = card.querySelector(`.edit-${typeLower}-image-prompt`).value.trim();

    if (!questionText && !manualPrompt) {
        showStatus(`Descreva a imagem ou digite a pergunta para usar como base para a imagem ${typeLabel}`, 'error');
        return;
    }

    const finalPrompt = manualPrompt || `A high-quality educational illustration for a quiz about: ${questionText}. Style: Professional, clean, and modern.`;

    showStatus(`🎨 Gerando imagem ${typeLabel} com Google Imagen... Por favor, aguarde.`, 'success');

    try {
        const response = await fetch('/api/generate-image-google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: finalPrompt })
        });

        const data = await response.json();
        if (!response.ok) {
            let msg = data.error || 'Erro desconhecido na geração';
            if (msg.includes('Generative Language API')) {
                msg += '\n\n💡 DICA: Ative a "Generative Language API" no Google Cloud Console.';
            }
            throw new Error(msg);
        }

        // Imagen 3 returns base64 in most implementations or a direct image
        if (data.predictions && data.predictions[0].bytesBase64Encoded) {
            const imageUrl = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
            updateImagePreview(index, imageUrl, type);
            showStatus(`✅ Imagem ${typeLabel} gerada com Google Imagen!`, 'success');
        } else {
            throw new Error('Resposta inesperada do Google Imagen');
        }
    } catch (error) {
        console.error('Google Imagen Error:', error);
        showStatus(`❌ Erro ao gerar imagem ${typeLabel} (Google): ${error.message}`, 'error');
    }
}

async function generateImageWithDallE(index, type) {
    const card = document.querySelector(`[data-question-index="${index}"]`);
    if (!card || !state.apiKey) {
        showStatus('Configure sua chave API nas configurações para usar o DALL-E', 'error');
        return;
    }

    const typeLower = type.toLowerCase();
    const typeLabel = type === 'question' ? 'da pergunta' : 'da resposta';

    const questionText = card.querySelector('.edit-question').value.trim();
    const manualPrompt = card.querySelector(`.edit-${typeLower}-image-prompt`).value.trim();

    if (!questionText && !manualPrompt) {
        showStatus(`Descreva a imagem ou digite a pergunta para usar como base para a imagem ${typeLabel}`, 'error');
        return;
    }

    const finalPrompt = manualPrompt || `A high-quality educational illustration for a quiz about: ${questionText}. Style: Professional, clean, and modern.`;

    showStatus(`🎨 Gerando imagem ${typeLabel} com DALL-E... Por favor, aguarde.`, 'success');

    try {
        const response = await fetch('/api/generate-image-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: finalPrompt })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const imageUrl = data.data[0].url;
        updateImagePreview(index, imageUrl, type);
        showStatus(`✅ Imagem ${typeLabel} gerada com sucesso!`, 'success');
    } catch (error) {
        console.error('DALL-E Error:', error);
        showStatus(`❌ Erro ao gerar com DALL-E: ${error.message}`, 'error');
    }
}



// Google Image Search State
let currentSearchContext = { index: -1, type: '' };

function openGoogleImageSearch(index, type) {
    currentSearchContext = { index, type };
    elements.imageSearchModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Auto-fill search if possible
    const card = document.querySelector(`[data-question-index="${index}"]`);
    if (card) {
        const questionText = card.querySelector('.edit-question').value.trim();
        if (questionText) {
            elements.imageSearchInput.value = questionText;
        }
    }
}

async function searchGoogleImages() {
    const query = elements.imageSearchInput.value.trim();
    if (!query) return;

    elements.imageSearchResults.innerHTML = '<div class="image-placeholder" style="grid-column: 1/-1; padding: var(--space-xl);"><div class="loading-spinner"></div> Buscando imagens...</div>';

    try {
        const response = await fetch('/api/image-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro desconhecido na busca');
        }

        if (!data.items || data.items.length === 0) {
            elements.imageSearchResults.innerHTML = '<div class="image-placeholder" style="grid-column: 1/-1; padding: var(--space-xl);">Nenhuma imagem com licença CC encontrada.</div>';
            return;
        }

        elements.imageSearchResults.innerHTML = data.items.map((item, idx) => `
            <div class="result-item" onclick="selectSearchResult('${item.link}')">
                <img src="${item.link}" alt="Resultado ${idx + 1}">
                <div class="result-info">${item.displayLink}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Google Search Error:', error);
        elements.imageSearchResults.innerHTML = `<div class="status-error" style="grid-column: 1/-1; padding: var(--space-md);">Erro na busca: ${error.message}</div>`;
    }
}

function selectSearchResult(url) {
    if (currentSearchContext.index !== -1) {
        updateImagePreview(currentSearchContext.index, url, currentSearchContext.type);
        closeImageSearch();
        showStatus('✅ Imagem selecionada com sucesso!', 'success');
    }
}

function closeImageSearch() {
    elements.imageSearchModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Attach Search Modal Events
document.getElementById('closeImageSearch').addEventListener('click', closeImageSearch);
document.getElementById('executeImageSearch').addEventListener('click', searchGoogleImages);
elements.imageSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchGoogleImages();
});

// Bulk Import Backgrounds
async function bulkImportBackgrounds(event) {
    const files = Array.from(event.target.files);

    if (!files.length) {
        showStatus('❌ Nenhuma imagem selecionada', 'error');
        return;
    }

    if (!state.generatedQuiz || !state.generatedQuiz.questions) {
        showStatus('❌ Gere um quiz primeiro antes de importar backgrounds', 'error');
        return;
    }

    try {
        showStatus('⏳ Importando backgrounds...', 'info');

        // Sort files alphabetically by name
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        // Convert files to base64
        const imagePromises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        const imageDataUrls = await Promise.all(imagePromises);

        // Assign one background per question (cycling if needed)
        state.generatedQuiz.questions.forEach((question, index) => {
            const bgIndex = index % imageDataUrls.length;
            question.backgroundImage = imageDataUrls[bgIndex];
        });

        // Refresh the quiz display
        displayQuiz(state.generatedQuiz, state.currentConfig);

        showStatus(`✅ ${imageDataUrls.length} backgrounds importados para ${state.generatedQuiz.questions.length} questões!`, 'success');

        // Reset file input
        event.target.value = '';
    } catch (error) {
        console.error('Error importing backgrounds:', error);
        showStatus(`❌ Erro ao importar backgrounds: ${error.message}`, 'error');
    }
}

// Bulk Import Images
async function bulkImportImages(event) {
    const files = Array.from(event.target.files);

    if (!files.length) {
        showStatus('❌ Nenhuma imagem selecionada', 'error');
        return;
    }

    if (!state.generatedQuiz || !state.generatedQuiz.questions) {
        showStatus('❌ Gere um quiz primeiro antes de importar imagens', 'error');
        return;
    }

    try {
        showStatus('⏳ Importando imagens...', 'info');

        // Sort files alphabetically by name
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        // Convert files to base64 and distribute to questions
        const imagePromises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        const imageDataUrls = await Promise.all(imagePromises);

        // Distribute images to questions
        let imageIndex = 0;
        for (let i = 0; i < state.generatedQuiz.questions.length && imageIndex < imageDataUrls.length; i++) {
            const question = state.generatedQuiz.questions[i];

            // Assign question image (odd position: 0, 2, 4...)
            if (imageIndex < imageDataUrls.length) {
                question.questionImageUrl = imageDataUrls[imageIndex];
                question.questionLayout = 'image-right';
                imageIndex++;
            }

            // Assign answer image (even position: 1, 3, 5...)
            if (imageIndex < imageDataUrls.length) {
                question.answerImageUrl = imageDataUrls[imageIndex];
                question.answerLayout = 'image-right';
                imageIndex++;
            }
        }

        // Refresh the quiz display
        displayQuiz(state.generatedQuiz, state.currentConfig);

        showStatus(`✅ ${imageIndex} imagens importadas com sucesso!`, 'success');

        // Reset file input
        event.target.value = '';
    } catch (error) {
        console.error('Error importing images:', error);
        showStatus(`❌ Erro ao importar imagens: ${error.message}`, 'error');
    }
}

function saveQuestion(questionIndex) {
    const wrapper = document.querySelector(`.question-card-wrapper[data-question-index="${questionIndex}"]`);
    if (!wrapper || !state.generatedQuiz) return;

    const question = state.generatedQuiz.questions[questionIndex];

    // Get basic values
    const newStatement = wrapper.querySelector('.edit-question').value.trim();
    const newJustification = wrapper.querySelector('.edit-justification').value.trim();
    const newCorrectAnswer = wrapper.querySelector('.edit-correct-answer').value;

    // Get question image values - with safety checks
    const newQuestionLayout = wrapper.querySelector('.edit-question-layout').value;
    const qPromptElem = wrapper.querySelector('.edit-question-image-prompt');
    const newQuestionImagePrompt = qPromptElem ? qPromptElem.value.trim() : (question.questionImagePrompt || '');
    const questionPreviewImg = wrapper.querySelector('.question-preview');
    const newQuestionImageUrl = questionPreviewImg ? (questionPreviewImg.src || questionPreviewImg.dataset.url) : (question.questionImageUrl || null);

    // Get answer image values - with safety checks
    const newAnswerLayout = wrapper.querySelector('.edit-answer-layout').value;
    const aPromptElem = wrapper.querySelector('.edit-answer-image-prompt');
    const newAnswerImagePrompt = aPromptElem ? aPromptElem.value.trim() : (question.answerImagePrompt || '');
    const answerPreviewImg = wrapper.querySelector('.answer-preview');
    const newAnswerImageUrl = answerPreviewImg ? (answerPreviewImg.src || answerPreviewImg.dataset.url) : (question.answerImageUrl || null);

    // Get alternatives
    const alternativeInputs = wrapper.querySelectorAll('.edit-alternative');
    const newAlternatives = Array.from(alternativeInputs).map(input => input.value.trim());

    // Validation
    if (!newStatement) {
        showStatus('A pergunta não pode estar vazia', 'error');
        return;
    }

    if (newAlternatives.some(alt => !alt)) {
        showStatus('Todas as alternativas devem ser preenchidas', 'error');
        return;
    }

    if (!newJustification) {
        showStatus('A justificativa não pode estar vazia', 'error');
        return;
    }

    // Update question object
    question.statement = newStatement;
    question.alternatives = newAlternatives;
    question.correctAnswer = newCorrectAnswer;
    question.justification = newJustification;

    // Update imagery data
    question.questionLayout = newQuestionLayout;
    question.questionImageUrl = newQuestionImageUrl;
    question.questionImagePrompt = newQuestionImagePrompt;

    question.answerLayout = newAnswerLayout;
    question.answerImageUrl = newAnswerImageUrl;
    question.answerImagePrompt = newAnswerImagePrompt;

    // Background values are updated in real-time by the range inputs themselves to maintain state
    // but ensure they are correctly set in the object if someone types something manually or for safety:
    const brightnessInput = wrapper.querySelector('.edit-bg-brightness');
    const opacityInput = wrapper.querySelector('.edit-bg-opacity');
    const overlayInput = wrapper.querySelector('.edit-bg-overlay');

    if (brightnessInput) question.bgBrightness = parseFloat(brightnessInput.value);
    if (opacityInput) question.bgOpacity = parseFloat(opacityInput.value);
    if (overlayInput) question.bgOverlayOpacity = parseFloat(overlayInput.value);

    const altBgInput = wrapper.querySelector('.edit-alt-bg-opacity');
    const altBorderInput = wrapper.querySelector('.edit-alt-border-opacity');
    const altTextColorInput = wrapper.querySelector('.edit-alt-text-color');
    const altBgColorInput = wrapper.querySelector('.edit-alt-bg-color');
    const altBorderColorInput = wrapper.querySelector('.edit-alt-border-color');

    if (altBgInput) question.altBgOpacity = parseFloat(altBgInput.value);
    if (altBorderInput) question.altBorderOpacity = parseFloat(altBorderInput.value);
    if (altTextColorInput) question.altTextColor = altTextColorInput.value;
    if (altBgColorInput) question.altBgColor = altBgColorInput.value;
    if (altBorderColorInput) question.altBorderColor = altBorderColorInput.value;

    // Rebuild the card with updated data
    const newCard = createQuestionCard(question, questionIndex);
    wrapper.replaceWith(newCard);

    showStatus('✅ Questão atualizada com sucesso!', 'success');
}

/**
 * Ensures text has no double spaces and no spaces before punctuation.
 * Uses a more aggressive regex to catch invisible characters and multiple types of spaces.
 */
function cleanText(text) {
    if (!text) return '';
    return text.toString()
        // Collapses all types of whitespace (including non-breaking spaces, tabs, newlines) into a single standard space
        .replace(/[\s\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/g, ' ')
        // Removes any space before common punctuation marks
        .replace(/\s+([.,;:!?])/g, '$1')
        .trim();
}

function cancelEdit(questionIndex) {
    toggleEditMode(questionIndex);
}

// ===================================
// IMAGE EXPORT FUNCTIONS
// ===================================
async function exportAllQuestionImages() {
    if (!state.generatedQuiz) {
        showStatus('Nenhum quiz gerado para exportar', 'error');
        return;
    }

    showStatus('🖼️ Gerando imagens das perguntas... Isso pode levar alguns momentos.', 'success');

    try {
        const zip = new JSZip();
        const questions = state.generatedQuiz.questions;

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const imageBlob = await generateQuestionImage(question, i);
            const filename = `${String(i + 1).padStart(2, '0')}_pergunta.png`;
            zip.file(filename, imageBlob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipBlob, 'quiz_perguntas.zip', 'application/zip');
        showStatus(`✅ ${questions.length} imagens de perguntas exportadas!`, 'success');
    } catch (error) {
        console.error('Error exporting question images:', error);
        showStatus(`❌ Erro ao exportar imagens: ${error.message}`, 'error');
    }
}

async function exportAllAnswerImages() {
    if (!state.generatedQuiz) {
        showStatus('Nenhum quiz gerado para exportar', 'error');
        return;
    }

    showStatus('🖼️ Gerando imagens das respostas... Isso pode levar alguns momentos.', 'success');

    try {
        const zip = new JSZip();
        const questions = state.generatedQuiz.questions;

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const imageBlob = await generateAnswerImage(question, i);
            const filename = `${String(i + 1).padStart(2, '0')}_resposta.png`;
            zip.file(filename, imageBlob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipBlob, 'quiz_respostas.zip', 'application/zip');
        showStatus(`✅ ${questions.length} imagens de respostas exportadas!`, 'success');
    } catch (error) {
        console.error('Error exporting answer images:', error);
        showStatus(`❌ Erro ao exportar imagens: ${error.message}`, 'error');
    }
}

async function exportAllTogether() {
    if (!state.generatedQuiz) {
        showStatus('Nenhum quiz gerado para exportar', 'error');
        return;
    }

    showStatus('🖼️ Gerando todas as imagens sequencialmente... Isso pode levar alguns momentos.', 'success');

    try {
        const zip = new JSZip();
        const questions = state.generatedQuiz.questions;

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const numPrefix = String(i + 1).padStart(2, '0');

            // 1. Question image (suffix 'a')
            const qBlob = await generateQuestionImage(question, i);
            zip.file(`${numPrefix}a.png`, qBlob);

            // 2. Answer image (suffix 'b')
            const aBlob = await generateAnswerImage(question, i);
            zip.file(`${numPrefix}b.png`, aBlob);

            // Progress feedback
            showStatus(`🖼️ Processando questão ${i + 1}/${questions.length}...`, 'success');
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipBlob, 'quiz_completo_sequencial.zip', 'application/zip');
        showStatus(`✅ ${questions.length * 2} imagens exportadas com sucesso (CapCut Ready)!`, 'success');
    } catch (error) {
        console.error('Error exporting all images together:', error);
        showStatus(`❌ Erro ao exportar imagens sequenciais: ${error.message}`, 'error');
    }
}

async function waitForImages(element) {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even on error
        });
    });
    return Promise.all(promises);
}

// Pre-fetch Google Fonts CSS to help html2canvas
async function injectGoogleFonts() {
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@400;700&family=Poppins:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@700&family=Roboto:wght@400;700&display=swap';
    try {
        const response = await fetch(fontUrl);
        if (response.ok) {
            const cssText = await response.text();
            const style = document.createElement('style');
            style.id = 'manual-google-fonts';
            style.innerHTML = cssText;
            document.head.appendChild(style);
            console.log('✅ Fontes do Google injetadas manualmente para exportação.');
        }
    } catch (e) {
        console.warn('⚠️ Falha ao injetar fontes manualmente:', e);
    }
}

/**
 * Ensures all custom fonts are fully loaded before rendering
 */
async function waitForFonts() {
    // 1. Force a browser layout reflow to ensure it knows fonts are needed
    document.body.offsetHeight;

    // 2. Wait for fonts API
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    // 3. Extra safety delay
    return new Promise(resolve => setTimeout(resolve, 500));
}

// PDF EXPORT CORE
async function exportToPDF(mode) {
    if (!state.generatedQuiz) {
        showStatus('Nenhum quiz gerado para exportar', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    // Create PDF in landscape mode. 
    // Using a large enough format to keep quality, 16:9 proportion.
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080]
    });

    const questions = state.generatedQuiz.questions;
    showStatus(`📄 Gerando PDF (${mode})... Isso pode levar algum tempo.`, 'success');

    try {
        const pagesToRender = [];

        if (mode === 'questions-only') {
            questions.forEach((q, i) => pagesToRender.push({ q, index: i, isAnswer: false }));
        } else if (mode === 'answers-only') {
            questions.forEach((q, i) => pagesToRender.push({ q, index: i, isAnswer: true }));
        } else if (mode === 'sequential') {
            questions.forEach((q, i) => {
                pagesToRender.push({ q, index: i, isAnswer: false });
                pagesToRender.push({ q, index: i, isAnswer: true });
            });
        } else if (mode === 'grouped') {
            // All questions first
            questions.forEach((q, i) => pagesToRender.push({ q, index: i, isAnswer: false }));
            // All answers after
            questions.forEach((q, i) => pagesToRender.push({ q, index: i, isAnswer: true }));
        }

        for (let i = 0; i < pagesToRender.size || i < pagesToRender.length; i++) {
            const item = pagesToRender[i];
            showStatus(`📄 Renderizando página ${i + 1}/${pagesToRender.length}...`, 'success');

            const canvas = await renderCardToCanvas(item.q, item.isAnswer);
            const imgData = canvas.toDataURL('image/jpeg', 0.9); // Using JPEG for smaller PDF size if many pages

            if (i > 0) {
                pdf.addPage([1920, 1080], 'landscape');
            }

            pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
        }

        const filename = `quiz_${mode}_${new Date().getTime()}.pdf`;
        pdf.save(filename);
        showStatus('✅ PDF exportado com sucesso!', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showStatus(`❌ Erro ao gerar PDF: ${error.message}`, 'error');
    }
}

async function renderCardToCanvas(question, isAnswer) {
    const card = createExportCard(question, isAnswer, null, state.currentConfig?.language);
    document.body.appendChild(card);

    try {
        await waitForImages(card);
        await waitForFonts();
        const canvas = await html2canvas(card, {
            width: 1920,
            height: 1080,
            scale: 1,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            allowTaint: false
        });
        document.body.removeChild(card);
        return canvas;
    } catch (error) {
        if (card.parentNode) document.body.removeChild(card);
        throw error;
    }
}

async function generateQuestionImage(question, index) {
    const card = createExportCard(question, false, null, state.currentConfig?.language);
    document.body.appendChild(card);

    try {
        // Wait for images and fonts to load before rendering
        await waitForImages(card);
        await waitForFonts();

        const canvas = await html2canvas(card, {
            width: 1920,
            height: 1080,
            scale: 1,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            allowTaint: false
        });

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                document.body.removeChild(card);
                resolve(blob);
            }, 'image/png');
        });
    } catch (error) {
        document.body.removeChild(card);
        throw error;
    }
}

async function generateAnswerImage(question, index) {
    const card = createExportCard(question, true, null, state.currentConfig?.language);
    document.body.appendChild(card);

    try {
        // Wait for images and fonts to load before rendering
        await waitForImages(card);
        await waitForFonts();

        const canvas = await html2canvas(card, {
            width: 1920,
            height: 1080,
            scale: 1,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            allowTaint: false
        });

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                document.body.removeChild(card);
                resolve(blob);
            }, 'image/png');
        });
    } catch (error) {
        document.body.removeChild(card);
        throw error;
    }
}

function createExportCard(question, showAnswer, customStyles = null, language = null) {
    const card = document.createElement('div');
    const imageUrl = showAnswer ? question.answerImageUrl : question.questionImageUrl;
    const styles = customStyles || state.cardStyle;
    const lang = language || state.currentConfig?.language || 'Português';

    const formattedNumber = formatQuestionNumber(question.number, styles.numberFormat, lang);
    const layout = styles.layout || 'default';

    // 1. Base Styles & Variables (Still useful for container layout)
    card.className = `export-card ${layout === 'image-right' ? 'layout-image-right' : ''}`;
    card.style.setProperty('--color-primary', styles.colorPrimary);
    card.style.setProperty('--color-accent', styles.colorAccent);
    card.style.setProperty('--card-bg-custom', styles.colorCardBg);

    // Scaling factor (Export is ~4x larger)
    const radiusScale = 4.0;

    // 2. Explicit Style Calculation for Inline Injection (Fonts & Sizes)
    // Fonts
    const fontNum = styles.fontFamilyNumber || styles.fontFamily || "'Inter', sans-serif";
    const fontQ = styles.fontFamilyQuestion || styles.fontFamily || "'Inter', sans-serif";
    const fontAlt = styles.fontFamilyAlternatives || styles.fontFamily || "'Inter', sans-serif";
    const fontJust = styles.fontFamilyJustification || styles.fontFamily || "'Inter', sans-serif";

    // Sizes (px)
    const scaleNum = (styles.fontSizeNumber || 100) / 100;
    const scaleQ = (styles.fontSizeQuestion || 100) / 100;
    const scaleAlt = (styles.fontSizeAlternatives || 100) / 100;
    const scaleJust = (styles.fontSizeJustification || 100) / 100;

    const sizeNum = `${36 * scaleNum}px`;
    const sizeQ = `${45 * scaleQ}px`;
    const sizeAlt = `${30 * scaleAlt}px`;
    const sizeJust = `${30 * scaleJust}px`;

    // Colors
    const colNum = styles.colorTextNumber || '#ffffff';
    const colQ = styles.colorTextQuestion || '#ffffff';
    const colAlt = styles.colorTextAlternatives || '#ffffff';
    const colJust = styles.colorTextJustification || '#ffffff'; // Fallback to white if undefined

    // Apply layout variables for CSS positioning (keep these as variables as layout relies on them)
    // CSS Variables for Dimensions & Radius
    const rNum = (styles.radiusNumber ?? 15) * radiusScale;
    const rAlt = (styles.radiusAlternatives ?? 20) * radiusScale;
    const rJust = (styles.radiusJustification ?? 20) * radiusScale;
    const rFio = (styles.radiusFio ?? 20) * radiusScale;

    card.style.setProperty('--radius-num', `${rNum}px`);
    card.style.setProperty('--radius-alt', `${rAlt}px`);
    card.style.setProperty('--alt-width', `${styles.widthAlternatives ?? 100}%`);
    card.style.setProperty('--radius-just', `${rJust}px`);
    card.style.setProperty('--just-width', `${styles.widthJustification ?? 100}%`);

    // CSS Variables for Colors (Essential for .correct class and other CSS hooks)
    card.style.setProperty('--color-correct', styles.colorCorrect || '#22c55e');
    card.style.setProperty('--color-correct-border', styles.colorCorrectBorder || styles.colorCorrect || '#22c55e');
    card.style.setProperty('--color-just-bg', styles.colorJustificationBg || '#166534');
    card.style.setProperty('--color-just-border', styles.colorJustificationBorder || '#22c55e');
    card.style.setProperty('--color-text-just', styles.colorTextJustification || '#ffffff');
    card.style.setProperty('--color-text-q', colQ);
    card.style.setProperty('--color-text-alt', colAlt);
    card.style.setProperty('--color-text-num', colNum);

    // Y-Offsets
    card.style.setProperty('--y-offset-num', `${(styles.yOffsetNumber ?? 0) * radiusScale}px`);
    card.style.setProperty('--y-offset-q', `${(styles.yOffsetQuestion ?? 0) * radiusScale}px`);
    card.style.setProperty('--y-offset-alt', `${(styles.yOffsetAlternatives ?? 0) * radiusScale}px`);
    card.style.setProperty('--y-offset-alt-img', `${(styles.yOffsetAlternativesImage ?? 0) * radiusScale}px`);
    card.style.setProperty('--y-offset-just', `${(styles.yOffsetJustification ?? 0) * radiusScale}px`);
    card.style.setProperty('--y-offset-img', `${(styles.yOffsetImage ?? 0) * radiusScale}px`);

    // Alternatives Box Styles (Variables needed for ::before/::after or background)
    card.style.setProperty('--alt-bg-opacity', question.altBgOpacity ?? styles.globalAltBgOpacity ?? 0.05);
    card.style.setProperty('--alt-border-opacity', question.altBorderOpacity ?? styles.globalAltBorderOpacity ?? 0.1);
    card.style.setProperty('--alt-bg-rgb', hexToRgbComponents(question.altBgColor || styles.globalAltBgColor || '#ffffff'));
    card.style.setProperty('--alt-border-rgb', hexToRgbComponents(question.altBorderColor || styles.globalAltBorderColor || '#ffffff'));


    // 3. Fio (Inner Border) Logic
    let fioHTML = '';
    if (styles.fioVisible) {
        const fioColor = styles.fioColor || '#ffffff';
        const fioThickness = (styles.fioThickness ?? 4) * radiusScale;
        const fioOffset = (styles.fioOffset ?? 30) * radiusScale;
        // Injecting inline styles for robustness
        fioHTML = `<div class="card-fio" style="
            position: absolute;
            top: ${fioOffset}px; left: ${fioOffset}px; right: ${fioOffset}px; bottom: ${fioOffset}px;
            border: ${fioThickness}px solid ${fioColor};
            border-radius: ${rFio}px;
            pointer-events: none;
            z-index: 5;
            opacity: 1;
        "></div>`;
    }

    // 4. Background Image
    const bgImage = question.backgroundImage || styles.bgImage;
    let backgroundHTML = '';
    if (bgImage) {
        const isIndividual = !!question.backgroundImage;
        const bgOpacity = question.bgOpacity ?? (isIndividual ? 1.0 : (styles.bgImageOpacity || 1.0));
        const bgBrightness = question.bgBrightness ?? 1.0;
        const bgOverlayOpacity = question.bgOverlayOpacity ?? styles.bgOpacity;

        backgroundHTML = `
            <div class="card-bg-image" style="background-image: url('${bgImage}'); opacity: ${bgOpacity}; filter: brightness(${bgBrightness});"></div>
            <div class="card-bg-overlay" style="background-color: rgba(0,0,0,${bgOverlayOpacity});"></div>
        `;
    } else {
        // Just the overlay
        backgroundHTML = `<div class="card-bg-overlay" style="background-color: rgba(0,0,0,${styles.bgOpacity ?? 0.5});"></div>`;
    }
    card.style.backgroundColor = styles.colorCardBg; // Ensuring bg color

    // 5. Build Content with INLINE STYLES
    let alternativesHTML = '';
    question.alternatives.forEach((alt) => {
        const isCorrect = showAnswer && alt === question.correctAnswer;
        const altCol = question.altTextColor || colAlt;

        let altStyle = `font-family: ${fontAlt} !important; font-size: ${sizeAlt} !important; color: ${altCol} !important;`;

        if (isCorrect) {
            const correctBg = styles.colorCorrect || '#22c55e';
            const correctBorder = styles.colorCorrectBorder || correctBg;
            altStyle += ` background-color: ${correctBg} !important; border-color: ${correctBorder} !important; background-image: none !important; color: #ffffff !important; opacity: 1 !important;`;
        }

        alternativesHTML += `
        <div class="export-card-alternative ${isCorrect ? 'correct' : ''}" 
             style="${altStyle}">
             ${alt}
        </div>`;
    });

    const isJustificationVisible = elements.narrativeJustificationFormatSelect.value === 'both' || elements.narrativeJustificationFormatSelect.value === 'print-only';

    // Justification HTML with inline styles
    const answerText = cleanText(question.justification);

    // Calculate border width for lateral border (scaled)
    const lateralBorderWidth = 6 * radiusScale; // 24px for export

    // NOTE: Styles moved to INNER div to ensure the box wraps the content tightly (fit-content logic within percentage constraint)
    const answerHTML = (isJustificationVisible && answerText) ? `
        <div class="export-card-answer-section ${!showAnswer ? 'invisible' : ''}" 
             style="margin-top: auto; 
                    background: transparent !important; 
                    border: none !important;
                    width: 100% !important;
                    display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
                    padding: 0 !important; margin-bottom: 40px !important;">
            <div class="export-card-justification" 
                 style="font-family: ${fontJust} !important; font-size: ${sizeJust} !important; color: ${colJust} !important; 
                        text-align: center !important; word-spacing: normal !important; white-space: normal !important;
                        background: ${styles.colorJustificationBg || 'rgba(0,0,0,0.8)'} !important; 
                        border-left: ${lateralBorderWidth}px solid ${styles.colorJustificationBorder || '#22c55e'} !important;
                        border-radius: ${rJust}px !important;
                        width: ${styles.widthJustification ?? 100}% !important;
                        padding: 40px !important;
                        box-sizing: border-box !important;">
                 ${answerText}
            </div>
        </div>
    ` : '';

    // Image HTML (Right or Center)
    let imageHTML = '';
    if (layout === 'image-right') {
        if (imageUrl) {
            imageHTML = `<div class="export-card-image-container"><img src="${imageUrl}" alt="Imagem" class="export-card-image"></div>`;
        } else {
            imageHTML = `<div class="export-card-image-container"><div class="image-placeholder" style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.3);font-size:24px;">Sem imagem</div></div>`;
        }
    }

    const centerImageHTML = (layout === 'default' && imageUrl) ?
        `<div class="export-card-image-container-center"><img src="${imageUrl}" alt="Imagem" class="export-card-image"></div>` : '';

    // Final Assembly
    card.innerHTML = `
        ${backgroundHTML}
        ${fioHTML}
        <div class="export-card-content" style="position: relative; z-index: 10; width: 100%; height: 100%; display: flex; flex-direction: column;">
            <div class="export-card-header">
                <div class="export-card-number" 
                     style="font-family: ${fontNum} !important; font-size: ${sizeNum} !important; color: ${colNum} !important; display: inline-block;">
                     ${formattedNumber}
                </div>
            </div>
            
            <div class="export-card-main-content">
                <div class="export-card-text-content">
                    <div class="export-card-question" 
                         style="font-family: ${fontQ} !important; font-size: ${sizeQ} !important; color: ${colQ} !important;">
                         ${question.statement}
                    </div>
                    
                    <div class="export-card-alternatives">
                        ${alternativesHTML}
                    </div>
                    
                    ${answerHTML}
                </div>
                ${imageHTML}
            </div>
            ${centerImageHTML}
        </div>
    `;

    return card;
}

// ===================================
// COLOR PALETTE PRESETS
// ===================================
const colorPalettes = {
    default: {
        colorPrimary: '#6366f1',
        colorAccent: '#a855f7',
        colorCardBg: '#1e1e2e',
        colorTextNumber: '#ffffff',
        colorTextQuestion: '#ffffff',
        colorTextAlternatives: '#ffffff',
        colorTextJustification: '#ffffff',
        colorCorrect: '#22c55e',
        colorJustificationBg: '#166534',
        colorJustificationBorder: '#22c55e'
    },
    ocean: {
        colorPrimary: '#14b8a6',
        colorAccent: '#06b6d4',
        colorCardBg: '#0f2027',
        colorTextNumber: '#ffffff',
        colorTextQuestion: '#ffffff',
        colorTextAlternatives: '#ffffff',
        colorTextJustification: '#ffffff',
        colorCorrect: '#10b981',
        colorJustificationBg: '#064e3b',
        colorJustificationBorder: '#10b981'
    },
    sunset: {
        colorPrimary: '#f97316',
        colorAccent: '#ec4899',
        colorCardBg: '#1a1625',
        colorTextNumber: '#ffffff',
        colorTextQuestion: '#ffffff',
        colorTextAlternatives: '#ffffff',
        colorTextJustification: '#ffffff',
        colorCorrect: '#fbbf24',
        colorJustificationBg: '#78350f',
        colorJustificationBorder: '#fbbf24'
    },
    forest: {
        colorPrimary: '#22c55e',
        colorAccent: '#84cc16',
        colorCardBg: '#0a1f0a',
        colorTextNumber: '#ffffff',
        colorTextQuestion: '#ffffff',
        colorTextAlternatives: '#ffffff',
        colorTextJustification: '#ffffff',
        colorCorrect: '#84cc16',
        colorJustificationBg: '#14532d',
        colorJustificationBorder: '#84cc16'
    },
    royal: {
        colorPrimary: '#9333ea',
        colorAccent: '#6366f1',
        colorCardBg: '#1e1b2e',
        colorTextNumber: '#ffffff',
        colorTextQuestion: '#ffffff',
        colorTextAlternatives: '#ffffff',
        colorTextJustification: '#ffffff',
        colorCorrect: '#a78bfa',
        colorJustificationBg: '#4c1d95',
        colorJustificationBorder: '#a78bfa'
    },
    fire: {
        colorPrimary: '#ef4444',
        colorAccent: '#f97316',
        colorCardBg: '#1f1410',
        colorTextNumber: '#ffffff',
        colorTextQuestion: '#ffffff',
        colorTextAlternatives: '#ffffff',
        colorTextJustification: '#ffffff',
        colorCorrect: '#fb923c',
        colorJustificationBg: '#7c2d12',
        colorJustificationBorder: '#fb923c'
    },
    night: {
        colorPrimary: '#1e40af',
        colorAccent: '#7c3aed',
        colorCardBg: '#0c0a1f',
        colorTextNumber: '#ffffff',
        colorTextQuestion: '#ffffff',
        colorTextAlternatives: '#ffffff',
        colorTextJustification: '#ffffff',
        colorCorrect: '#60a5fa',
        colorJustificationBg: '#1e3a8a',
        colorJustificationBorder: '#60a5fa'
    },
    pastel: {
        colorPrimary: '#f9a8d4',
        colorAccent: '#93c5fd',
        colorCardBg: '#2d2438',
        colorTextNumber: '#ffffff',
        colorTextQuestion: '#ffffff',
        colorTextAlternatives: '#ffffff',
        colorTextJustification: '#ffffff',
        colorCorrect: '#a7f3d0',
        colorJustificationBg: '#065f46',
        colorJustificationBorder: '#a7f3d0'
    }
};

window.applyColorPalette = function (paletteName) {
    const palette = colorPalettes[paletteName];
    if (!palette) return;

    // Update all color inputs
    elements.cardColorPrimaryInput.value = palette.colorPrimary;
    elements.cardColorAccentInput.value = palette.colorAccent;
    elements.cardColorBgInput.value = palette.colorCardBg;
    elements.cardColorTextAlternativesInput.value = palette.colorTextAlternatives;
    elements.cardColorTextJustificationInput.value = palette.colorTextJustification;

    // Update real-time cards for background changes
    if (state.generatedQuiz) {
        const cards = document.querySelectorAll('.question-card');
        cards.forEach((card, i) => {
            const question = state.generatedQuiz.questions[i];
            const hasIndividualBg = !!question.backgroundImage;

            // Background update
            const bgImg = card.querySelector('.card-bg-image');
            const bgOverlay = card.querySelector('.card-bg-overlay');

            if (bgImg && !hasIndividualBg) {
                bgImg.style.opacity = elements.cardBgImageOpacityInput.value;
            }
            if (bgOverlay) {
                bgOverlay.style.backgroundColor = `rgba(0,0,0,${elements.cardBgOpacityInput.value})`;
            }

            // Text Color Update
            card.style.setProperty('--color-text-num', palette.colorTextNumber);
            card.style.setProperty('--color-text-q', palette.colorTextQuestion);
            if (!question.altTextColor) {
                card.style.setProperty('--color-text-alt', palette.colorTextAlternatives);
            }
        });
    }

    elements.cardColorCorrectInput.value = palette.colorCorrect;
    elements.cardColorJustificationBgInput.value = palette.colorJustificationBg;
    elements.cardColorJustificationBorderInput.value = palette.colorJustificationBorder;

    // Trigger preview update
    updateStylePreview();

    // Refresh the results panel if a quiz exists
    if (state.generatedQuiz) {
        displayQuiz(state.generatedQuiz, state.currentConfig);
    }

    showStatus(`✅ Paleta "${paletteName}" aplicada com todas as cores!`, 'success');
};

// ===================================
// UTILITY FUNCTIONS
// ===================================
window.hexToRgbComponents = function (hex) {
    if (!hex) return '255, 255, 255';
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
};

window.toggleGlobalSync = function (isChecked, sourceIndex) {
    state.sync_global = isChecked;

    if (isChecked && sourceIndex !== undefined && state.generatedQuiz) {
        const sourceQ = state.generatedQuiz.questions[sourceIndex];
        const propsToSync = [
            'bgBrightness', 'bgOpacity', 'bgOverlayOpacity',
            'altBgOpacity', 'altBorderOpacity',
            'altBgColor', 'altBorderColor', 'altTextColor'
        ];

        state.generatedQuiz.questions.forEach((q, idx) => {
            if (idx === sourceIndex) return;
            propsToSync.forEach(prop => {
                if (sourceQ[prop] !== undefined) {
                    q[prop] = sourceQ[prop];
                }
            });
            // Also sync layouts for total consistency
            q.questionLayout = sourceQ.questionLayout;
            q.answerLayout = sourceQ.answerLayout;
        });

        showStatus("🔗 Sincronização GLOBAL ativada e aplicada a todos os cards", "success");
    } else if (!isChecked) {
        showStatus("🔓 Sincronização GLOBAL desativada", "info");
    }

    // Re-render to update UI
    if (state.generatedQuiz) {
        displayQuiz(state.generatedQuiz, state.currentConfig);
    }
};

window.updateRealTimeStyle = function (index, group, property, value) {
    const isSynced = state.sync_global;
    const targetIndices = isSynced ? state.generatedQuiz.questions.map((_, i) => i) : [index];

    targetIndices.forEach(i => {
        const q = state.generatedQuiz.questions[i];
        q[property] = property.toLowerCase().includes('color') ? value : parseFloat(value);

        const wrapper = document.querySelector(`.question-card-wrapper[data-question-index="${i}"]`);
        if (!wrapper) return;

        const card = wrapper.querySelector('.question-card');

        // Update specific UI elements to keep them in sync visually
        if (property === 'bgBrightness') {
            const img = card.querySelector('.card-bg-image');
            if (img) img.style.filter = `brightness(${value})`;
            wrapper.querySelector('.bg-brightness-value').textContent = value;
            wrapper.querySelector('.edit-bg-brightness').value = value;
        } else if (property === 'bgOpacity') {
            const img = card.querySelector('.card-bg-image');
            if (img) img.style.opacity = value;
            wrapper.querySelector('.bg-opacity-value').textContent = value;
            wrapper.querySelector('.edit-bg-opacity').value = value;
        } else if (property === 'bgOverlayOpacity') {
            const overlay = card.querySelector('.card-bg-overlay');
            if (overlay) overlay.style.backgroundColor = `rgba(0,0,0,${value})`;
            wrapper.querySelector('.bg-overlay-value').textContent = value;
            wrapper.querySelector('.edit-bg-overlay').value = value;
        } else if (property === 'altBgOpacity') {
            card.style.setProperty('--alt-bg-opacity', value);
            wrapper.querySelector('.alt-bg-opacity-value').textContent = value;
            wrapper.querySelector('.edit-alt-bg-opacity').value = value;
        } else if (property === 'altBorderOpacity') {
            card.style.setProperty('--alt-border-opacity', value);
            wrapper.querySelector('.alt-border-opacity-value').textContent = value;
            wrapper.querySelector('.edit-alt-border-opacity').value = value;
        } else if (property === 'altBgColor') {
            card.style.setProperty('--alt-bg-rgb', hexToRgbComponents(value));
            wrapper.querySelector('.edit-alt-bg-color').value = value;
        } else if (property === 'altBorderColor') {
            card.style.setProperty('--alt-border-rgb', hexToRgbComponents(value));
            wrapper.querySelector('.edit-alt-border-color').value = value;
        } else if (property === 'altTextColor') {
            card.style.setProperty('--color-text-alt', value);
            wrapper.querySelector('.edit-alt-text-color').value = value;
        }
    });
};

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID().toUpperCase();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16).toUpperCase();
    });
}

function safeCapCutName(text) {
    return text.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .trim();
}

async function exportCapCutProject() {
    if (!state.generatedQuiz) {
        showStatus('Nenhum quiz gerado para exportar', 'error');
        return;
    }

    const rawTitle = state.generatedQuiz.title || 'Quiz Gerado';
    const folderName = safeCapCutName(rawTitle);

    showStatus('🎬 Preparando projeto CapCut...', 'info');

    try {
        const zip = new JSZip();
        const quiz = state.generatedQuiz;
        const questions = quiz.questions;
        const includeAlternatives = elements.narrativeAlternativeFormatSelect.value !== 'omit';
        const timestamp = new Date().getTime();

        const projectId = generateUUID();
        const timelineId = generateUUID();
        const capcutBaseDir = "C:/Users/Pichau/AppData/Local/CapCut/User Data/Projects/com.lveditor.draft";
        const projectDir = `${capcutBaseDir}/${folderName}`;

        // 1. Render all images
        const mediaZipFolder = zip.folder("Resources");

        const t = state.timing;
        const DUR_QUESTION = t.statement * 1000000;
        const DUR_ALTS = t.alternatives * 1000000;
        const DUR_COUNTDOWN = t.timer * 1000000;
        const DUR_ANSWER = t.answer * 1000000;

        // Also add intro/outro/cta if we decide to include them in CapCut in the future,
        // for now keeping segmented logic as is but using state values.

        const materials = {
            videos: [], audios: [], texts: [], material_animations: [], placeholders: [], speeds: [], common_mask: [],
            chromas: [], text_templates: [], realtime_denoises: [], audio_pannings: [], audio_pitch_shifts: [],
            video_trackings: [], hsl: [], drafts: [], color_curves: [], hsl_curves: [], primary_color_wheels: [],
            log_color_wheels: [], video_effects: [], audio_balances: [], handwrites: [], manual_deformations: [],
            manual_beautys: [], plugin_effects: [], sound_channel_mappings: [], green_screens: [], shapes: [],
            material_colors: [], digital_humans: [], digital_human_model_dressing: [], smart_crops: [],
            ai_translates: [], audio_track_indexes: [], loudnesses: [], vocal_beautifys: [], vocal_separations: [],
            smart_relights: [], time_marks: [], multi_language_refs: [], video_shadows: [], video_strokes: [],
            video_radius: []
        };

        const videoSegments = [];
        let currentTimelineTime = 0;

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const qBlob = await generateQuestionImage(q, i);
            const numStr = (i + 1).toString().padStart(2, '0');
            const qFileName = `${numStr}a.png`;
            mediaZipFolder.file(qFileName, qBlob);
            if (i === 0) zip.file("draft_cover.jpg", qBlob);

            const qMatId = generateUUID();
            materials.videos.push({
                id: qMatId,
                path: `${projectDir}/Resources/${qFileName}`,
                type: "video", duration: DUR_QUESTION, width: 1920, height: 1080
            });
            videoSegments.push(createCapCutSegment(qMatId, currentTimelineTime, DUR_QUESTION));
            currentTimelineTime += DUR_QUESTION;

            if (includeAlternatives) {
                videoSegments.push(createCapCutSegment(qMatId, currentTimelineTime, DUR_ALTS));
                currentTimelineTime += DUR_ALTS;
            }
            currentTimelineTime += DUR_COUNTDOWN;

            const aBlob = await generateAnswerImage(q, i);
            const aFileName = `${numStr}b.png`;
            mediaZipFolder.file(aFileName, aBlob);
            const aMatId = generateUUID();
            materials.videos.push({
                id: aMatId,
                path: `${projectDir}/Resources/${aFileName}`,
                type: "video", duration: DUR_ANSWER, width: 1920, height: 1080
            });
            videoSegments.push(createCapCutSegment(aMatId, currentTimelineTime, DUR_ANSWER));
            currentTimelineTime += DUR_ANSWER;
        }

        const draftContent = {
            id: timelineId, version: 600000, new_version: "8.1.1", fps: 30.0, duration: currentTimelineTime,
            canvas_config: { height: 1080, ratio: "original", width: 1920 },
            config: {
                video_mute: false, record_audio_last_index: 1, extract_audio_last_index: 1, original_sound_last_index: 1,
                subtitle_sync: true, lyrics_sync: true, sticker_max_index: 1, adjust_max_index: 1, material_save_mode: 0,
                maintrack_adsorb: true, combination_max_index: 1, use_float_render: false
            },
            materials: materials,
            tracks: [{ id: generateUUID(), type: "video", segments: videoSegments, name: "Video Track 1", flag: 0, attribute: 0, is_default_name: true }],
            keyframes: { videos: [], audios: [], texts: [], stickers: [], filters: [], adjusts: [], handwrites: [], effects: [] },
            platform: { os: "windows", app_version: "8.1.1", app_id: 359289, app_source: "cc" }
        };

        zip.file("draft_content.json", JSON.stringify(draftContent, null, 2));

        // 3. Build Timelines Structure
        const timelinesFolder = zip.folder("Timelines");
        const timelineProject = {
            config: { color_space: -1, render_index_track_mode_on: false, use_float_render: false },
            create_time: timestamp * 1000,
            id: timelineId,
            main_timeline_id: timelineId,
            timelines: [{
                create_time: timestamp * 1000, id: timelineId, is_marked_delete: false, name: "Linha do tempo 01", update_time: timestamp * 1000
            }],
            update_time: timestamp * 1000, version: 0
        };
        timelinesFolder.file("project.json", JSON.stringify(timelineProject, null, 2));
        timelinesFolder.folder(timelineId).file("draft_content.json", JSON.stringify(draftContent, null, 2));

        // 4. Build draft_meta_info.json
        const draftMeta = {
            draft_cover: "draft_cover.jpg",
            draft_fold_path: projectDir,
            draft_id: projectId,
            draft_name: rawTitle,
            draft_root_path: capcutBaseDir,
            tm_draft_create: timestamp * 1000,
            tm_draft_modified: timestamp * 1000,
            tm_duration: currentTimelineTime,
            draft_type: "video"
        };
        zip.file("draft_meta_info.json", JSON.stringify(draftMeta, null, 2));

        zip.file("draft_settings", `[General]\ndraft_create_time=${Math.floor(timestamp / 1000)}\ndraft_last_edit_time=${Math.floor(timestamp / 1000)}\nreal_edit_seconds=0\nreal_edit_keys=0\ncloud_last_modify_platform=windows\n`);

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folderName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus('✅ Projeto CapCut exportado!', 'success');
        alert(`Projeto "${rawTitle}" pronto!\n\nImportante:\n1. Extraia na pasta rascunhos\n2. A pasta DEVE se chamar: ${folderName}`);

    } catch (error) {
        console.error('Error exporting CapCut project:', error);
        showStatus(`❌ Erro ao exportar para CapCut: ${error.message}`, 'error');
    }
}

async function exportIsolatedQuestion(index) {
    if (!state.generatedQuiz) return;
    const question = state.generatedQuiz.questions[index];
    showStatus(`📸 Gerando imagem da questão ${index + 1}...`, 'info');

    try {
        const blob = await generateQuestionImage(question, index);
        const numStr = (index + 1).toString().padStart(2, '0');
        const fileName = `${numStr}a.png`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showStatus(`✅ Questão ${index + 1} exportada!`, 'success');
    } catch (error) {
        console.error('Error exporting isolated question:', error);
        showStatus('❌ Erro ao exportar questão', 'error');
    }
}

async function exportIsolatedAnswer(index) {
    if (!state.generatedQuiz) return;
    const question = state.generatedQuiz.questions[index];
    showStatus(`📸 Gerando imagem da resposta ${index + 1}...`, 'info');

    try {
        const blob = await generateAnswerImage(question, index);
        const numStr = (index + 1).toString().padStart(2, '0');
        const fileName = `${numStr}b.png`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showStatus(`✅ Resposta ${index + 1} exportada!`, 'success');
    } catch (error) {
        console.error('Error exporting isolated answer:', error);
        showStatus('❌ Erro ao exportar resposta', 'error');
    }
}

// ===================================
// BRAINSTORM CHAT LOGIC
// ===================================
function initBrainstormListeners() {
    if (elements.openBrainstormBtn) {
        elements.openBrainstormBtn.addEventListener('click', openBrainstorm);
    }
    if (elements.closeBrainstormBtn) {
        elements.closeBrainstormBtn.addEventListener('click', closeBrainstorm);
    }
    if (elements.sendBrainstormBtn) {
        elements.sendBrainstormBtn.addEventListener('click', sendBrainstormMessage);
    }
    if (elements.brainstormInput) {
        elements.brainstormInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBrainstormMessage();
            }
        });
    }

    // Modal overlay close
    if (elements.brainstormModal) {
        elements.brainstormModal.querySelector('.modal-overlay').addEventListener('click', closeBrainstorm);
    }
}

function openBrainstorm() {
    elements.brainstormModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    elements.brainstormInput.focus();

    // Scroll to bottom
    const history = elements.brainstormChatHistory;
    history.scrollTop = history.scrollHeight;
}

function closeBrainstorm() {
    elements.brainstormModal.classList.add('hidden');
    document.body.style.overflow = '';
}

async function sendBrainstormMessage() {
    const text = elements.brainstormInput.value.trim();
    if (!text) return;

    // Clear input
    elements.brainstormInput.value = '';

    // Add User Message
    appendMessageToChat('user', text);
    state.brainstormHistory.push({ role: 'user', content: text });

    // Show Loading
    const loadingId = showChatLoading();

    try {
        const responseText = await callOpenAIBrainstorm(state.brainstormHistory);

        // Remove loading
        removeChatLoading(loadingId);

        // Add System Message
        appendMessageToChat('system', responseText);
        state.brainstormHistory.push({ role: 'assistant', content: responseText });

    } catch (error) {
        removeChatLoading(loadingId);
        appendMessageToChat('system', `❌ Erro: ${error.message}`);
        console.error(error);
    }
}

function showChatLoading() {
    const id = 'loading-' + Date.now();
    const html = `
        <div id="${id}" class="chat-loading">
            <div class="chat-dot"></div>
            <div class="chat-dot"></div>
            <div class="chat-dot"></div>
        </div>
    `;
    elements.brainstormChatHistory.insertAdjacentHTML('beforeend', html);
    elements.brainstormChatHistory.scrollTop = elements.brainstormChatHistory.scrollHeight;
    return id;
}

function removeChatLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function appendMessageToChat(role, text) {
    const div = document.createElement('div');
    div.className = `chat-message ${role}`;

    // Simple formatting
    let formattedText = text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/### (.*?)(<br>|$)/g, '<h3>$1</h3>')
        .replace(/- (.*?)(<br>|$)/g, '<ul><li>$1</li></ul>');

    // Clean up lists (very basic regex, can be improved but works for simple lists)
    formattedText = formattedText.replace(/<\/ul><br><ul>/g, '');

    div.innerHTML = formattedText;

    // Add Copy Button for System messages if they contain the magic section
    if (role === 'system' && (text.includes('Texto para') || text.includes('Detalhes sobre o Tema'))) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-suggestion-btn';
        copyBtn.innerHTML = '📝 Usar como Detalhes';
        copyBtn.onclick = () => {
            const detailsText = extractDetailsText(text);
            if (detailsText) {
                elements.detailsTextarea.value = detailsText;
                elements.detailsTextarea.style.borderColor = 'var(--color-success)';
                setTimeout(() => elements.detailsTextarea.style.borderColor = '', 2000);

                showStatus('✅ Texto aplicado aos Detalhes sobre o Tema!', 'success');
                closeBrainstorm();
            } else {
                navigator.clipboard.writeText(text);
                showStatus('Texto completo copiado!', 'success');
            }
        };
        div.appendChild(copyBtn);
    }

    elements.brainstormChatHistory.appendChild(div);
    elements.brainstormChatHistory.scrollTop = elements.brainstormChatHistory.scrollHeight;
}

function extractDetailsText(fullText) {
    // Try to find the section starting with "6." or similar
    // The prompt asks for "6. 📝 Texto para 'Detalhes sobre o Tema'"

    const markers = ['6. 📝', '6.', 'Texto para', 'Detalhes sobre o Tema'];

    let startIndex = -1;
    for (const marker of markers) {
        const idx = fullText.indexOf(marker);
        if (idx !== -1) {
            // Find the next newline after the marker to start capturing content
            const nextLine = fullText.indexOf('\n', idx);
            // If newline found, start after it. If not (weird case), start after marker.
            startIndex = nextLine !== -1 ? nextLine + 1 : idx + marker.length;
            break;
        }
    }

    if (startIndex !== -1) {
        return fullText.substring(startIndex).trim();
    }
    return fullText; // Fallback
}

async function callOpenAIBrainstorm(history) {
    const systemPrompt = `Você é o Estrategista Avançado do "Quiz Generator", especialista em configurar roteiros para IA.
    
OBJETIVO: Guiar o usuário para criar o MELHOR prompt de "Detalhes sobre o Tema".

REGRAS CRÍTICAS PARA A SEÇÃO "TEXTO PARA DETALHES":
1. O texto gerado nesta seção será colado diretamente no campo "Detalhes sobre o Tema" do gerador.
2. DEVE incluir: O Tema refinado, O Enfoque Específico, Estilo da Narrativa desejada (se relevante) e Tópicos obrigatórios.
3. PROIBIDO INCLUIR: Nível de Dificuldade, Formato (Quiz/Série) e Número de Alternativas. (Estes dados já são inseridos automaticamente pelo configurador do app).
4. SE sugerir questões específicas, ELAS DEVEM SER COMPATÍVEIS COM MÚLTIPLA ESCOLHA.
   - O Enunciado deve ser sempre uma PERGUNTA DIRETA e CLARA (nunca um texto abstrato).
   - Mesmo que o tema seja de alta dificuldade ou contenha "pegadinhas", a pergunta deve ter uma resposta correta definida.
   - Formato Obrigatório para sugestões: "Enunciado: [Pergunta Direta?] | Resposta Correta: [Texto] | Justificativa: [Texto]"

ESTRUTURA DA RESPOSTA (Use Markdown simples):
1. 🎯 Refinamento do Tema (Foco e Nicho)
2. 📐 Ângulos Criativos (Ideias fora da caixa)
3. 🏗️ Blueprint de Conteúdo (Use o formato Enunciado/Resposta/Justificativa se citar questões)
4. 📝 Texto para 'Detalhes sobre o Tema' (Bloco de texto denso e diretivo para a IA geradora, seguindo as regras acima)

Se o usuário já estiver conversando, mantenha o contexto.
Responda sempre em Português.`;

    // Filter history to last 10 messages to save context window
    const recentHistory = history.slice(-10);

    const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory
    ];

    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: state.model,
            messages: messages,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro na API');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function createCapCutSegment(materialId, startTime, duration) {
    const segmentId = generateUUID();
    return {
        id: segmentId,
        material_id: materialId,
        source_timerange: { start: 0, duration: duration },
        target_timerange: { start: startTime, duration: duration },
        render_index: 0,
        track_render_index: 0,
        visible: true,
        volume: 1.0,
        speed: 1.0,
        extra_material_refs: []
    };
}

// ===================================
// REGENERATE QUESTION LOGIC
// ===================================

let regenerateTargetIndex = null;

function initRegenerateListeners() {
    if (elements.closeRegenerateModalBtn) {
        elements.closeRegenerateModalBtn.addEventListener('click', closeRegenerateModal);
    }

    if (elements.regenerateModal) {
        const overlay = elements.regenerateModal.querySelector('.modal-overlay');
        if (overlay) overlay.addEventListener('click', closeRegenerateModal);
    }

    if (elements.regenerateCustomBtn) {
        elements.regenerateCustomBtn.addEventListener('click', () => {
            const prompt = elements.regeneratePromptInput.value;
            regenerateQuestion(regenerateTargetIndex, prompt);
        });
    }

    if (elements.regenerateRandomBtn) {
        elements.regenerateRandomBtn.addEventListener('click', () => {
            regenerateQuestion(regenerateTargetIndex, null);
        });
    }
}

// ===================================
// TIMING MANAGEMENT LOGIC
// ===================================

function initTimingListeners() {
    if (elements.openTimingModalBtn) {
        elements.openTimingModalBtn.onclick = openTimingModal;
    }
    if (elements.closeTimingModalBtn) {
        elements.closeTimingModalBtn.onclick = closeTimingModal;
    }
    if (elements.saveTimingBtn) {
        elements.saveTimingBtn.onclick = saveTiming;
    }
    if (elements.resetTimingBtn) {
        elements.resetTimingBtn.onclick = resetTiming;
    }

    // Overlay close
    const overlay = elements.timingModal ? elements.timingModal.querySelector('.modal-overlay') : null;
    if (overlay) {
        overlay.onclick = closeTimingModal;
    }
}

function openTimingModal() {
    if (!elements.timingModal) return;

    // Populate inputs with current state
    const t = state.timing;
    elements.timeIntroInput.value = t.intro;
    elements.timeCTAInput.value = t.cta;
    elements.timeStatementInput.value = t.statement;
    elements.timeAlternativesInput.value = t.alternatives;
    elements.timeTimerInput.value = t.timer;
    elements.timeAnswerInput.value = t.answer;
    elements.timeOutroInput.value = t.outro;

    elements.timingModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeTimingModal() {
    if (elements.timingModal) {
        elements.timingModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function saveTiming() {
    state.timing = {
        intro: parseFloat(elements.timeIntroInput.value) || 15,
        cta: parseFloat(elements.timeCTAInput.value) || 5,
        statement: parseFloat(elements.timeStatementInput.value) || 4,
        alternatives: parseFloat(elements.timeAlternativesInput.value) || 4,
        timer: parseFloat(elements.timeTimerInput.value) || 0,
        answer: parseFloat(elements.timeAnswerInput.value) || 15,
        outro: parseFloat(elements.timeOutroInput.value) || 10
    };

    localStorage.setItem('quiz_timing', JSON.stringify(state.timing));
    showStatus('✅ Configurações de tempo salvas com sucesso!', 'success');
    closeTimingModal();
}

function resetTiming() {
    if (confirm('Deseja resetar os tempos para os padrões originais?')) {
        state.timing = { ...DEFAULT_TIMING };
        localStorage.setItem('quiz_timing', JSON.stringify(state.timing));
        openTimingModal(); // Refresh inputs
        showStatus('♻️ Tempos resetados para o padrão', 'info');
    }
}

function openRegenerateModal(index) {
    if (typeof index !== 'number' || isNaN(index)) {
        console.error('Index inválido para regeneração:', index);
        return;
    }
    regenerateTargetIndex = index;
    if (elements.regenerateModal) {
        elements.regenerateModal.classList.remove('hidden');
        if (elements.regeneratePromptInput) {
            elements.regeneratePromptInput.value = '';
            elements.regeneratePromptInput.focus();
        }
    }
}

function closeRegenerateModal() {
    if (elements.regenerateModal) elements.regenerateModal.classList.add('hidden');
    regenerateTargetIndex = null;
}

async function regenerateQuestion(index, customPrompt) {
    if (index === null || index === undefined || !state.generatedQuiz) {
        showStatus('❌ Erro interno: Question index ou Quiz state ausente.', 'error');
        return;
    }

    closeRegenerateModal();
    const qNum = index + 1;
    showStatus(`⚡ Gerando nova versão da questão ${qNum}...`, 'info');

    try {
        const promptParams = buildRegeneratePrompt(index, customPrompt);

        // Ensure we have a model selected
        const activeModel = state.model || 'gpt-4o';

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: activeModel,
                messages: [
                    { role: 'system', content: `Você é um gerador de questões JSON especialista em quizzes educacionais. Gere APENAS o JSON solicitado, sem markdown ou explicações externas.` },
                    { role: 'user', content: promptParams }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Erro na API');
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // Clean markdown
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        // Try parsing
        let newQuestion;
        try {
            newQuestion = JSON.parse(content);
        } catch (e) {
            console.error("Failed JSON:", content);
            throw new Error("IA não retornou um JSON válido.");
        }

        // Validate basic structure
        if (!newQuestion.statement || !newQuestion.correctAnswer) {
            throw new Error("JSON incompleto retornado pela IA");
        }

        // Maintain the original number to avoid breaking sequence
        newQuestion.number = state.generatedQuiz.questions[index].number;

        // Update State
        state.generatedQuiz.questions[index] = newQuestion;

        // Re-render
        displayQuiz(state.generatedQuiz, state.currentConfig);
        showStatus(`✅ Questão ${qNum} regenerada com sucesso!`, 'success');

    } catch (error) {
        console.error('Erro na regeneração:', error);
        showStatus(`❌ Falha ao regenerar: ${error.message}`, 'error');
    }
}

function buildRegeneratePrompt(index, customPrompt) {
    // Safety check for config: if missing (imported quiz), build a fallback from state and current UI
    const config = state.currentConfig || {
        theme: state.generatedQuiz?.title || 'conhecimentos gerais',
        difficulty: 'Médio',
        language: 'Português',
        numAlternatives: state.generatedQuiz?.questions[0]?.alternatives?.length || 4
    };

    // Get list of existing statements to avoid duplicates
    const existingQuestions = state.generatedQuiz.questions.map(q => q.statement).slice(0, 50).join(' | ');

    // Determine number of alternatives
    const numAlts = parseInt(config.numAlternatives) || 4;
    const letters = ['A)', 'B)', 'C)', 'D)', 'E)'];
    const exampleAlts = letters.slice(0, numAlts).map(l => `"${l} ..."`);
    const altsStructure = `[${exampleAlts.join(', ')}]`;

    // We reuse the structure from buildSystemPrompt but condensed
    return `
CONTEXTO:
Estou criando um quiz sobre "${config.theme}" (Dificuldade: ${config.difficulty}, Idioma: ${config.language}).
Já tenho estas perguntas (NÃO REPITA): ${existingQuestions}

TAREFA:
Crie UMA NOVA questão (JSON) para substituir a questão número ${index + 1}.
A questão deve ter EXATAMENTE ${numAlts} alternativas.

${customPrompt ? `REQUISITO DO USUÁRIO: A questão deve ser sobre: "${customPrompt}"` : `REQUISITO: Gere uma questão aleatória dentro do tema, criativa e diferente das anteriores.`}

ESTRUTURA JSON OBRIGATÓRIA:
{
  "number": ${index + 1},
  "statement": "Pergunta clara e direta",
  "questionImagePrompt": "Termo de busca em Inglês (ex: 'Lion')",
  "alternatives": ${altsStructure},
  "correctAnswer": "A) ...",
  "answerImagePrompt": "Termo de busca em Inglês",
  "justification": "Explicação breve em ${config.language}",
  "narrative": "Texto para locução em ${config.language}"
}

IMPORTANTE:
1. Responda APENAS o JSON puro.
2. Imagens: Use termos de busca em INGLÊS, simples e diretos (ex: "Eiffel Tower").
3. A imagem da pergunta NÃO pode revelar a resposta.
`;
}

// ===================================
// START APPLICATION
// ===================================
document.addEventListener('DOMContentLoaded', init);
