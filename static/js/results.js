export function initResultsPage() {
    const elements = {
        genderResult: document.getElementById("gender-result"),
        confidenceScore: document.getElementById("confidence-score"),
        feedbackMessage: document.getElementById("feedback-message")
    };

    const results = JSON.parse(localStorage.getItem("analysisResults"));
    
    if (!results) {
        alert("No results found. Please try again.");
        window.location.href = "/upload";
        return;
    }

    elements.genderResult.textContent = results.gender;
    elements.confidenceScore.textContent = `${results.confidence.toFixed(2)}%`;
    
    // Feedback handling functions...
}
if (!window.helpers) {
    console.error("Helpers not initialized!");
    // Optionally initialize defaults or show error
}