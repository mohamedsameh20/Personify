/**
 * Assessment Module - Handles quiz logic and question management
 * Manages the personality assessment flow and question presentation
 */

class AssessmentEngine {
    constructor() {
        this.questions = [];
        this.currentQuestion = 0;
        this.answers = [];
        this.mode = 'basic'; // demo, basic, comprehensive
        this.startTime = null;
        this.demographics = {};
        
        // Assessment configuration
        this.config = {
            modes: {
                demo: { questions: 36, duration: 10 },
                basic: { questions: 120, duration: 25 },
                comprehensive: { questions: 240, duration: 45 }
            },
            traits: [
                'Honesty-Humility',
                'Emotionality',
                'Extraversion', 
                'Agreeableness',
                'Conscientiousness',
                'Openness',
                'Dominance',
                'Vigilance',
                'Self-Transcendence',
                'Abstract Orientation',
                'Value Orientation',
                'Flexibility'
            ]
        };

        this.questionPool = null;
        this.selectedQuestions = [];
        this.progress = {
            current: 0,
            total: 0,
            percentage: 0,
            traitProgress: {}
        };

        // Event handlers
        this.onQuestionChange = null;
        this.onProgress = null;
        this.onComplete = null;
    }

    /**
     * Load questions from JSON or use embedded data
     */
    async loadQuestions() {
        try {
            // Try to load from questions.json
            const response = await fetch('./questions.json');
            if (response.ok) {
                this.questionPool = await response.json();
                return true;
            }
        } catch (error) {
            console.warn('Could not load questions.json, using fallback data');
        }

        // Fallback to embedded question data
        this.questionPool = this.getDefaultQuestions();
        return true;
    }

    /**
     * Get default questions if external file fails
     */
    getDefaultQuestions() {
        return {
            traits: this.config.traits,
            trait_descriptions: {
                "Honesty-Humility": "Tendency toward sincerity, fairness, modesty, and avoidance of greed or exploitation",
                "Emotionality": "Tendency to experience anxiety, fear, emotional dependence, and empathetic sentimentality",
                "Extraversion": "Tendency toward social self-esteem, social boldness, sociability, and liveliness in expressions",
                "Agreeableness": "Tendency toward forgiveness, gentleness, flexibility, patience, and interpersonal trust",
                "Conscientiousness": "Tendency toward organization, diligence, perfectionism, and prudent deliberation",
                "Openness": "Tendency toward aesthetic appreciation, intellectual curiosity, creativity, and unconventionality",
                "Dominance": "Tendency toward assertiveness, leadership, control-seeking, and interpersonal influence",
                "Vigilance": "Tendency toward cautiousness, skepticism, wariness of intentions, and threat detection",
                "Self-Transcendence": "Tendency toward spirituality, sense of interconnectedness, altruism, and universal values",
                "Abstract Orientation": "Tendency to prefer conceptual ideas, theoretical possibilities, and intangible concepts",
                "Value Orientation": "Tendency to prioritize personal values, emotions, and moral principles in decision-making",
                "Flexibility": "Tendency toward adaptability, spontaneity, comfort with ambiguity, and openness to change"
            },
            questions: this.generateSampleQuestions()
        };
    }

    /**
     * Generate sample questions for testing
     */
    generateSampleQuestions() {
        const questionTemplates = [
            // Extraversion questions
            { text: "I enjoy being the center of attention at parties.", primary_trait: "Extraversion", facet: "Social Boldness", weight: 1.0, reversed: false },
            { text: "I prefer working alone rather than in groups.", primary_trait: "Extraversion", facet: "Sociability", weight: 1.0, reversed: true },
            { text: "I feel energized after spending time with friends.", primary_trait: "Extraversion", facet: "Liveliness", weight: 1.0, reversed: false },
            
            // Agreeableness questions
            { text: "I try to avoid conflicts with others.", primary_trait: "Agreeableness", facet: "Gentleness", weight: 1.0, reversed: false },
            { text: "I believe most people have good intentions.", primary_trait: "Agreeableness", facet: "Trust", weight: 1.0, reversed: false },
            { text: "I find it easy to forgive others when they hurt me.", primary_trait: "Agreeableness", facet: "Forgiveness", weight: 1.0, reversed: false },
            
            // Conscientiousness questions
            { text: "I always complete my tasks on time.", primary_trait: "Conscientiousness", facet: "Diligence", weight: 1.0, reversed: false },
            { text: "I like to keep my living space organized and clean.", primary_trait: "Conscientiousness", facet: "Organization", weight: 1.0, reversed: false },
            { text: "I pay close attention to details in my work.", primary_trait: "Conscientiousness", facet: "Perfectionism", weight: 1.0, reversed: false },
            
            // Openness questions
            { text: "I enjoy trying new and unusual foods.", primary_trait: "Openness", facet: "Unconventionality", weight: 1.0, reversed: false },
            { text: "I appreciate different forms of art and music.", primary_trait: "Openness", facet: "Aesthetic Appreciation", weight: 1.0, reversed: false },
            { text: "I like to explore new ideas and concepts.", primary_trait: "Openness", facet: "Inquisitiveness", weight: 1.0, reversed: false },
            
            // Honesty-Humility questions
            { text: "I am always honest, even when it might hurt someone's feelings.", primary_trait: "Honesty-Humility", facet: "Sincerity", weight: 1.0, reversed: false },
            { text: "I don't feel I deserve special treatment.", primary_trait: "Honesty-Humility", facet: "Modesty", weight: 1.0, reversed: false },
            { text: "I would never take something that doesn't belong to me.", primary_trait: "Honesty-Humility", facet: "Fairness", weight: 1.0, reversed: false },
            
            // Emotionality questions
            { text: "I worry about things that might go wrong.", primary_trait: "Emotionality", facet: "Anxiety", weight: 1.0, reversed: false },
            { text: "I feel deeply moved by others' suffering.", primary_trait: "Emotionality", facet: "Sentimentality", weight: 1.0, reversed: false },
            { text: "I need emotional support from others when facing challenges.", primary_trait: "Emotionality", facet: "Dependence", weight: 1.0, reversed: false }
        ];

        // Expand questions by creating variations and additional items
        const expandedQuestions = [...questionTemplates];
        
        // Generate additional questions for each trait to reach target counts
        this.config.traits.forEach(trait => {
            const traitQuestions = questionTemplates.filter(q => q.primary_trait === trait);
            const needed = Math.ceil(240 / this.config.traits.length) - traitQuestions.length;
            
            for (let i = 0; i < needed; i++) {
                const baseQuestion = traitQuestions[i % traitQuestions.length];
                expandedQuestions.push({
                    ...baseQuestion,
                    text: this.generateVariation(baseQuestion.text, i),
                    weight: 0.8 + Math.random() * 0.4 // Vary weights slightly
                });
            }
        });

        return expandedQuestions;
    }

    /**
     * Generate question variations
     */
    generateVariation(baseText, index) {
        const variations = [
            text => text.replace("I ", "I often "),
            text => text.replace("I ", "I usually "),
            text => text.replace("I ", "I generally "),
            text => text.replace("I ", "I typically "),
            text => text.replace(".", " in most situations."),
            text => text.replace(".", " compared to others."),
            text => text.replace(".", " when possible.")
        ];
        
        const variation = variations[index % variations.length];
        return variation(baseText);
    }

    /**
     * Initialize assessment with selected mode
     */
    initializeAssessment(mode = 'basic') {
        this.mode = mode;
        this.currentQuestion = 0;
        this.answers = [];
        this.startTime = new Date();
        
        const targetCount = this.config.modes[mode].questions;
        this.selectedQuestions = this.selectQuestions(targetCount);
        
        this.progress = {
            current: 0,
            total: this.selectedQuestions.length,
            percentage: 0,
            traitProgress: this.initializeTraitProgress()
        };

        return this.selectedQuestions.length > 0;
    }

    /**
     * Select questions for assessment based on mode
     */
    selectQuestions(targetCount) {
        if (!this.questionPool || !this.questionPool.questions) {
            console.error('Question pool not loaded');
            return [];
        }

        const questions = this.questionPool.questions;
        const questionsPerTrait = Math.ceil(targetCount / this.config.traits.length);
        const selected = [];

        // Ensure balanced coverage across all traits
        this.config.traits.forEach(trait => {
            const traitQuestions = questions.filter(q => q.primary_trait === trait);
            const shuffled = this.shuffleArray([...traitQuestions]);
            const count = Math.min(questionsPerTrait, shuffled.length);
            selected.push(...shuffled.slice(0, count));
        });

        // If we need more questions, add randomly from remaining pool
        if (selected.length < targetCount) {
            const remaining = questions.filter(q => !selected.includes(q));
            const shuffled = this.shuffleArray(remaining);
            const needed = targetCount - selected.length;
            selected.push(...shuffled.slice(0, needed));
        }

        // Shuffle final question order
        return this.shuffleArray(selected).slice(0, targetCount);
    }

    /**
     * Initialize trait progress tracking
     */
    initializeTraitProgress() {
        const progress = {};
        this.config.traits.forEach(trait => {
            const traitQuestions = this.selectedQuestions.filter(q => q.primary_trait === trait);
            progress[trait] = {
                total: traitQuestions.length,
                answered: 0,
                percentage: 0
            };
        });
        return progress;
    }

    /**
     * Get current question
     */
    getCurrentQuestion() {
        if (this.currentQuestion >= this.selectedQuestions.length) {
            return null;
        }
        return this.selectedQuestions[this.currentQuestion];
    }

    /**
     * Submit answer for current question
     */
    submitAnswer(answer) {
        if (this.currentQuestion >= this.selectedQuestions.length) {
            return false;
        }

        const question = this.selectedQuestions[this.currentQuestion];
        
        // Store answer
        this.answers[this.currentQuestion] = {
            questionIndex: this.currentQuestion,
            question: question,
            answer: answer,
            timestamp: new Date()
        };

        // Update trait progress
        if (question.primary_trait && this.progress.traitProgress[question.primary_trait]) {
            this.progress.traitProgress[question.primary_trait].answered++;
            this.progress.traitProgress[question.primary_trait].percentage = 
                (this.progress.traitProgress[question.primary_trait].answered / 
                 this.progress.traitProgress[question.primary_trait].total) * 100;
        }

        // Update overall progress
        this.progress.current = this.answers.filter(a => a !== undefined).length;
        this.progress.percentage = (this.progress.current / this.progress.total) * 100;

        // Trigger progress callback
        if (this.onProgress) {
            this.onProgress(this.progress);
        }

        return true;
    }

    /**
     * Move to next question
     */
    nextQuestion() {
        if (this.currentQuestion < this.selectedQuestions.length - 1) {
            this.currentQuestion++;
            
            if (this.onQuestionChange) {
                this.onQuestionChange(this.getCurrentQuestion(), this.currentQuestion);
            }
            
            return true;
        } else {
            // Assessment complete
            if (this.onComplete) {
                this.onComplete(this.getResults());
            }
            return false;
        }
    }

    /**
     * Move to previous question
     */
    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            
            if (this.onQuestionChange) {
                this.onQuestionChange(this.getCurrentQuestion(), this.currentQuestion);
            }
            
            return true;
        }
        return false;
    }

    /**
     * Jump to specific question
     */
    goToQuestion(questionIndex) {
        if (questionIndex >= 0 && questionIndex < this.selectedQuestions.length) {
            this.currentQuestion = questionIndex;
            
            if (this.onQuestionChange) {
                this.onQuestionChange(this.getCurrentQuestion(), this.currentQuestion);
            }
            
            return true;
        }
        return false;
    }

    /**
     * Skip current question
     */
    skipQuestion() {
        // Mark as skipped (null answer)
        this.answers[this.currentQuestion] = {
            questionIndex: this.currentQuestion,
            question: this.selectedQuestions[this.currentQuestion],
            answer: null,
            timestamp: new Date(),
            skipped: true
        };

        return this.nextQuestion();
    }

    /**
     * Get assessment results
     */
    getResults() {
        const validAnswers = this.answers.filter(a => a && a.answer !== null);
        const responses = this.answers.map(a => a ? a.answer : null);
        
        return {
            mode: this.mode,
            startTime: this.startTime,
            endTime: new Date(),
            duration: new Date() - this.startTime,
            questions: this.selectedQuestions,
            answers: this.answers,
            responses: responses,
            completionRate: (validAnswers.length / this.selectedQuestions.length) * 100,
            progress: this.progress,
            demographics: this.demographics
        };
    }

    /**
     * Calculate estimated time remaining
     */
    getTimeEstimate() {
        if (this.currentQuestion === 0) {
            return this.config.modes[this.mode].duration;
        }

        const elapsed = (new Date() - this.startTime) / 1000 / 60; // minutes
        const avgTimePerQuestion = elapsed / this.currentQuestion;
        const remaining = (this.selectedQuestions.length - this.currentQuestion) * avgTimePerQuestion;
        
        return Math.max(1, Math.round(remaining));
    }

    /**
     * Get progress statistics
     */
    getProgressStats() {
        const answered = this.answers.filter(a => a && a.answer !== null).length;
        const skipped = this.answers.filter(a => a && a.skipped).length;
        
        return {
            total: this.selectedQuestions.length,
            answered: answered,
            skipped: skipped,
            remaining: this.selectedQuestions.length - this.currentQuestion - 1,
            percentage: (this.currentQuestion / this.selectedQuestions.length) * 100,
            completionRate: (answered / this.selectedQuestions.length) * 100
        };
    }

    /**
     * Validate assessment completion
     */
    isComplete() {
        return this.currentQuestion >= this.selectedQuestions.length;
    }

    /**
     * Check if assessment has minimum required responses
     */
    hasMinimumResponses() {
        const validAnswers = this.answers.filter(a => a && a.answer !== null).length;
        const required = Math.ceil(this.selectedQuestions.length * 0.7); // 70% minimum
        return validAnswers >= required;
    }

    /**
     * Save assessment state
     */
    saveState() {
        return {
            mode: this.mode,
            currentQuestion: this.currentQuestion,
            answers: this.answers,
            selectedQuestions: this.selectedQuestions,
            startTime: this.startTime,
            progress: this.progress,
            demographics: this.demographics
        };
    }

    /**
     * Restore assessment state
     */
    restoreState(state) {
        this.mode = state.mode;
        this.currentQuestion = state.currentQuestion;
        this.answers = state.answers || [];
        this.selectedQuestions = state.selectedQuestions || [];
        this.startTime = new Date(state.startTime);
        this.progress = state.progress || this.initializeTraitProgress();
        this.demographics = state.demographics || {};
        
        return true;
    }

    /**
     * Reset assessment
     */
    reset() {
        this.currentQuestion = 0;
        this.answers = [];
        this.selectedQuestions = [];
        this.startTime = null;
        this.demographics = {};
        this.progress = {
            current: 0,
            total: 0,
            percentage: 0,
            traitProgress: {}
        };
    }

    /**
     * Utility function to shuffle array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Get trait distribution in selected questions
     */
    getTraitDistribution() {
        const distribution = {};
        this.config.traits.forEach(trait => {
            distribution[trait] = this.selectedQuestions.filter(q => q.primary_trait === trait).length;
        });
        return distribution;
    }

    /**
     * Get question categories
     */
    getQuestionCategories() {
        const categories = {};
        this.selectedQuestions.forEach(question => {
            const category = question.category || 'General';
            categories[category] = (categories[category] || 0) + 1;
        });
        return categories;
    }

    /**
     * Export assessment data
     */
    exportAssessmentData() {
        return {
            metadata: {
                mode: this.mode,
                version: '1.0',
                startTime: this.startTime,
                exportTime: new Date()
            },
            configuration: this.config,
            questions: this.selectedQuestions,
            answers: this.answers,
            progress: this.progress,
            statistics: this.getProgressStats()
        };
    }
}

// Export for use in other modules
window.AssessmentEngine = AssessmentEngine;
