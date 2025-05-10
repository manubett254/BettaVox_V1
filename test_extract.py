from extract import extract_features

if __name__ == "__main__":
    file_path = "children-saying-yay-praise-and-worship-jesus-299607.mp3"
    features = extract_features(file_path)
    if features:
        print("✅ Successfully extracted features!")
        print(f"Feature count: {len(features)}")
    else:
        print("❌ Failed to extract features.")