// analysis.js
import { showElement, hideElement, showError } from "./utils.js";

export function setupAnalysis() {
  const elements = {
    analyzeBtn: document.getElementById("analyze-btn"),
    processingSection: document.getElementById("processing-section"),
    processingStatus: document.getElementById("processing-status"),
    progressBar: document.querySelector(".progress"),
  };

  if (!elements.analyzeBtn) {
    console.error("Analyze button not found!");
    return;
  }

  let progressInterval = null;

  const startProcessingAnimation = () => {
    elements.progressBar.style.width = "0%";
    elements.processingStatus.textContent = "🎵 Extracting features...";
    showElement(elements.processingSection);

    // Simulate progress from 0% to 100%
    let width = 0;
    progressInterval = setInterval(() => {
      if (width >= 100) {
        clearInterval(progressInterval);
        return;
      }
      width += 2; // Adjust speed here (lower = slower)
      elements.progressBar.style.width = `${width}%`;
    }, 50); // Update every 50ms
  };

  const stopProcessingAnimation = (success = true) => {
    clearInterval(progressInterval);
    elements.progressBar.style.width = "100%";
    elements.processingStatus.textContent = success ? "✅ Analysis Complete!" : "❌ Error Processing";
  };

  const analyzeAudio = async () => {
    if (!window.uploadedFile) {
      showError('Please select or record an audio file first!');
      return;
    }

    const model = document.getElementById("model-select")?.value || "default-model";

    const formData = new FormData();
    formData.append("audio", window.uploadedFile, "recording.wav"); // Consistent filename
    formData.append("model", model);

    try {
      startProcessingAnimation();

      const response = await fetch("/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Prediction failed");

      const results = await response.json();

      // Store results synchronously before redirect
      localStorage.setItem("analysisResults", JSON.stringify(results));

      stopProcessingAnimation(true);

      // Short delay to ensure user sees completion
      setTimeout(() => {
        window.location.href = "/results";
      }, 800); // Reduced delay since data is ready

    } catch (error) {
      console.error("Analysis failed:", error);
      stopProcessingAnimation(false);

      // Show error message before redirecting
      elements.processingStatus.textContent = `❌ ${error.message}`;
      setTimeout(() => {
        window.location.href = "/upload"; // Better than /error – let user retry
      }, 2000);
    }
  };

  elements.analyzeBtn.addEventListener("click", analyzeAudio);
}