import { showElement, hideElement, showError } from "./utils.js";

export function setupAnalysis() {
    const elements = {
        analyzeBtn: document.getElementById("analyze-btn"),
        processingSection: document.getElementById("processing-section"),
        processingStatus: document.getElementById("processing-status"),
        progressBar: document.querySelector(".progress")
    };
    
    const analyzeAudio = async () => {
        // ... analysis logic ...
        if (!window.uploadedFile) {
            showError('Please select or record an audio file first!');
            return;
        }

        // Immediately show processing UI
        showElement(elements.processingSection);
        elements.processingStatus.textContent = "Extracting audio features...";
        elements.progressBar.style.width = "30%";

        const model = document.getElementById("model-select").value;
    
        const formData = new FormData();
        formData.append("audio", window.uploadedFile, window.uploadedFile.name || "recorded-audio.wav");
        formData.append("model", model); // ⬅️ Include the selected model
        console.log("Selected model:", model);
        showElement(elements.processingSection);

        elements.processingStatus.textContent = "🎵 Extracting features...";
    
        try {
             // Simulate progress animation
             const progressInterval = setInterval(() => {
                const currentWidth = parseInt(elements.progressBar.style.width);
                if (currentWidth < 80) {
                    elements.progressBar.style.width = `${currentWidth + 5}%`;
                }
            }, 500);

            const response = await fetch("/predict", {
                method: "POST",
                body: formData
            });

            clearInterval(progressInterval);
            elements.progressBar.style.width = "100%";
            elements.processingStatus.textContent = "Finalizing results...";

    
            if (!response.ok) throw new Error(await response.text());
    
            const results = await response.json();
            localStorage.setItem("analysisResults", JSON.stringify(results));

              // Smooth transition to results
              elements.processingStatus.textContent = "Done! Redirecting...";
              setTimeout(() => {
                  window.location.href = "/results";
              }, 1000);

        }catch (error) {
            console.error("Analysis failed:", error);
            elements.processingStatus.textContent = "Error processing audio";
            elements.progressBar.style.backgroundColor = "#ff4444";
            
            // Show error but don't redirect immediately
            setTimeout(() => {
                hideElement(elements.processingSection);
                showError(error.message || "Analysis failed. Please try again.");
            }, 2000);
        }
    };

    
     elements.analyzeBtn.addEventListener('click', analyzeAudio);
     console.log("Analyze button event listener attached");
}

if (!window.helpers) {
    console.error("Helpers not initialized!");
    // Optionally initialize defaults or show error
}