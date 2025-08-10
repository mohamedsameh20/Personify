/**
 * PERSONIFY PREMIUM - ADVANCED ASSESSMENT ENGINE
 * 
 * This module handles the core assessment logic including:
 * - Adaptive question selection
 * - Response validation and processing
 * - Progress tracking
 * - Performance optimization
 * - Real-time difficulty adjustment
 * 
 * @version 2.0.0
 * @author Personify Premium Team
 */

class AssessmentEngine {
    constructor(options = {}) {
        this.storageManager = options.storageManager;
        this.animationController = options.animationController;
        
        // Assessment configuration
        this.config = {
            maxQuestions: 120,
            minQuestions: 60,
            adaptiveThreshold: 0.8,
            timeLimit: 30000, // 30 seconds per question
            enableAdaptive: true,
            enableTiming: false,
            difficultyAdjustment: true
        };
        
        // Assessment state
        this.questions = [];
        this.traits = [];
        this.questionEffects = {};
        this.currentSession = null;
        this.adaptiveModel = null;
        
        this.init();
    }

    /**
     * Initialize the assessment engine
     */
    async init() {
        try {
            console.log('🔧 Initializing Assessment Engine...');
            
            // Initialize adaptive model
            this.adaptiveModel = new AdaptiveQuestionModel();
            
            // Load previous session if available
            await this.loadSession();
            
            console.log('✅ Assessment Engine initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Assessment Engine:', error);
            throw error;
        }
    }

    /**
     * Set assessment data
     */
    setData({ questions, traits, questionEffects }) {
        this.questions = questions || [];
        this.traits = traits || [];
        this.questionEffects = questionEffects || {};
        
        // Validate and process questions
        this.processQuestions();
        
        // Initialize adaptive model with questions
        this.adaptiveModel.initialize(this.questions, this.traits);
        
        console.log(`📊 Loaded ${this.questions.length} questions and ${this.traits.length} traits`);
    }

    /**
     * Process and validate questions
     */
    processQuestions() {
        this.questions = this.questions.map(question => {
            // Validate question structure
            if (!this.validateQuestion(question)) {
                console.warn('⚠️ Invalid question structure:', question);
                return null;
            }
            
            // Add metadata
            question.metadata = {
                difficulty: this.calculateQuestionDifficulty(question),
                discriminability: this.calculateDiscriminability(question),
                traits: this.extractQuestionTraits(question),
                category: question.category || 'general',
                timeEstimate: this.estimateResponseTime(question)
            };
            
            // Process options
            question.options = question.options.map(option => ({
                ...option,
                value: this.normalizeOptionValue(option.value)
            }));
            
            return question;
        }).filter(Boolean);
    }

    /**
     * Validate question structure
     */
    validateQuestion(question) {
        const required = ['id', 'text', 'options', 'traits'];
        return required.every(field => question.hasOwnProperty(field)) &&
               question.options.length >= 2 &&
               question.traits.length > 0;
    }

    /**
     * Calculate question difficulty based on various factors
     */
    calculateQuestionDifficulty(question) {
        let difficulty = 0.5; // Base difficulty
        
        // Text complexity
        const wordCount = question.text.split(' ').length;
        if (wordCount > 20) difficulty += 0.1;
        if (wordCount > 30) difficulty += 0.1;
        
        // Option complexity
        const optionComplexity = question.options.reduce((sum, option) => {
            return sum + option.text.split(' ').length;
        }, 0) / question.options.length;
        
        if (optionComplexity > 5) difficulty += 0.1;
        
        // Trait complexity (multiple traits = harder)
        if (question.traits.length > 1) difficulty += 0.1;
        
        // Abstract concepts
        const abstractKeywords = ['philosophy', 'abstract', 'theoretical', 'conceptual'];
        if (abstractKeywords.some(keyword => question.text.toLowerCase().includes(keyword))) {
            difficulty += 0.2;
        }
        
        return Math.min(1.0, Math.max(0.1, difficulty));
    }

    /**
     * Calculate question discriminability (how well it differentiates between people)
     */
    calculateDiscriminability(question) {
        // Based on option distribution and trait correlation
        const optionRange = Math.max(...question.options.map(o => o.value)) - 
                           Math.min(...question.options.map(o => o.value));
        
        return Math.min(1.0, optionRange / 5.0); // Assuming 1-5 scale
    }

    /**
     * Extract traits that this question measures
     */
    extractQuestionTraits(question) {
        return question.traits.map(trait => ({
            name: trait.name || trait,
            weight: trait.weight || 1.0,
            facet: trait.facet || null,
            direction: trait.direction || 'positive'
        }));
    }

    /**
     * Estimate response time for a question
     */
    estimateResponseTime(question) {
        const baseTime = 5000; // 5 seconds base
        const wordCount = question.text.split(' ').length;
        const optionCount = question.options.length;
        
        return baseTime + (wordCount * 100) + (optionCount * 500);
    }

    /**
     * Normalize option values to standard scale
     */
    normalizeOptionValue(value) {
        // Ensure values are numeric and within expected range
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        return Math.max(1, Math.min(5, numValue));
    }

    /**
     * Start new assessment session
     */
    async startAssessment(config = {}) {
        try {
            // Merge config with defaults
            this.config = { ...this.config, ...config };
            
            // Create new session
            this.currentSession = {
                id: this.generateSessionId(),
                startTime: Date.now(),
                responses: [],
                currentQuestionIndex: 0,
                adaptiveData: {},
                userProfile: {
                    estimatedTraits: {},
                    confidence: {},
                    responsePattern: {}
                }
            };
            
            // Initialize adaptive selection
            if (this.config.enableAdaptive) {
                await this.adaptiveModel.startSession(this.currentSession);
            }
            
            // Save session
            await this.saveSession();
            
            console.log('🎯 Assessment session started:', this.currentSession.id);
            
            return this.currentSession;
            
        } catch (error) {
            console.error('❌ Failed to start assessment:', error);
            throw error;
        }
    }

    /**
     * Get next question for assessment
     */
    getNextQuestion() {
        if (!this.currentSession) {
            throw new Error('No active assessment session');
        }

        let question;
        
        if (this.config.enableAdaptive) {
            // Use adaptive selection
            question = this.adaptiveModel.selectNextQuestion(
                this.currentSession.responses,
                this.currentSession.userProfile
            );
        } else {
            // Use sequential selection
            question = this.questions[this.currentSession.currentQuestionIndex];
        }

        if (question) {
            // Track question presentation
            this.trackQuestionPresentation(question);
            
            // Apply question effects
            this.applyQuestionEffects(question);
        }

        return question;
    }

    /**
     * Submit response to current question
     */
    async submitResponse(questionId, answer, metadata = {}) {
        if (!this.currentSession) {
            throw new Error('No active assessment session');
        }

        try {
            // Validate response
            const question = this.questions.find(q => q.id === questionId);
            if (!question) {
                throw new Error(`Question ${questionId} not found`);
            }

            if (!this.validateResponse(question, answer)) {
                throw new Error('Invalid response format');
            }

            // Create response object
            const response = {
                questionId,
                answer,
                responseTime: metadata.responseTime || null,
                timestamp: Date.now(),
                questionMetadata: question.metadata,
                sessionTime: Date.now() - this.currentSession.startTime,
                ...metadata
            };

            // Add to session
            this.currentSession.responses.push(response);
            this.currentSession.currentQuestionIndex++;

            // Update adaptive model
            if (this.config.enableAdaptive) {
                await this.adaptiveModel.processResponse(response, this.currentSession);
                this.updateUserProfile(response, question);
            }

            // Save session
            await this.saveSession();

            // Check if assessment is complete
            if (this.isAssessmentComplete()) {
                await this.completeAssessment();
            }

            console.log(`✅ Response submitted for question ${questionId}`);
            
            return response;

        } catch (error) {
            console.error('❌ Failed to submit response:', error);
            throw error;
        }
    }

    /**
     * Validate response format and content
     */
    validateResponse(question, answer) {
        // Check if answer exists in question options
        const validAnswers = question.options.map(option => option.value);
        return validAnswers.includes(answer);
    }

    /**
     * Update user profile based on response
     */
    updateUserProfile(response, question) {
        const profile = this.currentSession.userProfile;
        
        // Update trait estimates
        question.metadata.traits.forEach(trait => {
            if (!profile.estimatedTraits[trait.name]) {
                profile.estimatedTraits[trait.name] = {
                    value: 0,
                    confidence: 0,
                    responses: 0
                };
            }
            
            const currentTrait = profile.estimatedTraits[trait.name];
            const weight = trait.weight * (trait.direction === 'negative' ? -1 : 1);
            const newValue = (response.answer - 3) * weight; // Normalize to -2 to +2
            
            // Weighted average with confidence
            const totalWeight = currentTrait.responses + 1;
            currentTrait.value = (currentTrait.value * currentTrait.responses + newValue) / totalWeight;
            currentTrait.responses = totalWeight;
            currentTrait.confidence = Math.min(1.0, currentTrait.responses / 10);
        });
        
        // Update response patterns
        this.updateResponsePatterns(response);
    }

    /**
     * Update response patterns for better adaptive selection
     */
    updateResponsePatterns(response) {
        const patterns = this.currentSession.userProfile.responsePattern;
        
        // Response time patterns
        if (response.responseTime) {
            if (!patterns.averageResponseTime) {
                patterns.averageResponseTime = response.responseTime;
                patterns.responseTimeCount = 1;
            } else {
                patterns.averageResponseTime = (
                    patterns.averageResponseTime * patterns.responseTimeCount + response.responseTime
                ) / (patterns.responseTimeCount + 1);
                patterns.responseTimeCount++;
            }
        }
        
        // Answer distribution
        if (!patterns.answerDistribution) {
            patterns.answerDistribution = {};
        }
        patterns.answerDistribution[response.answer] = 
            (patterns.answerDistribution[response.answer] || 0) + 1;
        
        // Response consistency
        this.calculateResponseConsistency(patterns);
    }

    /**
     * Calculate response consistency
     */
    calculateResponseConsistency(patterns) {
        const responses = this.currentSession.responses;
        if (responses.length < 5) return;
        
        // Calculate variance in response times
        const responseTimes = responses
            .filter(r => r.responseTime)
            .map(r => r.responseTime);
            
        if (responseTimes.length > 0) {
            const mean = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
            const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / responseTimes.length;
            patterns.responseTimeConsistency = 1 / (1 + Math.sqrt(variance) / mean);
        }
        
        // Calculate answer pattern consistency
        const answerVariance = this.calculateAnswerVariance(responses);
        patterns.answerConsistency = 1 / (1 + answerVariance);
    }

    /**
     * Calculate variance in answer patterns
     */
    calculateAnswerVariance(responses) {
        const answers = responses.map(r => r.answer);
        const mean = answers.reduce((sum, answer) => sum + answer, 0) / answers.length;
        return answers.reduce((sum, answer) => sum + Math.pow(answer - mean, 2), 0) / answers.length;
    }

    /**
     * Check if assessment is complete
     */
    isAssessmentComplete() {
        if (!this.currentSession) return false;
        
        const responseCount = this.currentSession.responses.length;
        const minQuestionsReached = responseCount >= this.config.minQuestions;
        const maxQuestionsReached = responseCount >= this.config.maxQuestions;
        
        if (maxQuestionsReached) return true;
        
        if (minQuestionsReached && this.config.enableAdaptive) {
            // Check if we have sufficient confidence in trait estimates
            return this.hasAdequateConfidence();
        }
        
        return false;
    }

    /**
     * Check if we have adequate confidence in trait estimates
     */
    hasAdequateConfidence() {
        const profile = this.currentSession.userProfile;
        const traitNames = Object.keys(profile.estimatedTraits);
        
        if (traitNames.length === 0) return false;
        
        const averageConfidence = traitNames.reduce((sum, trait) => {
            return sum + (profile.estimatedTraits[trait].confidence || 0);
        }, 0) / traitNames.length;
        
        return averageConfidence >= this.config.adaptiveThreshold;
    }

    /**
     * Complete the assessment
     */
    async completeAssessment() {
        if (!this.currentSession) {
            throw new Error('No active assessment session');
        }

        try {
            // Finalize session
            this.currentSession.endTime = Date.now();
            this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
            this.currentSession.completed = true;
            
            // Generate completion statistics
            this.currentSession.statistics = this.generateSessionStatistics();
            
            // Save final session
            await this.saveSession();
            
            console.log('🎉 Assessment completed successfully');
            
            // Trigger completion event
            document.dispatchEvent(new CustomEvent('assessment-completed', {
                detail: { session: this.currentSession }
            }));
            
            return this.currentSession;
            
        } catch (error) {
            console.error('❌ Failed to complete assessment:', error);
            throw error;
        }
    }

    /**
     * Generate session statistics
     */
    generateSessionStatistics() {
        const responses = this.currentSession.responses;
        const responseTimes = responses.filter(r => r.responseTime).map(r => r.responseTime);
        
        return {
            totalQuestions: responses.length,
            averageResponseTime: responseTimes.length > 0 ? 
                responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : null,
            fastestResponse: responseTimes.length > 0 ? Math.min(...responseTimes) : null,
            slowestResponse: responseTimes.length > 0 ? Math.max(...responseTimes) : null,
            answerDistribution: this.calculateAnswerDistribution(responses),
            traitCoverage: this.calculateTraitCoverage(responses),
            adaptiveEfficiency: this.calculateAdaptiveEfficiency()
        };
    }

    /**
     * Calculate answer distribution
     */
    calculateAnswerDistribution(responses) {
        const distribution = {};
        responses.forEach(response => {
            distribution[response.answer] = (distribution[response.answer] || 0) + 1;
        });
        return distribution;
    }

    /**
     * Calculate trait coverage
     */
    calculateTraitCoverage(responses) {
        const traitCounts = {};
        responses.forEach(response => {
            const question = this.questions.find(q => q.id === response.questionId);
            if (question && question.metadata.traits) {
                question.metadata.traits.forEach(trait => {
                    traitCounts[trait.name] = (traitCounts[trait.name] || 0) + 1;
                });
            }
        });
        return traitCounts;
    }

    /**
     * Calculate adaptive efficiency
     */
    calculateAdaptiveEfficiency() {
        if (!this.config.enableAdaptive) return null;
        
        const profile = this.currentSession.userProfile;
        const confidenceValues = Object.values(profile.estimatedTraits)
            .map(trait => trait.confidence || 0);
        
        const averageConfidence = confidenceValues.length > 0 ?
            confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length : 0;
        
        return {
            averageConfidence,
            questionsPerConfidencePoint: this.currentSession.responses.length / (averageConfidence || 1),
            efficiency: averageConfidence / (this.currentSession.responses.length / this.config.maxQuestions)
        };
    }

    /**
     * Track question presentation
     */
    trackQuestionPresentation(question) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'question_presented', {
                question_id: question.id,
                question_category: question.category,
                session_id: this.currentSession.id
            });
        }
    }

    /**
     * Apply question effects
     */
    applyQuestionEffects(question) {
        const effects = this.questionEffects[question.id];
        if (effects && this.animationController) {
            this.animationController.applyQuestionEffects(effects);
        }
    }

    /**
     * Save current session
     */
    async saveSession() {
        if (this.currentSession && this.storageManager) {
            await this.storageManager.saveAssessmentSession(this.currentSession);
        }
    }

    /**
     * Load previous session
     */
    async loadSession() {
        if (this.storageManager) {
            try {
                this.currentSession = await this.storageManager.loadAssessmentSession();
                if (this.currentSession && !this.currentSession.completed) {
                    console.log('📂 Loaded previous session:', this.currentSession.id);
                }
            } catch (error) {
                console.warn('⚠️ Failed to load previous session:', error);
            }
        }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get assessment progress
     */
    getProgress() {
        if (!this.currentSession) return 0;
        
        const responseCount = this.currentSession.responses.length;
        const targetQuestions = this.config.enableAdaptive ? 
            this.config.minQuestions : this.config.maxQuestions;
        
        return Math.min(1.0, responseCount / targetQuestions);
    }

    /**
     * Get current session data
     */
    getCurrentSession() {
        return this.currentSession;
    }

    /**
     * Check if timed mode is enabled
     */
    isTimedMode() {
        return this.config.enableTiming;
    }

    /**
     * Get time limit for current question
     */
    getTimeLimit() {
        return this.config.timeLimit;
    }

    /**
     * Reset assessment
     */
    reset() {
        this.currentSession = null;
        if (this.adaptiveModel) {
            this.adaptiveModel.reset();
        }
    }
}

/**
 * Adaptive Question Selection Model
 */
class AdaptiveQuestionModel {
    constructor() {
        this.questions = [];
        this.traits = [];
        this.questionHistory = new Set();
        this.traitTargets = {};
    }

    /**
     * Initialize with questions and traits
     */
    initialize(questions, traits) {
        this.questions = questions;
        this.traits = traits;
        
        // Set initial trait targets
        this.traits.forEach(trait => {
            this.traitTargets[trait.name] = {
                target: 5, // Target number of questions per trait
                current: 0
            };
        });
    }

    /**
     * Start adaptive session
     */
    async startSession(session) {
        this.questionHistory.clear();
        
        // Reset trait targets based on session config
        Object.keys(this.traitTargets).forEach(trait => {
            this.traitTargets[trait].current = 0;
        });
    }

    /**
     * Select next question based on adaptive algorithm
     */
    selectNextQuestion(responses, userProfile) {
        // Get candidate questions
        const candidates = this.getCandidateQuestions(responses, userProfile);
        
        if (candidates.length === 0) {
            console.warn('⚠️ No candidate questions available');
            return null;
        }
        
        // Score candidates
        const scoredCandidates = candidates.map(question => ({
            question,
            score: this.scoreQuestion(question, responses, userProfile)
        }));
        
        // Select best question
        scoredCandidates.sort((a, b) => b.score - a.score);
        const selectedQuestion = scoredCandidates[0].question;
        
        // Track selection
        this.questionHistory.add(selectedQuestion.id);
        
        return selectedQuestion;
    }

    /**
     * Get candidate questions (not yet asked)
     */
    getCandidateQuestions(responses, userProfile) {
        return this.questions.filter(question => {
            // Not already asked
            if (this.questionHistory.has(question.id)) {
                return false;
            }
            
            // Has relevant traits we need to measure
            return question.metadata.traits.some(trait => {
                const target = this.traitTargets[trait.name];
                return target && target.current < target.target;
            });
        });
    }

    /**
     * Score question for selection
     */
    scoreQuestion(question, responses, userProfile) {
        let score = 0;
        
        // Information value (how much will this question tell us?)
        score += this.calculateInformationValue(question, userProfile);
        
        // Trait coverage (do we need more data on these traits?)
        score += this.calculateTraitCoverageScore(question);
        
        // Difficulty appropriateness
        score += this.calculateDifficultyScore(question, userProfile);
        
        // Discriminability
        score += question.metadata.discriminability * 0.3;
        
        // Diversity bonus (avoid similar questions)
        score += this.calculateDiversityBonus(question, responses);
        
        return score;
    }

    /**
     * Calculate information value of a question
     */
    calculateInformationValue(question, userProfile) {
        let infoValue = 0;
        
        question.metadata.traits.forEach(trait => {
            const currentTrait = userProfile.estimatedTraits[trait.name];
            if (currentTrait) {
                // Higher value for traits with low confidence
                infoValue += (1 - currentTrait.confidence) * trait.weight;
            } else {
                // High value for unmeasured traits
                infoValue += 1.0 * trait.weight;
            }
        });
        
        return infoValue;
    }

    /**
     * Calculate trait coverage score
     */
    calculateTraitCoverageScore(question) {
        let coverageScore = 0;
        
        question.metadata.traits.forEach(trait => {
            const target = this.traitTargets[trait.name];
            if (target) {
                const needed = Math.max(0, target.target - target.current);
                coverageScore += needed / target.target;
            }
        });
        
        return coverageScore;
    }

    /**
     * Calculate difficulty appropriateness score
     */
    calculateDifficultyScore(question, userProfile) {
        // For now, return moderate difficulty preference
        // In future, could adapt based on user's demonstrated ability
        const targetDifficulty = 0.5;
        const difficultyDiff = Math.abs(question.metadata.difficulty - targetDifficulty);
        return 1 - difficultyDiff;
    }

    /**
     * Calculate diversity bonus
     */
    calculateDiversityBonus(question, responses) {
        if (responses.length === 0) return 0;
        
        const recentCategories = responses
            .slice(-5) // Last 5 questions
            .map(r => {
                const q = this.questions.find(quest => quest.id === r.questionId);
                return q ? q.metadata.category : null;
            })
            .filter(Boolean);
        
        const categoryCount = recentCategories.filter(cat => cat === question.metadata.category).length;
        return categoryCount === 0 ? 0.2 : -0.1 * categoryCount;
    }

    /**
     * Process response and update model
     */
    async processResponse(response, session) {
        const question = this.questions.find(q => q.id === response.questionId);
        if (!question) return;
        
        // Update trait targets
        question.metadata.traits.forEach(trait => {
            if (this.traitTargets[trait.name]) {
                this.traitTargets[trait.name].current++;
            }
        });
        
        // Update question difficulty based on response time
        if (response.responseTime) {
            this.updateQuestionDifficulty(question, response);
        }
    }

    /**
     * Update question difficulty based on actual response data
     */
    updateQuestionDifficulty(question, response) {
        const expectedTime = question.metadata.timeEstimate;
        const actualTime = response.responseTime;
        
        if (actualTime > expectedTime * 1.5) {
            // Question was harder than expected
            question.metadata.difficulty = Math.min(1.0, question.metadata.difficulty + 0.05);
        } else if (actualTime < expectedTime * 0.5) {
            // Question was easier than expected
            question.metadata.difficulty = Math.max(0.1, question.metadata.difficulty - 0.05);
        }
    }

    /**
     * Reset the model
     */
    reset() {
        this.questionHistory.clear();
        Object.keys(this.traitTargets).forEach(trait => {
            this.traitTargets[trait].current = 0;
        });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AssessmentEngine, AdaptiveQuestionModel };
}
