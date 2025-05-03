// results.js
export function initResultsPage() {
    const elements = {
      genderResult: document.getElementById("gender-result"),
      confidenceScore: document.getElementById("confidence-score"),
      feedbackMessage: document.getElementById("feedback-message")
    };
  
    const rawResults = localStorage.getItem("analysisResults");
  
    if (!rawResults) {
      console.warn("No analysis results found in localStorage");
      if (elements.feedbackMessage) {
        elements.feedbackMessage.textContent = "⚠️ No results found. Please try analyzing an audio file again.";
      }
      return;
    }
  
    let results;
    try {
      results = JSON.parse(rawResults);
    } catch (e) {
      console.error("Failed to parse results JSON:", e);
      if (elements.feedbackMessage) {
        elements.feedbackMessage.textContent = "⚠️ Invalid result data. Please try again.";
      }
      return;
    }
  
    // Display results
    elements.genderResult.textContent = results.gender || "Unknown";
    elements.confidenceScore.textContent = `${(results.gender_confidence || 0).toFixed(2)}%`;
  
    // Optional: display age group
    const ageEl = document.getElementById("age-result");
    if (ageEl) {
      ageEl.textContent = results.age_group || "Unknown";
    }
  
    // You can add more UI updates here as needed
  }