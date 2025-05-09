import { setupRecording } from './audio-recording.js';
import { setupFileUpload } from './file-upload.js';
import { setupAnalysis } from './analysis.js';
import { initResultsPage } from './results.js';
import { initTheme } from './dark.js';
import { initAboutPage } from './about.js';

import { showElement, hideElement, showError, initToastSystem } from './utils.js';

// Global application state initialization
const initializeAppState = () => {
  window.appState = window.appState || {
    uploadedFile: null,
    isProcessing: false,
    currentModel: 'svm',
    helpers: { showElement, hideElement, showError }
  };
};

// Common features available on all pages
const initCommonFeatures = () => {
  initToastSystem();
  initializeAppState();
  initTheme(); // Initialize theme system

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && window.appState.isProcessing) {
      showError("Processing interrupted - page visibility changed");
    }
  });
};

// Page-specific initializers
const initUploadPage = () => {
  initializeAppState();
  initCommonFeatures();
  
  console.log("Initializing upload page features...");
  
  // Initialize modules
  setupFileUpload();
  setupRecording();
  setupAnalysis();  // This should come after the other two

  const processingSection = document.getElementById("processing-section");
  if (processingSection) {
    hideElement(processingSection);
  }
};

const initResults = () => {
  initResultsPage();
};

// Main application initializer
const initializeApplication = () => {
  try {
    initCommonFeatures();

    const path = window.location.pathname.replace(/\/$/, '');
    if (path.includes('/upload')) {
      initUploadPage();
    } else if (path.includes('/results')) {
      initResults();
    } else if (path.includes('/about')) {
      // Optional: About page logic here
    }

  } catch (error) {
    console.error("Application initialization failed:", error);
    showError("Application failed to load properly");

    setTimeout(() => {
      if (!window.location.pathname.includes('error')) {
        window.location.href = '/error';
      }
    }, 3000);
  }
};

// Global error handler
window.addEventListener('error', function (event) {
  console.error("Uncaught error:", event.error);
  showError("An unexpected error occurred");

  if (navigator.onLine) {
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



// Fire when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApplication);
