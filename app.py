from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from extract import extract_features
import os
import json
import pandas as pd
import logging
import numpy as np
import sqlite3

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Import modules for models
from models import load_assets

app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg", "m4a"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('predictions.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            audio_file TEXT,
            predicted_gender TEXT,
            predicted_age_group TEXT,
            confidence_score REAL,
            gender_confidence REAL,
            age_confidence REAL,
            is_correct INTEGER,
            corrected_gender TEXT,
            corrected_age_group TEXT,
            user_feedback TEXT,
            features TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Add new columns if they don't exist
    cursor.execute("PRAGMA table_info(predictions)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'gender_confidence' not in columns:
        cursor.execute("ALTER TABLE predictions ADD COLUMN gender_confidence REAL")
    if 'age_confidence' not in columns:
        cursor.execute("ALTER TABLE predictions ADD COLUMN age_confidence REAL")
    conn.commit()
    conn.close()

def init_corrections_db():
    conn = sqlite3.connect('corrections.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS corrections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            audio_file TEXT,
            predicted_gender TEXT,
            predicted_age_group TEXT,
            confidence_score REAL,
            gender_confidence REAL,
            age_confidence REAL,
            corrected_gender TEXT,
            corrected_age_group TEXT,
            features TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Add new columns if they don't exist
    cursor.execute("PRAGMA table_info(corrections)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'gender_confidence' not in columns:
        cursor.execute("ALTER TABLE corrections ADD COLUMN gender_confidence REAL")
    if 'age_confidence' not in columns:
        cursor.execute("ALTER TABLE corrections ADD COLUMN age_confidence REAL")
    conn.commit()
    conn.close()

# Initialize both databases when the app starts
init_db()
init_corrections_db()

# Load models
(
    GENDER_MODELS, SCALER_GENDER, FEATURE_LIST,
    MODEL_STEP1, SCALER_STEP1, LABEL_ENCODER_STEP1,
    MODEL_STEP2, SCALER_STEP2, LABEL_ENCODER_STEP2
) = load_assets()

def allowed_file(filename):
    return filename.lower().endswith(tuple(ALLOWED_EXTENSIONS))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/results", methods=["GET"])
def results():
    return render_template("results.html")

@app.route("/upload", methods=["GET"])
def upload():
    return render_template("upload.html")

@app.route("/about", methods=["GET"])
def about():
    return render_template("about.html")

@app.route('/error')
def error():
    return render_template('error.html')

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)
@app.route("/predict", methods=["POST"])
def predict():
    file = request.files.get("audio")
    model_type = request.form.get("model", "svm")
    logging.info(f"📥 Received model: {model_type}")
    
    if model_type not in GENDER_MODELS:
        logging.error("Invalid model type provided")
        return jsonify({"error": "Invalid model type. Choose 'svm' or 'lr'"}), 400
    
    if not file or file.filename == "":
        logging.error("No valid file uploaded")
        return jsonify({"error": "No valid file uploaded"}), 400
    
    if allowed_file(file.filename):
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(file.filename))
        file.save(filepath)
        try:
            logging.info(f"🟢 Processing file: {filepath}")
            features = extract_features(filepath)
            features_df = pd.DataFrame([features], columns=FEATURE_LIST)
            
            # Predict Gender
            features_scaled_gender = SCALER_GENDER.transform(features_df)
            gender_prediction = GENDER_MODELS[model_type].predict(features_scaled_gender)[0]
            gender_label = "Female" if gender_prediction == 1 else "Male"
            gender_confidence = float(max(GENDER_MODELS[model_type].predict_proba(features_scaled_gender)[0])) * 100
            
            features_df["gender"] = gender_prediction
            
            # Predict Age
            features_scaled_step1 = SCALER_STEP1.transform(features_df)
            step1_pred_encoded = MODEL_STEP1.predict(features_scaled_step1)[0]
            step1_pred = LABEL_ENCODER_STEP1.inverse_transform([step1_pred_encoded])[0]
            
            if step1_pred == 'child':
                age_group = 'child'
                age_confidence = MODEL_STEP1.predict_proba(features_scaled_step1)[0].max() * 100
            else:
                features_scaled_step2 = SCALER_STEP2.transform(features_df)
                step2_pred_encoded = MODEL_STEP2.predict(features_scaled_step2)[0]
                age_group = LABEL_ENCODER_STEP2.inverse_transform([step2_pred_encoded])[0]
                age_confidence = MODEL_STEP2.predict_proba(features_scaled_step2)[0].max() * 100
            
            os.remove(filepath)
            
            # Save to database with both confidence scores
            features_serialized = json.dumps({f"feature_{i}": float(feature) for i, feature in enumerate(features)})
            conn = sqlite3.connect('predictions.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO predictions (
                    audio_file, predicted_gender, predicted_age_group, 
                    confidence_score, gender_confidence, age_confidence,
                    is_correct, features
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                file.filename, gender_label, age_group, 
                age_confidence, gender_confidence, age_confidence,
                -1, features_serialized
            ))
            prediction_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return jsonify({
                "id": prediction_id,
                "gender": gender_label,
                "gender_confidence": gender_confidence,
                "age_group": age_group,
                "age_confidence": age_confidence
            })
        
        except Exception as e:
            logging.error(f"❌ Error during prediction: {str(e)}")
            return jsonify({"error": f"An error occurred during analysis: {str(e)}"}), 500
    
    logging.error("Invalid file format uploaded")
    return jsonify({"error": "Invalid file format"}), 400

@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.json
    prediction_id = data.get("id")
    is_correct = data.get("is_correct", -1)
    corrected_gender = data.get("corrected_gender")
    corrected_age_group = data.get("corrected_age_group")
    user_feedback = data.get("user_feedback")
    
    if prediction_id is None or is_correct not in [0, 1]:
        return jsonify({"error": "Invalid feedback data - missing prediction ID"}), 400
    
    try:
        # Get original prediction with both confidence scores
        conn = sqlite3.connect('predictions.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT audio_file, predicted_gender, predicted_age_group, 
                   gender_confidence, age_confidence, features
            FROM predictions WHERE id = ?
        ''', (prediction_id,))
        prediction = cursor.fetchone()
        
        if not prediction:
            return jsonify({"error": "Prediction not found"}), 404
        
        # Update prediction
        cursor.execute('''
            UPDATE predictions SET 
                is_correct = ?, 
                corrected_gender = ?, 
                corrected_age_group = ?, 
                user_feedback = ?
            WHERE id = ?
        ''', (is_correct, corrected_gender, corrected_age_group, user_feedback, prediction_id))
        conn.commit()
        conn.close()
        
        # If incorrect, save to corrections with both confidence scores
        if is_correct == 0:
            audio_file, pred_gender, pred_age, gender_conf, age_conf, features = prediction
            conn = sqlite3.connect('corrections.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO corrections (
                    audio_file, predicted_gender, predicted_age_group,
                    confidence_score, gender_confidence, age_confidence,
                    corrected_gender, corrected_age_group, features
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                audio_file, pred_gender, pred_age,
                age_conf, gender_conf, age_conf,
                corrected_gender, corrected_age_group, features
            ))
            conn.commit()
            conn.close()
            logging.info(f"Correction saved for prediction ID: {prediction_id}")
        
        return jsonify({"message": "Feedback recorded successfully"})
    
    except Exception as e:
        logging.error(f"Error processing feedback: {str(e)}")
        return jsonify({"error": "Failed to process feedback"}), 500
    
# Error handlers
@app.errorhandler(404)
def page_not_found(error):
    logging.error(f"❌ 404 Error: {request.path} not found.")
    return jsonify({"error": "Page not found"}), 404

@app.errorhandler(500)
def internal_server_error(error):
    logging.error(f"❌ 500 Error: {str(error)}")
    return jsonify({"error": "Internal server error. Please try again later."}), 500

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)