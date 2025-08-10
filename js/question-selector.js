/**
 * PERSONIFY PREMIUM - INTELLIGENT QUESTION SELECTOR
 * 
 * This module handles advanced question selection including:
 * - Adaptive question sequencing
 * - Trait-based question targeting
 * - Real-time difficulty adjustment
 * - Response pattern analysis
 * - Optimal question ordering
 * 
 * @version 2.0.0
 * @author Personify Premium Team
 */

class QuestionSelector {
    constructor(options = {}) {
        this.assessmentEngine = options.assessmentEngine;
        
        // Configuration
        this.config = {
            maxQuestions: 120,
            minQuestions: 60,
            targetTraitQuestions: 8, // Questions per trait
            difficultyProgression: 'adaptive', // 'linear', 'adaptive', 'random'
            categoryBalance: true,
            diversityWeight: 0.3,
            adaptiveThreshold: 0.8
        };
        
        // State
        this.questionPool = [];
        this.selectedQuestions = [];
        this.questionHistory = new Map();
        this.traitCoverage = new Map();
        this.categoryDistribution = new Map();
        this.currentIndex = 0;
        this.difficultyModel = null;
        
        this.init();
    }

    /**
     * Initialize the question selector
     */
    async init() {
        try {
            console.log('🎯 Initializing Question Selector...');
            
            // Initialize difficulty model
            this.difficultyModel = new DifficultyModel();
            
            // Initialize analytics
            this.analytics = new QuestionAnalytics();
            
            console.log('✅ Question Selector initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Question Selector:', error);
            throw error;
        }
    }

    /**
     * Initialize assessment with question pool
     */
    async initializeAssessment() {
        try {
            // Get questions from assessment engine
            const questions = this.assessmentEngine.questions;
            if (!questions || questions.length === 0) {
                throw new Error('No questions available');
            }
            
            // Process and categorize questions
            this.questionPool = this.processQuestionPool(questions);
            
            // Reset state
            this.selectedQuestions = [];
            this.questionHistory.clear();
            this.traitCoverage.clear();
            this.categoryDistribution.clear();
            this.currentIndex = 0;
            
            // Initialize trait coverage tracking
            this.initializeTraitCoverage();
            
            // Pre-select question sequence if using non-adaptive mode
            if (this.config.difficultyProgression !== 'adaptive') {
                this.preSelectQuestions();
            }
            
            console.log(`🎯 Question selector initialized with ${this.questionPool.length} questions`);
            
        } catch (error) {
            console.error('❌ Failed to initialize assessment:', error);
            throw error;
        }
    }

    /**
     * Process question pool and add metadata
     */
    processQuestionPool(questions) {
        return questions.map(question => {
            // Ensure question has required metadata
            if (!question.metadata) {
                question.metadata = {};
            }
            
            // Add selection metadata
            question.metadata.selectionData = {
                timesSelected: 0,
                avgResponseTime: null,
                difficultyRating: question.metadata.difficulty || 0.5,
                informationValue: this.calculateInformationValue(question),
                traitRelevance: this.calculateTraitRelevance(question),
                lastSelected: null
            };
            
            return question;
        });
    }

    /**
     * Calculate information value of a question
     */
    calculateInformationValue(question) {
        // Higher value for questions that measure multiple traits
        const traitCount = question.metadata.traits ? question.metadata.traits.length : 1;
        const traitWeight = Math.min(1.0, traitCount * 0.3);
        
        // Higher value for high discriminability
        const discriminability = question.metadata.discriminability || 0.5;
        
        // Combine factors
        return (traitWeight * 0.4) + (discriminability * 0.6);
    }

    /**
     * Calculate trait relevance for targeting
     */
    calculateTraitRelevance(question) {
        const relevance = {};
        
        if (question.metadata.traits) {
            question.metadata.traits.forEach(trait => {
                relevance[trait.name] = trait.weight || 1.0;
            });
        }
        
        return relevance;
    }

    /**
     * Initialize trait coverage tracking
     */
    initializeTraitCoverage() {
        // Get all unique traits from question pool
        const allTraits = new Set();
        this.questionPool.forEach(question => {
            if (question.metadata.traits) {
                question.metadata.traits.forEach(trait => {
                    allTraits.add(trait.name);
                });
            }
        });
        
        // Initialize coverage tracking
        allTraits.forEach(trait => {
            this.traitCoverage.set(trait, {
                target: this.config.targetTraitQuestions,
                current: 0,
                priority: 1.0,
                confidence: 0.0
            });
        });
    }

    /**
     * Pre-select questions for non-adaptive mode
     */
    preSelectQuestions() {
        const sequence = [];
        
        switch (this.config.difficultyProgression) {
            case 'linear':
                sequence.push(...this.createLinearSequence());
                break;
            case 'random':
                sequence.push(...this.createRandomSequence());
                break;
            default:
                sequence.push(...this.createBalancedSequence());
        }
        
        this.selectedQuestions = sequence.slice(0, this.config.maxQuestions);
    }

    /**
     * Create linear difficulty progression
     */
    createLinearSequence() {
        // Sort by difficulty
        const sorted = [...this.questionPool].sort((a, b) => {
            return (a.metadata.difficulty || 0.5) - (b.metadata.difficulty || 0.5);
        });
        
        // Ensure trait balance
        return this.balanceTraitsInSequence(sorted);
    }

    /**
     * Create random sequence with constraints
     */
    createRandomSequence() {
        const shuffled = [...this.questionPool];
        
        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Apply trait balancing
        return this.balanceTraitsInSequence(shuffled);
    }

    /**
     * Create balanced sequence considering multiple factors
     */
    createBalancedSequence() {
        const sequence = [];
        const remainingQuestions = [...this.questionPool];
        const tempTraitCoverage = new Map(this.traitCoverage);
        
        while (sequence.length < this.config.maxQuestions && remainingQuestions.length > 0) {
            // Score each remaining question
            const scored = remainingQuestions.map(question => ({
                question,
                score: this.scoreQuestionForSelection(question, sequence, tempTraitCoverage)
            }));
            
            // Sort by score
            scored.sort((a, b) => b.score - a.score);
            
            // Select best question
            const selected = scored[0].question;
            sequence.push(selected);
            
            // Update tracking
            this.updateTraitCoverageForQuestion(selected, tempTraitCoverage);
            
            // Remove from remaining
            const index = remainingQuestions.indexOf(selected);
            remainingQuestions.splice(index, 1);
        }
        
        return sequence;
    }

    /**
     * Score question for selection
     */
    scoreQuestionForSelection(question, currentSequence, traitCoverage) {
        let score = 0;
        
        // Information value
        score += question.metadata.selectionData.informationValue * 0.3;
        
        // Trait coverage need
        score += this.calculateTraitCoverageScore(question, traitCoverage) * 0.4;
        
        // Difficulty appropriateness
        score += this.calculateDifficultyScore(question, currentSequence) * 0.2;
        
        // Diversity bonus
        score += this.calculateDiversityScore(question, currentSequence) * 0.1;
        
        return score;
    }

    /**
     * Calculate trait coverage score
     */
    calculateTraitCoverageScore(question, traitCoverage) {
        let coverageScore = 0;
        
        if (question.metadata.traits) {
            question.metadata.traits.forEach(trait => {
                const coverage = traitCoverage.get(trait.name);
                if (coverage) {
                    const need = Math.max(0, coverage.target - coverage.current);
                    const priority = coverage.priority;
                    coverageScore += (need / coverage.target) * priority * (trait.weight || 1.0);
                }
            });
        }
        
        return coverageScore;
    }

    /**
     * Calculate difficulty score
     */
    calculateDifficultyScore(question, currentSequence) {
        if (currentSequence.length === 0) {
            // Start with medium difficulty
            const targetDifficulty = 0.5;
            return 1 - Math.abs((question.metadata.difficulty || 0.5) - targetDifficulty);
        }
        
        // Progressive difficulty based on sequence position
        const position = currentSequence.length / this.config.maxQuestions;
        const targetDifficulty = this.calculateTargetDifficulty(position);
        
        return 1 - Math.abs((question.metadata.difficulty || 0.5) - targetDifficulty);
    }

    /**
     * Calculate target difficulty for position
     */
    calculateTargetDifficulty(position) {
        // Start easy, build to medium-hard, end medium
        if (position < 0.2) {
            return 0.3; // Start easy
        } else if (position < 0.7) {
            return 0.3 + (position - 0.2) * 0.8; // Build up
        } else {
            return 0.7 - (position - 0.7) * 0.3; // Ease off slightly
        }
    }

    /**
     * Calculate diversity score
     */
    calculateDiversityScore(question, currentSequence) {
        if (currentSequence.length === 0) return 0;
        
        const recentQuestions = currentSequence.slice(-3); // Last 3 questions
        let diversityScore = 1.0;
        
        // Category diversity
        const questionCategory = question.metadata.category || 'general';
        const recentCategories = recentQuestions.map(q => q.metadata.category || 'general');
        const categoryRepeat = recentCategories.filter(cat => cat === questionCategory).length;
        diversityScore -= categoryRepeat * 0.2;
        
        // Trait diversity
        const questionTraits = new Set((question.metadata.traits || []).map(t => t.name));
        recentQuestions.forEach(recentQ => {
            const recentTraits = new Set((recentQ.metadata.traits || []).map(t => t.name));
            const overlap = [...questionTraits].filter(trait => recentTraits.has(trait)).length;
            diversityScore -= overlap * 0.1;
        });
        
        return Math.max(0, diversityScore);
    }

    /**
     * Update trait coverage for a question
     */
    updateTraitCoverageForQuestion(question, traitCoverage) {
        if (question.metadata.traits) {
            question.metadata.traits.forEach(trait => {
                const coverage = traitCoverage.get(trait.name);
                if (coverage) {
                    coverage.current++;
                }
            });
        }
    }

    /**
     * Balance traits in sequence
     */
    balanceTraitsInSequence(sequence) {
        const balanced = [];
        const tempCoverage = new Map(this.traitCoverage);
        
        // First pass: ensure minimum trait coverage
        const remaining = [...sequence];
        
        // Get questions for underrepresented traits
        this.traitCoverage.forEach((coverage, trait) => {
            while (coverage.current < Math.ceil(coverage.target * 0.5) && remaining.length > 0) {
                const question = this.findBestQuestionForTrait(trait, remaining);
                if (question) {
                    balanced.push(question);
                    this.updateTraitCoverageForQuestion(question, tempCoverage);
                    remaining.splice(remaining.indexOf(question), 1);
                }
            }
        });
        
        // Second pass: fill remaining slots
        while (balanced.length < this.config.maxQuestions && remaining.length > 0) {
            const question = remaining.shift();
            balanced.push(question);
        }
        
        return balanced;
    }

    /**
     * Find best question for a specific trait
     */
    findBestQuestionForTrait(targetTrait, questions) {
        const candidates = questions.filter(question => {
            return question.metadata.traits && 
                   question.metadata.traits.some(trait => trait.name === targetTrait);
        });
        
        if (candidates.length === 0) return null;
        
        // Score candidates by trait relevance
        const scored = candidates.map(question => {
            const traitData = question.metadata.traits.find(t => t.name === targetTrait);
            return {
                question,
                score: (traitData?.weight || 1.0) * question.metadata.selectionData.informationValue
            };
        });
        
        scored.sort((a, b) => b.score - a.score);
        return scored[0].question;
    }

    /**
     * Get current question
     */
    getCurrentQuestion() {
        if (this.config.difficultyProgression === 'adaptive') {
            return this.getAdaptiveQuestion();
        } else {
            return this.getSequentialQuestion();
        }
    }

    /**
     * Get question using adaptive selection
     */
    getAdaptiveQuestion() {
        // Get current assessment state
        const responses = this.assessmentEngine.getCurrentSession()?.responses || [];
        const userProfile = this.assessmentEngine.getCurrentSession()?.userProfile || {};
        
        // Get candidate questions
        const candidates = this.getCandidateQuestions(responses);
        
        if (candidates.length === 0) {
            console.warn('⚠️ No candidate questions available');
            return null;
        }
        
        // Score and select best question
        const scored = candidates.map(question => ({
            question,
            score: this.scoreAdaptiveQuestion(question, responses, userProfile)
        }));
        
        scored.sort((a, b) => b.score - a.score);
        const selected = scored[0].question;
        
        // Track selection
        this.trackQuestionSelection(selected);
        
        return selected;
    }

    /**
     * Get question from pre-selected sequence
     */
    getSequentialQuestion() {
        if (this.currentIndex >= this.selectedQuestions.length) {
            return null;
        }
        
        const question = this.selectedQuestions[this.currentIndex];
        this.currentIndex++;
        
        // Track selection
        this.trackQuestionSelection(question);
        
        return question;
    }

    /**
     * Get candidate questions for adaptive selection
     */
    getCandidateQuestions(responses) {
        const answeredIds = new Set(responses.map(r => r.questionId));
        
        return this.questionPool.filter(question => {
            // Not already answered
            if (answeredIds.has(question.id)) {
                return false;
            }
            
            // Has relevant traits we need to measure
            if (question.metadata.traits) {
                return question.metadata.traits.some(trait => {
                    const coverage = this.traitCoverage.get(trait.name);
                    return coverage && coverage.current < coverage.target;
                });
            }
            
            return true;
        });
    }

    /**
     * Score question for adaptive selection
     */
    scoreAdaptiveQuestion(question, responses, userProfile) {
        let score = 0;
        
        // Information value
        score += question.metadata.selectionData.informationValue * 0.25;
        
        // Trait coverage priority
        score += this.calculateTraitPriorityScore(question) * 0.35;
        
        // Uncertainty reduction
        score += this.calculateUncertaintyScore(question, userProfile) * 0.25;
        
        // Difficulty appropriateness
        score += this.calculateAdaptiveDifficultyScore(question, userProfile) * 0.15;
        
        return score;
    }

    /**
     * Calculate trait priority score
     */
    calculateTraitPriorityScore(question) {
        let priorityScore = 0;
        
        if (question.metadata.traits) {
            question.metadata.traits.forEach(trait => {
                const coverage = this.traitCoverage.get(trait.name);
                if (coverage) {
                    const need = Math.max(0, coverage.target - coverage.current);
                    priorityScore += (need / coverage.target) * coverage.priority;
                }
            });
        }
        
        return priorityScore;
    }

    /**
     * Calculate uncertainty reduction score
     */
    calculateUncertaintyScore(question, userProfile) {
        let uncertaintyScore = 0;
        
        if (question.metadata.traits && userProfile.estimatedTraits) {
            question.metadata.traits.forEach(trait => {
                const estimate = userProfile.estimatedTraits[trait.name];
                if (estimate) {
                    // Higher score for low confidence traits
                    uncertaintyScore += (1 - estimate.confidence) * (trait.weight || 1.0);
                } else {
                    // High score for unmeasured traits
                    uncertaintyScore += 1.0;
                }
            });
        }
        
        return uncertaintyScore;
    }

    /**
     * Calculate adaptive difficulty score
     */
    calculateAdaptiveDifficultyScore(question, userProfile) {
        // For now, prefer medium difficulty
        // Future: adapt based on user's performance pattern
        const targetDifficulty = 0.5;
        return 1 - Math.abs((question.metadata.difficulty || 0.5) - targetDifficulty);
    }

    /**
     * Track question selection
     */
    trackQuestionSelection(question) {
        // Update selection metadata
        question.metadata.selectionData.timesSelected++;
        question.metadata.selectionData.lastSelected = Date.now();
        
        // Track in history
        this.questionHistory.set(question.id, {
            selectedAt: Date.now(),
            index: this.currentIndex,
            adaptiveScore: null // To be filled if adaptive
        });
        
        // Update category distribution
        const category = question.metadata.category || 'general';
        this.categoryDistribution.set(category, 
            (this.categoryDistribution.get(category) || 0) + 1);
        
        // Analytics
        this.analytics.trackSelection(question);
    }

    /**
     * Update adaptive selection based on response
     */
    updateAdaptiveSelection(responses) {
        if (responses.length === 0) return;
        
        const latestResponse = responses[responses.length - 1];
        const question = this.questionPool.find(q => q.id === latestResponse.questionId);
        
        if (question) {
            // Update question performance data
            this.updateQuestionPerformance(question, latestResponse);
            
            // Update trait coverage
            this.updateTraitCoverage(question);
            
            // Update difficulty model
            this.difficultyModel.updateWithResponse(question, latestResponse);
            
            // Adjust trait priorities
            this.adjustTraitPriorities(responses);
        }
    }

    /**
     * Update question performance data
     */
    updateQuestionPerformance(question, response) {
        const selectionData = question.metadata.selectionData;
        
        // Update average response time
        if (response.responseTime) {
            if (selectionData.avgResponseTime) {
                selectionData.avgResponseTime = 
                    (selectionData.avgResponseTime + response.responseTime) / 2;
            } else {
                selectionData.avgResponseTime = response.responseTime;
            }
        }
        
        // Update difficulty rating based on actual performance
        const expectedTime = question.metadata.timeEstimate || 10000;
        if (response.responseTime) {
            if (response.responseTime > expectedTime * 1.5) {
                // Question was harder than expected
                selectionData.difficultyRating = Math.min(1.0, 
                    selectionData.difficultyRating + 0.05);
            } else if (response.responseTime < expectedTime * 0.5) {
                // Question was easier than expected
                selectionData.difficultyRating = Math.max(0.1, 
                    selectionData.difficultyRating - 0.05);
            }
        }
    }

    /**
     * Update trait coverage
     */
    updateTraitCoverage(question) {
        if (question.metadata.traits) {
            question.metadata.traits.forEach(trait => {
                const coverage = this.traitCoverage.get(trait.name);
                if (coverage) {
                    coverage.current++;
                    
                    // Update priority based on current coverage
                    const completionRatio = coverage.current / coverage.target;
                    if (completionRatio >= 1.0) {
                        coverage.priority = 0.5; // Lower priority when target met
                    } else if (completionRatio < 0.3) {
                        coverage.priority = 1.5; // Higher priority when far from target
                    }
                }
            });
        }
    }

    /**
     * Adjust trait priorities based on response patterns
     */
    adjustTraitPriorities(responses) {
        // Analyze response consistency for each trait
        const traitResponses = new Map();
        
        responses.forEach(response => {
            const question = this.questionPool.find(q => q.id === response.questionId);
            if (question && question.metadata.traits) {
                question.metadata.traits.forEach(trait => {
                    if (!traitResponses.has(trait.name)) {
                        traitResponses.set(trait.name, []);
                    }
                    traitResponses.get(trait.name).push(response.answer);
                });
            }
        });
        
        // Adjust priorities based on response variance
        traitResponses.forEach((answers, trait) => {
            const coverage = this.traitCoverage.get(trait);
            if (coverage && answers.length > 2) {
                const variance = this.calculateVariance(answers);
                
                // Higher variance = more questions needed for confidence
                if (variance > 1.5) {
                    coverage.priority = Math.min(2.0, coverage.priority + 0.2);
                } else if (variance < 0.5) {
                    coverage.priority = Math.max(0.5, coverage.priority - 0.1);
                }
            }
        });
    }

    /**
     * Calculate variance of a set of values
     */
    calculateVariance(values) {
        if (values.length < 2) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squareDiffs = values.map(val => Math.pow(val - mean, 2));
        return squareDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }

    /**
     * Get total number of questions
     */
    getTotalQuestions() {
        if (this.config.difficultyProgression === 'adaptive') {
            // Estimate based on coverage targets
            const totalTraits = this.traitCoverage.size;
            return Math.min(this.config.maxQuestions, 
                Math.max(this.config.minQuestions, totalTraits * this.config.targetTraitQuestions));
        } else {
            return this.selectedQuestions.length;
        }
    }

    /**
     * Get selection statistics
     */
    getSelectionStatistics() {
        return {
            totalQuestions: this.questionPool.length,
            selectedCount: this.questionHistory.size,
            traitCoverage: Object.fromEntries(this.traitCoverage),
            categoryDistribution: Object.fromEntries(this.categoryDistribution),
            difficultyDistribution: this.calculateDifficultyDistribution(),
            selectionEfficiency: this.calculateSelectionEfficiency()
        };
    }

    /**
     * Calculate difficulty distribution of selected questions
     */
    calculateDifficultyDistribution() {
        const distribution = { easy: 0, medium: 0, hard: 0 };
        
        this.questionHistory.forEach((data, questionId) => {
            const question = this.questionPool.find(q => q.id === questionId);
            if (question) {
                const difficulty = question.metadata.difficulty || 0.5;
                if (difficulty < 0.33) {
                    distribution.easy++;
                } else if (difficulty < 0.67) {
                    distribution.medium++;
                } else {
                    distribution.hard++;
                }
            }
        });
        
        return distribution;
    }

    /**
     * Calculate selection efficiency
     */
    calculateSelectionEfficiency() {
        const selectedCount = this.questionHistory.size;
        const totalTraits = this.traitCoverage.size;
        const avgCoverage = Array.from(this.traitCoverage.values())
            .reduce((sum, cov) => sum + Math.min(1, cov.current / cov.target), 0) / totalTraits;
        
        return selectedCount > 0 ? avgCoverage / (selectedCount / this.config.maxQuestions) : 0;
    }

    /**
     * Reset selector state
     */
    reset() {
        this.selectedQuestions = [];
        this.questionHistory.clear();
        this.traitCoverage.clear();
        this.categoryDistribution.clear();
        this.currentIndex = 0;
        
        if (this.difficultyModel) {
            this.difficultyModel.reset();
        }
    }
}

/**
 * Difficulty Model for adaptive difficulty adjustment
 */
class DifficultyModel {
    constructor() {
        this.userAbility = 0.5; // Estimated user ability (0-1)
        this.confidence = 0.0; // Confidence in ability estimate
        this.responseHistory = [];
    }

    /**
     * Update model with new response
     */
    updateWithResponse(question, response) {
        this.responseHistory.push({
            difficulty: question.metadata.difficulty,
            responseTime: response.responseTime,
            answer: response.answer,
            timestamp: response.timestamp
        });
        
        // Update ability estimate
        this.updateAbilityEstimate(question, response);
        
        // Update confidence
        this.updateConfidence();
    }

    /**
     * Update ability estimate based on response
     */
    updateAbilityEstimate(question, response) {
        const difficulty = question.metadata.difficulty || 0.5;
        const responseTime = response.responseTime;
        const expectedTime = question.metadata.timeEstimate || 10000;
        
        // Performance indicator based on response time
        const timeRatio = responseTime ? expectedTime / responseTime : 1.0;
        const performance = Math.min(1.0, Math.max(0.1, timeRatio));
        
        // Weighted update
        const weight = 0.1; // Learning rate
        const newEstimate = this.userAbility * (1 - weight) + 
                           (performance * difficulty) * weight;
        
        this.userAbility = Math.min(1.0, Math.max(0.1, newEstimate));
    }

    /**
     * Update confidence in ability estimate
     */
    updateConfidence() {
        const historyLength = this.responseHistory.length;
        this.confidence = Math.min(1.0, historyLength / 20); // Confidence builds over 20 responses
    }

    /**
     * Get recommended difficulty for next question
     */
    getRecommendedDifficulty() {
        // Target difficulty slightly above estimated ability
        const targetDifficulty = Math.min(0.9, this.userAbility + 0.1);
        
        // Add some randomness for exploration
        const exploration = (Math.random() - 0.5) * 0.2 * (1 - this.confidence);
        
        return Math.min(1.0, Math.max(0.1, targetDifficulty + exploration));
    }

    /**
     * Reset the model
     */
    reset() {
        this.userAbility = 0.5;
        this.confidence = 0.0;
        this.responseHistory = [];
    }
}

/**
 * Question Analytics for tracking and optimization
 */
class QuestionAnalytics {
    constructor() {
        this.selectionData = new Map();
        this.performanceData = new Map();
    }

    /**
     * Track question selection
     */
    trackSelection(question) {
        const id = question.id;
        
        if (!this.selectionData.has(id)) {
            this.selectionData.set(id, {
                timesSelected: 0,
                categories: new Set(),
                avgPosition: 0,
                totalPositions: 0
            });
        }
        
        const data = this.selectionData.get(id);
        data.timesSelected++;
        if (question.metadata.category) {
            data.categories.add(question.metadata.category);
        }
    }

    /**
     * Track question performance
     */
    trackPerformance(question, response) {
        const id = question.id;
        
        if (!this.performanceData.has(id)) {
            this.performanceData.set(id, {
                responses: [],
                avgResponseTime: 0,
                difficultyRating: question.metadata.difficulty || 0.5
            });
        }
        
        const data = this.performanceData.get(id);
        data.responses.push({
            responseTime: response.responseTime,
            answer: response.answer,
            timestamp: response.timestamp
        });
        
        // Update averages
        const responseTimes = data.responses
            .filter(r => r.responseTime)
            .map(r => r.responseTime);
        
        if (responseTimes.length > 0) {
            data.avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        }
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        return {
            totalQuestionsTracked: this.selectionData.size,
            totalPerformanceData: this.performanceData.size,
            selectionFrequency: this.calculateSelectionFrequency(),
            performanceSummary: this.calculatePerformanceSummary()
        };
    }

    /**
     * Calculate selection frequency statistics
     */
    calculateSelectionFrequency() {
        const frequencies = Array.from(this.selectionData.values())
            .map(data => data.timesSelected);
        
        return {
            min: Math.min(...frequencies),
            max: Math.max(...frequencies),
            avg: frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length,
            total: frequencies.reduce((sum, freq) => sum + freq, 0)
        };
    }

    /**
     * Calculate performance summary
     */
    calculatePerformanceSummary() {
        const responseTimes = [];
        const difficultyRatings = [];
        
        this.performanceData.forEach(data => {
            if (data.avgResponseTime > 0) {
                responseTimes.push(data.avgResponseTime);
            }
            difficultyRatings.push(data.difficultyRating);
        });
        
        return {
            avgResponseTime: responseTimes.length > 0 ? 
                responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0,
            avgDifficulty: difficultyRatings.length > 0 ?
                difficultyRatings.reduce((sum, diff) => sum + diff, 0) / difficultyRatings.length : 0.5
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuestionSelector, DifficultyModel, QuestionAnalytics };
}
