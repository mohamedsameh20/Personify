/**
 * PERSONIFY PREMIUM - MAIN APPLICATION CONTROLLER
 * 
 * This is the main application entry point that orchestrates all premium features:
 * - Assessment engine coordination
 * - UI state management
 * - Advanced visualizations
 * - Character comparison system
 * - Theme management
 * - Real-time insights
 * 
 * @version 2.0.0
 * @author Personify Premium Team
 */

class PersonifyPremiumApp {
    constructor() {
        this.currentUser = null;
        this.assessmentData = null;
        this.visualizationEngine = null;
        this.characterComparison = null;
        this.themeManager = null;
        this.animationController = null;
        this.insightsGenerator = null;
        this.storageManager = null;
        
        this.currentStep = 'landing';
        this.assessmentProgress = 0;
        this.currentQuestionIndex = 0;
        this.responses = [];
        this.results = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing Personify Premium...');
            
            // Initialize core managers
            await this.initializeManagers();
            
            // Load data and setup UI
            await this.loadApplicationData();
            this.setupEventListeners();
            this.initializeUI();
            
            // Setup accessibility and performance monitoring
            this.setupAccessibility();
            this.setupPerformanceMonitoring();
            
            console.log('✅ Personify Premium initialized successfully');
            
            // Show landing screen with animation
            this.showLanding();
            
        } catch (error) {
            console.error('❌ Failed to initialize Personify Premium:', error);
            this.showErrorState(error);
        }
    }

    /**
     * Initialize all core managers
     */
    async initializeManagers() {
        try {
            // Initialize storage manager first
            this.storageManager = new PremiumStorageManager();
            await this.storageManager.init();

            // Initialize theme manager
            this.themeManager = new ThemeManager();
            await this.themeManager.init();

            // Initialize animation controller
            this.animationController = new AnimationController();

            // Initialize assessment engine
            this.assessmentEngine = new AssessmentEngine({
                storageManager: this.storageManager,
                animationController: this.animationController
            });

            // Initialize question selector
            this.questionSelector = new QuestionSelector({
                assessmentEngine: this.assessmentEngine
            });

            // Initialize scoring system
            this.scoringEngine = new AdvancedScoringEngine();

            // Initialize visualization engine
            this.visualizationEngine = new Visualizations3D({
                animationController: this.animationController
            });

            // Initialize character comparison
            this.characterComparison = new CharacterComparison({
                visualizationEngine: this.visualizationEngine
            });

            // Initialize insights generator
            this.insightsGenerator = new InsightsGenerator({
                scoringEngine: this.scoringEngine
            });

            // Initialize effects controller
            this.effectsController = new EffectsController();

            console.log('✅ All managers initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize managers:', error);
            throw error;
        }
    }

    /**
     * Load all application data
     */
    async loadApplicationData() {
        try {
            console.log('📊 Loading application data...');

            // Load data in parallel for better performance
            const [
                questions,
                traits,
                characters,
                correlations,
                mbtiData,
                themes,
                questionEffects
            ] = await Promise.all([
                this.loadJSON('./data/premium-questions.json'),
                this.loadJSON('./data/traits-advanced.json'),
                this.loadJSON('./data/characters-enhanced.json'),
                this.loadJSON('./data/correlations-matrix.json'),
                this.loadJSON('./data/mbti-extended.json'),
                this.loadJSON('./data/visual-themes.json'),
                this.loadJSON('./data/question-effects.json')
            ]);

            // Store data in respective managers
            this.assessmentEngine.setData({ questions, traits, questionEffects });
            this.scoringEngine.setData({ traits, correlations, mbtiData });
            this.characterComparison.setData({ characters });
            this.themeManager.setThemes(themes);

            console.log('✅ Application data loaded successfully');

        } catch (error) {
            console.error('❌ Failed to load application data:', error);
            // Use fallback data if main data fails to load
            await this.loadFallbackData();
        }
    }

    /**
     * Load JSON data with error handling
     */
    async loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`⚠️ Failed to load ${url}, using fallback:`, error);
            return this.getFallbackData(url);
        }
    }

    /**
     * Get fallback data when main data files fail to load
     */
    getFallbackData(url) {
        const fallbacks = {
            './data/premium-questions.json': { questions: [] },
            './data/traits-advanced.json': { traits: [] },
            './data/characters-enhanced.json': { characters: [] },
            './data/correlations-matrix.json': { correlations: {} },
            './data/mbti-extended.json': { mbti: {} },
            './data/visual-themes.json': { themes: {} },
            './data/question-effects.json': { effects: {} }
        };
        
        return fallbacks[url] || {};
    }

    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Navigation events
        document.addEventListener('click', this.handleNavigation.bind(this));
        
        // Assessment events
        document.addEventListener('answer-selected', this.handleAnswerSelected.bind(this));
        document.addEventListener('assessment-complete', this.handleAssessmentComplete.bind(this));
        
        // Theme events
        document.addEventListener('theme-change', this.handleThemeChange.bind(this));
        
        // Character comparison events
        document.addEventListener('character-select', this.handleCharacterSelect.bind(this));
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
        
        // Resize events for responsive visualizations
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Scroll events for animations
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Performance monitoring
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Setup progress indicator
        this.setupProgressIndicator();
        
        // Initialize theme toggle
        this.initializeThemeToggle();
        
        // Setup accessibility features
        this.setupAccessibilityFeatures();
        
        // Initialize tooltips and help system
        this.initializeHelpSystem();
        
        // Setup particle systems
        this.effectsController.initializeParticleSystem();
        
        // Initialize scroll animations
        this.animationController.initializeScrollAnimations();
    }

    /**
     * Handle navigation events
     */
    handleNavigation(event) {
        const target = event.target.closest('[data-nav]');
        if (!target) return;

        event.preventDefault();
        const destination = target.dataset.nav;
        
        this.navigateTo(destination);
    }

    /**
     * Navigate to a specific section
     */
    async navigateTo(section) {
        if (this.currentStep === section) return;

        // Animate out current section
        await this.animationController.animatePageTransition(this.currentStep, section);
        
        // Update current step
        this.currentStep = section;
        
        // Show new section
        this.showSection(section);
        
        // Update URL without page reload
        history.pushState({ section }, '', `#${section}`);
        
        // Update navigation state
        this.updateNavigationState();
    }

    /**
     * Show specific section
     */
    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(el => {
            el.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Initialize section-specific features
            this.initializeSectionFeatures(section);
            
            // Update scroll position
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Initialize section-specific features
     */
    initializeSectionFeatures(section) {
        switch (section) {
            case 'assessment':
                this.initializeAssessment();
                break;
            case 'results':
                this.initializeResults();
                break;
            case 'character-comparison':
                this.initializeCharacterComparison();
                break;
            case 'insights':
                this.initializeInsights();
                break;
        }
    }

    /**
     * Show landing screen
     */
    showLanding() {
        this.currentStep = 'landing';
        this.showSection('landing');
        
        // Start ambient animations
        this.effectsController.startAmbientAnimations();
        
        // Load user data if available
        this.loadUserData();
    }

    /**
     * Initialize assessment
     */
    async initializeAssessment() {
        try {
            // Reset assessment state
            this.currentQuestionIndex = 0;
            this.responses = [];
            this.assessmentProgress = 0;
            
            // Initialize question selector
            await this.questionSelector.initializeAssessment();
            
            // Show first question
            this.showCurrentQuestion();
            
            // Update progress indicator
            this.updateProgressIndicator();
            
        } catch (error) {
            console.error('❌ Failed to initialize assessment:', error);
            this.showErrorState(error);
        }
    }

    /**
     * Show current question
     */
    showCurrentQuestion() {
        const question = this.questionSelector.getCurrentQuestion();
        if (!question) {
            console.error('❌ No current question available');
            return;
        }

        // Update question UI
        this.updateQuestionUI(question);
        
        // Apply question-specific effects
        this.effectsController.applyQuestionEffects(question);
        
        // Start question timer if enabled
        if (this.assessmentEngine.isTimedMode()) {
            this.startQuestionTimer();
        }
    }

    /**
     * Update question UI
     */
    updateQuestionUI(question) {
        const questionContainer = document.getElementById('current-question');
        if (!questionContainer) return;

        // Create question HTML
        const questionHTML = this.createQuestionHTML(question);
        
        // Animate question transition
        this.animationController.animateQuestionTransition(questionContainer, questionHTML);
    }

    /**
     * Create question HTML
     */
    createQuestionHTML(question) {
        return `
            <div class="question-card glass-bg" data-question-id="${question.id}">
                <div class="question-header">
                    <span class="question-category">${question.category}</span>
                    <span class="question-number">${this.currentQuestionIndex + 1} / ${this.questionSelector.getTotalQuestions()}</span>
                </div>
                
                <div class="question-content">
                    <h3 class="question-text">${question.text}</h3>
                    ${question.description ? `<p class="question-description">${question.description}</p>` : ''}
                </div>
                
                <div class="answer-options">
                    ${question.options.map((option, index) => `
                        <button 
                            class="answer-option btn-glass ripple" 
                            data-value="${option.value}"
                            data-index="${index}"
                            aria-label="Answer option: ${option.text}"
                        >
                            <span class="option-text">${option.text}</span>
                            <span class="option-value">${option.value}</span>
                        </button>
                    `).join('')}
                </div>
                
                <div class="question-actions">
                    <button class="btn-secondary" data-action="previous" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                        Previous
                    </button>
                    <button class="btn-secondary" data-action="skip">
                        Skip Question
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle answer selection
     */
    handleAnswerSelected(event) {
        const { questionId, answer, responseTime } = event.detail;
        
        // Store response
        this.responses.push({
            questionId,
            answer,
            responseTime,
            timestamp: Date.now()
        });
        
        // Update progress
        this.assessmentProgress = (this.currentQuestionIndex + 1) / this.questionSelector.getTotalQuestions() * 100;
        this.updateProgressIndicator();
        
        // Move to next question or complete assessment
        this.nextQuestion();
    }

    /**
     * Move to next question
     */
    async nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.questionSelector.getTotalQuestions()) {
            // Assessment complete
            await this.completeAssessment();
        } else {
            // Show next question
            this.showCurrentQuestion();
            
            // Update adaptive algorithm
            this.questionSelector.updateAdaptiveSelection(this.responses);
        }
    }

    /**
     * Complete assessment and calculate results
     */
    async completeAssessment() {
        try {
            console.log('🎯 Completing assessment...');
            
            // Calculate results
            this.results = await this.scoringEngine.calculateResults(this.responses);
            
            // Generate insights
            const insights = await this.insightsGenerator.generateInsights(this.results, this.responses);
            this.results.insights = insights;
            
            // Save results
            await this.storageManager.saveResults(this.results);
            
            // Navigate to results
            this.navigateTo('results');
            
            // Trigger completion event
            document.dispatchEvent(new CustomEvent('assessment-complete', {
                detail: { results: this.results }
            }));
            
        } catch (error) {
            console.error('❌ Failed to complete assessment:', error);
            this.showErrorState(error);
        }
    }

    /**
     * Initialize results visualization
     */
    async initializeResults() {
        if (!this.results) {
            console.error('❌ No results available');
            this.navigateTo('assessment');
            return;
        }

        try {
            // Create visualizations
            await this.visualizationEngine.createTraitRadar(this.results.traits);
            await this.visualizationEngine.createPersonalityBarChart(this.results.facets);
            await this.visualizationEngine.createComparisonHeatmap(this.results.comparisons);
            
            // Update results UI
            this.updateResultsUI();
            
            // Start result animations
            this.animationController.startResultAnimations();
            
        } catch (error) {
            console.error('❌ Failed to initialize results:', error);
            this.showErrorState(error);
        }
    }

    /**
     * Update results UI
     */
    updateResultsUI() {
        // Update personality type
        const typeElement = document.getElementById('personality-type');
        if (typeElement && this.results.mbtiType) {
            typeElement.textContent = this.results.mbtiType.type;
        }

        // Update trait scores
        this.updateTraitScores();
        
        // Update insights
        this.updateInsightsDisplay();
        
        // Update recommendations
        this.updateRecommendations();
    }

    /**
     * Update trait scores display
     */
    updateTraitScores() {
        const traitsContainer = document.getElementById('trait-scores');
        if (!traitsContainer || !this.results.traits) return;

        const traitsHTML = Object.entries(this.results.traits).map(([trait, data]) => `
            <div class="trait-item">
                <div class="trait-header">
                    <span class="trait-name">${trait}</span>
                    <span class="trait-score">${Math.round(data.score * 100)}%</span>
                </div>
                <div class="trait-bar">
                    <div class="trait-progress" style="width: ${data.score * 100}%"></div>
                </div>
                <div class="trait-description">${data.description}</div>
            </div>
        `).join('');

        traitsContainer.innerHTML = traitsHTML;
    }

    /**
     * Handle theme change
     */
    handleThemeChange(event) {
        const { theme } = event.detail;
        this.themeManager.setTheme(theme);
        
        // Update visualizations with new theme
        this.visualizationEngine.updateTheme(theme);
        
        // Update effects
        this.effectsController.updateTheme(theme);
    }

    /**
     * Handle character selection for comparison
     */
    handleCharacterSelect(event) {
        const { characterId } = event.detail;
        
        if (this.results) {
            this.characterComparison.compareWithCharacter(characterId, this.results);
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(event) {
        switch (event.key) {
            case 'Escape':
                // Close modals or go back
                this.closeActiveModal();
                break;
            case 'Tab':
                // Ensure proper tab order
                this.handleTabNavigation(event);
                break;
            case 'Enter':
            case ' ':
                // Activate focused element
                if (event.target.classList.contains('answer-option')) {
                    event.preventDefault();
                    event.target.click();
                }
                break;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update visualizations
        if (this.visualizationEngine) {
            this.visualizationEngine.handleResize();
        }
        
        // Update particle systems
        if (this.effectsController) {
            this.effectsController.handleResize();
        }
    }

    /**
     * Handle scroll events for animations
     */
    handleScroll() {
        // Update parallax effects
        this.animationController.updateParallaxEffects();
        
        // Trigger scroll animations
        this.animationController.checkScrollAnimations();
    }

    /**
     * Setup progress indicator
     */
    setupProgressIndicator() {
        const progressBar = document.getElementById('assessment-progress');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }

    /**
     * Update progress indicator
     */
    updateProgressIndicator() {
        const progressBar = document.getElementById('assessment-progress');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${this.assessmentProgress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(this.assessmentProgress)}% Complete`;
        }
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Focus management
        this.setupFocusManagement();
        
        // Screen reader announcements
        this.setupScreenReaderSupport();
        
        // High contrast mode detection
        this.setupHighContrastMode();
        
        // Reduced motion preferences
        this.setupReducedMotionPreferences();
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor frame rate
        this.monitorFrameRate();
        
        // Track memory usage
        this.monitorMemoryUsage();
        
        // Monitor network requests
        this.monitorNetworkPerformance();
    }

    /**
     * Show error state
     */
    showErrorState(error) {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-card glass-bg">
                    <h3>Something went wrong</h3>
                    <p>${error.message || 'An unexpected error occurred'}</p>
                    <button class="btn-primary" onclick="location.reload()">
                        Reload Application
                    </button>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }

    /**
     * Load user data
     */
    async loadUserData() {
        try {
            const userData = await this.storageManager.getUserData();
            if (userData) {
                this.currentUser = userData;
                this.updateUserInterface();
            }
        } catch (error) {
            console.warn('⚠️ Failed to load user data:', error);
        }
    }

    /**
     * Handle before unload
     */
    handleBeforeUnload(event) {
        // Save current progress
        if (this.responses.length > 0) {
            this.storageManager.saveProgress({
                responses: this.responses,
                currentQuestionIndex: this.currentQuestionIndex,
                timestamp: Date.now()
            });
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.personifyApp = new PersonifyPremiumApp();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersonifyPremiumApp;
}
