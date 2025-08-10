/**
 * Main Application Controller - Orchestrates the entire personality assessment app
 * Handles screen transitions, user interactions, and data flow between modules
 */

class PersonalityApp {
    constructor() {
        // Initialize modules
        this.storage = new StorageManager();
        this.scoring = new ScoringEngine();
        this.characters = new CharacterEngine();
        this.visualizations = new VisualizationEngine();
        this.assessment = new AssessmentEngine();
        
        // Application state
        this.currentScreen = 'welcome';
        this.selectedMode = null;
        this.userProfile = null;
        this.characterMatches = [];
        
        // DOM elements
        this.screens = {};
        this.elements = {};
        
        // Initialize app
        this.initialize();
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Initializing Personify...');
            
            // Show loading screen
            this.showLoading();
            
            // Load DOM elements
            this.loadDOMElements();
            
            // Load external data
            await this.loadData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load user preferences
            this.loadUserPreferences();
            
            // Check for saved assessment
            this.checkSavedAssessment();
            
            // Show welcome screen
            this.hideLoading();
            this.showScreen('welcome');
            
            console.log('Personify initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize the application. Please refresh the page.');
        }
    }

    /**
     * Load DOM elements and cache references
     */
    loadDOMElements() {
        // Screens
        this.screens = {
            welcome: document.getElementById('welcome-screen'),
            assessment: document.getElementById('assessment-screen'),
            results: document.getElementById('results-screen')
        };

        // Main elements
        this.elements = {
            // Loading
            loadingScreen: document.getElementById('loading-screen'),
            
            // Welcome screen
            optionCards: document.querySelectorAll('.option-card'),
            startButton: document.getElementById('start-assessment'),
            resumeSection: document.getElementById('resume-section'),
            resumeButton: document.getElementById('resume-assessment'),
            startNewButton: document.getElementById('start-new'),
            
            // Navigation
            themeToggle: document.getElementById('theme-toggle'),
            saveProgress: document.getElementById('save-progress'),
            
            // Assessment screen
            questionCounter: document.getElementById('question-counter'),
            traitFocus: document.getElementById('trait-focus'),
            progressBar: document.querySelector('.progress-fill'),
            progressPercentage: document.getElementById('progress-percentage'),
            questionText: document.getElementById('question-text'),
            questionCategory: document.getElementById('question-category'),
            answerOptions: document.getElementById('answer-options'),
            prevButton: document.getElementById('prev-question'),
            nextButton: document.getElementById('next-question'),
            skipButton: document.getElementById('skip-question'),
            timeRemaining: document.getElementById('time-remaining'),
            
            // Results screen
            mbtiType: document.getElementById('mbti-type'),
            typeDescription: document.getElementById('type-description'),
            radarChart: document.getElementById('radar-chart'),
            traitBars: document.getElementById('trait-bars'),
            characterGrid: document.getElementById('character-grid'),
            downloadResults: document.getElementById('download-results'),
            shareResults: document.getElementById('share-results'),
            retakeAssessment: document.getElementById('retake-assessment'),
            
            // Modals
            characterModal: document.getElementById('character-modal'),
            settingsModal: document.getElementById('settings-modal'),
            
            // Error handling
            errorMessage: document.getElementById('error-message')
        };
    }

    /**
     * Load external data (questions, characters)
     */
    async loadData() {
        try {
            // Load questions
            await this.assessment.loadQuestions();
            
            // Load characters
            await this.characters.loadCharacters();
            
            console.log('External data loaded successfully');
        } catch (error) {
            console.warn('Some external data failed to load, using fallback data');
        }
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Welcome screen events
        this.setupWelcomeEvents();
        
        // Assessment screen events
        this.setupAssessmentEvents();
        
        // Results screen events
        this.setupResultsEvents();
        
        // Global events
        this.setupGlobalEvents();
        
        // Assessment engine callbacks
        this.setupAssessmentCallbacks();
    }

    /**
     * Set up welcome screen events
     */
    setupWelcomeEvents() {
        // Mode selection
        this.elements.optionCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectAssessmentMode(card.dataset.mode);
            });
        });

        // Start assessment
        this.elements.startButton?.addEventListener('click', () => {
            if (this.selectedMode) {
                this.startAssessment();
            }
        });

        // Resume assessment
        this.elements.resumeButton?.addEventListener('click', () => {
            this.resumeAssessment();
        });

        // Start new assessment
        this.elements.startNewButton?.addEventListener('click', () => {
            this.storage.clearAssessmentProgress();
            this.hideResumeSection();
        });
    }

    /**
     * Set up assessment screen events
     */
    setupAssessmentEvents() {
        // Answer selection
        this.elements.answerOptions?.addEventListener('change', (e) => {
            if (e.target.type === 'radio' && e.target.name === 'answer') {
                this.handleAnswerSelection(parseInt(e.target.value));
            }
        });

        // Navigation buttons
        this.elements.prevButton?.addEventListener('click', () => {
            this.assessment.previousQuestion();
        });

        this.elements.nextButton?.addEventListener('click', () => {
            this.assessment.nextQuestion();
        });

        this.elements.skipButton?.addEventListener('click', () => {
            this.assessment.skipQuestion();
        });

        // Auto-save progress
        this.elements.saveProgress?.addEventListener('click', () => {
            this.saveAssessmentProgress();
        });
    }

    /**
     * Set up results screen events
     */
    setupResultsEvents() {
        // Character cards
        this.elements.characterGrid?.addEventListener('click', (e) => {
            const characterCard = e.target.closest('.character-card');
            if (characterCard) {
                this.showCharacterDetail(characterCard.dataset.characterId);
            }
        });

        // Action buttons
        this.elements.downloadResults?.addEventListener('click', () => {
            this.downloadResults();
        });

        this.elements.shareResults?.addEventListener('click', () => {
            this.shareResults();
        });

        this.elements.retakeAssessment?.addEventListener('click', () => {
            this.retakeAssessment();
        });

        // Analysis tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchAnalysisTab(btn.dataset.tab);
            });
        });
    }

    /**
     * Set up global events
     */
    setupGlobalEvents() {
        // Theme toggle
        this.elements.themeToggle?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Modal handling
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            if (this.currentScreen === 'assessment') {
                this.saveAssessmentProgress();
            }
        });

        window.addEventListener('resize', () => {
            this.visualizations.resizeCharts();
        });
    }

    /**
     * Set up assessment engine callbacks
     */
    setupAssessmentCallbacks() {
        this.assessment.onQuestionChange = (question, index) => {
            this.updateQuestionDisplay(question, index);
        };

        this.assessment.onProgress = (progress) => {
            this.updateProgressDisplay(progress);
        };

        this.assessment.onComplete = (results) => {
            this.completeAssessment(results);
        };
    }

    /**
     * Show loading screen
     */
    showLoading() {
        const loading = this.elements.loadingScreen;
        if (loading) {
            loading.style.display = 'flex';
            loading.classList.remove('hidden');
        }
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loading = this.elements.loadingScreen;
        if (loading) {
            loading.classList.add('hidden');
            setTimeout(() => {
                loading.style.display = 'none';
                document.getElementById('app').style.display = 'block';
            }, 500);
        }
    }

    /**
     * Show specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });

        // Show target screen
        const targetScreen = this.screens[screenName];
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }

        // Update navigation visibility
        this.updateNavigationVisibility();
    }

    /**
     * Update navigation visibility based on current screen
     */
    updateNavigationVisibility() {
        const saveButton = this.elements.saveProgress;
        if (saveButton) {
            saveButton.style.display = this.currentScreen === 'assessment' ? 'flex' : 'none';
        }
    }

    /**
     * Select assessment mode
     */
    selectAssessmentMode(mode) {
        this.selectedMode = mode;
        
        // Update UI
        this.elements.optionCards.forEach(card => {
            card.classList.toggle('selected', card.dataset.mode === mode);
        });

        // Enable start button
        if (this.elements.startButton) {
            this.elements.startButton.disabled = false;
            this.elements.startButton.querySelector('.btn-text').textContent = 'Start Assessment';
        }
    }

    /**
     * Start new assessment
     */
    async startAssessment() {
        if (!this.selectedMode) return;

        try {
            // Initialize assessment
            const success = this.assessment.initializeAssessment(this.selectedMode);
            if (!success) {
                throw new Error('Failed to initialize assessment');
            }

            // Show assessment screen
            this.showScreen('assessment');
            
            // Display first question
            this.updateQuestionDisplay(this.assessment.getCurrentQuestion(), 0);
            this.updateProgressDisplay(this.assessment.progress);
            
            // Enable auto-save
            this.enableAutoSave();
            
        } catch (error) {
            console.error('Failed to start assessment:', error);
            this.showError('Failed to start assessment. Please try again.');
        }
    }

    /**
     * Resume saved assessment
     */
    resumeAssessment() {
        const saved = this.storage.loadAssessmentProgress();
        if (!saved) return;

        try {
            this.assessment.restoreState(saved);
            this.selectedMode = saved.mode;
            
            this.showScreen('assessment');
            this.updateQuestionDisplay(this.assessment.getCurrentQuestion(), this.assessment.currentQuestion);
            this.updateProgressDisplay(this.assessment.progress);
            
            this.enableAutoSave();
            
        } catch (error) {
            console.error('Failed to resume assessment:', error);
            this.showError('Failed to resume assessment. Starting fresh.');
            this.storage.clearAssessmentProgress();
        }
    }

    /**
     * Update question display
     */
    updateQuestionDisplay(question, index) {
        if (!question) return;

        // Update question text and metadata
        if (this.elements.questionText) {
            this.elements.questionText.textContent = question.text;
        }

        if (this.elements.questionCounter) {
            this.elements.questionCounter.textContent = 
                `Question ${index + 1} of ${this.assessment.progress.total}`;
        }

        if (this.elements.traitFocus) {
            this.elements.traitFocus.textContent = `Focus: ${question.primary_trait}`;
        }

        if (this.elements.questionCategory) {
            this.elements.questionCategory.textContent = question.category || 'Behavioral';
        }

        // Clear previous answers
        const radioButtons = this.elements.answerOptions?.querySelectorAll('input[type="radio"]');
        radioButtons?.forEach(radio => {
            radio.checked = false;
        });

        // Restore previous answer if it exists
        const previousAnswer = this.assessment.answers[index];
        if (previousAnswer && previousAnswer.answer) {
            const targetRadio = this.elements.answerOptions?.querySelector(`input[value="${previousAnswer.answer}"]`);
            if (targetRadio) {
                targetRadio.checked = true;
            }
        }

        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Update time estimate
        this.updateTimeEstimate();
    }

    /**
     * Update progress display
     */
    updateProgressDisplay(progress) {
        // Progress bar
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${progress.percentage}%`;
        }

        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = `${Math.round(progress.percentage)}%`;
        }

        // Trait progress in sidebar
        this.updateTraitProgress(progress.traitProgress);
    }

    /**
     * Update trait progress sidebar
     */
    updateTraitProgress(traitProgress) {
        const sidebar = document.querySelector('.trait-progress');
        if (!sidebar) return;

        sidebar.innerHTML = '';

        Object.entries(traitProgress).forEach(([trait, progress]) => {
            const item = document.createElement('div');
            item.className = 'trait-progress-item';
            
            item.innerHTML = `
                <span class="trait-name">${trait}</span>
                <span class="trait-questions">${progress.answered}/${progress.total}</span>
                <div class="trait-progress-bar">
                    <div class="trait-progress-fill" style="width: ${progress.percentage}%"></div>
                </div>
            `;

            sidebar.appendChild(item);
        });
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        if (this.elements.prevButton) {
            this.elements.prevButton.disabled = this.assessment.currentQuestion === 0;
        }

        if (this.elements.nextButton) {
            const hasAnswer = this.assessment.answers[this.assessment.currentQuestion]?.answer;
            this.elements.nextButton.disabled = !hasAnswer;
        }
    }

    /**
     * Update time estimate
     */
    updateTimeEstimate() {
        if (this.elements.timeRemaining) {
            const estimate = this.assessment.getTimeEstimate();
            this.elements.timeRemaining.textContent = `Estimated time: ${estimate} minutes`;
        }
    }

    /**
     * Handle answer selection
     */
    handleAnswerSelection(answer) {
        this.assessment.submitAnswer(answer);
        this.updateNavigationButtons();
        
        // Auto-advance after short delay
        setTimeout(() => {
            this.assessment.nextQuestion();
        }, 300);
    }

    /**
     * Complete assessment and calculate results
     */
    async completeAssessment(assessmentResults) {
        try {
            // Calculate personality scores
            const traitScores = this.scoring.calculateTraitScores(
                assessmentResults.responses, 
                assessmentResults.questions
            );

            const facetScores = this.scoring.calculateFacetScores(
                assessmentResults.responses,
                assessmentResults.questions,
                traitScores
            );

            const mbtiType = this.scoring.calculateMBTIType(traitScores);
            
            const confidenceIntervals = this.scoring.calculateConfidenceIntervals(
                assessmentResults.responses,
                assessmentResults.questions,
                traitScores
            );

            const insights = this.scoring.generateInsights(traitScores, facetScores, mbtiType);

            // Calculate character matches
            const characterMatches = this.characters.calculateCharacterMatches(traitScores);

            // Create user profile
            this.userProfile = {
                traitScores: traitScores,
                facetScores: facetScores,
                mbtiType: mbtiType,
                confidenceIntervals: confidenceIntervals,
                insights: insights,
                characterMatches: characterMatches,
                assessmentData: assessmentResults
            };

            // Save completed assessment
            this.storage.saveCompletedAssessment(this.userProfile);
            this.storage.clearAssessmentProgress();

            // Show results
            this.showResults();

        } catch (error) {
            console.error('Failed to complete assessment:', error);
            this.showError('Failed to calculate results. Please try again.');
        }
    }

    /**
     * Show results screen
     */
    showResults() {
        this.showScreen('results');
        this.displayResults();
    }

    /**
     * Display results on results screen
     */
    displayResults() {
        if (!this.userProfile) return;

        // Display MBTI type
        if (this.elements.mbtiType) {
            this.elements.mbtiType.textContent = this.userProfile.mbtiType;
        }

        if (this.elements.typeDescription) {
            this.elements.typeDescription.textContent = this.getMBTIDescription(this.userProfile.mbtiType);
        }

        // Create visualizations
        this.visualizations.createRadarChart('radar-chart', this.userProfile.traitScores);
        this.visualizations.createTraitBarsChart('trait-bars', this.userProfile.traitScores);

        // Display character matches
        this.displayCharacterMatches();

        // Display analysis insights
        this.displayAnalysisInsights();
    }

    /**
     * Display character matches
     */
    displayCharacterMatches() {
        if (!this.elements.characterGrid || !this.userProfile.characterMatches) return;

        this.elements.characterGrid.innerHTML = '';

        this.userProfile.characterMatches.slice(0, 6).forEach((match, index) => {
            const character = match.character;
            const similarity = Math.round(match.similarity * 100);

            const card = document.createElement('div');
            card.className = `character-card ${index === 0 ? 'best-match' : ''}`;
            card.dataset.characterId = character.id;

            card.innerHTML = `
                <div class="character-header">
                    <div class="character-avatar">${character.imageUrl}</div>
                    <div class="character-info">
                        <h4>${character.name}</h4>
                        <div class="character-show">${character.show}</div>
                        <div class="similarity-score">${similarity}% match</div>
                    </div>
                </div>
                <div class="character-description">
                    ${character.description}
                </div>
                <div class="character-traits">
                    ${this.getTopTraits(character.normalizedScores).map(trait => 
                        `<span class="trait-tag high">${trait}</span>`
                    ).join('')}
                </div>
            `;

            this.elements.characterGrid.appendChild(card);
        });
    }

    /**
     * Display analysis insights
     */
    displayAnalysisInsights() {
        if (!this.userProfile.insights) return;

        // Strengths
        this.displayInsightTab('strengths', this.userProfile.insights.strengths);
        
        // Growth areas
        this.displayInsightTab('growth', this.userProfile.insights.growthAreas);
        
        // Relationships
        this.displayInsightTab('relationships', this.userProfile.insights.relationships);
        
        // Careers
        this.displayInsightTab('careers', this.userProfile.insights.careers);
    }

    /**
     * Display specific insight tab
     */
    displayInsightTab(tabName, insights) {
        const tabPanel = document.getElementById(`${tabName}-tab`);
        if (!tabPanel) return;

        tabPanel.innerHTML = '';

        insights.forEach(insight => {
            const item = document.createElement('div');
            item.className = `insight-item ${tabName}-item`;
            
            item.innerHTML = `
                <h5>${insight.title}</h5>
                <p>${insight.description}</p>
            `;

            tabPanel.appendChild(item);
        });
    }

    /**
     * Switch analysis tab
     */
    switchAnalysisTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-tab`);
        });
    }

    /**
     * Show character detail modal
     */
    showCharacterDetail(characterId) {
        const character = this.characters.getCharacterById(characterId);
        const match = this.userProfile.characterMatches.find(m => m.character.id === characterId);
        
        if (!character || !match) return;

        const modal = this.elements.characterModal;
        const content = modal.querySelector('.character-detail');
        
        const similarity = Math.round(match.similarity * 100);
        
        content.innerHTML = `
            <div class="character-detail-header">
                <div class="character-detail-avatar">${character.imageUrl}</div>
                <h2>${character.name}</h2>
                <div class="character-detail-show">${character.show}</div>
                <div class="similarity-badge">${similarity}% match</div>
            </div>
            <div class="character-analysis">
                <h3>Character Analysis</h3>
                <p>${character.analysis}</p>
            </div>
            <div class="trait-comparison">
                <h3>Trait Comparison</h3>
                <div id="character-comparison-chart"></div>
            </div>
        `;

        // Create comparison visualization
        this.visualizations.createTraitComparison(
            'character-comparison-chart',
            this.userProfile.traitScores,
            character.normalizedScores,
            character.name
        );

        modal.classList.add('show');
    }

    /**
     * Close all modals
     */
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    /**
     * Save assessment progress
     */
    saveAssessmentProgress() {
        const state = this.assessment.saveState();
        const saved = this.storage.saveAssessmentProgress(state);
        
        if (saved) {
            this.showNotification('Progress saved!');
        }
    }

    /**
     * Enable auto-save
     */
    enableAutoSave() {
        this.storage.enableAutoSave(() => {
            this.saveAssessmentProgress();
        }, 30000); // Every 30 seconds
    }

    /**
     * Check for saved assessment
     */
    checkSavedAssessment() {
        if (this.storage.hasAssessmentInProgress()) {
            this.showResumeSection();
        }
    }

    /**
     * Show resume section
     */
    showResumeSection() {
        if (this.elements.resumeSection) {
            this.elements.resumeSection.style.display = 'block';
        }
    }

    /**
     * Hide resume section
     */
    hideResumeSection() {
        if (this.elements.resumeSection) {
            this.elements.resumeSection.style.display = 'none';
        }
    }

    /**
     * Load user preferences
     */
    loadUserPreferences() {
        const preferences = this.storage.loadUserPreferences();
        
        // Apply theme
        if (preferences.theme === 'dark') {
            this.setTheme('dark');
        }

        // Apply accessibility settings
        if (preferences.reducedMotion) {
            document.body.classList.add('reduced-motion');
        }

        if (preferences.highContrast) {
            document.body.classList.add('high-contrast');
        }
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.dataset.theme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        document.documentElement.dataset.theme = theme;
        
        // Update theme toggle icon
        if (this.elements.themeToggle) {
            const icon = this.elements.themeToggle.querySelector('.theme-icon');
            if (icon) {
                icon.textContent = theme === 'dark' ? '☀️' : '🌙';
            }
        }

        // Apply to visualizations
        this.visualizations.applyTheme(theme);

        // Save preference
        const preferences = this.storage.loadUserPreferences();
        preferences.theme = theme;
        this.storage.saveUserPreferences(preferences);
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        if (this.currentScreen === 'assessment') {
            // Number keys for answers
            if (e.key >= '1' && e.key <= '5') {
                const answer = parseInt(e.key);
                const radio = this.elements.answerOptions?.querySelector(`input[value="${answer}"]`);
                if (radio) {
                    radio.checked = true;
                    this.handleAnswerSelection(answer);
                }
            }
            
            // Arrow keys for navigation
            if (e.key === 'ArrowLeft' && !this.elements.prevButton?.disabled) {
                this.assessment.previousQuestion();
            } else if (e.key === 'ArrowRight' && !this.elements.nextButton?.disabled) {
                this.assessment.nextQuestion();
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeModals();
        }
    }

    /**
     * Download results as PDF
     */
    downloadResults() {
        // This would typically integrate with a PDF generation library
        // For now, we'll create a simple text export
        const results = this.generateResultsText();
        this.downloadTextFile(results, 'personality-results.txt');
    }

    /**
     * Share results
     */
    shareResults() {
        if (navigator.share) {
            navigator.share({
                title: 'My Personality Assessment Results',
                text: `I'm an ${this.userProfile.mbtiType} personality type! Take the assessment yourself.`,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            const text = `I'm an ${this.userProfile.mbtiType} personality type! Take the assessment at ${window.location.href}`;
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('Results copied to clipboard!');
            });
        }
    }

    /**
     * Retake assessment
     */
    retakeAssessment() {
        this.assessment.reset();
        this.storage.clearAssessmentProgress();
        this.selectedMode = null;
        this.userProfile = null;
        this.characterMatches = [];
        
        this.showScreen('welcome');
        
        // Reset welcome screen
        this.elements.optionCards.forEach(card => {
            card.classList.remove('selected');
        });
        
        if (this.elements.startButton) {
            this.elements.startButton.disabled = true;
            this.elements.startButton.querySelector('.btn-text').textContent = 'Select an Assessment to Begin';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorElement = this.elements.errorMessage;
        if (errorElement) {
            errorElement.querySelector('.error-text').textContent = message;
            errorElement.classList.add('show');
            
            setTimeout(() => {
                errorElement.classList.remove('show');
            }, 5000);
        }
    }

    /**
     * Show notification
     */
    showNotification(message) {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    /**
     * Utility functions
     */
    getMBTIDescription(type) {
        const descriptions = {
            'ENFP': 'The Campaigner - Enthusiastic, creative and sociable free spirit',
            'INFP': 'The Mediator - Poetic, kind and altruistic people',
            'ENFJ': 'The Protagonist - Charismatic and inspiring leaders',
            'INFJ': 'The Advocate - Creative and insightful inspirers',
            'ENTP': 'The Debater - Smart and curious thinkers',
            'INTP': 'The Thinker - Innovative inventors with unquenchable thirst for knowledge',
            'ENTJ': 'The Commander - Bold, imaginative and strong-willed leaders',
            'INTJ': 'The Architect - Imaginative and strategic thinkers',
            'ESFP': 'The Entertainer - Spontaneous, energetic and enthusiastic people',
            'ISFP': 'The Adventurer - Flexible and charming artists',
            'ESFJ': 'The Consul - Extraordinarily caring, social and popular people',
            'ISFJ': 'The Protector - Very dedicated and warm protectors',
            'ESTP': 'The Entrepreneur - Smart, energetic and perceptive people',
            'ISTP': 'The Virtuoso - Bold and practical experimenters',
            'ESTJ': 'The Executive - Excellent administrators, unsurpassed at managing things',
            'ISTJ': 'The Logistician - Practical and fact-minded, reliable and responsible'
        };
        
        return descriptions[type] || 'Unique Personality Type';
    }

    getTopTraits(scores) {
        return Object.entries(scores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([trait]) => trait);
    }

    generateResultsText() {
        if (!this.userProfile) return '';
        
        const { mbtiType, traitScores, insights } = this.userProfile;
        
        let text = `Personality Assessment Results\n`;
        text += `================================\n\n`;
        text += `MBTI Type: ${mbtiType}\n`;
        text += `Description: ${this.getMBTIDescription(mbtiType)}\n\n`;
        
        text += `Trait Scores:\n`;
        Object.entries(traitScores).forEach(([trait, score]) => {
            text += `${trait}: ${Math.round(score * 100)}%\n`;
        });
        
        text += `\nStrengths:\n`;
        insights.strengths.forEach(strength => {
            text += `• ${strength.title}: ${strength.description}\n`;
        });
        
        return text;
    }

    downloadTextFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.personalityApp = new PersonalityApp();
});
