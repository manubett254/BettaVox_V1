import { showElement, hideElement, showError } from "./utils.js";

export function setupRecording() {
    const elements = {
        recordBtn: document.getElementById("record-btn"),
        stopBtn: document.getElementById("stop-btn"),
        cancelBtn: document.getElementById("cancel-btn"),
        analyzeBtn: document.getElementById("analyze-btn"),
        recordingSection: document.getElementById("recording-section"),
        recordTimer: document.getElementById("record-timer"),
        waveformCanvas: document.getElementById("waveform"),
        recordedAudio: document.getElementById("recorded-audio"),
        dropArea: document.getElementById("drop-area")
    };

    let audioContext, analyser, mediaRecorder, audioStream;
    let animationFrameId, recordingInterval;
    const MAX_RECORD_TIME = 60;
    let audioChunks = [];

    const setupWaveform = () => {
        const ctx = elements.waveformCanvas.getContext('2d');
        const width = elements.waveformCanvas.width;
        const height = elements.waveformCanvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const draw = () => {
            if (!analyser) return;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);
            
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, width, height);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#004d4d';
            ctx.beginPath();
            
            const sliceWidth = width / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * height / 2;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            ctx.lineTo(width, height / 2);
            ctx.stroke();
            
            animationFrameId = requestAnimationFrame(draw);
        };
        
        draw();
    };

    const startRecording = async () => {
        try {
            // Reset previous recording if any
            audioChunks = [];
            
            // Get audio stream
            audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    sampleSize: 16,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            
            // Setup audio context and analyzer
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            
            const source = audioContext.createMediaStreamSource(audioStream);
            source.connect(analyser);
            
            // Setup media recorder
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 
                'audio/webm' : 
                'audio/mp4';
            
            mediaRecorder = new MediaRecorder(audioStream, { mimeType });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                elements.recordedAudio.src = audioUrl;
                elements.recordedAudio.controls = true;
                showElement(elements.recordedAudio);
                
                // Store the recorded audio for upload
                window.uploadedFile = new File([audioBlob], "recording.webm", { type: mediaRecorder.mimeType });
            };
            
            mediaRecorder.onerror = (event) => {
                console.error("Recording error:", event.error);
                showError("Recording error occurred. Please try again.");
                cleanupMedia();
            };
            
            // Update UI
            hideElement(elements.recordBtn);
            hideElement(elements.dropArea);
            showElement(elements.recordingSection);
            elements.recordingSection.classList.add('active');
            
            // Start recording
            mediaRecorder.start(100); // Collect data every 100ms
            
            // Setup timer
            let seconds = 0;
            elements.recordTimer.textContent = "00:00";
            
            recordingInterval = setInterval(() => {
                seconds++;
                const minutes = Math.floor(seconds / 60);
                elements.recordTimer.textContent = 
                    `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
                
                if (seconds >= MAX_RECORD_TIME) {
                    stopRecording();
                }
            }, 1000);
            
            // Start waveform visualization
            setupWaveform();
            
        } catch (error) {
            console.error("Recording setup failed:", error);
            
            const errorMessages = {
                'NotAllowedError': 'Microphone access denied. Please allow microphone access.',
                'NotFoundError': 'No microphone found.',
                'NotReadableError': 'Microphone is already in use by another application.',
                'OverconstrainedError': 'Cannot satisfy audio constraints.'
            };
            
            showError(errorMessages[error.name] || 'Failed to access microphone. Please try again.');
            
            cleanupMedia();
            resetUI();
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
        
        cleanupMedia();
        clearInterval(recordingInterval);
        
        showElement(elements.analyzeBtn);
        showElement(elements.recordedAudio);
    };

    const cancelRecording = () => {
        stopRecording();
        
        // Reset audio element
        elements.recordedAudio.src = '';
        elements.recordedAudio.controls = false;
        hideElement(elements.recordedAudio);
        
        // Reset uploaded file
        window.uploadedFile = null;
        
        // Reset UI
        resetUI();
    };

    const cleanupMedia = () => {
        // Stop all media tracks
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }
        
        // Stop animation frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Disconnect audio nodes
        if (audioContext) {
            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
            audioContext = null;
        }
        
        analyser = null;
        mediaRecorder = null;
    };

    const resetUI = () => {
        hideElement(elements.recordingSection);
        elements.recordingSection.classList.remove('active');
        showElement(elements.recordBtn);
        showElement(elements.dropArea);
        elements.recordTimer.textContent = '00:00';
        hideElement(elements.analyzeBtn);
    };

    // Event listeners
    elements.recordBtn?.addEventListener('click', startRecording);
    elements.stopBtn?.addEventListener('click', stopRecording);
    elements.cancelBtn?.addEventListener('click', cancelRecording);

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanupMedia);

    return {
        startRecording,
        stopRecording,
        cleanupMedia
    };
}