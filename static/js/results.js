export function initResultsPage() {
  // Get all elements at once
  const elements = {
      genderResult: document.getElementById("gender-result"),
      ageResult: document.getElementById("age-result"),
      confidenceScore: document.getElementById("confidence-score"),
      feedbackMessage: document.getElementById("feedback-message"),
      resultsContainer: document.querySelector(".results-container"),
      errorContainer: document.querySelector(".error-container") // Add this to your HTML if missing
  };

  // Check for results immediately
  checkAndDisplayResults(elements);

  // Set up periodic check if needed (optional)
  const resultsCheckInterval = setInterval(() => {
      if (checkAndDisplayResults(elements)) {
          clearInterval(resultsCheckInterval);
      }
  }, 500);

  // Clean up on unmount if using SPA framework
  return () => clearInterval(resultsCheckInterval);
}

function checkAndDisplayResults(elements) {
  const rawResults = localStorage.getItem("analysisResults");

  if (!rawResults) {
      showError(elements, "No analysis results found. Please try analyzing an audio file again.");
      return false;
  }

  let results;
  try {
      results = JSON.parse(rawResults);
      
      // Validate required fields
      if (!results.gender || !results.gender_confidence) {
          throw new Error("Incomplete results data");
      }
  } catch (e) {
      console.error("Results processing error:", e);
      showError(elements, "Invalid or incomplete result data. Please try again.");
      return false;
  }

  // Display results
  displayResults(elements, results);
  return true;
}

// Update your submitFeedback and submitCorrection functions in results.js:

async function submitFeedback(isCorrect) {
  const results = JSON.parse(localStorage.getItem("analysisResults"));
  
  try {
      const response = await fetch('/feedback', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              id: results.id,
              is_correct: isCorrect ? 1 : 0
          })
      });

      if (!response.ok) {
          throw new Error('Feedback submission failed');
      }

      const feedbackMessage = document.getElementById("feedback-message");
      feedbackMessage.classList.remove("hidden");
      
      if (isCorrect) {
          feedbackMessage.querySelector('svg path').setAttribute('fill', '#4BB543');
          feedbackMessage.querySelector('h4').textContent = 'Thank You!';
          feedbackMessage.querySelector('p').textContent = 'Your feedback has been submitted successfully.';
      } else {
          feedbackMessage.querySelector('svg path').setAttribute('fill', '#ff4444');
          feedbackMessage.querySelector('h4').textContent = 'Correction Needed';
          feedbackMessage.querySelector('p').textContent = 'Please provide more details below.';
          document.getElementById("correction-form").classList.remove("hidden");
      }
      
      document.querySelector('.feedback-options').classList.add("hidden");
  } catch (error) {
      console.error('Error submitting feedback:', error);
      showError({ feedbackMessage: document.getElementById("feedback-message") }, "Failed to submit feedback. Please try again.");
  }
}

function displayResults(elements, results) {
  // Hide error container if visible
  if (elements.errorContainer) {
      elements.errorContainer.style.display = "none";
  }

  // Show results container
  if (elements.resultsContainer) {
      elements.resultsContainer.style.display = "block";
  }

  // Set results
  elements.genderResult.textContent = results.gender ? capitalizeFirstLetter(results.gender) : "Unknown";
  
  if (elements.ageResult) {
      elements.ageResult.textContent = results.age_group || "Unknown";
  }
  
  if (elements.confidenceScore) {
      elements.confidenceScore.textContent = `${(results.gender_confidence || 0).toFixed(2)}%`;
  }
}

function showError(elements, message) {
  // Hide results container if visible
  if (elements.resultsContainer) {
      elements.resultsContainer.style.display = "none";
  }

  // Show error container
  if (elements.errorContainer) {
      elements.errorContainer.style.display = "block";
  }

  // Set error message
  if (elements.feedbackMessage) {
      elements.feedbackMessage.textContent = `⚠️ ${message}`;
      elements.feedbackMessage.style.display = "block";
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function submitCorrection() {
  const results = JSON.parse(localStorage.getItem("analysisResults"));
  const correctGender = document.getElementById("correct-gender").value;
  const correctAge = document.getElementById("correct-age").value;
  const wrongGender = document.getElementById("wrong-gender").checked;
  const wrongAge = document.getElementById("wrong-age").checked;

  try {
      const response = await fetch('/feedback', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              id: results.id,
              is_correct: 0,
              corrected_gender: wrongGender ? correctGender : null,
              corrected_age_group: wrongAge ? correctAge : null
          })
      });

      if (!response.ok) {
          throw new Error('Correction submission failed');
      }

      const feedbackMessage = document.getElementById("feedback-message");
      feedbackMessage.querySelector('svg path').setAttribute('fill', '#4BB543');
      feedbackMessage.querySelector('h4').textContent = 'Correction Submitted';
      feedbackMessage.querySelector('p').textContent = 'Thank you for helping improve our model!';
      
      document.getElementById("correction-form").classList.add("hidden");
  } catch (error) {
      console.error('Error submitting correction:', error);
      showError({ feedbackMessage: document.getElementById("feedback-message") }, "Failed to submit correction. Please try again.");
  }
}