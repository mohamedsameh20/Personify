"""
Model for the personality quiz data and logic
Handles loading questions, calculating scores, and storing results
"""
import json
import random
import numpy as np
import os
from functools import lru_cache

class QuizModel:
    def __init__(self, questions_path=None, test_mode=False):
        # Add test mode parameter
        self.test_mode = test_mode
        # Test mode properties
        self.test_modes = {
            "demo": {"name": "Quick Demo Test", "questions": 36, "description": "A brief 10-minute assessment to get a quick snapshot of your personality traits."},
            "basic": {"name": "Basic Personality Test", "questions": 120, "description": "A standard assessment with good reliability, taking about 25-30 minutes."},
            "comprehensive": {"name": "Comprehensive Analysis", "questions": 240, "description": "Our most thorough assessment with highest reliability, taking 45-60 minutes."}
        }
        self.selected_mode = None
        self.active_questions = []
        
        # Use provided path or default
        self.questions_path = questions_path or os.path.join("c:", os.sep, "Users", "Public", "Python", "questions.json")
        
        # Initialize data structures
        self.traits = []
        self.trait_descriptions = {}
        self.facets = {}
        self.facet_descriptions = {}
        self.questions = []
        self.trait_correlations = []
        self.cross_domain_correlations = {}
        
        # Quiz state
        self.current_question = 0
        self.user_answers = []
        self.demographics = {}
        
        # Scores
        self.trait_scores = []
        self.facet_scores = {}
        
        # New weighted averaging approach
        self.sum_value_weight = {}  # Sum of value × weight for each trait
        self.sum_weight = {}        # Sum of weights for each trait
        
        # Weights for direct vs. correlated contributions - optimized for maximum balance
        self.W_d = 39.0  # Increased from 37.5 to better preserve input quality
        self.W_c = 0.085  # Fine-tuned from 0.09 for optimal balance
        
        # Correlation enforcement factor - fine-tuned for perfect realism with better quality
        self.correlation_enforcement = 0.22  # Reduced from 0.23 for better quality preservation
        
        # Dictionary for pair-specific correlation handling - optimized for critical pairs
        self.pair_specific_params = {
            ("Agreeableness", "Vigilance"): {"force_factor": 2.2, "threshold": 0.08, "min_score": 0.19},
            ("Agreeableness", "Dominance"): {"force_factor": 2.1, "threshold": 0.08, "min_score": 0.19},
            ("Conscientiousness", "Flexibility"): {"force_factor": 2.3, "threshold": 0.08, "min_score": 0.16},
            ("Extraversion", "Dominance"): {"force_factor": 2.0, "threshold": 0.08, "min_score": 0.21},
            ("Openness", "Self-Transcendence"): {"force_factor": 1.9, "threshold": 0.08, "min_score": 0.21},
            ("Openness", "Abstract Orientation"): {"force_factor": 1.9, "threshold": 0.08, "min_score": 0.21}
        }
        
        # Add pattern detection for adaptive correlation enforcement
        self.pattern_counts = {"high": 0, "low": 0, "moderate": 0, "total": 0}
        
        # List of trait pairs that need extra enforcement of negative correlations
        self.critical_neg_correlated_pairs = [
            ("Agreeableness", "Vigilance"),
            ("Agreeableness", "Dominance"),
            ("Conscientiousness", "Flexibility")
        ]
        
        # List of trait pairs that need extra enforcement of positive correlations
        self.critical_pos_correlated_pairs = [
            ("Extraversion", "Dominance"),
            ("Openness", "Self-Transcendence"),
            ("Openness", "Abstract Orientation")
        ]
        
        # Mapping dictionaries for scoring
        # Converts qualitative choices to numerical values on a 1-5 scale
        self.value_map = {
            'Very Low': 1,     # Strong negative indicator
            'Low': 2,          # Negative indicator
            'Low-Moderate': 2.5, # Slightly negative indicator
            'Moderate': 3,     # Neutral response
            'High': 4,         # Positive indicator
            'Very High': 5     # Strong positive indicator
        }
        
        # Maps correlation symbols to numerical adjustments
        # Used to calculate the effect of an answer on correlated traits
        self.adjustment_map = {
            '+': 0.5,    # Strong positive correlation
            '+m': 0.25,  # Moderate positive correlation
            '0': 0.0,    # No correlation
            '-m': -0.25, # Moderate negative correlation
            '-': -0.5    # Strong negative correlation
        }
        
        # Maps trait abbreviations to their full names
        # Used to identify traits from correlation specifications
        self.trait_abbr_to_full = {
            'H-H': 'Honesty-Humility',
            'Em': 'Emotionality',
            'Ex': 'Extraversion',
            'Ag': 'Agreeableness',
            'Co': 'Conscientiousness',
            'Op': 'Openness',
            'Do': 'Dominance',
            'Vi': 'Vigilance',
            'ST': 'Self-Transcendence',
            'C/A': 'Abstract Orientation',
            'L/V': 'Value Orientation',
            'S/F': 'Flexibility'
        }
        
        # Cache for frequently computed values
        self._cache = {}
        
        # Load data from JSON
        self.load_questions_and_traits()
        self.initialize_scores()
    
    def load_questions_and_traits(self):
        """Load questions and traits from a JSON file"""
        try:
            with open(self.questions_path, "r") as f:
                data = json.load(f)
                self.questions = data["questions"]
                self.traits = data["traits"]
                self.facets = data["facets"]
                self.facet_descriptions = data["facet_descriptions"]
                self.trait_descriptions = data["trait_descriptions"]
                self.trait_correlations = data["trait_correlations"]
                self.cross_domain_correlations = data.get("cross_domain_correlations", {})
        except Exception as e:
            print(f"Error loading questions: {e}")
            self.questions = []
            self.traits = []
            self.facets = {}
            self.facet_descriptions = {}
            self.trait_descriptions = {}
            self.trait_correlations = []
            self.cross_domain_correlations = {}
    
    def initialize_scores(self):
        """Initialize trait and facet scores to neutral values"""
        # Initialize trait scores at 0.5 (neutral)
        self.trait_scores = [0.5] * len(self.traits)
        
        # Initialize facet scores for each trait
        self.facet_scores = {}
        for trait, facet_list in self.facets.items():
            self.facet_scores[trait] = {facet: 0.5 for facet in facet_list}
            
        # Initialize weighted averaging accumulators
        self.sum_value_weight = {trait: 0.0 for trait in self.traits}
        self.sum_weight = {trait: 0.0 for trait in self.traits}
    
    def _select_balanced_questions(self, num_questions_per_trait, total_questions):
        """Helper to select a balanced set of questions across all traits"""
        active_questions = []
        trait_questions = {trait: [] for trait in self.traits}
        
        # Organize questions by trait
        for question in self.questions:
            trait = question["category"].split(":")[0].strip()
            if trait in trait_questions:
                trait_questions[trait].append(question)
        
        # Take specified number of questions from each trait
        for trait in self.traits:
            if trait_questions[trait]:
                # Shuffle to get random questions for this trait
                random.shuffle(trait_questions[trait])
                active_questions.extend(trait_questions[trait][:num_questions_per_trait])
        
        # If we don't have enough questions, add random ones to fill
        if len(active_questions) < total_questions:
            remaining = random.sample(self.questions, total_questions - len(active_questions))
            active_questions.extend(remaining)
        
        # If we have too many questions, reduce to match total
        if len(active_questions) > total_questions:
            active_questions = random.sample(active_questions, total_questions)
            
        # Shuffle the final set of questions
        random.shuffle(active_questions)
        return active_questions
    
    def prepare_questions_for_mode(self, mode, total_questions):
        """Prepare a subset of questions based on the selected mode"""
        if mode == "demo":
            # 3 questions per trait for quick demo
            self.active_questions = self._select_balanced_questions(3, total_questions)
        elif mode == "basic":
            # 10 questions per trait for basic test
            self.active_questions = self._select_balanced_questions(10, total_questions)
        else:
            # For comprehensive test - use all questions up to the limit
            self.active_questions = self.questions[:total_questions]
            random.shuffle(self.active_questions)
    
    def select_test_mode(self, mode):
        """Set the test mode and prepare the questions"""
        self.selected_mode = mode
        total_questions = self.test_modes[mode]["questions"]
        self.prepare_questions_for_mode(mode, total_questions)
        self.reset_quiz()
    
    def reset_quiz(self):
        """Reset the quiz state for a new attempt"""
        self.current_question = 0
        self.user_answers = []
        
        # Reset trait scores to exactly neutral
        self.trait_scores = [0.5] * len(self.traits)
        
        # Reset facet scores to neutral
        for trait, facet_list in self.facets.items():
            self.facet_scores[trait] = {facet: 0.5 for facet in facet_list}
            
        # Reset weighted averaging accumulators
        self.sum_value_weight = {trait: 0.0 for trait in self.traits}
        self.sum_weight = {trait: 0.0 for trait in self.traits}
        
        # Reset pattern tracking
        self.pattern_counts = {"high": 0, "low": 0, "moderate": 0, "total": 0}
    
    def process_answer(self, choice_index):
        """
        Process a user's answer using weighted averaging approach
        
        This method applies higher weights to direct contributions (W_d)
        and lower weights to correlated contributions (W_c)
        """
        self.user_answers.append(choice_index)
        
        # Get the current question
        question = self.active_questions[self.current_question]
        
        # Check if this is a demographic question
        if question.get("type") == "demographic":
            self.demographics[question["id"]] = choice_index
            self.current_question += 1
            return
        
        # Extract the trait from the category
        category = question.get("category", "")
        primary_trait = category.split(":")[0].strip() if ":" in category else category
        
        # Skip if choice_index is out of range
        if choice_index >= len(question.get("choices", [])):
            self.current_question += 1
            return
            
        # Get the choice's correlations
        choice = question["choices"][choice_index]
        choice_value = choice.get("value", "Moderate")
        correlations = choice.get("correlations", {})
        
        # Track response patterns for adaptive correlation enforcement
        if choice_value in ["High", "Very High"]:
            self.pattern_counts["high"] += 1
        elif choice_value in ["Low", "Very Low"]:
            self.pattern_counts["low"] += 1
        else:
            self.pattern_counts["moderate"] += 1
        self.pattern_counts["total"] += 1
        
        # Convert the qualitative value to a numerical score (1-5 scale)
        score = self.value_map.get(choice_value, 3)  # Default to Moderate if not found
        
        # Add direct contribution to primary trait with higher weight (W_d)
        if primary_trait in self.traits:
            self.sum_value_weight[primary_trait] += score * self.W_d
            self.sum_weight[primary_trait] += self.W_d
        
        # Apply correlated contributions with lower weight (W_c)
        if correlations:
            self._apply_correlations(correlations, score)
        
        # Update facet scores if applicable
        if ":" in category and primary_trait in self.traits:
            self._update_facet_score(primary_trait, category, score)
        
        # Calculate current trait scores based on contributions so far
        self.calculate_scores()
        
        # Move to next question
        self.current_question += 1
    
    def _apply_correlations(self, correlations, score):
        """Helper method to apply correlated contributions"""
        for abbr, symbol in correlations.items():
            full_trait = self.trait_abbr_to_full.get(abbr)
            if full_trait in self.traits:
                # Calculate adjusted score for correlated trait based on user's response strength
                adjustment = self.adjustment_map.get(symbol, 0.0)
                
                # Calculate deviation from neutral (3 is neutral on 1-5 scale)
                deviation = score - 3
                
                # Calculate correlated score
                correlated_score = 3 + (deviation * adjustment * 2)  # *2 to maintain full range
                
                # Add contribution with lower weight (W_c)
                self.sum_value_weight[full_trait] += correlated_score * self.W_c
                self.sum_weight[full_trait] += self.W_c
    
    def _update_facet_score(self, primary_trait, category, score):
        """
        Helper method to update facet scores with range validation
        
        Args:
            primary_trait: The main trait category
            category: The full category string including facet
            score: The raw score value (1-5 scale)
        """
        facet = category.split(":")[1].strip()
        if primary_trait in self.facets and facet in self.facet_scores[primary_trait]:
            # Convert score to 0-1 scale for facet
            facet_score = (score - 1) / 4.0  # Convert 1-5 scale to 0-1 scale
            # Update with weighted average
            current = self.facet_scores[primary_trait][facet]
            new_score = (current * 0.8) + (facet_score * 0.2)
            # Ensure facet scores stay within valid range
            self.facet_scores[primary_trait][facet] = max(0.1, min(0.9, new_score))

    def calculate_scores(self):
        """
        Calculate trait scores using weighted averaging with correlation adjustment
        
        This hybrid approach combines the strengths of multiple configurations
        """
        # Clear calculation cache
        self._cache = {}
        
        # First calculate base scores using weighted averaging
        base_scores = self._calculate_base_scores()
        if self.test_mode:
            self.trait_scores = base_scores
            return
        # Store direct contribution scores for reference
        direct_scores = base_scores.copy()
        
        # Apply correlation adjustments ONLY when we have enough answers
        if sum(self.sum_weight.values()) > 10:
            # Initialize adjusted scores with base scores
            adjusted_scores = base_scores.copy()
            
            # Convert to numpy arrays for faster computation
            np_adjusted = np.array(adjusted_scores)
            np_direct = np.array(direct_scores)
            np_trait_correlations = np.array(self.trait_correlations)
            
            # Apply phases of correlation adjustment
            np_adjusted = self._apply_phase1_adjustments(np_adjusted, np_direct, np_trait_correlations)
            np_adjusted = self._apply_phase2_adjustments(np_adjusted, np_direct, np_trait_correlations)
            np_adjusted = self._apply_phase3_adjustments(np_adjusted, np_direct)
            np_adjusted = self._apply_phase4_adjustments(np_adjusted, np_direct)
            
            # Convert back to list
            self.trait_scores = np_adjusted.tolist()
        else:
            # Not enough data for correlation adjustment yet
            self.trait_scores = base_scores
    
    def _calculate_base_scores(self):
        """
        Calculate base trait scores from weighted averaging with improved error handling
        
        Returns:
            list: Normalized trait scores based on direct inputs
        """
        base_scores = []
        for trait in self.traits:
            if self.sum_weight[trait] > 0:
                # Calculate weighted average (1-5 scale)
                avg_score = self.sum_value_weight[trait] / self.sum_weight[trait]
                # Convert to 0-1 scale
                normalized_score = (avg_score - 1) / 4.0
                # In test mode, allow full range [0, 1.0]
                if self.test_mode:
                    normalized_score = max(0.0, min(1.0, normalized_score))
                else:
                    # Clamp between 0.1 and 0.9 for production/real use
                    normalized_score = max(0.1, min(0.9, normalized_score))
                base_scores.append(normalized_score)
            else:
                # Set to neutral value (0.5) if no contributions
                base_scores.append(0.5)
        return base_scores
    
    def _apply_phase1_adjustments(self, np_adjusted, np_direct, np_trait_correlations):
        """Apply phase 1 correlation adjustments using numpy for performance"""
        n_traits = len(self.traits)
        
        # Pre-calculate matrices for vectorized operations
        trait_indices = np.arange(n_traits)
        trait_matrix = np.ones((n_traits, n_traits))
        np.fill_diagonal(trait_matrix, 0)  # Exclude self-correlations
        
        # Create deviation matrix - how far each score is from neutral
        deviations = np_adjusted - 0.5
        
        # Apply pattern-specific enforcement
        pattern_ratio = self._detect_response_pattern()
        
        # For each trait
        for i in range(n_traits):
            # Skip if no correlations
            if np.sum(np.abs(np_trait_correlations[i])) == 0:
                continue
                
            # Get all correlations for this trait
            correlations = np_trait_correlations[i]
            
            # Weights based on correlation strength - optimized for maximum realism
            weights = np.abs(correlations)
            # Apply stronger weights for both negative and positive correlations
            weights = np.where(correlations < 0, weights * 1.8, weights)  # Reduced from 2.0 for better quality
            weights = np.where((correlations > 0.4), weights * 1.6, weights)  # Reduced from 1.8 for better balance
            
            # Calculate target scores based on correlations - optimized for realistic profiles
            targets = 0.5 + correlations * deviations * 1.4  # Reduced from 1.5 for improved quality
            
            # Ensure targets have minimum threshold but respect direct input influence
            targets = np.clip(targets, 0.18, 0.82)  # Narrowed range from 0.15-0.85 for better balance
            
            # Calculate deviation factors - optimize for natural feeling results
            dev_factors = 1.0 + np.abs(deviations) * 1.1  # Reduced from 1.2 for better quality
            
            # Calculate adjustments
            adjustments = weights * (targets - np_adjusted[i]) * dev_factors
            
            # Calculate total adjustment
            total_adjustment = np.sum(adjustments * trait_matrix[i])
            total_strength = np.sum(weights * trait_matrix[i])
            
            if total_strength > 0:
                # Apply adjustment with correlation enforcement and direct score respect
                adj_factor = self.correlation_enforcement * (total_strength / n_traits)
                
                # Pattern-specific adjustment - reduce enforcement for extreme patterns
                if pattern_ratio["high_ratio"] > 0.6:
                    adj_factor *= 0.8  # Reduce enforcement for high-bias patterns
                elif pattern_ratio["low_ratio"] > 0.6:
                    adj_factor *= 0.85  # Slightly reduce enforcement for low-bias patterns
                
                # Adaptive adjustment factor based on how extreme direct score is
                if np_direct[i] > 0.8 or np_direct[i] < 0.2:
                    # Further reduce adjustment for very extreme direct scores
                    adj_factor *= 0.75  # Reduced from 0.85 for better quality preservation
                elif np_direct[i] > 0.7 or np_direct[i] < 0.3:
                    # Reduce adjustment for extreme direct scores
                    adj_factor *= 0.85  # Same as before
                
                np_adjusted[i] += total_adjustment * adj_factor / total_strength
                
                # Respect direct scores more strongly - improved quality preservation
                direct_deviation = abs(np_direct[i] - 0.5)
                if direct_deviation > 0.25:  # If direct score is very high or very low
                    # Pull adjusted score back toward direct score proportionally
                    pull_factor = 0.35 * (direct_deviation - 0.25)  # Increased from 0.3 for better quality
                    np_adjusted[i] = np_adjusted[i] * (1 - pull_factor) + np_direct[i] * pull_factor
                
                # Enhanced quality preservation for extreme scores
                if np_direct[i] > 0.8 and np_adjusted[i] < 0.6:
                    # Ensure very high direct scores stay reasonably high
                    np_adjusted[i] = max(np_adjusted[i], 0.6)
                elif np_direct[i] < 0.2 and np_adjusted[i] > 0.4:
                    # Ensure very low direct scores stay reasonably low
                    np_adjusted[i] = min(np_adjusted[i], 0.4)
                
                # Ensure valid range with better quality preservation
                np_adjusted[i] = np.clip(np_adjusted[i], 0.12, 0.88)
        
        return np_adjusted
    
    def _detect_response_pattern(self):
        """Detect the response pattern to enable adaptive correlation enforcement"""
        total = max(1, self.pattern_counts["total"])  # Avoid division by zero
        high_ratio = self.pattern_counts["high"] / total
        low_ratio = self.pattern_counts["low"] / total
        moderate_ratio = self.pattern_counts["moderate"] / total
        
        return {
            "high_ratio": high_ratio,
            "low_ratio": low_ratio,
            "moderate_ratio": moderate_ratio,
            "is_balanced": 0.3 <= moderate_ratio <= 0.7,
            "is_high_biased": high_ratio > 0.5,
            "is_low_biased": low_ratio > 0.5
        }
    
    def _adjust_negative_correlation(self, np_adjusted, np_direct, i, j, correlation, params):
        """Apply negative correlation adjustment with enhanced quality preservation"""
        # Extract min_score from params at the beginning, so it's always defined
        min_score = params.get("min_score", 0.15)
        
        # Initialize variables used later to avoid potential unboundlocalerror
        strong_direct_i = np_direct[i] > 0.8 or np_direct[i] < 0.2
        strong_direct_j = np_direct[j] > 0.8 or np_direct[j] < 0.2
        
        # Check if traits are on the same side of neutral
        if (np_adjusted[i] > 0.5 and np_adjusted[j] > 0.5) or \
           (np_adjusted[i] < 0.5 and np_adjusted[j] < 0.5):
            
            # Apply pair-specific force factor with quality preservation
            force_factor = params["force_factor"]
            
            # Enhanced quality protection - detect extremely strong direct signals
            # Already defined above: strong_direct_i, strong_direct_j
            
            # Decide which score to adjust with enhanced quality preservation
            if (abs(np_adjusted[i] - 0.5) < abs(np_adjusted[j] - 0.5)) or (strong_direct_j and not strong_direct_i):
                # Trait i is closer to neutral or trait j has stronger direct signal
                
                # Apply with adaptive force reduction for strong direct signals
                force_reduction = 0.3 if strong_direct_i else 0.0
                effective_force = force_factor * (1.0 - force_reduction)
                
                np_adjusted[i] = 0.5 - (np_adjusted[j] - 0.5) * abs(correlation) * effective_force
                
                # Enhanced direct score respect
                if np_direct[i] > 0.65:
                    # Pull back toward direct proportionally to direct score strength
                    pull_strength = (np_direct[i] - 0.65) * 2.0  # Increased from 1.5
                    np_adjusted[i] = max(np_adjusted[i], min_score + pull_strength * 0.25)  # Increased from 0.2
            else:
                # Trait j is closer to neutral or trait i has stronger direct signal
                
                # Apply with adaptive force reduction for strong direct signals
                force_reduction = 0.3 if strong_direct_j else 0.0
                effective_force = force_factor * (1.0 - force_reduction)
                
                np_adjusted[j] = 0.5 - (np_adjusted[i] - 0.5) * abs(correlation) * effective_force
                
                # Enhanced direct score respect
                if np_direct[j] > 0.65:
                    # Pull back toward direct proportionally to direct score strength
                    pull_strength = (np_direct[j] - 0.65) * 2.0  # Increased from 1.5
                    np_adjusted[j] = max(np_adjusted[j], min_score + pull_strength * 0.25)  # Increased from 0.2
    
        # Ensure scores never fall below guaranteed minimum with higher protection for strong direct
        min_i = min_score + (0.1 if strong_direct_i else 0)
        min_j = min_score + (0.1 if strong_direct_j else 0)
        np_adjusted[i] = max(min_i, min(0.9, np_adjusted[i]))
        np_adjusted[j] = max(min_j, min(0.9, np_adjusted[j]))

    def _apply_phase2_adjustments(self, np_adjusted, np_direct, np_trait_correlations):
        """Apply phase 2 pair-specific correlation enforcement"""
        n_traits = len(self.traits)
        
        # For each pair of traits
        for i in range(n_traits):
            for j in range(i+1, n_traits):
                # Get the trait pair and correlation value
                trait_pair = (self.traits[i], self.traits[j])
                reverse_pair = (self.traits[j], self.traits[i])
                correlation = np_trait_correlations[i][j]
                
                # Get pair parameters
                params = self._get_pair_params(trait_pair, reverse_pair)
                min_score = params.get("min_score", 0.15)
                threshold = params["threshold"]
                
                # Skip if correlation is weak
                if abs(correlation) < 0.45:
                    continue
                
                # Only adjust if both traits are far enough from neutral
                if abs(np_adjusted[i] - 0.5) >= threshold and abs(np_adjusted[j] - 0.5) >= threshold:
                    if correlation < 0:
                        # For negative correlations
                        self._adjust_negative_correlation(np_adjusted, np_direct, i, j, correlation, params)
                    else:
                        # For positive correlations
                        self._adjust_positive_correlation(np_adjusted, np_direct, i, j, correlation, params)
        
        return np_adjusted
    
    def _get_pair_params(self, trait_pair, reverse_pair):
        """Get parameters for a trait pair with caching"""
        # Use cache if available
        cache_key = f"{trait_pair}_{reverse_pair}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        # Get parameters
        if trait_pair in self.pair_specific_params:
            params = self.pair_specific_params[trait_pair]
        elif reverse_pair in self.pair_specific_params:
            params = self.pair_specific_params[reverse_pair]
        else:
            params = {"force_factor": 1.4, "threshold": 0.15, "min_score": 0.15}
        
        # Cache and return
        self._cache[cache_key] = params
        return params
    
    def _adjust_positive_correlation(self, np_adjusted, np_direct, i, j, correlation, params):
        """Apply positive correlation adjustment with balanced enforcement"""
        # Check if traits are on opposite sides of neutral
        if (np_adjusted[i] > 0.5 and np_adjusted[j] < 0.5) or \
           (np_adjusted[i] < 0.5 and np_adjusted[j] > 0.5):
            
            # Apply pair-specific force factor with quality preservation
            force_factor = params["force_factor"] * 1.2  # Increased from 0.9
            min_score = params.get("min_score", 0.15)  # Extract min_score from params
            
            # Decide which score to adjust (the one closer to neutral)
            if abs(np_adjusted[i] - 0.5) < abs(np_adjusted[j] - 0.5):
                # Trait i is closer to neutral, move it to same side as j
                deviation = np_adjusted[j] - 0.5
                np_adjusted[i] = 0.5 + deviation * abs(correlation) * force_factor
                
                # Respect direct input - enhanced quality preservation
                if np_direct[i] < 0.4 and np_adjusted[i] > 0.5:
                    # Pull back toward direct proportionally for low direct scores
                    pull_strength = (0.4 - np_direct[i]) * 1.5  # 0-0.4 scale
                    np_adjusted[i] = min(np_adjusted[i], 0.5 + pull_strength * 0.2)
                elif np_direct[i] > 0.6 and np_adjusted[i] < 0.5:
                    # Pull back toward direct proportionally for high direct scores
                    pull_strength = (np_direct[i] - 0.6) * 1.5  # 0-0.4 scale
                    np_adjusted[i] = max(np_adjusted[i], 0.5 - pull_strength * 0.2)
            else:
                # Trait j is closer to neutral, move it to same side as i
                deviation = np_adjusted[i] - 0.5
                np_adjusted[j] = 0.5 + deviation * abs(correlation) * force_factor
                
                # Respect direct input - enhanced quality preservation
                if np_direct[j] < 0.4 and np_adjusted[j] > 0.5:
                    # Pull back toward direct proportionally for low direct scores
                    pull_strength = (0.4 - np_direct[j]) * 1.5  # 0-0.4 scale
                    np_adjusted[j] = min(np_adjusted[j], 0.5 + pull_strength * 0.2)
                elif np_direct[j] > 0.6 and np_adjusted[j] < 0.5:
                    # Pull back toward direct proportionally for high direct scores
                    pull_strength = (np_direct[j] - 0.6) * 1.5  # 0-0.4 scale
                    np_adjusted[j] = max(np_adjusted[j], 0.5 - pull_strength * 0.2)
        else:
            # If traits aren't on opposite sides, still need to define min_score for later use
            min_score = params.get("min_score", 0.15)
        
        # Ensure scores remain in valid range
        np_adjusted[i] = max(min_score, min(0.9, np_adjusted[i]))
        np_adjusted[j] = max(min_score, min(0.9, np_adjusted[j]))
    
    def _apply_phase3_adjustments(self, np_adjusted, np_direct):
        """Apply phase 3 special handling for critical pairs with enhanced quality preservation"""
        # Special handling for all critical pairs
        critical_pairs = [
            ("Agreeableness", "Vigilance", -0.60),
            ("Agreeableness", "Dominance", -0.55),
            ("Conscientiousness", "Flexibility", -0.72),
            ("Extraversion", "Dominance", 0.56),
            ("Openness", "Self-Transcendence", 0.70),
            ("Openness", "Abstract Orientation", 0.65)
        ]
        
        for trait1, trait2, expected_corr in critical_pairs:
            try:
                idx1 = self.traits.index(trait1)
                idx2 = self.traits.index(trait2)
                
                # Get current scores
                score1 = np_adjusted[idx1]
                score2 = np_adjusted[idx2]
                
                # Get direct scores
                direct1 = np_direct[idx1]
                direct2 = np_direct[idx2]
                
                # Calculate strength of direct signals
                direct_strength1 = abs(direct1 - 0.5) * 2  # 0-1 scale
                direct_strength2 = abs(direct2 - 0.5) * 2  # 0-1 scale
                
                # Only adjust if at least one trait has a strong signal (far from neutral)
                # but reduce threshold for more reliable correlation enforcement
                if abs(score1 - 0.5) > 0.1 or abs(score2 - 0.5) > 0.1:
                    # For negative correlations
                    if expected_corr < 0:
                        # If they're on the same side of neutral, force them to opposite sides
                        if (score1 > 0.5 and score2 > 0.5) or (score1 < 0.5 and score2 < 0.5):
                            # Calculate adaptive force factor based on direct score strength
                            # Higher direct scores get more respect (less forcing)
                            base_force = 1.9  # Reduced from 2.0 for better quality
                            
                            # Decide which to adjust (the one closer to neutral or with weaker direct)
                            if abs(score1 - 0.5) < abs(score2 - 0.5) or direct_strength1 < direct_strength2:
                                # Force trait1 to opposite side with adaptive force
                                force = base_force * (1.0 - direct_strength1 * 0.4)  # Reduce force for strong direct
                                np_adjusted[idx1] = 0.5 - (score2 - 0.5) * abs(expected_corr) * force
                            else:
                                # Force trait2 to opposite side with adaptive force
                                force = base_force * (1.0 - direct_strength2 * 0.4)  # Reduce force for strong direct
                                np_adjusted[idx2] = 0.5 - (score1 - 0.5) * abs(expected_corr) * force
                    # For positive correlations
                    else:
                        # If they're on opposite sides of neutral, force them to same side
                        if (score1 > 0.5 and score2 < 0.5) or (score1 < 0.5 and score2 > 0.5):
                            # Calculate adaptive force factor based on direct score strength
                            base_force = 1.8  # Reduced from 2.0 for better quality
                            
                            # Decide which to adjust (the one closer to neutral or with weaker direct)
                            if abs(score1 - 0.5) < abs(score2 - 0.5) or direct_strength1 < direct_strength2:
                                # Force trait1 to same side with adaptive force
                                force = base_force * (1.0 - direct_strength1 * 0.4)  # Reduce force for strong direct
                                np_adjusted[idx1] = 0.5 + (score2 - 0.5) * expected_corr * force
                            else:
                                # Force trait2 to same side with adaptive force
                                force = base_force * (1.0 - direct_strength2 * 0.4)  # Reduce force for strong direct
                                np_adjusted[idx2] = 0.5 + (score1 - 0.5) * expected_corr * force
                    
                    # Ensure valid range with minimum guarantees
                    np_adjusted[idx1] = np.clip(np_adjusted[idx1], 0.15, 0.85)
                    np_adjusted[idx2] = np.clip(np_adjusted[idx2], 0.15, 0.85)
            
            except ValueError:
                # Skip if trait not found
                continue
        
        return np_adjusted
    
    def _apply_phase4_adjustments(self, np_adjusted, np_direct):
        """Apply phase 4 final direct score influence with improved quality preservation"""
        # More granular thresholds for enhanced quality preservation
        extreme_high_direct_mask = np_direct > 0.9  # Extremely high direct scores
        very_high_direct_mask = (np_direct > 0.8) & (np_direct <= 0.9)  # Very high direct
        high_direct_mask = (np_direct > 0.7) & (np_direct <= 0.8)  # High direct
        med_high_direct_mask = (np_direct > 0.6) & (np_direct <= 0.7)  # Moderately high
        
        # For extremely high direct scores, strong quality preservation
        np_adjusted = np.where(extreme_high_direct_mask & (np_adjusted < 0.65), 
                              np.maximum(np_adjusted, 0.65), 
                              np_adjusted)
        
        # For very high direct scores, ensure substantial minimum
        np_adjusted = np.where(very_high_direct_mask & (np_adjusted < 0.5), 
                              np.maximum(np_adjusted, 0.5), 
                              np_adjusted)
        
        # For high direct scores, ensure decent minimum
        np_adjusted = np.where(high_direct_mask & (np_adjusted < 0.35), 
                              np.maximum(np_adjusted, 0.35), 
                              np_adjusted)
        
        # For moderately high direct scores, ensure reasonable minimum
        np_adjusted = np.where(med_high_direct_mask & (np_adjusted < 0.25), 
                              np.maximum(np_adjusted, 0.25), 
                              np_adjusted)
        
        # Similar enhanced logic for low scores
        extreme_low_direct_mask = np_direct < 0.1
        very_low_direct_mask = (np_direct >= 0.1) & (np_direct < 0.2)
        low_direct_mask = (np_direct >= 0.2) & (np_direct < 0.3)
        
        # For extremely low direct scores, strong quality preservation
        np_adjusted = np.where(extreme_low_direct_mask & (np_adjusted > 0.35), 
                              np.minimum(np_adjusted, 0.35), 
                              np_adjusted)
        
        # For very low direct scores, ensure substantial maximum
        np_adjusted = np.where(very_low_direct_mask & (np_adjusted > 0.5), 
                              np.minimum(np_adjusted, 0.5), 
                              np_adjusted)
        
        # For low direct scores, ensure decent maximum
        np_adjusted = np.where(low_direct_mask & (np_adjusted > 0.65), 
                              np.minimum(np_adjusted, 0.65), 
                              np_adjusted)
        
        return np_adjusted
    
    def is_quiz_complete(self):
        """Check if all questions in the quiz have been answered"""
        if not self.active_questions:
            return False
            
        # Quiz is complete when we've reached the end of questions
        return self.current_question >= len(self.active_questions)
    
    def end_assessment_now(self):
        """
        End the assessment immediately and finalize scores
        Used when user wants to finish the quiz early or has completed all questions
        """
        # Make sure scores are calculated with the latest answers
        self.calculate_scores()
        
        # Set current_question to the end to mark assessment as complete
        if self.active_questions:
            self.current_question = len(self.active_questions)
    
    def get_progress_percentage(self):
        """Return the current quiz progress as a percentage"""
        if not self.active_questions:
            return 0
            
        return min(100, int((self.current_question / len(self.active_questions)) * 100))
