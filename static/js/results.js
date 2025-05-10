export function initResultsPage() {
    document.getElementById('download-results').addEventListener('click', downloadResults);
document.getElementById('share-results').addEventListener('click', () => showShareModal());
  // Get all elements at once
  const elements = {
      genderResult: document.getElementById("gender-result"),
      ageResult: document.getElementById("age-result"),
      confidenceScore: document.getElementById("confidence-score"),
      feedbackMessage: document.getElementById("feedback-message"),
      resultsContainer: document.querySelector(".results-container"),
      errorContainer: document.querySelector(".error-container") // Add this to your HTML if missing
      shareButton: document.getElementById("share-results"),
      shareModal: document.getElementById("share-modal"),
      downloadButton: document.getElementById("download-results"),
      downloadLink: document.getElementById("download-link"),
      downloadModal: document.getElementById("download-modal"),

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

// Set up share functionality
  if (elements.shareButton) {
    elements.shareButton.addEventListener('click', () => showShareModal(elements));
  }

  // Set up download functionality
  if (elements.downloadButton) {
    elements.downloadButton.addEventListener('click', downloadResults);
  }
}

// Share Modal Functionality
function showShareModal(elements) {
  if (!elements.shareModal) {
    // Create modal if it doesn't exist
    const modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'share-modal hidden';
    modal.innerHTML = `
      <div class="share-modal-content glass-card">
        <div class="share-modal-header">
          <h3>Share Your Results</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="share-options">
          <button class="share-option" data-platform="whatsapp">
            <img src="/static/images/whatsapp-icon.png" alt="WhatsApp">
            WhatsApp
          </button>
          <button class="share-option" data-platform="facebook">
            <img src="/static/images/facebook-icon.png" alt="Facebook">
            Facebook
          </button>
          <button class="share-option" data-platform="twitter">
            <img src="/static/images/twitter-icon.png" alt="Twitter">
            Twitter
          </button>
          <button class="share-option" data-platform="linkedin">
            <img src="/static/images/linkedin-icon.png" alt="LinkedIn">
            LinkedIn
          </button>
          <button class="share-option" data-platform="copy">
            <img src="/static/images/copy-icon.png" alt="Copy Link">
            Copy Link
          </button>
        </div>
        <div class="share-link-container">
          <input type="text" id="share-link" readonly>
          <button id="copy-link-btn">Copy</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    elements.shareModal = modal;
  }

  // Set up modal events
  const closeBtn = elements.shareModal.querySelector('.close-modal');
  closeBtn.addEventListener('click', () => {
    elements.shareModal.classList.add('hidden');
  });

  // Set up share options
  const shareOptions = elements.shareModal.querySelectorAll('.share-option');
  shareOptions.forEach(option => {
    option.addEventListener('click', () => {
      shareResults(option.dataset.platform);
    });
  });

  // Set up copy link button
  const copyBtn = elements.shareModal.querySelector('#copy-link-btn');
  copyBtn.addEventListener('click', () => {
    const shareLink = elements.shareModal.querySelector('#share-link');
    shareLink.select();
    document.execCommand('copy');
    showToast('Link copied to clipboard!');
  });

  // Generate shareable link
  const results = JSON.parse(localStorage.getItem("analysisResults"));
  const shareLink = generateShareLink(results);
  elements.shareModal.querySelector('#share-link').value = shareLink;

  // Show modal
  elements.shareModal.classList.remove('hidden');
}

function generateShareLink(results) {
  // Generate a unique ID for these results if they don't have one
  if (!results.id) {
    results.id = 'res_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("analysisResults", JSON.stringify(results));
  }

  // Return URL with results ID
  return `${window.location.origin}/results/${results.id}`;
}

function shareResults(platform) {
  try {
    const results = JSON.parse(localStorage.getItem("analysisResults"));
    if (!results) {
      throw new Error("No results found");
    }

    const gender = results.gender ? capitalizeFirstLetter(results.gender) : "Unknown";
    const age = results.age_group || "Unknown";
    
    const shareLink = generateShareLink(results);
    let shareText = `Check out my voice analysis results from BettaVox!`;
    shareText += `\n\nGender: ${gender}`;
    shareText += `\nAge Group: ${age}`;
    shareText += `\n\nSee more at: ${shareLink}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}&quote=${encodeURIComponent(shareText)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(shareText)
          .then(() => showToast('Results copied to clipboard!'))
          .catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Results copied to clipboard!');
          });
        break;
    }
  } catch (error) {
    console.error('Error sharing results:', error);
    showToast('Failed to share results. Please try again.', true);
  }
}

async function downloadResults() {
  try {
    const results = JSON.parse(localStorage.getItem("analysisResults"));
    if (!results) {
      throw new Error("No results found");
    }

    // Create a PDF or image of the results
    const gender = results.gender ? capitalizeFirstLetter(results.gender) : "Unknown";
    const age = results.age_group || "Unknown";
    const confidence = results.gender_confidence ? `${results.gender_confidence}%` : "Unknown";
    
    // Create HTML content for the PDF
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #004d4d; }
            .result-item { margin-bottom: 15px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>BettaVox Voice Analysis Results</h1>
          <div class="result-item">
            <span class="label">Gender:</span> ${gender}
          </div>
          <div class="result-item">
            <span class="label">Age Group:</span> ${age}
          </div>
          <div class="result-item">
            <span class="label">Confidence:</span> ${confidence}
          </div>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </body>
      </html>
    `;

    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `BettaVox-Results-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

  } catch (error) {
    console.error('Error downloading results:', error);
    showToast('Failed to download results. Please try again.', true);
  }
}

function generateQRCode(text) {
  // Simple QR code generation (you might want to use a library like qrcode.js)
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  // This is a simplified representation - use a proper QR library
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  
  // Draw a simple pattern (replace with actual QR code)
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      if ((i === 0 || i === 6 || j === 0 || j === 6) || 
          (i > 1 && i < 5 && j > 1 && j < 5)) {
        ctx.fillRect(20 + i * 25, 20 + j * 25, 15, 15);
      }
    }
  }
  
  return canvas;
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }, 100);
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }, 100);
}

function generateShareLink(results) {
  if (!results.id) {
    results.id = 'res_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("analysisResults", JSON.stringify(results));
  }
  return `${window.location.origin}/results/${results.id}`;
}