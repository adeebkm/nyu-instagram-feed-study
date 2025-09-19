# NYU Feed Carousel Study

Instagram feed-style carousel advertisement study for NYU Stern MBA program.

## Features

- **Instagram Feed UI**: Authentic Instagram feed interface
- **NYU Carousel Ad**: Interactive 4-slide carousel with NYU Stern MBA content
- **Google Analytics 4**: Comprehensive tracking with placeholder measurement ID
- **Detailed Analytics**: Tracks carousel interactions, dwell time, and user engagement
- **Return to Survey**: Button to navigate back to survey platform

## Analytics Tracked

### Carousel Events
- `carousel_start`: When user begins interacting with carousel
- `slide_view`: Each slide view with index and total slides
- `dwell_end`: Time spent on each slide (minimum 2 seconds)
- `carousel_complete`: Overall completion with viewed slides count

### CTA Events
- `cta_click`: Like, comment, share, save button clicks

### Parameters Included
- `carousel_id`: Unique identifier for the carousel
- `slide_index`: Current slide number (0-based)
- `dwell_ms`: Time spent on slide in milliseconds
- `carousel_type`: "feed_carousel"
- `participant_id`: PROLIFIC_ID for participant tracking
- `study_id`: "instagram_study"

## Setup

1. **Update Measurement ID**: Replace `G-XXXXXXXXXX` in `js/ga-lite.js` with your actual GA4 measurement ID
2. **Configure Custom Dimensions** in GA4:
   - `slide_index` (Event scope)
   - `dwell_ms` (Event scope)
   - `carousel_id` (Event scope)
   - `participant_id` (Event scope)
3. **Deploy** to your hosting platform

## Usage

### For Participants
1. Open the page in a web browser
2. Enter PROLIFIC_ID when prompted (or include as URL parameter: `?PROLIFIC_ID=123`)
3. Click "Tap to Start" to begin the study
4. Interact with the carousel by swiping or clicking dots
5. Use "Return to Survey" button when finished

### For Researchers
1. Monitor events in GA4 DebugView (real-time)
2. Analyze carousel engagement in GA4 Reports
3. Export data to CSV for detailed analysis
4. Use custom dimensions for advanced segmentation

## File Structure

```
nyu-feed-carousel-repo/
├── index.html              # Main feed carousel page
├── js/
│   ├── ga-lite.js          # GA4 initialization and PROLIFIC_ID handling
│   └── ga-carousel.js      # Carousel-specific tracking logic
├── assets/
│   └── images/
│       ├── nyupfp.png      # NYU profile picture
│       └── Exp-Images/     # Carousel slide images
│           ├── NYU1.png
│           ├── NYU2.png
│           ├── NYU3.png
│           └── NYU4.png
└── README.md
```

## Research Benefits

- **Engagement Measurement**: Track which slides users spend most time viewing
- **Interaction Analysis**: Monitor CTA clicks and user behavior
- **Completion Rates**: Measure how many users view all slides
- **Participant Tracking**: Individual analysis with PROLIFIC_ID integration
- **Dwell Time Analysis**: Understand attention patterns across carousel slides

## Technical Notes

- **Mobile Optimized**: Responsive design for mobile devices
- **Touch Gestures**: Swipe navigation for natural interaction
- **Session Independence**: No localStorage persistence for clean research sessions
- **Error Handling**: Graceful degradation if GA4 is blocked
- **Privacy Focused**: Minimal data collection, research-appropriate tracking
