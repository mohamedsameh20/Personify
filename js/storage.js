/**
 * Storage Module - Handles local data persistence
 * Manages localStorage operations for assessment data, user preferences, and results
 */

class StorageManager {
    constructor() {
        this.STORAGE_PREFIX = 'personify_';
        this.STORAGE_KEYS = {
            ASSESSMENT_PROGRESS: 'assessment_progress',
            USER_PREFERENCES: 'user_preferences',
            COMPLETED_ASSESSMENTS: 'completed_assessments',
            CHARACTER_DATA: 'character_data',
            QUESTIONS_DATA: 'questions_data'
        };
        
        // Initialize storage check
        this.isAvailable = this.checkStorageAvailability();
        
        if (!this.isAvailable) {
            console.warn('localStorage is not available. Data will not persist between sessions.');
        }
    }

    /**
     * Check if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get a storage key with prefix
     */
    getKey(key) {
        return this.STORAGE_PREFIX + key;
    }

    /**
     * Save data to localStorage
     */
    save(key, data) {
        if (!this.isAvailable) return false;
        
        try {
            const serializedData = JSON.stringify({
                data: data,
                timestamp: new Date().toISOString(),
                version: '1.0'
            });
            localStorage.setItem(this.getKey(key), serializedData);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    /**
     * Load data from localStorage
     */
    load(key) {
        if (!this.isAvailable) return null;
        
        try {
            const serializedData = localStorage.getItem(this.getKey(key));
            if (!serializedData) return null;
            
            const parsedData = JSON.parse(serializedData);
            return parsedData.data;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    /**
     * Remove data from localStorage
     */
    remove(key) {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    /**
     * Clear all application data
     */
    clearAll() {
        if (!this.isAvailable) return false;
        
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                this.remove(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    /**
     * Save assessment progress
     */
    saveAssessmentProgress(progressData) {
        return this.save(this.STORAGE_KEYS.ASSESSMENT_PROGRESS, {
            currentQuestion: progressData.currentQuestion,
            answers: progressData.answers,
            mode: progressData.mode,
            startTime: progressData.startTime,
            lastUpdated: new Date().toISOString(),
            traitScores: progressData.traitScores || {},
            demographics: progressData.demographics || {}
        });
    }

    /**
     * Load assessment progress
     */
    loadAssessmentProgress() {
        return this.load(this.STORAGE_KEYS.ASSESSMENT_PROGRESS);
    }

    /**
     * Clear assessment progress
     */
    clearAssessmentProgress() {
        return this.remove(this.STORAGE_KEYS.ASSESSMENT_PROGRESS);
    }

    /**
     * Save completed assessment
     */
    saveCompletedAssessment(assessmentData) {
        const completedAssessments = this.loadCompletedAssessments() || [];
        
        const assessment = {
            id: this.generateUUID(),
            completedAt: new Date().toISOString(),
            mode: assessmentData.mode,
            scores: assessmentData.scores,
            mbtiType: assessmentData.mbtiType,
            characterMatches: assessmentData.characterMatches,
            demographics: assessmentData.demographics,
            insights: assessmentData.insights
        };
        
        completedAssessments.unshift(assessment); // Add to beginning
        
        // Keep only last 10 assessments
        if (completedAssessments.length > 10) {
            completedAssessments.splice(10);
        }
        
        return this.save(this.STORAGE_KEYS.COMPLETED_ASSESSMENTS, completedAssessments);
    }

    /**
     * Load completed assessments
     */
    loadCompletedAssessments() {
        return this.load(this.STORAGE_KEYS.COMPLETED_ASSESSMENTS) || [];
    }

    /**
     * Get latest completed assessment
     */
    getLatestAssessment() {
        const assessments = this.loadCompletedAssessments();
        return assessments.length > 0 ? assessments[0] : null;
    }

    /**
     * Save user preferences
     */
    saveUserPreferences(preferences) {
        return this.save(this.STORAGE_KEYS.USER_PREFERENCES, {
            theme: preferences.theme || 'light',
            reducedMotion: preferences.reducedMotion || false,
            highContrast: preferences.highContrast || false,
            fontSize: preferences.fontSize || 'medium',
            language: preferences.language || 'en',
            notifications: preferences.notifications || true,
            autoSave: preferences.autoSave !== false // Default to true
        });
    }

    /**
     * Load user preferences
     */
    loadUserPreferences() {
        return this.load(this.STORAGE_KEYS.USER_PREFERENCES) || {
            theme: 'light',
            reducedMotion: false,
            highContrast: false,
            fontSize: 'medium',
            language: 'en',
            notifications: true,
            autoSave: true
        };
    }

    /**
     * Cache character data
     */
    cacheCharacterData(characterData) {
        return this.save(this.STORAGE_KEYS.CHARACTER_DATA, {
            characters: characterData,
            cachedAt: new Date().toISOString()
        });
    }

    /**
     * Load cached character data
     */
    loadCachedCharacterData() {
        const cached = this.load(this.STORAGE_KEYS.CHARACTER_DATA);
        if (!cached) return null;
        
        // Check if cache is less than 24 hours old
        const cacheAge = new Date() - new Date(cached.cachedAt);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (cacheAge > maxAge) {
            this.remove(this.STORAGE_KEYS.CHARACTER_DATA);
            return null;
        }
        
        return cached.characters;
    }

    /**
     * Cache questions data
     */
    cacheQuestionsData(questionsData) {
        return this.save(this.STORAGE_KEYS.QUESTIONS_DATA, {
            questions: questionsData,
            cachedAt: new Date().toISOString()
        });
    }

    /**
     * Load cached questions data
     */
    loadCachedQuestionsData() {
        const cached = this.load(this.STORAGE_KEYS.QUESTIONS_DATA);
        if (!cached) return null;
        
        // Check if cache is less than 24 hours old
        const cacheAge = new Date() - new Date(cached.cachedAt);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (cacheAge > maxAge) {
            this.remove(this.STORAGE_KEYS.QUESTIONS_DATA);
            return null;
        }
        
        return cached.questions;
    }

    /**
     * Export all user data
     */
    exportData() {
        if (!this.isAvailable) return null;
        
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            preferences: this.loadUserPreferences(),
            completedAssessments: this.loadCompletedAssessments(),
            assessmentProgress: this.loadAssessmentProgress()
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import user data
     */
    importData(dataString) {
        if (!this.isAvailable) return false;
        
        try {
            const importData = JSON.parse(dataString);
            
            if (importData.preferences) {
                this.saveUserPreferences(importData.preferences);
            }
            
            if (importData.completedAssessments) {
                this.save(this.STORAGE_KEYS.COMPLETED_ASSESSMENTS, importData.completedAssessments);
            }
            
            if (importData.assessmentProgress) {
                this.saveAssessmentProgress(importData.assessmentProgress);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        if (!this.isAvailable) return null;
        
        let totalSize = 0;
        const itemSizes = {};
        
        Object.values(this.STORAGE_KEYS).forEach(key => {
            const data = localStorage.getItem(this.getKey(key));
            const size = data ? new Blob([data]).size : 0;
            itemSizes[key] = size;
            totalSize += size;
        });
        
        return {
            totalSize: totalSize,
            itemSizes: itemSizes,
            available: this.isAvailable,
            quota: this.getStorageQuota()
        };
    }

    /**
     * Get storage quota (approximate)
     */
    getStorageQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            return navigator.storage.estimate();
        }
        
        // Fallback estimation
        return Promise.resolve({
            quota: 5 * 1024 * 1024, // ~5MB typical localStorage limit
            usage: 0
        });
    }

    /**
     * Generate a UUID for unique identification
     */
    generateUUID() {
        if (crypto && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        
        // Fallback UUID generation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Auto-save functionality
     */
    enableAutoSave(callback, interval = 30000) { // 30 seconds default
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            if (typeof callback === 'function') {
                callback();
            }
        }, interval);
    }

    /**
     * Disable auto-save
     */
    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Check if there's a saved assessment in progress
     */
    hasAssessmentInProgress() {
        const progress = this.loadAssessmentProgress();
        return progress && progress.currentQuestion !== undefined && progress.answers && progress.answers.length > 0;
    }

    /**
     * Get assessment completion percentage
     */
    getAssessmentCompletion() {
        const progress = this.loadAssessmentProgress();
        if (!progress || !progress.answers) return 0;
        
        const totalQuestions = this.getTotalQuestionsForMode(progress.mode);
        return Math.round((progress.answers.length / totalQuestions) * 100);
    }

    /**
     * Get total questions for mode (helper method)
     */
    getTotalQuestionsForMode(mode) {
        const questionCounts = {
            'demo': 36,
            'basic': 120,
            'comprehensive': 240
        };
        return questionCounts[mode] || 120;
    }

    /**
     * Backup data to download
     */
    downloadBackup() {
        const data = this.exportData();
        if (!data) return false;
        
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `personify-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        return true;
    }

    /**
     * Restore data from file
     */
    restoreFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const success = this.importData(e.target.result);
                    resolve(success);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}

// Export for use in other modules
window.StorageManager = StorageManager;
