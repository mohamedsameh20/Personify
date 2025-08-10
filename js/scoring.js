/**
 * Scoring Module - Handles personality trait scoring algorithms
 * Implements the 12-trait personality model with sophisticated scoring
 */

class ScoringEngine {
    constructor() {
        this.traits = [
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
        ];

        // Facet definitions for each trait
        this.facets = {
            'Honesty-Humility': ['Sincerity', 'Fairness', 'Greed Avoidance', 'Modesty'],
            'Emotionality': ['Fearfulness', 'Anxiety', 'Dependence', 'Sentimentality'],
            'Extraversion': ['Social Self-Esteem', 'Social Boldness', 'Sociability', 'Liveliness'],
            'Agreeableness': ['Forgiveness', 'Gentleness', 'Flexibility', 'Patience', 'Trust'],
            'Conscientiousness': ['Organization', 'Diligence', 'Perfectionism', 'Prudence'],
            'Openness': ['Aesthetic Appreciation', 'Inquisitiveness', 'Creativity', 'Unconventionality'],
            'Dominance': ['Assertiveness', 'Leadership', 'Control', 'Self-Confidence'],
            'Vigilance': ['Suspicion', 'Skepticism', 'Wariness', 'Distrust'],
            'Self-Transcendence': ['Spirituality', 'Universality', 'Altruism', 'Unity'],
            'Abstract Orientation': ['Conceptual Thinking', 'Imagination', 'Idea-Focus', 'Theoretical'],
            'Value Orientation': ['Empathy', 'Moral Focus', 'Personal Values', 'Emotional Reasoning'],
            'Flexibility': ['Adaptability', 'Spontaneity', 'Tolerance for Ambiguity', 'Openness to Change']
        };

        // Trait correlation matrix for cross-validation
        this.correlationMatrix = this.buildCorrelationMatrix();
        
        // Scoring weights and parameters
        this.weights = {
            direct: 39.0,      // Weight for direct trait contributions
            correlated: 3.0,   // Weight for correlated trait contributions
            reliability: 0.85  // Reliability factor for score confidence
        };

        // MBTI mapping configuration
        this.mbtiMapping = this.initializeMBTIMapping();
        
        // Confidence interval parameters
        this.confidenceParams = {
            minQuestions: 10,   // Minimum questions for reliable scoring
            maxConfidence: 0.95, // Maximum confidence level
            baseConfidence: 0.6  // Base confidence with minimal questions
        };
    }

    /**
     * Build correlation matrix between traits
     */
    buildCorrelationMatrix() {
        const matrix = {};
        
        // Initialize matrix
        this.traits.forEach(trait => {
            matrix[trait] = {};
            this.traits.forEach(otherTrait => {
                matrix[trait][otherTrait] = 0;
            });
        });

        // Define correlations based on personality psychology research
        const correlations = [
            // Positive correlations
            ['Extraversion', 'Dominance', 0.65],
            ['Extraversion', 'Openness', 0.45],
            ['Agreeableness', 'Honesty-Humility', 0.55],
            ['Conscientiousness', 'Vigilance', 0.35],
            ['Openness', 'Abstract Orientation', 0.75],
            ['Self-Transcendence', 'Value Orientation', 0.60],
            ['Flexibility', 'Openness', 0.50],
            ['Emotionality', 'Value Orientation', 0.40],
            
            // Negative correlations
            ['Dominance', 'Agreeableness', -0.45],
            ['Vigilance', 'Agreeableness', -0.50],
            ['Flexibility', 'Conscientiousness', -0.35],
            ['Honesty-Humility', 'Dominance', -0.30],
            ['Vigilance', 'Self-Transcendence', -0.40],
            ['Abstract Orientation', 'Conscientiousness', -0.25]
        ];

        // Apply correlations symmetrically
        correlations.forEach(([trait1, trait2, correlation]) => {
            matrix[trait1][trait2] = correlation;
            matrix[trait2][trait1] = correlation;
        });

        return matrix;
    }

    /**
     * Initialize MBTI mapping from 12-trait scores
     */
    initializeMBTIMapping() {
        return {
            // Extraversion vs Introversion
            'E_I': {
                traits: ['Extraversion', 'Dominance'],
                weights: [0.8, 0.2],
                threshold: 0.5
            },
            // Sensing vs Intuition  
            'S_N': {
                traits: ['Abstract Orientation', 'Openness'],
                weights: [0.7, 0.3],
                threshold: 0.5
            },
            // Thinking vs Feeling
            'T_F': {
                traits: ['Value Orientation', 'Agreeableness'],
                weights: [0.6, 0.4],
                threshold: 0.5
            },
            // Judging vs Perceiving
            'J_P': {
                traits: ['Conscientiousness', 'Flexibility'],
                weights: [0.7, -0.3], // Negative weight for Flexibility
                threshold: 0.5
            }
        };
    }

    /**
     * Calculate trait scores from question responses
     */
    calculateTraitScores(responses, questions) {
        const traitContributions = {};
        const traitQuestionCounts = {};
        
        // Initialize trait accumulators
        this.traits.forEach(trait => {
            traitContributions[trait] = { direct: 0, correlated: 0 };
            traitQuestionCounts[trait] = 0;
        });

        // Process each response
        responses.forEach((response, index) => {
            const question = questions[index];
            if (!question || response === null || response === undefined) return;

            const primaryTrait = question.primary_trait;
            const weight = question.weight || 1.0;
            const reversed = question.reversed || false;
            
            // Calculate normalized score (0-1 scale)
            let normalizedScore = (response - 1) / 4; // Convert 1-5 to 0-1
            if (reversed) {
                normalizedScore = 1 - normalizedScore;
            }

            // Direct contribution to primary trait
            if (primaryTrait && traitContributions[primaryTrait]) {
                traitContributions[primaryTrait].direct += normalizedScore * weight;
                traitQuestionCounts[primaryTrait]++;
            }

            // Correlated contributions to other traits
            if (primaryTrait) {
                this.traits.forEach(trait => {
                    if (trait !== primaryTrait) {
                        const correlation = this.correlationMatrix[primaryTrait][trait] || 0;
                        traitContributions[trait].correlated += normalizedScore * correlation * weight;
                    }
                });
            }
        });

        // Calculate final trait scores
        const traitScores = {};
        
        this.traits.forEach(trait => {
            const directSum = traitContributions[trait].direct;
            const correlatedSum = traitContributions[trait].correlated;
            const questionCount = traitQuestionCounts[trait];
            
            if (questionCount > 0) {
                // Weighted combination of direct and correlated contributions
                const totalWeightedSum = (directSum * this.weights.direct) + 
                                       (correlatedSum * this.weights.correlated);
                const totalWeight = (questionCount * this.weights.direct) + 
                                  (this.weights.correlated * (this.traits.length - 1));
                
                traitScores[trait] = Math.max(0, Math.min(1, totalWeightedSum / totalWeight));
            } else {
                // No direct questions, use only correlated contributions
                const avgCorrelated = correlatedSum / (this.traits.length - 1);
                traitScores[trait] = Math.max(0, Math.min(1, avgCorrelated));
            }
        });

        return traitScores;
    }

    /**
     * Calculate facet scores within each trait
     */
    calculateFacetScores(responses, questions, traitScores) {
        const facetScores = {};
        
        this.traits.forEach(trait => {
            facetScores[trait] = {};
            const facetList = this.facets[trait];
            
            facetList.forEach(facet => {
                // Find questions that target this specific facet
                const facetQuestions = questions.filter(q => 
                    q.primary_trait === trait && q.facet === facet
                );
                
                if (facetQuestions.length > 0) {
                    // Calculate facet score from relevant questions
                    let facetSum = 0;
                    let facetCount = 0;
                    
                    facetQuestions.forEach(question => {
                        const responseIndex = questions.indexOf(question);
                        const response = responses[responseIndex];
                        
                        if (response !== null && response !== undefined) {
                            let normalizedScore = (response - 1) / 4;
                            if (question.reversed) {
                                normalizedScore = 1 - normalizedScore;
                            }
                            
                            facetSum += normalizedScore * (question.weight || 1.0);
                            facetCount++;
                        }
                    });
                    
                    facetScores[trait][facet] = facetCount > 0 ? 
                        Math.max(0, Math.min(1, facetSum / facetCount)) : 
                        traitScores[trait]; // Fallback to trait score
                } else {
                    // No specific facet questions, estimate from trait score
                    facetScores[trait][facet] = traitScores[trait] * 
                        (0.8 + Math.random() * 0.4); // Add slight variation
                }
            });
        });
        
        return facetScores;
    }

    /**
     * Calculate MBTI type from trait scores
     */
    calculateMBTIType(traitScores) {
        let mbtiType = '';
        
        // Extraversion vs Introversion
        const eScore = this.calculateMBTIDimension('E_I', traitScores);
        mbtiType += eScore > this.mbtiMapping['E_I'].threshold ? 'E' : 'I';
        
        // Sensing vs Intuition
        const nScore = this.calculateMBTIDimension('S_N', traitScores);
        mbtiType += nScore > this.mbtiMapping['S_N'].threshold ? 'N' : 'S';
        
        // Thinking vs Feeling
        const fScore = this.calculateMBTIDimension('T_F', traitScores);
        mbtiType += fScore > this.mbtiMapping['T_F'].threshold ? 'F' : 'T';
        
        // Judging vs Perceiving
        const pScore = this.calculateMBTIDimension('J_P', traitScores);
        mbtiType += pScore > this.mbtiMapping['J_P'].threshold ? 'P' : 'J';
        
        return mbtiType;
    }

    /**
     * Calculate individual MBTI dimension score
     */
    calculateMBTIDimension(dimension, traitScores) {
        const config = this.mbtiMapping[dimension];
        let score = 0;
        let totalWeight = 0;
        
        config.traits.forEach((trait, index) => {
            const weight = config.weights[index];
            const traitScore = traitScores[trait] || 0.5;
            
            score += traitScore * Math.abs(weight);
            totalWeight += Math.abs(weight);
        });
        
        return totalWeight > 0 ? score / totalWeight : 0.5;
    }

    /**
     * Calculate confidence intervals for trait scores
     */
    calculateConfidenceIntervals(responses, questions, traitScores) {
        const confidenceIntervals = {};
        
        this.traits.forEach(trait => {
            const traitQuestions = questions.filter(q => q.primary_trait === trait);
            const questionCount = traitQuestions.length;
            
            // Base confidence on number of questions and response consistency
            let confidence = this.confidenceParams.baseConfidence;
            
            if (questionCount >= this.confidenceParams.minQuestions) {
                // Increase confidence with more questions
                const questionFactor = Math.min(1, questionCount / 20); // 20 questions = max
                confidence += (this.confidenceParams.maxConfidence - this.confidenceParams.baseConfidence) * questionFactor;
                
                // Adjust for response consistency (lower variance = higher confidence)
                const traitResponses = traitQuestions.map(q => {
                    const index = questions.indexOf(q);
                    return responses[index];
                }).filter(r => r !== null && r !== undefined);
                
                if (traitResponses.length > 1) {
                    const variance = this.calculateVariance(traitResponses);
                    const consistencyFactor = 1 - (variance / 4); // Max variance is 4 (1-5 scale)
                    confidence *= Math.max(0.5, consistencyFactor);
                }
            }
            
            confidence = Math.max(0.3, Math.min(0.95, confidence));
            
            // Calculate margin of error
            const marginOfError = (1 - confidence) * 0.2; // Max 20% margin
            
            confidenceIntervals[trait] = {
                score: traitScores[trait],
                confidence: confidence,
                lowerBound: Math.max(0, traitScores[trait] - marginOfError),
                upperBound: Math.min(1, traitScores[trait] + marginOfError),
                marginOfError: marginOfError
            };
        });
        
        return confidenceIntervals;
    }

    /**
     * Calculate variance of responses
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }

    /**
     * Generate personality insights based on trait scores
     */
    generateInsights(traitScores, facetScores, mbtiType) {
        const insights = {
            strengths: [],
            growthAreas: [],
            relationships: [],
            careers: [],
            summary: ''
        };

        // Identify strengths (high scores)
        Object.entries(traitScores).forEach(([trait, score]) => {
            if (score > 0.7) {
                insights.strengths.push(this.getStrengthInsight(trait, score));
            }
        });

        // Identify growth areas (low scores that could be beneficial)
        Object.entries(traitScores).forEach(([trait, score]) => {
            if (score < 0.3) {
                insights.growthAreas.push(this.getGrowthInsight(trait, score));
            }
        });

        // Relationship insights based on trait combinations
        insights.relationships = this.getRelationshipInsights(traitScores);

        // Career insights based on trait profile
        insights.careers = this.getCareerInsights(traitScores, mbtiType);

        // Generate summary
        insights.summary = this.generateSummary(traitScores, mbtiType);

        return insights;
    }

    /**
     * Get strength insight for a trait
     */
    getStrengthInsight(trait, score) {
        const strengthTemplates = {
            'Honesty-Humility': {
                title: 'Integrity & Authenticity',
                description: 'You demonstrate strong moral principles and genuine interactions with others. People trust you because of your sincerity and fair treatment of others.'
            },
            'Emotionality': {
                title: 'Emotional Awareness',
                description: 'You have a high level of emotional intelligence and empathy. You connect deeply with others and are sensitive to emotional nuances.'
            },
            'Extraversion': {
                title: 'Social Energy',
                description: 'You thrive in social situations and energize others with your enthusiasm. You\'re comfortable taking social initiatives and expressing yourself.'
            },
            'Agreeableness': {
                title: 'Cooperative Spirit',
                description: 'You excel at building harmony and maintaining positive relationships. Others appreciate your patience and willingness to collaborate.'
            },
            'Conscientiousness': {
                title: 'Reliability & Organization',
                description: 'You are highly dependable and methodical in your approach. Others can count on you to follow through and maintain high standards.'
            },
            'Openness': {
                title: 'Creative Curiosity',
                description: 'You embrace new experiences and think creatively. You appreciate beauty, art, and intellectual exploration.'
            },
            'Dominance': {
                title: 'Leadership Presence',
                description: 'You naturally take charge and influence others positively. You\'re confident in decision-making and inspiring others to action.'
            },
            'Vigilance': {
                title: 'Strategic Awareness',
                description: 'You excel at risk assessment and careful planning. Your cautious nature helps avoid problems and ensures thorough preparation.'
            },
            'Self-Transcendence': {
                title: 'Higher Purpose',
                description: 'You connect with something greater than yourself and find meaning in helping others. You have a strong sense of universal values.'
            },
            'Abstract Orientation': {
                title: 'Conceptual Thinking',
                description: 'You excel at seeing patterns and thinking theoretically. You enjoy exploring ideas and understanding complex systems.'
            },
            'Value Orientation': {
                title: 'Values-Driven Decisions',
                description: 'You make decisions based on personal values and moral principles. You prioritize what\'s right over what\'s convenient.'
            },
            'Flexibility': {
                title: 'Adaptability',
                description: 'You handle change well and adapt quickly to new situations. You\'re comfortable with ambiguity and spontaneous opportunities.'
            }
        };

        return strengthTemplates[trait] || {
            title: trait,
            description: `You show strong tendencies in ${trait.toLowerCase()}.`
        };
    }

    /**
     * Get growth insight for a trait
     */
    getGrowthInsight(trait, score) {
        const growthTemplates = {
            'Honesty-Humility': {
                title: 'Building Authentic Relationships',
                description: 'Consider practicing more openness and humility in interactions. Authentic connections often require vulnerability.'
            },
            'Emotionality': {
                title: 'Emotional Expression',
                description: 'You might benefit from exploring and expressing emotions more freely. Emotional awareness can enhance relationships and decision-making.'
            },
            'Extraversion': {
                title: 'Social Confidence',
                description: 'Try gradually expanding your social comfort zone. Small social challenges can build confidence over time.'
            },
            'Agreeableness': {
                title: 'Collaborative Skills',
                description: 'Practice active listening and finding common ground. Building cooperation skills can improve team dynamics.'
            },
            'Conscientiousness': {
                title: 'Organization & Planning',
                description: 'Developing better planning and organizational systems could help you achieve goals more effectively.'
            },
            'Openness': {
                title: 'Embracing New Experiences',
                description: 'Try stepping outside your comfort zone with new activities, ideas, or creative pursuits.'
            },
            'Dominance': {
                title: 'Leadership Development',
                description: 'Consider developing assertiveness skills and practicing taking initiative in group settings.'
            },
            'Vigilance': {
                title: 'Strategic Thinking',
                description: 'Practice pausing to consider potential risks and alternatives before making decisions.'
            },
            'Self-Transcendence': {
                title: 'Finding Purpose',
                description: 'Explore activities that connect you to something larger than yourself, such as volunteering or spiritual practices.'
            },
            'Abstract Orientation': {
                title: 'Conceptual Skills',
                description: 'Try engaging with abstract ideas, theoretical discussions, or creative problem-solving challenges.'
            },
            'Value Orientation': {
                title: 'Values Clarification',
                description: 'Spend time identifying your core values and how they guide your decisions and relationships.'
            },
            'Flexibility': {
                title: 'Adaptability',
                description: 'Practice being more spontaneous and open to changing plans when opportunities arise.'
            }
        };

        return growthTemplates[trait] || {
            title: trait,
            description: `Consider developing skills in ${trait.toLowerCase()}.`
        };
    }

    /**
     * Generate relationship insights
     */
    getRelationshipInsights(traitScores) {
        const insights = [];
        
        // High agreeableness + high emotionality
        if (traitScores['Agreeableness'] > 0.6 && traitScores['Emotionality'] > 0.6) {
            insights.push({
                title: 'Empathetic Connector',
                description: 'You naturally create deep, caring relationships and are highly attuned to others\' emotional needs.'
            });
        }
        
        // High extraversion + high dominance
        if (traitScores['Extraversion'] > 0.6 && traitScores['Dominance'] > 0.6) {
            insights.push({
                title: 'Social Leader',
                description: 'You likely take charge in social situations and inspire others through your energy and confidence.'
            });
        }
        
        // High honesty-humility + high agreeableness
        if (traitScores['Honesty-Humility'] > 0.6 && traitScores['Agreeableness'] > 0.6) {
            insights.push({
                title: 'Trusted Advisor',
                description: 'People naturally come to you for advice because they trust your integrity and caring nature.'
            });
        }

        return insights;
    }

    /**
     * Generate career insights
     */
    getCareerInsights(traitScores, mbtiType) {
        const insights = [];
        
        // Career suggestions based on trait combinations
        if (traitScores['Openness'] > 0.6 && traitScores['Abstract Orientation'] > 0.6) {
            insights.push({
                title: 'Creative & Innovative Roles',
                description: 'Consider careers in design, research, innovation, or creative problem-solving where you can explore new ideas.'
            });
        }
        
        if (traitScores['Conscientiousness'] > 0.6 && traitScores['Vigilance'] > 0.6) {
            insights.push({
                title: 'Detail-Oriented Professions',
                description: 'You\'d excel in roles requiring precision, planning, and risk management like project management or quality assurance.'
            });
        }
        
        if (traitScores['Agreeableness'] > 0.6 && traitScores['Emotionality'] > 0.6) {
            insights.push({
                title: 'People-Centered Careers',
                description: 'Consider careers in counseling, education, healthcare, or human resources where you can help and support others.'
            });
        }

        return insights;
    }

    /**
     * Generate personality summary
     */
    generateSummary(traitScores, mbtiType) {
        const topTraits = Object.entries(traitScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([trait]) => trait);

        return `As an ${mbtiType} personality type, you are characterized by strong ${topTraits.join(', ').toLowerCase()} traits. Your unique combination of these characteristics creates a personality that brings valuable perspectives to both personal relationships and professional environments.`;
    }

    /**
     * Normalize scores to ensure they fall within valid ranges
     */
    normalizeScores(scores) {
        const normalized = {};
        
        Object.entries(scores).forEach(([trait, score]) => {
            normalized[trait] = Math.max(0, Math.min(1, score || 0));
        });
        
        return normalized;
    }

    /**
     * Calculate overall assessment reliability
     */
    calculateReliability(responses, questions) {
        if (responses.length === 0) return 0;
        
        // Count valid responses
        const validResponses = responses.filter(r => r !== null && r !== undefined).length;
        const responseRate = validResponses / responses.length;
        
        // Check trait coverage
        const traitsWithQuestions = new Set();
        questions.forEach((question, index) => {
            if (responses[index] !== null && responses[index] !== undefined) {
                traitsWithQuestions.add(question.primary_trait);
            }
        });
        
        const traitCoverage = traitsWithQuestions.size / this.traits.length;
        
        // Calculate overall reliability
        const reliability = (responseRate * 0.6 + traitCoverage * 0.4) * this.weights.reliability;
        
        return Math.max(0, Math.min(1, reliability));
    }
}

// Export for use in other modules
window.ScoringEngine = ScoringEngine;
