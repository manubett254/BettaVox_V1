document.addEventListener("DOMContentLoaded", function () {
    // Unified element references
    const elements = {
        fileInput: document.getElementById("file-input"),
        dropArea: document.getElementById("drop-area"),
        fileInfo: document.getElementById("file-info"),
        uploadedAudio: document.getElementById("uploaded-audio"),
        analyzeBtn: document.getElementById("analyze-btn"),
        recordBtn: document.getElementById("record-btn"),
        stopBtn: document.getElementById("stop-btn"),
        cancelBtn: document.getElementById("cancel-btn"),
        recordingContainer: document.getElementById("recording-container"),
        recordingSection: document.getElementById("recording-section"),
        recordTimer: document.getElementById("record-timer"),
        recordedAudio: document.getElementById("recorded-audio"),
        processingSection: document.getElementById("processing-section"),
        processingStatus: document.getElementById("processing-status"),
        waveformCanvas: document.getElementById("waveform"),
        
        // Results page elements
        genderResult: document.getElementById("gender-result"),
        confidenceScore: document.getElementById("confidence-score"),
        feedbackMessage: document.getElementById("feedback-message"),
    };
    
    // Audio variables
    let audioContext, analyser, mediaRecorder, audioStream;
    let animationFrameId, recordingInterval;
    let uploadedFile = null;
    const MAX_RECORD_TIME = 60; // 60 seconds

    // Waveform Visualization
    const setupWaveform = () => {
        const ctx = elements.waveformCanvas.getContext('2d');
        ctx.clearRect(0, 0, elements.waveformCanvas.width, elements.waveformCanvas.height);
        
        const draw = () => {
            if (!analyser) return;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);

            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, elements.waveformCanvas.width, elements.waveformCanvas.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#004d4d';
            ctx.beginPath();

            const sliceWidth = elements.waveformCanvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * elements.waveformCanvas.height / 2;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                x += sliceWidth;
            }

            ctx.lineTo(elements.waveformCanvas.width, elements.waveformCanvas.height / 2);
            ctx.stroke();
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();
    };

    // Recording Management
    const startRecording = async () => {
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(audioStream);
            source.connect(analyser);

            mediaRecorder = new MediaRecorder(audioStream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                console.log("Uploading file:", uploadedFile.name, uploadedFile.type);

                elements.recordedAudio.src = URL.createObjectURL(audioBlob);
                elements.recordedAudio.controls = true; // 👈 Enables the audio player controls
                elements.recordedAudio.style.display = 'block'; // 👈 Ensure it's visible
                uploadedFile = audioBlob;
                
                showElement(elements.recordedAudio);  // 👈 Just in case
                showElement(elements.analyzeBtn);     // Now this shows only after playback is available
            };

            // UI Updates
            hideElement(elements.dropArea);
            showElement(elements.recordingContainer);
            showElement(elements.recordingSection);
            hideElement(elements.recordBtn);
            setupWaveform();
            mediaRecorder.start();

            // Timer
            let seconds = 0;
                recordingInterval = setInterval(() => {
                    seconds++;
                    const minutes = Math.floor(seconds / 60);
                    elements.recordTimer.textContent = `Recording: ${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

                    if (seconds >= MAX_RECORD_TIME) stopRecording();
                }, 1000);


        } catch (error) {
            showError('Microphone access required for recording');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
        cleanupMedia();
        clearInterval(recordingInterval);
        resetUI();
    };

    const cancelRecording = () => {
        stopRecording();
        elements.recordedAudio.src = '';
        elements.recordedAudio.controls = false;
        hideElement(elements.recordedAudio);
        uploadedFile = null;
    };

    const cleanupMedia = () => {
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }
        cancelAnimationFrame(animationFrameId);
    };

    const resetUI = () => {
        hideElement(elements.recordingSection);
        showElement(elements.recordBtn);
        showElement(elements.dropArea);
        elements.recordTimer.textContent = '00:00';
    };

    // File Handling
    const handleFileUpload = (event) => {
        const file = event.target.files ? event.target.files[0] : event.dataTransfer.files[0];
        if (!file || !file.type.startsWith('audio/')) {
            showError('Please upload a valid audio file (WAV, MP3, OGG)');
            return;
        }
    
        uploadedFile = file;
        elements.uploadedAudio.src = URL.createObjectURL(file);
        showElement(elements.uploadedAudio);
        hideElement(elements.recordingContainer);
        showElement(elements.analyzeBtn);
    };
    

    // Analysis Submission
    const analyzeAudio = async () => {
        if (!uploadedFile) {
            showError('No audio file selected!');
            return;
        }
    
        const model = document.getElementById("model-select").value;
    
        const formData = new FormData();
        formData.append("audio", uploadedFile, uploadedFile.name);
        formData.append("model", model); // ⬅️ Include the selected model
        console.log("Selected model:", model);
        showElement(elements.processingSection);
        elements.processingStatus.textContent = "🎵 Extracting features...";
    
        try {
            const response = await fetch("/predict", {
                method: "POST",
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
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
    

    // Results Page Logic
    if (window.location.pathname === "/results") {
        const results = JSON.parse(localStorage.getItem("analysisResults")); // Replaced sessionStorage with localStorage
        
        if (!results) {
            alert("No results found. Please try again.");
            window.location.href = "/upload";
            return;
        }

        elements.genderResult.textContent = results.gender;
        elements.confidenceScore.textContent = `${results.confidence.toFixed(2)}%`;

    }

    // Helper Functions
    const showElement = (el) => el.classList.remove("hidden");
    const hideElement = (el) => el.classList.add("hidden");
    const showError = (msg) => alert(msg); // Replace with toast implementation

    // Event Listeners
    if (elements.fileInput) {
        elements.fileInput.addEventListener("change", handleFileUpload);
    } else {
        console.error("File input element not found!");
    }
    elements.recordBtn.addEventListener("click", startRecording);
    elements.stopBtn.addEventListener("click", stopRecording);
    elements.cancelBtn.addEventListener("click", cancelRecording);
    elements.analyzeBtn.addEventListener("click", analyzeAudio);
    
    // Drag & Drop Handlers
    ['dragenter', 'dragover'].forEach(event => {
        elements.dropArea.addEventListener(event, e => {
            e.preventDefault();
            elements.dropArea.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(event => {
        elements.dropArea.addEventListener(event, e => {
            e.preventDefault();
            elements.dropArea.classList.remove('dragover');
        });
    });

    elements.dropArea.addEventListener('drop', handleFileUpload);
    document.getElementById("browse-btn").addEventListener("click", () => elements.fileInput.click());
});
