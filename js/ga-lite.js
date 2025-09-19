/**
 * GA4 Lite - Shared GA initialization and tracking
 * Handles PROLIFIC_ID from query string or localStorage
 */

(function() {
    'use strict';
    
    // Configuration - Updated with actual measurement ID
    const GA_MEASUREMENT_ID = 'G-5FM9CX3QSD';
    const PROLIFIC_ID_KEY = 'prolific_id';
    
    // Global tracking state
    window.GALite = {
        isLoaded: false,
        userId: null,
        measurementId: GA_MEASUREMENT_ID
    };
    
    /**
     * Get PROLIFIC_ID from URL query string or prompt (no localStorage storage)
     */
    function getProlificId() {
        console.log('Getting PROLIFIC_ID...');
        
        // Check URL query string first
        const urlParams = new URLSearchParams(window.location.search);
        const prolificFromUrl = urlParams.get('PROLIFIC_ID');
        console.log('PROLIFIC_ID from URL:', prolificFromUrl);
        
        if (prolificFromUrl) {
            console.log('Using PROLIFIC_ID from URL:', prolificFromUrl);
            return prolificFromUrl;
        }
        
        // If no URL parameter, always prompt user for fresh session
        console.log('No PROLIFIC_ID in URL, prompting user...');
        const prolificFromPrompt = prompt('Please enter your Participant ID:');
        console.log('User entered PROLIFIC_ID:', prolificFromPrompt);
        
        if (prolificFromPrompt && prolificFromPrompt.trim()) {
            const trimmedId = prolificFromPrompt.trim();
            console.log('Using PROLIFIC_ID from prompt:', trimmedId);
            return trimmedId;
        }
        
        console.log('No PROLIFIC_ID provided, returning null');
        return null;
    }
    
    /**
     * Initialize GA4 with user_id
     */
    async function initializeGA() {
        return new Promise((resolve, reject) => {
            try {
                // Clear any existing PROLIFIC_ID from localStorage for fresh session
                localStorage.removeItem(PROLIFIC_ID_KEY);
                
                // Get PROLIFIC_ID
                window.GALite.userId = getProlificId();
                
                // Load gtag script
                const script = document.createElement('script');
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
                
                script.onload = () => {
                    // Initialize gtag
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    window.gtag = gtag;
                    
                    gtag('js', new Date());
                    
                    // Configure GA with user_id if available
                    const config = {
                        send_page_view: true,
                        debug_mode: false,
                        enhanced_measurement: {
                            scroll_events: false // Disable automatic scroll event tracking
                        }
                    };
                    
                    if (window.GALite.userId) {
                        config.user_id = window.GALite.userId;
                        gtag('set', 'user_properties', { participant_id: window.GALite.userId });
                    }
                    
                    gtag('config', GA_MEASUREMENT_ID, config);
                    
                    window.GALite.isLoaded = true;
                    resolve();
                };
                
                document.head.appendChild(script);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Track custom event with automatic user_id and participant_id inclusion
     */
    function track(eventName, parameters = {}) {
        if (!window.GALite.isLoaded || typeof window.gtag !== 'function') {
            return; // Fail silently if GA is blocked
        }
        
        try {
            const eventData = { ...parameters };
            
            // Always include user_id if available
            if (window.GALite.userId) {
                eventData.user_id = window.GALite.userId;
                // Add participant_id as duplicate for GA4 reporting
                eventData.participant_id = window.GALite.userId;
            }
            
            window.gtag('event', eventName, eventData);
        } catch (error) {
            // Fail silently - no console errors
        }
    }
    
    /**
     * Public API
     */
    window.GALite.track = track;
    window.GALite.init = initializeGA;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeGA().catch(() => {
                // Fail silently if GA initialization fails
            });
        });
    } else {
        initializeGA().catch(() => {
            // Fail silently if GA initialization fails
        });
    }
    
})();
