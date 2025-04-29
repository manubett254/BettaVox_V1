export function setupRecording() {
    const elements = {
        recordBtn: document.getElementById("record-btn"),
        stopBtn: document.getElementById("stop-btn"),
        cancelBtn: document.getElementById("cancel-btn"),
        analyzeBtn: document.getElementById("analyze-btn"),
        recordingSection: document.getElementById("recording-section"),
        recordingContainer: document.getElementById("recording-container"),
        recordTimer: document.getElementById("record-timer"),
        waveformCanvas: document.getElementById("waveform"),
        recordedAudio: document.getElementById("recorded-audio"),
        dropArea: document.getElementById("drop-area")
    };

    let audioContext, analyser, mediaRecorder, audioStream;
    let animationFrameId, recordingInterval;
    let uploadedFile = null;
    const MAX_RECORD_TIME = 60;// 60 seconds

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

    const startRecording = async () => {
        // ... recording start logic ...
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
                console.log("Recorded audio Blob:", audioBlob); // Log the Blob
                const audioUrl = URL.createObjectURL(audioBlob);
                elements.recordedAudio.src = audioUrl; // Assign the Blob URL to the audio element
                elements.recordedAudio.controls = true; // Enable controls
                elements.recordedAudio.style.display = 'block'; // Make the element visible
                window.uploadedFile = audioBlob; // Assign the Blob to uploadedFile
                console.log("Uploaded file after recording:", uploadedFile); // Confirm assignment
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
        // ... recording stop logic ...
        if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
        cleanupMedia();
        clearInterval(recordingInterval);
        resetUI();
        showElement(elements.analyzeBtn); // Show the Analyze button
        showElement(elements.recordedAudio); // Ensure the recorded audio is visible
    };

    const cancelRecording = () => {
        stopRecording();
        elements.recordedAudio.src = '';
        elements.recordedAudio.controls = false;
        hideElement(elements.recordedAudio);
        window.uploadedFile = null;
    };


    const cleanupMedia = () => {
        // ... cleanup logic ...
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
        showElement(elements.analyzeBtn); // Ensure this line is executed
    };

    // Event listeners
    elements.recordBtn?.addEventListener('click', startRecording);
    elements.stopBtn?.addEventListener('click', stopRecording);
    elements.cancelBtn?.addEventListener('click', cancelRecording);

    return {
        startRecording,
        stopRecording,
        cleanupMedia
    };
}

if (!window.helpers) {
    console.error("Helpers not initialized!");
    // Optionally initialize defaults or show error
}