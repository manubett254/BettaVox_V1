// Ensure DOM is fully loaded before setting up event listeners
document.addEventListener('DOMContentLoaded', () => {
    setupFileUpload();
});

export function setupFileUpload() {
    const elements = {
        fileInput: document.getElementById("file-input"),
        fileInfo: document.getElementById("file-info"),
        analyzeBtn: document.getElementById("analyze-btn"),
        dropArea: document.getElementById("drop-area"),
        uploadedAudio: document.getElementById("uploaded-audio"),
        recordingContainer: document.getElementById("recording-container")
    };

    // Helper functions to hide/show elements
    function showElement(el) {
        if (el) {
            el.classList.remove("hidden");
            el.style.display = "";
        }
    }

    function hideElement(el) {
        if (el) {
            el.classList.add("hidden");
            el.style.display = "none";
        }
    }

    // Handle file upload
    const handleFileUpload = (event) => {
        let file;

        // Check if it's a drag/drop or input change event
        if (event.dataTransfer) {
            file = event.dataTransfer.files[0];
        } else {
            file = event.target.files?.[0] || null;
        }

        if (!file) {
            console.warn("No file selected.");
            return;
        }

        const validTypes = ["audio/wav", "audio/mpeg", "audio/ogg", "audio/mp4"];
        if (!validTypes.includes(file.type)) {
            alert("Unsupported file type. Please use WAV, MP3, or OGG.");
            return;
        }

        // Store file globally if needed
        window.uploadedFile = file;

        // Set audio source
        elements.uploadedAudio.src = URL.createObjectURL(file);
        showElement(elements.uploadedAudio);

        // Hide recording section
        hideElement(elements.recordingContainer);

        // Show Analyze Button
        if (elements.analyzeBtn) {
            showElement(elements.analyzeBtn);
            console.log("Analyze button shown");
        } else {
            console.error("Analyze button not found in DOM");
        }

        // Update file info text
        if (elements.fileInfo) {
            elements.fileInfo.textContent = file.name;
        }
    };

    // Drag & Drop handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventType => {
        if (elements.dropArea) {
            elements.dropArea.addEventListener(eventType, (e) => {
                e.preventDefault();
                if (eventType === 'dragenter' || eventType === 'dragover') {
                    elements.dropArea.classList.add('dragover');
                } else {
                    elements.dropArea.classList.remove('dragover');
                }

                if (eventType === 'drop') {
                    handleFileUpload(e);
                }
            });
        }
    });

    // File input change handler
    if (elements.fileInput) {
        elements.fileInput.addEventListener('change', handleFileUpload);
    }

    // Browse button click handler
    const browseBtn = document.getElementById("browse-btn");
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            elements.fileInput?.click();
        });
    }
}