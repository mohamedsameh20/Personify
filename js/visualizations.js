/**
 * Visualizations Module - Handles charts and data visualization
 * Creates interactive personality charts and visual representations
 */

class VisualizationEngine {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#4A90E2',
            secondary: '#7B68EE', 
            accent: '#FF6B6B',
            success: '#4ECDC4',
            warning: '#FFA726',
            muted: '#95A5A6'
        };
        
        this.gradients = {
            primary: ['#4A90E2', '#7B68EE'],
            personality: ['#FF6B6B', '#FFA726', '#4ECDC4', '#4A90E2', '#7B68EE'],
            rainbow: ['#FF6B6B', '#FFA726', '#FFD93D', '#6BCF7F', '#4ECDC4', '#4A90E2', '#7B68EE', '#A663CC']
        };

        this.chartDefaults = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        };
    }

    /**
     * Create radar chart for personality traits
     */
    createRadarChart(canvasId, traitScores, characterComparison = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const traits = Object.keys(traitScores);
        const scores = Object.values(traitScores).map(score => score * 100); // Convert to percentage

        const datasets = [{
            label: 'Your Personality',
            data: scores,
            backgroundColor: this.hexToRgba(this.colors.primary, 0.2),
            borderColor: this.colors.primary,
            borderWidth: 3,
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.1
        }];

        // Add character comparison if provided
        if (characterComparison) {
            const characterScores = Object.keys(traitScores).map(trait => 
                (characterComparison.normalizedScores[trait] || 0) * 100
            );

            datasets.push({
                label: characterComparison.name,
                data: characterScores,
                backgroundColor: this.hexToRgba(this.colors.accent, 0.1),
                borderColor: this.colors.accent,
                borderWidth: 2,
                pointBackgroundColor: this.colors.accent,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.1
            });
        }

        const config = {
            type: 'radar',
            data: {
                labels: traits,
                datasets: datasets
            },
            options: {
                ...this.chartDefaults,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            font: {
                                size: 12
                            },
                            color: '#666'
                        },
                        grid: {
                            color: '#e0e0e0'
                        },
                        angleLines: {
                            color: '#e0e0e0'
                        },
                        pointLabels: {
                            font: {
                                size: 13,
                                weight: 'bold'
                            },
                            color: '#333'
                        }
                    }
                },
                plugins: {
                    ...this.chartDefaults.plugins,
                    legend: {
                        display: characterComparison !== null,
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 14
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}%`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        };

        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    /**
     * Create horizontal bar chart for trait breakdown
     */
    createTraitBarsChart(containerId, traitScores) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container element with id '${containerId}' not found`);
            return;
        }

        container.innerHTML = ''; // Clear existing content

        Object.entries(traitScores).forEach(([trait, score], index) => {
            const barContainer = document.createElement('div');
            barContainer.className = 'trait-bar';
            
            const percentage = Math.round(score * 100);
            const colorIndex = index % this.gradients.personality.length;
            const color = this.gradients.personality[colorIndex];

            barContainer.innerHTML = `
                <div class="trait-label">
                    <span class="trait-name">${trait}</span>
                    <span class="trait-score">${percentage}%</span>
                </div>
                <div class="trait-bar-bg">
                    <div class="trait-bar-fill" style="width: 0%; background: ${color};" data-width="${percentage}%"></div>
                </div>
            `;

            container.appendChild(barContainer);

            // Animate bar fill
            setTimeout(() => {
                const fill = barContainer.querySelector('.trait-bar-fill');
                fill.style.width = fill.dataset.width;
            }, index * 100);
        });
    }

    /**
     * Create personality type visualization
     */
    createPersonalityTypeViz(containerId, mbtiType, typeDescription) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const typeColors = {
            'E': this.colors.accent,
            'I': this.colors.primary,
            'S': this.colors.success,
            'N': this.colors.secondary,
            'T': this.colors.warning,
            'F': this.colors.accent,
            'J': this.colors.primary,
            'P': this.colors.success
        };

        const letters = mbtiType.split('');
        
        container.innerHTML = `
            <div class="mbti-visualization">
                <div class="mbti-letters">
                    ${letters.map(letter => `
                        <div class="mbti-letter" style="background: ${typeColors[letter]}">
                            ${letter}
                        </div>
                    `).join('')}
                </div>
                <div class="mbti-description">
                    <h3>${mbtiType}</h3>
                    <p>${typeDescription}</p>
                </div>
            </div>
        `;
    }

    /**
     * Create character similarity chart
     */
    createSimilarityChart(canvasId, characterMatches) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const labels = characterMatches.map(match => match.character.name);
        const similarities = characterMatches.map(match => Math.round(match.similarity * 100));
        
        const config = {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: similarities,
                    backgroundColor: this.gradients.rainbow.slice(0, characterMatches.length),
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverBorderWidth: 4
                }]
            },
            options: {
                ...this.chartDefaults,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label}: ${data.datasets[0].data[i]}%`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}% match`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 2000
                }
            }
        };

        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    /**
     * Create trait comparison visualization
     */
    createTraitComparison(containerId, userScores, characterScores, characterName) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="comparison-grid"></div>';
        const grid = container.querySelector('.comparison-grid');

        Object.keys(userScores).forEach((trait, index) => {
            const userScore = userScores[trait];
            const charScore = characterScores[trait];
            
            const item = document.createElement('div');
            item.className = 'comparison-item';
            
            item.innerHTML = `
                <div class="comparison-trait">${trait}</div>
                <div class="comparison-bars">
                    <div class="comparison-bar user-bar">
                        <div class="comparison-bar-fill" style="width: ${userScore * 100}%"></div>
                    </div>
                    <div class="comparison-bar character-bar">
                        <div class="comparison-bar-fill" style="width: ${charScore * 100}%"></div>
                    </div>
                </div>
                <div class="comparison-labels">
                    <span>You: ${Math.round(userScore * 100)}%</span>
                    <span>${characterName}: ${Math.round(charScore * 100)}%</span>
                </div>
            `;

            grid.appendChild(item);

            // Animate bars
            setTimeout(() => {
                const fills = item.querySelectorAll('.comparison-bar-fill');
                fills.forEach(fill => {
                    fill.style.transition = 'width 1s ease';
                });
            }, index * 50);
        });
    }

    /**
     * Create animated score counter
     */
    createScoreCounter(elementId, targetScore, duration = 2000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startScore = 0;
        const increment = targetScore / (duration / 16); // 60fps
        let currentScore = startScore;

        const counter = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(counter);
            }
            
            element.textContent = Math.round(currentScore) + '%';
        }, 16);
    }

    /**
     * Create progress circle
     */
    createProgressCircle(containerId, percentage, label = '') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        container.innerHTML = `
            <div class="progress-circle">
                <svg width="100" height="100">
                    <circle 
                        cx="50" 
                        cy="50" 
                        r="${radius}"
                        stroke="#e0e0e0"
                        stroke-width="8"
                        fill="transparent"
                    />
                    <circle 
                        cx="50" 
                        cy="50" 
                        r="${radius}"
                        stroke="${this.colors.primary}"
                        stroke-width="8"
                        fill="transparent"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${circumference}"
                        stroke-linecap="round"
                        style="transition: stroke-dashoffset 2s ease-in-out;"
                        class="progress-fill"
                    />
                </svg>
                <div class="progress-text">
                    <span class="progress-number">${Math.round(percentage)}%</span>
                    ${label ? `<span class="progress-label">${label}</span>` : ''}
                </div>
            </div>
        `;

        // Animate progress
        setTimeout(() => {
            const progressFill = container.querySelector('.progress-fill');
            progressFill.style.strokeDashoffset = offset;
        }, 100);
    }

    /**
     * Create facet breakdown visualization
     */
    createFacetBreakdown(containerId, facetScores) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        Object.entries(facetScores).forEach(([trait, facets]) => {
            const traitSection = document.createElement('div');
            traitSection.className = 'facet-section';
            
            traitSection.innerHTML = `
                <h4 class="facet-trait-title">${trait}</h4>
                <div class="facet-grid"></div>
            `;

            const facetGrid = traitSection.querySelector('.facet-grid');

            Object.entries(facets).forEach(([facet, score]) => {
                const facetItem = document.createElement('div');
                facetItem.className = 'facet-item';
                
                const percentage = Math.round(score * 100);
                
                facetItem.innerHTML = `
                    <div class="facet-name">${facet}</div>
                    <div class="facet-bar">
                        <div class="facet-bar-fill" style="width: 0%" data-width="${percentage}%"></div>
                    </div>
                    <div class="facet-score">${percentage}%</div>
                `;

                facetGrid.appendChild(facetItem);
            });

            container.appendChild(traitSection);
        });

        // Animate facet bars
        setTimeout(() => {
            const fills = container.querySelectorAll('.facet-bar-fill');
            fills.forEach((fill, index) => {
                setTimeout(() => {
                    fill.style.width = fill.dataset.width;
                }, index * 50);
            });
        }, 500);
    }

    /**
     * Create interactive heatmap for trait correlations
     */
    createCorrelationHeatmap(containerId, correlationMatrix) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const traits = Object.keys(correlationMatrix);
        
        let heatmapHTML = '<div class="correlation-heatmap"><table class="heatmap-table">';
        
        // Header row
        heatmapHTML += '<tr><th></th>';
        traits.forEach(trait => {
            heatmapHTML += `<th class="trait-header">${trait}</th>`;
        });
        heatmapHTML += '</tr>';

        // Data rows
        traits.forEach(rowTrait => {
            heatmapHTML += `<tr><th class="trait-header">${rowTrait}</th>`;
            traits.forEach(colTrait => {
                const correlation = correlationMatrix[rowTrait][colTrait] || 0;
                const intensity = Math.abs(correlation);
                const color = correlation > 0 ? 
                    `rgba(74, 144, 226, ${intensity})` : 
                    `rgba(255, 107, 107, ${intensity})`;
                
                heatmapHTML += `
                    <td class="heatmap-cell" 
                        style="background-color: ${color}"
                        data-correlation="${correlation.toFixed(2)}"
                        title="${rowTrait} vs ${colTrait}: ${correlation.toFixed(2)}">
                        ${correlation.toFixed(2)}
                    </td>
                `;
            });
            heatmapHTML += '</tr>';
        });
        
        heatmapHTML += '</table></div>';
        container.innerHTML = heatmapHTML;
    }

    /**
     * Helper function to convert hex to rgba
     */
    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Create gradient background
     */
    createGradient(ctx, colors, direction = 'horizontal') {
        let gradient;
        
        if (direction === 'horizontal') {
            gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
        } else {
            gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        }

        colors.forEach((color, index) => {
            gradient.addColorStop(index / (colors.length - 1), color);
        });

        return gradient;
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    /**
     * Update chart with new data
     */
    updateChart(canvasId, newData) {
        const chart = this.charts[canvasId];
        if (!chart) return false;

        chart.data = newData;
        chart.update('active');
        return true;
    }

    /**
     * Export chart as image
     */
    exportChart(canvasId, filename = 'chart.png') {
        const chart = this.charts[canvasId];
        if (!chart) return false;

        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    }

    /**
     * Resize all charts
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    /**
     * Apply theme to charts
     */
    applyTheme(theme = 'light') {
        const isDark = theme === 'dark';
        
        if (isDark) {
            this.colors = {
                primary: '#5BA3F5',
                secondary: '#8B7ED8',
                accent: '#FF8A8A',
                success: '#5EDDD4',
                warning: '#FFB74D',
                muted: '#B0BEC5'
            };
        } else {
            this.colors = {
                primary: '#4A90E2',
                secondary: '#7B68EE',
                accent: '#FF6B6B',
                success: '#4ECDC4',
                warning: '#FFA726',
                muted: '#95A5A6'
            };
        }

        // Update existing charts with new colors
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.data && chart.data.datasets) {
                chart.data.datasets.forEach((dataset, index) => {
                    if (index === 0) {
                        dataset.borderColor = this.colors.primary;
                        dataset.backgroundColor = this.hexToRgba(this.colors.primary, 0.2);
                        dataset.pointBackgroundColor = this.colors.primary;
                    }
                });
                chart.update();
            }
        });
    }
}

// Export for use in other modules
window.VisualizationEngine = VisualizationEngine;
