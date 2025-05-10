import librosa
import numpy as np
import os
import soundfile as sf

def extract_features(file_path):
    try:
        print(f"🟢 Processing file: {file_path}")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found at path: {file_path}")

        # Load audio using soundfile directly first
        try:
            y, sr = sf.read(file_path)
            if len(y.shape) > 1:
                y = np.mean(y, axis=1)  # Convert stereo to mono
        except Exception as sf_error:
            print(f"⚠️ SoundFile failed: {sf_error}. Falling back to librosa...")
            y, sr = librosa.load(file_path, sr=16000)

        if len(y) == 0:
            raise ValueError("Loaded audio is empty")

        # Trim or pad to exactly 5 seconds
        target_length = sr * 5
        if len(y) > target_length:
            start_sample = (len(y) - target_length) // 2
            y = y[start_sample:start_sample + target_length]
        elif len(y) < target_length:
            y = np.pad(y, (0, target_length - len(y)), mode='constant')

        print("✅ Audio loaded and standardized (5s, 16kHz)")

        # Extract features
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        spec_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        zcr = librosa.feature.zero_crossing_rate(y)
        rms = librosa.feature.rms(y=y)
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
        hnr = librosa.effects.harmonic(y)
        pitches, _ = librosa.piptrack(y=y, sr=sr)

        # Aggregate features (mean + std for each feature)
        features = {
            "mfcc": np.concatenate([np.mean(mfcc, axis=1), np.std(mfcc, axis=1)]),
            "chroma": np.concatenate([np.mean(chroma, axis=1), np.std(chroma, axis=1)]),
            "spectral_contrast": np.concatenate([np.mean(spec_contrast, axis=1), np.std(spec_contrast, axis=1)]),
            "zcr": [np.mean(zcr), np.std(zcr)],
            "rms": [np.mean(rms), np.std(rms)],
            "centroid": [np.mean(centroid), np.std(centroid)],
            "bandwidth": [np.mean(bandwidth), np.std(bandwidth)],
            "rolloff": [np.mean(rolloff), np.std(rolloff)],
            "hnr": [np.mean(hnr), np.std(hnr)],
            "pitch": [np.mean(pitches), np.std(pitches)]
        }

        # Flatten all feature arrays into a single list
        feature_vector = []
        for value in features.values():
            feature_vector.extend(value)

        print(f"✅ Features successfully extracted (Total: {len(feature_vector)} features)")
        return feature_vector

    except Exception as e:
        print(f"❌ Error extracting features from {file_path}: {e}")
        return None