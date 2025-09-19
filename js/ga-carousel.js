/**
 * GA4 Feed Carousel Tracking
 * Tracks carousel interactions in Instagram feed format
 */

(function() {
    'use strict';
    
    // Configuration
    const MIN_DWELL_MS = 2000; // Minimum dwell time to count as "viewed"
    
    // Tracking state for each carousel
    let carouselTrackers = new Map();
    
    /**
     * Initialize carousel tracking for a specific carousel
     */
    function initCarouselTracker(carouselId) {
        return {
            carouselId: carouselId,
            isStarted: false,
            totalSlides: 0,
            currentSlide: 0,
            slideStartTime: null,
            slideViewedFlags: [], // Track which slides have been viewed long enough
            totalDwellTime: 0,
            slideHistory: [], // Track all slide visits with dwell times
            startTime: Date.now()
        };
    }
    
    /**
     * Track carousel start event
     */
    function trackCarouselStart(carouselId) {
        console.log(`🎠 Carousel ${carouselId} started`);
        
        if (window.GALite && window.GALite.track) {
            window.GALite.track('carousel_start', {
                carousel_id: carouselId,
                carousel_type: 'feed_carousel',
                study_id: 'instagram_study'
            });
        }
    }
    
    /**
     * Track slide view event
     */
    function trackSlideView(carouselId, slideIndex, totalSlides) {
        const tracker = carouselTrackers.get(carouselId);
        if (!tracker) return;
        
        // End previous slide dwell if exists
        if (tracker.slideStartTime !== null && tracker.currentSlide !== slideIndex) {
            trackDwellEnd(carouselId, tracker.currentSlide);
        }
        
        // Start new slide tracking
        tracker.currentSlide = slideIndex;
        tracker.slideStartTime = Date.now();
        
        console.log(`👁️ Slide ${slideIndex} viewed in carousel ${carouselId}`);
        
        if (window.GALite && window.GALite.track) {
            window.GALite.track('slide_view', {
                carousel_id: carouselId,
                slide_index: slideIndex,
                total_slides: totalSlides,
                carousel_type: 'feed_carousel',
                study_id: 'instagram_study'
            });
        }
    }
    
    /**
     * Track dwell end for a slide
     */
    function trackDwellEnd(carouselId, slideIndex) {
        const tracker = carouselTrackers.get(carouselId);
        if (!tracker || tracker.slideStartTime === null) return;
        
        const dwellMs = Date.now() - tracker.slideStartTime;
        
        // Only track if dwell time meets minimum threshold
        if (dwellMs >= MIN_DWELL_MS) {
            tracker.totalDwellTime += dwellMs;
            tracker.slideHistory.push({
                slideIndex: slideIndex,
                dwellMs: dwellMs,
                timestamp: Date.now()
            });
            
            // Mark slide as viewed if not already
            if (!tracker.slideViewedFlags[slideIndex]) {
                tracker.slideViewedFlags[slideIndex] = true;
            }
            
            console.log(`⏱️ Slide ${slideIndex} dwell end: ${dwellMs}ms`);
            
            if (window.GALite && window.GALite.track) {
                window.GALite.track('dwell_end', {
                    carousel_id: carouselId,
                    slide_index: slideIndex,
                    dwell_ms: dwellMs,
                    carousel_type: 'feed_carousel',
                    study_id: 'instagram_study'
                });
            }
        }
        
        tracker.slideStartTime = null;
    }
    
    /**
     * Track carousel completion
     */
    function trackCarouselComplete(carouselId) {
        const tracker = carouselTrackers.get(carouselId);
        if (!tracker) return;
        
        // End current slide dwell
        if (tracker.slideStartTime !== null) {
            trackDwellEnd(carouselId, tracker.currentSlide);
        }
        
        const viewedSlides = tracker.slideViewedFlags.filter(Boolean).length;
        const completionRate = (viewedSlides / tracker.totalSlides) * 100;
        
        console.log(`✅ Carousel ${carouselId} completed - ${viewedSlides}/${tracker.totalSlides} slides viewed`);
        
        if (window.GALite && window.GALite.track) {
            window.GALite.track('carousel_complete', {
                carousel_id: carouselId,
                slides_viewed: viewedSlides,
                total_slides: tracker.totalSlides,
                completion_rate: Math.round(completionRate),
                total_dwell_ms: tracker.totalDwellTime,
                carousel_type: 'feed_carousel',
                study_id: 'instagram_study'
            });
        }
    }
    
    /**
     * Set up carousel navigation listeners
     */
    function setupCarouselNavigation() {
        // Find all feed carousels
        const carousels = document.querySelectorAll('.feed-carousel');
        
        carousels.forEach((carousel, carouselIndex) => {
            const carouselId = `feed_carousel_${carouselIndex + 1}`;
            const images = carousel.querySelectorAll('img');
            const dots = carousel.querySelectorAll('.carousel-dot');
            
            if (!images.length) return;
            
            // Initialize tracker
            const tracker = initCarouselTracker(carouselId);
            tracker.totalSlides = images.length;
            carouselTrackers.set(carouselId, tracker);
            
            console.log(`🎠 Initialized carousel ${carouselId} with ${images.length} slides`);
            
            // Track carousel start
            trackCarouselStart(carouselId);
            
            // Track initial slide view
            trackSlideView(carouselId, 0, images.length);
            
            // Monitor for slide changes by watching for active class changes
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const target = mutation.target;
                        if (target.tagName === 'IMG' && target.classList.contains('active')) {
                            const slideIndex = Array.from(images).indexOf(target);
                            if (slideIndex !== -1) {
                                trackSlideView(carouselId, slideIndex, images.length);
                            }
                        }
                    }
                });
            });
            
            // Observe all images for class changes
            images.forEach(img => {
                observer.observe(img, { attributes: true, attributeFilter: ['class'] });
            });
        });
    }
    
    /**
     * Set up page unload tracking
     */
    function setupUnloadTracking() {
        const handleUnload = () => {
            // Complete all active carousels
            carouselTrackers.forEach((tracker, carouselId) => {
                trackCarouselComplete(carouselId);
            });
        };
        
        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('pagehide', handleUnload);
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                handleUnload();
            }
        });
    }
    
    /**
     * Wait for "Tap to Start" to enable tracking
     */
    function waitForTapToStart() {
        const tapOverlay = document.getElementById('tap-to-start-overlay');
        if (tapOverlay) {
            tapOverlay.addEventListener('click', () => {
                console.log('Tap to Start clicked - Feed carousel tracking enabled');
                
                // Set up carousel tracking after tap to start
                setTimeout(() => {
                    setupCarouselNavigation();
                    setupUnloadTracking();
                }, 500);
            });
        } else {
            // No tap to start overlay, initialize immediately
            setupCarouselNavigation();
            setupUnloadTracking();
        }
    }
    
    /**
     * Initialize carousel tracking
     */
    function initCarouselTracking() {
        console.log('Initializing feed carousel tracking...');
        
        // Wait for GALite to be available
        if (!window.GALite) {
            setTimeout(initCarouselTracking, 100);
            return;
        }
        
        // Wait for tap to start or initialize immediately
        waitForTapToStart();
        
        console.log('Feed carousel tracking initialized');
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarouselTracking);
    } else {
        initCarouselTracking();
    }
    
})();
