import os
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Model paths for Gender Prediction
MODEL_PATHS = {
    "svm": os.path.join(os.getcwd(), "models1", "Gender Model", "gender_model_svm.pkl"),
    "lr": os.path.join(os.getcwd(), "models1", "Gender Model", "gender_model_lr.pkl")
}
SCALER_PATH_GENDER = os.path.join(os.getcwd(), "models1", "Gender Model", "scaler.pkl")
FEATURE_LIST_PATH = os.path.join(os.getcwd(), "models1", "Gender Model", "feature_list.pkl")

# Model paths for Age Prediction (Step 1: Child vs Non-Child)
MODEL_PATH_STEP1 = os.path.join(os.getcwd(), "models1", "Age_step_models", "model_step1.joblib")
SCALER_PATH_STEP1 = os.path.join(os.getcwd(), "models1", "Age_step_models", "scaler_step1.joblib")
LABEL_ENCODER_PATH_STEP1 = os.path.join(os.getcwd(), "models1", "Age_step_models", "label_encoder_step1.joblib")

# Model paths for Age Prediction (Step 2: Teen vs Adult)
MODEL_PATH_STEP2 = os.path.join(os.getcwd(), "models1", "Age_step_models", "model_step2.joblib")
SCALER_PATH_STEP2 = os.path.join(os.getcwd(), "models1", "Age_step_models", "scaler_step2.joblib")
LABEL_ENCODER_PATH_STEP2 = os.path.join(os.getcwd(), "models1", "Age_step_models", "label_encoder_step2.joblib")

def load_assets():
    try:
        logging.info("🟢 Loading models and assets...")
        
        # Load Gender Models
        logging.info(f"Loading gender models from: {MODEL_PATHS}")
        gender_models = {name: joblib.load(path) for name, path in MODEL_PATHS.items()}
        
        logging.info(f"Loading gender scaler from: {SCALER_PATH_GENDER}")
        scaler_gender = joblib.load(SCALER_PATH_GENDER)
        
        logging.info(f"Loading feature list from: {FEATURE_LIST_PATH}")
        feature_list = joblib.load(FEATURE_LIST_PATH)
        
        # Load Step 1: Child vs Non-Child
        logging.info(f"Loading Step 1 model from: {MODEL_PATH_STEP1}")
        model_step1 = joblib.load(MODEL_PATH_STEP1)
        
        logging.info(f"Loading Step 1 scaler from: {SCALER_PATH_STEP1}")
        scaler_step1 = joblib.load(SCALER_PATH_STEP1)
        
        logging.info(f"Loading Step 1 label encoder from: {LABEL_ENCODER_PATH_STEP1}")
        label_encoder_step1 = joblib.load(LABEL_ENCODER_PATH_STEP1)
        
        # Load Step 2: Teen vs Adult
        logging.info(f"Loading Step 2 model from: {MODEL_PATH_STEP2}")
        model_step2 = joblib.load(MODEL_PATH_STEP2)
        
        logging.info(f"Loading Step 2 scaler from: {SCALER_PATH_STEP2}")
        scaler_step2 = joblib.load(SCALER_PATH_STEP2)
        
        logging.info(f"Loading Step 2 label encoder from: {LABEL_ENCODER_PATH_STEP2}")
        label_encoder_step2 = joblib.load(LABEL_ENCODER_PATH_STEP2)
        
        logging.info("✅ Models and assets loaded successfully")
        return (
            gender_models, scaler_gender, feature_list,
            model_step1, scaler_step1, label_encoder_step1,
            model_step2, scaler_step2, label_encoder_step2
        )
    
    except FileNotFoundError as e:
        logging.error(f"❌ File not found: {str(e)}")
        raise
    
    except Exception as e:
        logging.error(f"❌ Error loading models: {str(e)}")
        raise