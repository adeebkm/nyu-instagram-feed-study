/**
 * GA4 Feed Carousel Tracking
 * Uses the same sophisticated tracking method as reel carousel
 * Adapted for feed carousel structure (.feed-carousel)
 */

(function() {
    'use strict';
    
    // Configuration
    const MIN_DWELL_MS = 2000; // Minimum dwell time to count as "viewed"
    
    // Tracking state
    let carouselState = {
        isStarted: false,
        totalSlides: 0,
        currentSlide: 0,
        slideStartTime: null,
        slideViewedFlags: [], // Track which slides have been viewed long enough
        totalDwellTime: 0,
        slideHistory: [] // Track all slide visits with dwell times
    };
    
    /**
     * Initialize carousel tracking
     */
    function initCarouselTracking() {
        // Wait for GALite to be available
        if (!window.GALite) {
            setTimeout(initCarouselTracking, 100);
            return;
        }
        
        // Find carousel slides (adapt to feed carousel structure)
        const carousel = document.querySelector('.feed-carousel');
        const slides = carousel ? carousel.querySelectorAll('img') : [];
        
        if (slides.length === 0) {
            return; // No carousel found
        }
        
        carouselState.totalSlides = slides.length;
        carouselState.slideViewedFlags = new Array(slides.length).fill(false);
        
        console.log(`🎠 Initialized feed carousel with ${slides.length} slides`);
        
        // Set up navigation button listeners
        setupNavigationListeners();
        
        // Wait for tap-to-start before beginning tracking
        waitForTapToStart();
    }
    
    /**
     * Wait for tap-to-start before beginning carousel tracking
     */
    function waitForTapToStart() {
        const tapOverlay = document.getElementById('tap-to-start-overlay');
        if (!tapOverlay) {
            // No tap-to-start overlay, begin tracking immediately
            startCarouselTracking();
            return;
        }
        
        // Check if overlay is already hidden
        if (tapOverlay.classList.contains('hidden') || 
            window.getComputedStyle(tapOverlay).display === 'none') {
            startCarouselTracking();
            return;
        }
        
        // Wait for tap-to-start click
        tapOverlay.addEventListener('click', startCarouselTracking, { once: true });
    }
    
    /**
     * Start carousel tracking after tap-to-start
     */
    function startCarouselTracking() {
        trackCarouselStart();
        trackSlideView(0, 'start');
        carouselState.slideStartTime = Date.now();
    }
    
    /**
     * Track carousel start event
     */
    function trackCarouselStart() {
        if (!carouselState.isStarted) {
            carouselState.isStarted = true;
            console.log('🎠 Carousel started');
            
            window.GALite.track('carousel_start', {
                carousel_id: 'feed_carousel_1',
                carousel_type: 'feed_carousel',
                total_slides: carouselState.totalSlides,
                study_id: 'instagram_study'
            });
        }
    }
    
    /**
     * Track slide view event
     */
    function trackSlideView(slideIndex, direction = 'unknown') {
        console.log(`👁️ Slide ${slideIndex} viewed (${direction})`);
        
        window.GALite.track('slide_view', {
            carousel_id: 'feed_carousel_1',
            carousel_type: 'feed_carousel',
            slide_index: slideIndex,
            total_slides: carouselState.totalSlides,
            direction: direction,
            study_id: 'instagram_study'
        });
        
        carouselState.currentSlide = slideIndex;
    }
    
    /**
     * Track dwell end event when leaving a slide
     */
    function trackDwellEnd(slideIndex, dwellMs) {
        // Only track if dwell time meets minimum threshold
        if (dwellMs >= MIN_DWELL_MS) {
            console.log(`⏱️ Slide ${slideIndex} dwell end: ${dwellMs}ms`);
            
            window.GALite.track('dwell_end', {
                carousel_id: 'feed_carousel_1',
                carousel_type: 'feed_carousel',
                slide_index: slideIndex,
                dwell_ms: dwellMs,
                study_id: 'instagram_study'
            });
            
            // Mark slide as viewed
            carouselState.slideViewedFlags[slideIndex] = true;
        }
        
        // Add to total dwell time
        carouselState.totalDwellTime += dwellMs;
        
        // Store in history
        carouselState.slideHistory.push({
            slideIndex: slideIndex,
            dwellMs: dwellMs,
            timestamp: Date.now()
        });
    }
    
    /**
     * Handle slide change
     */
    function handleSlideChange(newSlideIndex, direction) {
        const now = Date.now();
        
        // Calculate dwell time for previous slide
        if (carouselState.slideStartTime !== null) {
            const dwellMs = now - carouselState.slideStartTime;
            trackDwellEnd(carouselState.currentSlide, dwellMs);
        }
        
        // Track new slide view
        trackSlideView(newSlideIndex, direction);
        
        // Update state
        carouselState.slideStartTime = now;
    }
    
    /**
     * Track carousel completion
     */
    function trackCarouselComplete() {
        // Calculate final dwell time for current slide
        if (carouselState.slideStartTime !== null) {
            const dwellMs = Date.now() - carouselState.slideStartTime;
            trackDwellEnd(carouselState.currentSlide, dwellMs);
            carouselState.slideStartTime = null;
        }
        
        // Calculate completion metrics
        const viewedSlides = carouselState.slideViewedFlags.filter(Boolean).length;
        const completionRate = (viewedSlides / carouselState.totalSlides) * 100;
        const allViewed = carouselState.slideViewedFlags.every(viewed => viewed);
        
        console.log(`✅ Carousel completed - ${viewedSlides}/${carouselState.totalSlides} slides viewed`);
        
        window.GALite.track('carousel_complete', {
            carousel_id: 'feed_carousel_1',
            carousel_type: 'feed_carousel',
            slides_viewed: viewedSlides,
            total_slides: carouselState.totalSlides,
            completion_rate: Math.round(completionRate),
            total_dwell_ms: carouselState.totalDwellTime,
            all_viewed: allViewed,
            study_id: 'instagram_study'
        });
    }
    
    /**
     * Set up navigation listeners for feed carousel system
     */
    function setupNavigationListeners() {
        const carousel = document.querySelector('.feed-carousel');
        if (!carousel) return;
        
        const images = carousel.querySelectorAll('img');
        const dots = carousel.querySelectorAll('.carousel-dot');
        
        // Monitor for active class changes on images
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.tagName === 'IMG' && target.classList.contains('active')) {
                        const slideIndex = Array.from(images).indexOf(target);
                        if (slideIndex !== -1 && slideIndex !== carouselState.currentSlide) {
                            const direction = slideIndex > carouselState.currentSlide ? 'next' : 'prev';
                            handleSlideChange(slideIndex, direction);
                        }
                    }
                }
            });
        });
        
        // Observe all images for class changes
        images.forEach(img => {
            observer.observe(img, { attributes: true, attributeFilter: ['class'] });
        });
        
        // Also listen for dot clicks directly
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                setTimeout(() => {
                    if (index !== carouselState.currentSlide) {
                        handleSlideChange(index, 'jump');
                    }
                }, 50);
            });
        });
        
        // Listen for touch/swipe events on carousel
        let lastSlideIndex = 0;
        carousel.addEventListener('touchend', () => {
            setTimeout(() => {
                const activeImg = carousel.querySelector('img.active');
                if (activeImg) {
                    const currentSlideIndex = Array.from(images).indexOf(activeImg);
                    if (currentSlideIndex !== -1 && currentSlideIndex !== lastSlideIndex) {
                        const direction = currentSlideIndex > lastSlideIndex ? 'next' : 'prev';
                        if (currentSlideIndex !== carouselState.currentSlide) {
                            handleSlideChange(currentSlideIndex, direction);
                        }
                        lastSlideIndex = currentSlideIndex;
                    }
                }
            }, 50);
        });
    }
    
    /**
     * Handle page unload - track final dwell time and completion
     */
    function handlePageUnload() {
        if (carouselState.slideStartTime !== null) {
            const dwellMs = Date.now() - carouselState.slideStartTime;
            trackDwellEnd(carouselState.currentSlide, dwellMs);
        }
        
        // Track completion on unload
        trackCarouselComplete();
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarouselTracking);
    } else {
        initCarouselTracking();
    }
    
    // Track final dwell time and completion on page unload
    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('pagehide', handlePageUnload);
    
    // Handle visibility changes (tab switch, etc.)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            handlePageUnload();
        }
    });
    
    // Expose for debugging (optional)
    window.CarouselTracker = {
        getState: () => ({ ...carouselState }),
        MIN_DWELL_MS: MIN_DWELL_MS
    };
    
})();