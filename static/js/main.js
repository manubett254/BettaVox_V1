import { setupRecording } from './audio-recording.js';
import { setupFileUpload } from './file-upload.js';
import { setupAnalysis } from './analysis.js';
import { initResultsPage } from './results.js';
import { showElement, hideElement, showError, initToastSystem } from './utils.js';

// Initialize global application state
const initializeAppState = () => {
    window.appState = {
        uploadedFile: null,
        isProcessing: false,
        currentModel: 'svm', // Default model
        helpers: { showElement, hideElement, showError }
    };
};

document.addEventListener("DOMContentLoaded", function() {
    try {
        // Initialize core systems
        initializeAppState();
        initToastSystem();
        
        // Verify critical elements exist
        const verifyCriticalElements = () => {
            const requiredElements = {
                processingSection: document.getElementById("processing-section"),
                analyzeBtn: document.getElementById("analyze-btn")
            };
            
            if (window.location.pathname.includes('upload') && !requiredElements.analyzeBtn) {
                throw new Error("Critical upload page elements missing");
            }
            
            return requiredElements;
        };

        const elements = verifyCriticalElements();
        
        // Initialize page-specific modules
        const initializePageModules = () => {
            const path = window.location.pathname;
            
            if (path.includes('upload')) {
                setupRecording();
                setupFileUpload();
                setupAnalysis(); // Explicit initialization for upload page
                
                // Set initial UI state
                hideElement(elements.processingSection);
            } 
            else if (path.includes('results')) {
                initResultsPage();
            }
            
            // Add global event listeners
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden' && window.appState.isProcessing) {
                    showError("Processing interrupted - page visibility changed");
                }
            });
        };

        initializePageModules();

    } catch (error) {
        console.error("Application initialization failed:", error);
        showError("Application failed to load properly");
        
        // Fallback error handling
        setTimeout(() => {
            if (!window.location.pathname.includes('error')) {
                window.location.href = '/error';
            }
        }, 3000);
    }
});

// Global error handler
window.addEventListener('error', function(event) {
    console.error("Uncaught error:", event.error);
    showError("An unexpected error occurred");
    
    // Send error to server if available
    if (window.navigator.onLine) {
        fetch('/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: event.error.message,
                stack: event.error.stack,
                url: window.location.href
            })
        }).catch(e => console.error("Error logging failed:", e));
    }
});