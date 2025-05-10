import { showElement, hideElement, showError } from "./utils.js";

// WAV file creation utilities
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function createWaveFileBuffer(leftChannel, sampleRate) {
    const length = leftChannel.length * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // Write audio samples
    const volume = 1;
    let index = 44;
    for (let i = 0; i < leftChannel.length; i++) {
        view.setInt16(index, leftChannel[i] * (0x7FFF * volume), true);
        index += 2;
    }

    return buffer;
}

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
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
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
            cleanupMedia();
            
            // Get audio stream with specific constraints
            audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false
                },
                video: false
            });
            
            // Setup audio context and analyzer
            audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });
            
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            
            const source = audioContext.createMediaStreamSource(audioStream);
            source.connect(analyser);
            
            // Setup media recorder
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 
                'audio/webm;codecs=opus' : 
                'audio/mp4';
            
            mediaRecorder = new MediaRecorder(audioStream, { 
                mimeType,
                audioBitsPerSecond: 128000
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = async () => {
                try {
                    // Create blob from chunks
                    const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                    
                    // Create playable version
                    const audioUrl = URL.createObjectURL(audioBlob);
                    elements.recordedAudio.src = audioUrl;
                    elements.recordedAudio.controls = true;
                    showElement(elements.recordedAudio);
                    showElement(elements.analyzeBtn);
                    
                    // Process for WAV conversion
                    try {
                        const arrayBuffer = await audioBlob.arrayBuffer();
                        const offlineContext = new OfflineAudioContext(1, audioContext.sampleRate * MAX_RECORD_TIME, audioContext.sampleRate);
                        const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
                        
                        const leftChannel = audioBuffer.getChannelData(0);
                        const wavBuffer = createWaveFileBuffer(leftChannel, audioBuffer.sampleRate);
                        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                        
                        window.uploadedFile = new File([wavBlob], "recording.wav", {
                            type: 'audio/wav',
                            lastModified: Date.now()
                        });
                        
                        console.log("WAV conversion successful");
                    } catch (convertError) {
                        console.error("WAV conversion failed, using original format:", convertError);
                        window.uploadedFile = new File([audioBlob], "recording.audio", {
                            type: mediaRecorder.mimeType,
                            lastModified: Date.now()
                        });
                    }
                    
                    // Setup audio playback verification
                    elements.recordedAudio.oncanplay = () => {
                        console.log("Audio ready for playback");
                        showElement(elements.analyzeBtn);
                    };
                    
                    elements.recordedAudio.onerror = () => {
                        console.error("Audio playback failed");
                        showError("Recording playback failed. Please try again.");
                    };
                    
                } catch (error) {
                    console.error("Error in onstop handler:", error);
                    showError("Failed to process recording");
                    resetUI();
                } finally {
                    cleanupMedia();
                }
            };
            
            mediaRecorder.onerror = (event) => {
                console.error("MediaRecorder error:", event.error);
                showError("Recording error occurred. Please try again.");
                cleanupMedia();
                resetUI();
            };
            
            // Update UI
            hideElement(elements.recordBtn);
            hideElement(elements.dropArea);
            showElement(elements.recordingSection);
            elements.recordingSection.classList.add('active');
            showElement(elements.stopBtn);
            showElement(elements.cancelBtn);
            hideElement(elements.analyzeBtn);
            
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
        clearInterval(recordingInterval);
        hideElement(elements.stopBtn);
        hideElement(elements.cancelBtn);
    };

    const cancelRecording = () => {
        stopRecording();
        elements.recordedAudio.src = '';
        hideElement(elements.recordedAudio);
        window.uploadedFile = null;
        resetUI();
    };

    const cleanupMedia = () => {
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().catch(e => console.warn("AudioContext close error:", e));
        }
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

    window.addEventListener('beforeunload', cleanupMedia);

    return {
        startRecording,
        stopRecording,
        cleanupMedia
    };
}