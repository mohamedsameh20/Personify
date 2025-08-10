/**
 * Characters Module - Handles character comparison and matching
 * Manages character data and similarity calculations
 */

class CharacterEngine {
    constructor() {
        this.characters = [];
        this.userProfile = null;
        this.similarities = [];
        
        // Character matching algorithm parameters
        this.matchingConfig = {
            weightedTraits: {
                'Extraversion': 1.2,
                'Openness': 1.1, 
                'Agreeableness': 1.1,
                'Conscientiousness': 1.0,
                'Emotionality': 1.0,
                'Honesty-Humility': 1.0,
                'Dominance': 0.9,
                'Vigilance': 0.9,
                'Self-Transcendence': 0.8,
                'Abstract Orientation': 0.8,
                'Value Orientation': 0.8,
                'Flexibility': 0.8
            },
            similarityThreshold: 0.7,
            maxMatches: 9
        };
    }

    /**
     * Load character data from JSON or cache
     */
    async loadCharacters() {
        try {
            // Try to load from existing characters.json first
            const response = await fetch('./characters.json');
            if (response.ok) {
                this.characters = await response.json();
                return this.characters;
            }
        } catch (error) {
            console.warn('Could not load characters.json, using fallback data');
        }

        // Fallback to embedded character data
        this.characters = this.getDefaultCharacters();
        return this.characters;
    }

    /**
     * Get default character data if external file fails
     */
    getDefaultCharacters() {
        return [
            {
                id: "phineas-flynn",
                name: "Phineas Flynn",
                show: "Phineas and Ferb",
                imageUrl: "🧠",
                description: "The endlessly optimistic and wildly creative co-protagonist, Phineas is an unstoppable force of summer fun. His personality is defined by his boundless energy and ingenuity.",
                analysis: "Phineas's profile is dominated by extremely high scores in Extraversion, Openness, and Abstract Orientation. This combination fuels his daily invention sprees and his ability to see possibilities everywhere.",
                normalizedScores: {
                    "Honesty-Humility": 0.831,
                    "Emotionality": 0.919,
                    "Extraversion": 0.994,
                    "Agreeableness": 0.806,
                    "Conscientiousness": 0.756,
                    "Openness": 0.996,
                    "Dominance": 0.681,
                    "Vigilance": 0.619,
                    "Self-Transcendence": 0.769,
                    "Abstract Orientation": 0.999,
                    "Value Orientation": 0.819,
                    "Flexibility": 0.881
                }
            },
            {
                id: "ferb-fletcher",
                name: "Ferb Fletcher", 
                show: "Phineas and Ferb",
                imageUrl: "🔧",
                description: "The quiet genius behind many of Phineas's inventions, Ferb is incredibly skilled and thoughtful. His calm demeanor masks a brilliant engineering mind.",
                analysis: "Ferb's personality is characterized by high Conscientiousness and Abstract Orientation, making him the perfect complement to Phineas's wild creativity.",
                normalizedScores: {
                    "Honesty-Humility": 0.769,
                    "Emotionality": 0.744,
                    "Extraversion": 0.544,
                    "Agreeableness": 0.756,
                    "Conscientiousness": 0.894,
                    "Openness": 0.931,
                    "Dominance": 0.544,
                    "Vigilance": 0.556,
                    "Self-Transcendence": 0.781,
                    "Abstract Orientation": 0.996,
                    "Value Orientation": 0.856,
                    "Flexibility": 0.806
                }
            },
            {
                id: "candace-flynn",
                name: "Candace Flynn",
                show: "Phineas and Ferb", 
                imageUrl: "😤",
                description: "The anxious and rule-focused older sister who constantly tries to expose her brothers' schemes to their mother.",
                analysis: "Candace shows high Vigilance and Emotionality, driving her protective instincts and concern for rules and order.",
                normalizedScores: {
                    "Honesty-Humility": 0.669,
                    "Emotionality": 0.856,
                    "Extraversion": 0.731,
                    "Agreeableness": 0.519,
                    "Conscientiousness": 0.681,
                    "Openness": 0.456,
                    "Dominance": 0.694,
                    "Vigilance": 0.894,
                    "Self-Transcendence": 0.544,
                    "Abstract Orientation": 0.419,
                    "Value Orientation": 0.731,
                    "Flexibility": 0.331
                }
            },
            {
                id: "dr-doofenshmirtz",
                name: "Dr. Heinz Doofenshmirtz",
                show: "Phineas and Ferb",
                imageUrl: "🔬",
                description: "The megalomaniacal but ultimately harmless evil scientist with a tragic backstory and validation needs.",
                analysis: "Doofenshmirtz combines high creativity with low agreeableness and high dominance, creating his unique villain-with-a-heart-of-gold personality.",
                normalizedScores: {
                    "Honesty-Humility": 0.369,
                    "Emotionality": 0.781,
                    "Extraversion": 0.656,
                    "Agreeableness": 0.244,
                    "Conscientiousness": 0.469,
                    "Openness": 0.806,
                    "Dominance": 0.856,
                    "Vigilance": 0.694,
                    "Self-Transcendence": 0.319,
                    "Abstract Orientation": 0.744,
                    "Value Orientation": 0.506,
                    "Flexibility": 0.619
                }
            },
            {
                id: "perry-the-platypus",
                name: "Perry the Platypus",
                show: "Phineas and Ferb",
                imageUrl: "🕵️",
                description: "The secret agent platypus who leads a double life as both a pet and a spy, showing incredible dedication and focus.",
                analysis: "Perry demonstrates extremely high Conscientiousness and Vigilance, essential for his secret agent work, balanced with loyalty and dedication.",
                normalizedScores: {
                    "Honesty-Humility": 0.731,
                    "Emotionality": 0.431,
                    "Extraversion": 0.381,
                    "Agreeableness": 0.606,
                    "Conscientiousness": 0.956,
                    "Openness": 0.594,
                    "Dominance": 0.731,
                    "Vigilance": 0.944,
                    "Self-Transcendence": 0.669,
                    "Abstract Orientation": 0.581,
                    "Value Orientation": 0.794,
                    "Flexibility": 0.694
                }
            },
            {
                id: "isabella-garcia-shapiro",
                name: "Isabella Garcia-Shapiro",
                show: "Phineas and Ferb",
                imageUrl: "🎀",
                description: "The competent and enthusiastic Fireside Girl leader with a crush on Phineas, showing strong organizational and social skills.",
                analysis: "Isabella combines high Agreeableness and Conscientiousness with strong Extraversion, making her an effective leader and loyal friend.",
                normalizedScores: {
                    "Honesty-Humility": 0.794,
                    "Emotionality": 0.719,
                    "Extraversion": 0.831,
                    "Agreeableness": 0.881,
                    "Conscientiousness": 0.844,
                    "Openness": 0.706,
                    "Dominance": 0.656,
                    "Vigilance": 0.569,
                    "Self-Transcendence": 0.731,
                    "Abstract Orientation": 0.619,
                    "Value Orientation": 0.806,
                    "Flexibility": 0.744
                }
            },
            {
                id: "baljeet-tjinder",
                name: "Baljeet Tjinder",
                show: "Phineas and Ferb",
                imageUrl: "📚",
                description: "The academic perfectionist with extremely high standards for himself and others, often anxious about grades and performance.",
                analysis: "Baljeet shows extremely high Conscientiousness combined with high Emotionality, driving his perfectionist tendencies and academic focus.",
                normalizedScores: {
                    "Honesty-Humility": 0.756,
                    "Emotionality": 0.831,
                    "Extraversion": 0.456,
                    "Agreeableness": 0.694,
                    "Conscientiousness": 0.969,
                    "Openness": 0.781,
                    "Dominance": 0.369,
                    "Vigilance": 0.706,
                    "Self-Transcendence": 0.581,
                    "Abstract Orientation": 0.869,
                    "Value Orientation": 0.744,
                    "Flexibility": 0.281
                }
            },
            {
                id: "buford-van-stomm",
                name: "Buford Van Stomm",
                show: "Phineas and Ferb",
                imageUrl: "💪",
                description: "The school bully with a tough exterior but hidden depths, showing loyalty and unexpected sensitivity beneath the surface.",
                analysis: "Buford presents low Agreeableness and high Dominance publicly, but shows higher Emotionality and loyalty in his friendships.",
                normalizedScores: {
                    "Honesty-Humility": 0.506,
                    "Emotionality": 0.644,
                    "Extraversion": 0.681,
                    "Agreeableness": 0.331,
                    "Conscientiousness": 0.544,
                    "Openness": 0.481,
                    "Dominance": 0.819,
                    "Vigilance": 0.631,
                    "Self-Transcendence": 0.456,
                    "Abstract Orientation": 0.394,
                    "Value Orientation": 0.619,
                    "Flexibility": 0.706
                }
            },
            {
                id: "linda-flynn-fletcher",
                name: "Linda Flynn-Fletcher",
                show: "Phineas and Ferb",
                imageUrl: "👩",
                description: "The patient and loving mother who somehow always misses her sons' elaborate inventions, showing remarkable calm and trust.",
                analysis: "Linda demonstrates balanced traits with particularly high Agreeableness and moderate Vigilance, enabling her trusting and patient parenting style.",
                normalizedScores: {
                    "Honesty-Humility": 0.744,
                    "Emotionality": 0.606,
                    "Extraversion": 0.619,
                    "Agreeableness": 0.856,
                    "Conscientiousness": 0.719,
                    "Openness": 0.631,
                    "Dominance": 0.581,
                    "Vigilance": 0.444,
                    "Self-Transcendence": 0.694,
                    "Abstract Orientation": 0.531,
                    "Value Orientation": 0.781,
                    "Flexibility": 0.769
                }
            }
        ];
    }

    /**
     * Calculate similarity between user and all characters
     */
    calculateCharacterMatches(userTraitScores) {
        this.userProfile = userTraitScores;
        this.similarities = [];

        this.characters.forEach(character => {
            const similarity = this.calculateSimilarity(userTraitScores, character.normalizedScores);
            
            this.similarities.push({
                character: character,
                similarity: similarity,
                details: this.generateComparisonDetails(userTraitScores, character.normalizedScores)
            });
        });

        // Sort by similarity (highest first)
        this.similarities.sort((a, b) => b.similarity - a.similarity);

        return this.similarities.slice(0, this.matchingConfig.maxMatches);
    }

    /**
     * Calculate similarity between two trait profiles using weighted Euclidean distance
     */
    calculateSimilarity(userScores, characterScores) {
        let weightedDistanceSum = 0;
        let totalWeight = 0;

        Object.keys(userScores).forEach(trait => {
            const userScore = userScores[trait] || 0;
            const characterScore = characterScores[trait] || 0;
            const weight = this.matchingConfig.weightedTraits[trait] || 1.0;

            // Calculate squared difference
            const difference = Math.pow(userScore - characterScore, 2);
            weightedDistanceSum += difference * weight;
            totalWeight += weight;
        });

        // Calculate weighted root mean squared difference
        const weightedRMSD = Math.sqrt(weightedDistanceSum / totalWeight);
        
        // Convert to similarity score (0-1, where 1 is perfect match)
        const similarity = Math.max(0, 1 - weightedRMSD);
        
        return similarity;
    }

    /**
     * Generate detailed comparison between user and character
     */
    generateComparisonDetails(userScores, characterScores) {
        const details = {
            strongMatches: [],
            differences: [],
            overallCompatibility: 0
        };

        Object.keys(userScores).forEach(trait => {
            const userScore = userScores[trait] || 0;
            const characterScore = characterScores[trait] || 0;
            const difference = Math.abs(userScore - characterScore);

            if (difference < 0.2) {
                details.strongMatches.push({
                    trait: trait,
                    userScore: userScore,
                    characterScore: characterScore,
                    difference: difference
                });
            } else if (difference > 0.4) {
                details.differences.push({
                    trait: trait,
                    userScore: userScore,
                    characterScore: characterScore,
                    difference: difference
                });
            }
        });

        // Calculate overall compatibility
        details.overallCompatibility = this.calculateSimilarity(userScores, characterScores);

        return details;
    }

    /**
     * Get top character matches
     */
    getTopMatches(count = 3) {
        return this.similarities.slice(0, count);
    }

    /**
     * Get character by ID
     */
    getCharacterById(characterId) {
        return this.characters.find(char => char.id === characterId);
    }

    /**
     * Get character match details
     */
    getCharacterMatchDetails(characterId) {
        const match = this.similarities.find(sim => sim.character.id === characterId);
        return match ? match.details : null;
    }

    /**
     * Generate character match insights
     */
    generateMatchInsights(characterMatch) {
        const character = characterMatch.character;
        const similarity = characterMatch.similarity;
        const details = characterMatch.details;

        const insights = {
            compatibility: Math.round(similarity * 100),
            sharedTraits: details.strongMatches.map(match => ({
                trait: match.trait,
                description: this.getTraitMatchDescription(match.trait, match.userScore, match.characterScore)
            })),
            differences: details.differences.map(diff => ({
                trait: diff.trait,
                description: this.getTraitDifferenceDescription(diff.trait, diff.userScore, diff.characterScore)
            })),
            relationshipDynamic: this.getRelationshipDynamic(character, details),
            learningOpportunities: this.getLearningOpportunities(character, details)
        };

        return insights;
    }

    /**
     * Get trait match description
     */
    getTraitMatchDescription(trait, userScore, characterScore) {
        const avgScore = (userScore + characterScore) / 2;
        const level = avgScore > 0.7 ? 'high' : avgScore > 0.3 ? 'moderate' : 'low';
        
        const descriptions = {
            'Extraversion': {
                high: 'Both of you are social and energetic, enjoying group activities and expressing yourselves openly.',
                moderate: 'You both have a balanced approach to social interaction, comfortable in groups but also valuing quiet time.',
                low: 'You both tend to be more reserved and introspective, preferring smaller groups and deeper conversations.'
            },
            'Agreeableness': {
                high: 'You both prioritize harmony and cooperation, making you naturally compatible in collaborative situations.',
                moderate: 'You share a balanced approach to relationships, being supportive while maintaining healthy boundaries.',
                low: 'You both tend to be more direct and competitive, which can create dynamic but challenging interactions.'
            },
            'Conscientiousness': {
                high: 'You both value organization, planning, and follow-through, making you reliable partners in any endeavor.',
                moderate: 'You share a practical approach to responsibilities, balancing structure with flexibility.',
                low: 'You both prefer spontaneity and adaptability over rigid planning and structure.'
            },
            'Openness': {
                high: 'You both love exploring new ideas, experiences, and creative possibilities together.',
                moderate: 'You share an appreciation for both familiar comforts and occasional new experiences.',
                low: 'You both prefer traditional approaches and proven methods over experimental or unconventional ideas.'
            }
        };

        return descriptions[trait]?.[level] || `You both share similar levels of ${trait.toLowerCase()}.`;
    }

    /**
     * Get trait difference description
     */
    getTraitDifferenceDescription(trait, userScore, characterScore) {
        const userLevel = userScore > 0.7 ? 'high' : userScore > 0.3 ? 'moderate' : 'low';
        const charLevel = characterScore > 0.7 ? 'high' : characterScore > 0.3 ? 'moderate' : 'low';
        
        return `While you tend toward ${userLevel} ${trait.toLowerCase()}, this character shows ${charLevel} levels, creating complementary dynamics.`;
    }

    /**
     * Get relationship dynamic description
     */
    getRelationshipDynamic(character, details) {
        const strongMatches = details.strongMatches.length;
        const differences = details.differences.length;

        if (strongMatches > differences) {
            return `You and ${character.name} would likely have a harmonious relationship with shared values and compatible approaches to life.`;
        } else if (differences > strongMatches) {
            return `You and ${character.name} might have a complementary relationship where your differences create balance and growth opportunities.`;
        } else {
            return `You and ${character.name} would have a balanced relationship with both shared ground and interesting contrasts.`;
        }
    }

    /**
     * Get learning opportunities from character
     */
    getLearningOpportunities(character, details) {
        const opportunities = [];

        details.differences.forEach(diff => {
            if (diff.characterScore > diff.userScore + 0.3) {
                opportunities.push(`Learn from ${character.name}'s strength in ${diff.trait.toLowerCase()} to develop this area in yourself.`);
            }
        });

        if (opportunities.length === 0) {
            opportunities.push(`${character.name}'s balanced approach to life offers insights into maintaining harmony across different personality traits.`);
        }

        return opportunities;
    }

    /**
     * Filter characters by similarity threshold
     */
    filterBySimilarity(threshold = null) {
        const cutoff = threshold || this.matchingConfig.similarityThreshold;
        return this.similarities.filter(match => match.similarity >= cutoff);
    }

    /**
     * Get character statistics
     */
    getCharacterStats() {
        if (this.similarities.length === 0) return null;

        const similarities = this.similarities.map(s => s.similarity);
        
        return {
            totalCharacters: this.characters.length,
            analyzedMatches: this.similarities.length,
            bestMatch: Math.max(...similarities),
            averageSimilarity: similarities.reduce((a, b) => a + b, 0) / similarities.length,
            compatibleCount: this.filterBySimilarity().length
        };
    }

    /**
     * Export character comparison data
     */
    exportComparisonData() {
        return {
            userProfile: this.userProfile,
            characterMatches: this.similarities.map(sim => ({
                characterId: sim.character.id,
                characterName: sim.character.name,
                similarity: sim.similarity,
                details: sim.details
            })),
            analysisDate: new Date().toISOString(),
            config: this.matchingConfig
        };
    }

    /**
     * Get random character recommendation
     */
    getRandomRecommendation() {
        if (this.characters.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * this.characters.length);
        return this.characters[randomIndex];
    }

    /**
     * Search characters by name or traits
     */
    searchCharacters(query) {
        const searchTerm = query.toLowerCase();
        
        return this.characters.filter(character => 
            character.name.toLowerCase().includes(searchTerm) ||
            character.show.toLowerCase().includes(searchTerm) ||
            character.description.toLowerCase().includes(searchTerm) ||
            character.analysis.toLowerCase().includes(searchTerm)
        );
    }
}

// Export for use in other modules
window.CharacterEngine = CharacterEngine;
