export function setupAnalysis() {
    const elements = {
        analyzeBtn: document.getElementById("analyze-btn"),
        processingSection: document.getElementById("processing-section"),
        processingStatus: document.getElementById("processing-status")
    };
    
    const analyzeAudio = async () => {
        // ... analysis logic ...
        if (!window.uploadedFile) {
            showError('No audio file selected!');
            return;
        }
    
        const model = document.getElementById("model-select").value;
    
        const formData = new FormData();
        formData.append("audio", window.uploadedFile, window.uploadedFile.name || "recorded-audio.wav");
        formData.append("model", model); // ⬅️ Include the selected model
        console.log("Selected model:", model);
        showElement(elements.processingSection);
        elements.processingStatus.textContent = "🎵 Extracting features...";
    
        try {
            const response = await fetch("/predict", {
                method: "POST",
                body: formData
            });
    
            if (!response.ok) throw new Error("Prediction failed");
    
            const results = await response.json();
            localStorage.setItem("analysisResults", JSON.stringify(results));
            window.location.href = "/results";
        } catch (error) {
            console.error(error);
            elements.processingStatus.textContent = "❌ Error processing audio";
            setTimeout(() => window.location.href = "/error", 2000);
        }
    };

    elements.analyzeBtn?.addEventListener('click', analyzeAudio);
}

if (!window.helpers) {
    console.error("Helpers not initialized!");
    // Optionally initialize defaults or show error
}