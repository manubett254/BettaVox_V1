import os
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Model paths
MODEL_PATHS = {
    "svm": os.path.join(os.getcwd(), "models1", "Gender Model", "gender_model_svm.pkl"),
    "lr": os.path.join(os.getcwd(), "models1", "Gender Model", "gender_model_lr.pkl")
}
SCALER_PATH_GENDER = os.path.join(os.getcwd(), "models1", "Gender Model", "scaler.pkl")
FEATURE_LIST_PATH = os.path.join(os.getcwd(), "models1", "Gender Model", "feature_list.pkl")
AGE_MODEL_PATH = os.path.join(os.getcwd(), "models1", "Age model", "random_forest_age_model.pkl")
SCALER_PATH_AGE = os.path.join(os.getcwd(), "models1", "Age model", "scaler.pkl")
LABEL_ENCODER_PATH = os.path.join(os.getcwd(), "models1", "Age model", "label_encoder.pkl")

def load_assets():
    try:
        logging.info("🟢 Loading models and assets...")
        models = {name: joblib.load(path) for name, path in MODEL_PATHS.items()}
        scaler_gender = joblib.load(SCALER_PATH_GENDER)
        feature_list = joblib.load(FEATURE_LIST_PATH)
        age_model = joblib.load(AGE_MODEL_PATH)
        scaler_age = joblib.load(SCALER_PATH_AGE)
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        logging.info("✅ Models and assets loaded successfully")
        return models, scaler_gender, feature_list, age_model, scaler_age, label_encoder
    except Exception as e:
        logging.error(f"❌ Error loading models: {str(e)}")
        raise