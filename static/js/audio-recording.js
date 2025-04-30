import { showElement, hideElement, showError } from "./utils.js";

if (!MediaRecorder.prototype.start && MediaRecorder.prototype.startRecording) {
  MediaRecorder.prototype.start = MediaRecorder.prototype.startRecording;
  MediaRecorder.prototype.stop = MediaRecorder.prototype.stopRecording;
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

  const setupWaveform = () => {
    const ctx = elements.waveformCanvas.getContext('2d');
    const width = elements.waveformCanvas.offsetWidth;
    const height = elements.waveformCanvas.offsetHeight;
     // Set actual canvas size
    elements.waveformCanvas.width = width;
    elements.waveformCanvas.height = height;
    
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
      const sliceWidth = elements.waveformCanvas.width / bufferLength;
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
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 
            'audio/webm; codecs=opus' : 
            'audio/mp4';
            audioStream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                  channelCount: 1,
                  sampleRate: 16000,
                  sampleSize: 16
              }
          });  
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyser);
      mediaRecorder = new MediaRecorder(audioStream, { mimeType });
       // Add error handling for Edge
       mediaRecorder.onerror = (e) => {
        showError(`Recording error: ${e.error.name}`);
        cleanupMedia();
    };
      const audioChunks = [];
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        elements.recordedAudio.src = audioUrl;
        elements.recordedAudio.controls = true;
        showElement(elements.recordedAudio);
        window.uploadedFile = audioBlob;
      };
      hideElement(elements.dropArea);
      elements.recordingSection.classList.add('active');
      hideElement(elements.recordBtn);
      setupWaveform();
      mediaRecorder.start();

      let seconds = 0;
      recordingInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        elements.recordTimer.textContent = `Recording: ${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        if (seconds >= MAX_RECORD_TIME) stopRecording();
      }, 1000);

    } catch (error) {
      // Improved error messages
      const errorMap = {
          'NotAllowedError': 'Microphone access denied. Please enable permissions.',
          'NotFoundError': 'No microphone found.',
          'NotReadableError': 'Microphone is already in use.'
      };
      showError(errorMap[error.name] || 'Recording failed. Please try again.');
  }
};

  const stopRecording = () => {
    if (mediaRecorder?.state === "recording") mediaRecorder.stop();
    cleanupMedia();
    clearInterval(recordingInterval);
    elements.recordingSection.classList.remove('active');
    showElement(elements.analyzeBtn);
    showElement(elements.recordedAudio);
  };

  const cancelRecording = () => {
    stopRecording();
    elements.recordedAudio.src = '';
    elements.recordedAudio.controls = false;
    hideElement(elements.recordedAudio);
    hideElement(elements.analyzeBtn);
    window.uploadedFile = null;
  };

  const cleanupMedia = () => {
    audioStream?.getTracks().forEach(track => track.stop());
    audioStream = null;
    cancelAnimationFrame(animationFrameId);
  };

  const resetUI = () => {
    hideElement(elements.recordingSection);
    showElement(elements.recordBtn);
    showElement(elements.dropArea);
    elements.recordTimer.textContent = '00:00';
    hideElement(elements.analyzeBtn);
  };

  elements.recordBtn?.addEventListener('click', startRecording);
  elements.stopBtn?.addEventListener('click', stopRecording);
  elements.cancelBtn?.addEventListener('click', cancelRecording);

  return {
    startRecording,
    stopRecording,
    cleanupMedia
  };
}
