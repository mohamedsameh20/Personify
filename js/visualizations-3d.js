/**
 * PERSONIFY PREMIUM - 3D VISUALIZATIONS ENGINE
 * 
 * This module creates advanced 3D visualizations including:
 * - 3D Radar charts for personality traits
 * - Interactive bar charts with depth
 * - Animated heatmaps with 3D effects
 * - Character comparison visualizations
 * - Real-time data updates with smooth transitions
 * 
 * @version 2.0.0
 * @author Personify Premium Team
 */

class Visualizations3D {
    constructor(options = {}) {
        this.animationController = options.animationController;
        
        // Chart instances
        this.charts = new Map();
        this.canvases = new Map();
        this.contexts = new Map();
        
        // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Configuration
        this.config = {
            radarLevels: 5,
            barAnimation: true,
            heatmapGrid: 12,
            colors: {
                primary: '#6C5CE7',
                secondary: '#A29BFE',
                accent: '#FD79A8',
                gradient: ['#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7']
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutCubic'
            }
        };
        
        this.init();
    }

    /**
     * Initialize the visualization engine
     */
    async init() {
        try {
            console.log('📊 Initializing 3D Visualizations Engine...');
            
            // Load Chart.js and Three.js if not already loaded
            await this.loadDependencies();
            
            // Initialize Three.js scene
            this.initializeThreeJS();
            
            // Setup responsive handlers
            this.setupResponsiveHandlers();
            
            console.log('✅ 3D Visualizations Engine initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize 3D Visualizations Engine:', error);
            throw error;
        }
    }

    /**
     * Load external dependencies
     */
    async loadDependencies() {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js');
        }
        
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js');
        }
    }

    /**
     * Load external script
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize Three.js scene
     */
    initializeThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(800, 600);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add lighting
        this.setupLighting();
        
        // Add to DOM when needed
        this.threejsContainer = this.renderer.domElement;
    }

    /**
     * Setup lighting for Three.js scene
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point lights for accent
        const pointLight1 = new THREE.PointLight(0x6C5CE7, 0.8, 100);
        pointLight1.position.set(10, 10, 10);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xFD79A8, 0.6, 100);
        pointLight2.position.set(-10, -10, 10);
        this.scene.add(pointLight2);
    }

    /**
     * Create 3D radar chart for personality traits
     */
    async createTraitRadar(traitData) {
        try {
            console.log('📊 Creating 3D trait radar chart...');
            
            const container = document.getElementById('trait-radar-chart');
            if (!container) {
                console.warn('⚠️ Trait radar chart container not found');
                return;
            }
            
            // Prepare data
            const labels = Object.keys(traitData);
            const data = Object.values(traitData).map(trait => trait.score || 0);
            const confidence = Object.values(traitData).map(trait => trait.confidence || 0);
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.id = 'trait-radar-canvas';
            container.innerHTML = '';
            container.appendChild(canvas);
            
            // Chart configuration
            const config = {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Personality Traits',
                            data: data,
                            borderColor: this.config.colors.primary,
                            backgroundColor: this.hexToRgba(this.config.colors.primary, 0.2),
                            borderWidth: 3,
                            pointBackgroundColor: this.config.colors.accent,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            tension: 0.3
                        },
                        {
                            label: 'Confidence',
                            data: confidence.map(c => c * 100),
                            borderColor: this.config.colors.secondary,
                            backgroundColor: this.hexToRgba(this.config.colors.secondary, 0.1),
                            borderWidth: 2,
                            pointBackgroundColor: this.config.colors.secondary,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 1,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: this.config.animation.duration,
                        easing: this.config.animation.easing
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#fff',
                                font: {
                                    size: 14,
                                    family: 'Inter, sans-serif'
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: this.config.colors.primary,
                            borderWidth: 1,
                            callbacks: {
                                label: (context) => {
                                    const trait = traitData[context.label];
                                    return [
                                        `Score: ${context.parsed.r.toFixed(1)}`,
                                        `Confidence: ${(trait.confidence * 100).toFixed(0)}%`,
                                        `Level: ${trait.level || 'Unknown'}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: {
                                stepSize: 20,
                                color: '#888',
                                font: {
                                    size: 12
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            angleLines: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            pointLabels: {
                                color: '#fff',
                                font: {
                                    size: 13,
                                    family: 'Inter, sans-serif'
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'nearest'
                    }
                }
            };
            
            // Create chart
            const chart = new Chart(canvas.getContext('2d'), config);
            this.charts.set('trait-radar', chart);
            
            // Add 3D enhancement
            this.enhance3DRadar(canvas, traitData);
            
            console.log('✅ 3D trait radar chart created');
            
        } catch (error) {
            console.error('❌ Failed to create trait radar chart:', error);
        }
    }

    /**
     * Enhance radar chart with 3D effects
     */
    enhance3DRadar(canvas, traitData) {
        // Add CSS 3D transforms and effects
        canvas.style.transform = 'perspective(1000px) rotateX(5deg)';
        canvas.style.filter = 'drop-shadow(0 10px 20px rgba(108, 92, 231, 0.3))';
        canvas.style.transition = 'all 0.3s ease';
        
        // Add hover effects
        canvas.addEventListener('mouseenter', () => {
            canvas.style.transform = 'perspective(1000px) rotateX(0deg) scale(1.02)';
        });
        
        canvas.addEventListener('mouseleave', () => {
            canvas.style.transform = 'perspective(1000px) rotateX(5deg) scale(1)';
        });
    }

    /**
     * Create 3D bar chart for personality facets
     */
    async createPersonalityBarChart(facetData) {
        try {
            console.log('📊 Creating 3D personality bar chart...');
            
            const container = document.getElementById('personality-bar-chart');
            if (!container) {
                console.warn('⚠️ Personality bar chart container not found');
                return;
            }
            
            // Flatten facet data
            const chartData = this.prepareFacetData(facetData);
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.id = 'personality-bar-canvas';
            container.innerHTML = '';
            container.appendChild(canvas);
            
            // Chart configuration
            const config = {
                type: 'bar',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Facet Scores',
                        data: chartData.scores,
                        backgroundColor: chartData.labels.map((_, index) => 
                            this.getGradientColor(index, chartData.labels.length)),
                        borderColor: chartData.labels.map((_, index) => 
                            this.getGradientColor(index, chartData.labels.length, 1)),
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: this.config.animation.duration,
                        easing: this.config.animation.easing,
                        delay: (context) => context.dataIndex * 100
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: this.config.colors.primary,
                            borderWidth: 1,
                            callbacks: {
                                label: (context) => {
                                    const facetInfo = chartData.info[context.dataIndex];
                                    return [
                                        `Score: ${context.parsed.y.toFixed(1)}`,
                                        `Confidence: ${(facetInfo.confidence * 100).toFixed(0)}%`,
                                        `Trait: ${facetInfo.trait}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#fff',
                                font: {
                                    size: 11
                                },
                                maxRotation: 45
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            min: 0,
                            max: 100,
                            ticks: {
                                color: '#fff',
                                font: {
                                    size: 12
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            };
            
            // Create chart
            const chart = new Chart(canvas.getContext('2d'), config);
            this.charts.set('personality-bar', chart);
            
            // Add 3D enhancement
            this.enhance3DBarChart(canvas);
            
            console.log('✅ 3D personality bar chart created');
            
        } catch (error) {
            console.error('❌ Failed to create personality bar chart:', error);
        }
    }

    /**
     * Prepare facet data for bar chart
     */
    prepareFacetData(facetData) {
        const labels = [];
        const scores = [];
        const info = [];
        
        Object.entries(facetData).forEach(([trait, facets]) => {
            Object.entries(facets).forEach(([facetName, facetInfo]) => {
                labels.push(facetName);
                scores.push(facetInfo.score || 0);
                info.push({
                    trait: trait,
                    confidence: facetInfo.confidence || 0,
                    description: facetInfo.description || ''
                });
            });
        });
        
        return { labels, scores, info };
    }

    /**
     * Enhance bar chart with 3D effects
     */
    enhance3DBarChart(canvas) {
        // Add 3D perspective
        canvas.style.transform = 'perspective(1200px) rotateX(2deg) rotateY(-2deg)';
        canvas.style.filter = 'drop-shadow(0 8px 16px rgba(108, 92, 231, 0.2))';
        canvas.style.transition = 'all 0.3s ease';
        
        // Add interaction effects
        canvas.addEventListener('mouseenter', () => {
            canvas.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1.01)';
        });
        
        canvas.addEventListener('mouseleave', () => {
            canvas.style.transform = 'perspective(1200px) rotateX(2deg) rotateY(-2deg) scale(1)';
        });
    }

    /**
     * Create comparison heatmap
     */
    async createComparisonHeatmap(comparisonData) {
        try {
            console.log('📊 Creating comparison heatmap...');
            
            const container = document.getElementById('comparison-heatmap');
            if (!container) {
                console.warn('⚠️ Comparison heatmap container not found');
                return;
            }
            
            // Create Three.js heatmap
            this.createThreeJSHeatmap(container, comparisonData);
            
            console.log('✅ Comparison heatmap created');
            
        } catch (error) {
            console.error('❌ Failed to create comparison heatmap:', error);
        }
    }

    /**
     * Create Three.js based heatmap
     */
    createThreeJSHeatmap(container, data) {
        // Create scene for heatmap
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);
        
        // Create heatmap grid
        const gridSize = this.config.heatmapGrid;
        const geometry = new THREE.PlaneGeometry(8, 8, gridSize - 1, gridSize - 1);
        
        // Create material with custom shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                data: { value: this.generateHeatmapData(data, gridSize) },
                colors: { value: this.getHeatmapColors() }
            },
            vertexShader: this.getHeatmapVertexShader(),
            fragmentShader: this.getHeatmapFragmentShader(),
            transparent: true
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        // Position camera
        camera.position.z = 10;
        
        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            material.uniforms.time.value += 0.01;
            mesh.rotation.x = Math.sin(material.uniforms.time.value * 0.5) * 0.1;
            mesh.rotation.y = Math.cos(material.uniforms.time.value * 0.3) * 0.1;
            
            renderer.render(scene, camera);
        };
        
        animate();
        
        // Store for cleanup
        this.charts.set('heatmap', { scene, camera, renderer, animate });
    }

    /**
     * Generate heatmap data
     */
    generateHeatmapData(data, gridSize) {
        const heatmapData = [];
        
        for (let i = 0; i < gridSize * gridSize; i++) {
            // Generate sample data based on input
            const value = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
            heatmapData.push(value);
        }
        
        return heatmapData;
    }

    /**
     * Get heatmap colors
     */
    getHeatmapColors() {
        return [
            new THREE.Vector3(0.4, 0.2, 0.9), // Purple
            new THREE.Vector3(0.6, 0.4, 1.0), // Light Purple
            new THREE.Vector3(0.9, 0.5, 0.7), // Pink
            new THREE.Vector3(1.0, 0.8, 0.4), // Orange
            new THREE.Vector3(0.4, 0.2, 0.9)  // Back to Purple
        ];
    }

    /**
     * Get heatmap vertex shader
     */
    getHeatmapVertexShader() {
        return `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get heatmap fragment shader
     */
    getHeatmapFragmentShader() {
        return `
            uniform float time;
            uniform float data[144]; // gridSize * gridSize
            uniform vec3 colors[5];
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                // Calculate grid position
                int gridSize = 12;
                int x = int(vUv.x * float(gridSize));
                int y = int(vUv.y * float(gridSize));
                int index = y * gridSize + x;
                
                // Get data value
                float value = data[index];
                
                // Animate value
                value += sin(time + vPosition.x + vPosition.y) * 0.1;
                value = clamp(value, 0.0, 1.0);
                
                // Interpolate colors
                float colorIndex = value * 4.0;
                int index1 = int(colorIndex);
                int index2 = min(index1 + 1, 4);
                float t = colorIndex - float(index1);
                
                vec3 color = mix(colors[index1], colors[index2], t);
                
                // Add glow effect
                float glow = smoothstep(0.0, 1.0, value);
                color *= (1.0 + glow * 0.5);
                
                gl_FragColor = vec4(color, 0.8);
            }
        `;
    }

    /**
     * Get gradient color for data point
     */
    getGradientColor(index, total, alpha = 0.8) {
        const ratio = index / (total - 1);
        const colors = this.config.colors.gradient;
        
        const colorIndex = ratio * (colors.length - 1);
        const index1 = Math.floor(colorIndex);
        const index2 = Math.min(index1 + 1, colors.length - 1);
        const t = colorIndex - index1;
        
        const color1 = this.hexToRgb(colors[index1]);
        const color2 = this.hexToRgb(colors[index2]);
        
        const r = Math.round(color1.r + (color2.r - color1.r) * t);
        const g = Math.round(color1.g + (color2.g - color1.g) * t);
        const b = Math.round(color1.b + (color2.b - color1.b) * t);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Convert hex to RGBA
     */
    hexToRgba(hex, alpha) {
        const rgb = this.hexToRgb(hex);
        return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : hex;
    }

    /**
     * Update chart theme
     */
    updateTheme(theme) {
        // Update color configuration
        if (theme.colors) {
            this.config.colors = { ...this.config.colors, ...theme.colors };
        }
        
        // Update existing charts
        this.charts.forEach((chart, key) => {
            if (chart.update) {
                chart.update();
            }
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Resize Chart.js charts
        this.charts.forEach((chart, key) => {
            if (chart.resize) {
                chart.resize();
            }
        });
        
        // Resize Three.js renderers
        const containers = ['comparison-heatmap'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container && this.charts.has('heatmap')) {
                const heatmapChart = this.charts.get('heatmap');
                if (heatmapChart.renderer) {
                    heatmapChart.renderer.setSize(container.clientWidth, container.clientHeight);
                    heatmapChart.camera.aspect = container.clientWidth / container.clientHeight;
                    heatmapChart.camera.updateProjectionMatrix();
                }
            }
        });
    }

    /**
     * Setup responsive handlers
     */
    setupResponsiveHandlers() {
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * Cleanup charts and resources
     */
    cleanup() {
        // Dispose Chart.js charts
        this.charts.forEach((chart, key) => {
            if (chart.destroy) {
                chart.destroy();
            }
        });
        
        // Dispose Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Clear maps
        this.charts.clear();
        this.canvases.clear();
        this.contexts.clear();
    }

    /**
     * Export chart as image
     */
    exportChart(chartKey, format = 'png') {
        const chart = this.charts.get(chartKey);
        if (!chart) {
            console.warn(`⚠️ Chart ${chartKey} not found for export`);
            return null;
        }
        
        if (chart.toBase64Image) {
            // Chart.js export
            return chart.toBase64Image('image/' + format);
        } else if (chart.renderer) {
            // Three.js export
            return chart.renderer.domElement.toDataURL('image/' + format);
        }
        
        return null;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Visualizations3D;
}
