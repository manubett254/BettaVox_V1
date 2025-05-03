export function setupFileUpload() {
    const elements = {
        fileInput: document.getElementById("file-input"),
        fileInfo: document.getElementById("file-info"),
        analyzeBtn: document.getElementById("analyze-btn"),
        dropArea: document.getElementById("drop-area"),
        uploadedAudio: document.getElementById("uploaded-audio"),
        recordingContainer: document.getElementById("recording-container")
    };

    // Helper functions
    const showElement = (el) => el?.classList?.remove("hidden");
    const hideElement = (el) => el?.classList?.add("hidden");

    const handleFileSelection = (file) => {
        if (!file) {
            console.warn("No file selected.");
            return;
        }

        const validTypes = ["audio/wav", "audio/mpeg", "audio/ogg", "audio/mp4"];
        if (!validTypes.includes(file.type)) {
            alert("Please upload WAV, MP3, or OGG files only");
            return;
        }

        console.log("File selected:", file.name);
        window.uploadedFile = file;
        elements.uploadedAudio.src = URL.createObjectURL(file);
        showElement(elements.uploadedAudio);
        hideElement(elements.recordingContainer);
        showElement(elements.analyzeBtn);
        elements.fileInfo.textContent = file.name;
    };

    // File input change handler
    elements.fileInput?.addEventListener('change', (e) => {
        handleFileSelection(e.target.files?.[0]);
    });

    // Drag and drop handlers
    if (elements.dropArea) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            elements.dropArea.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            elements.dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            elements.dropArea.addEventListener(eventName, unhighlight, false);
        });

        // Handle dropped files
        elements.dropArea.addEventListener('drop', handleDrop, false);
    }

    // Browse button
    document.getElementById("browse-btn")?.addEventListener('click', () => {
        elements.fileInput?.click();
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        elements.dropArea.classList.add('dragover');
    }

    function unhighlight() {
        elements.dropArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFileSelection(file);
    }
}