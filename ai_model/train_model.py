import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# ==============================
# PATHS
# ==============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "ml_training_data.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

# ==============================
# LOAD DATA
# ==============================
print(f"📂 Loading data from: {CSV_PATH}")
df = pd.read_csv(CSV_PATH)
print(f"✅ Loaded {len(df)} training examples")
print(f"📊 Columns: {df.columns.tolist()}")

# ==============================
# FEATURE ENGINEERING
# ==============================
df["load_ratio"] = df["passengers"] / df["train_capacity"]
df["avg_speed"] = df["distance_km"] / df["travel_time_hr"]

def distance_type(d):
    if d < 150:
        return 0
    elif d < 400:
        return 1
    else:
        return 2

df["distance_type"] = df["distance_km"].apply(distance_type)

# ==============================
# FEATURES & TARGET
# ==============================
X = df[
    [
        "passengers",
        "distance_km",
        "travel_time_hr",
        "load_ratio",
        "avg_speed",
        "distance_type",
        "is_peak_hour"
    ]
]

y = df["delay_risk"]

print(f"\n📊 Feature shapes:")
print(f"   X: {X.shape}")
print(f"   y: {y.shape}")
print(f"\n📊 Target distribution:")
print(y.value_counts())

# ==============================
# TRAIN / TEST SPLIT
# ==============================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y  # Ensure balanced split
)

print(f"\n📊 Split sizes:")
print(f"   Train: {len(X_train)}")
print(f"   Test: {len(X_test)}")

# ==============================
# MODEL
# ==============================
print("\n🤖 Training Random Forest model...")
model = RandomForestClassifier(
    n_estimators=120,
    max_depth=10,
    random_state=42,
    n_jobs=-1,
    class_weight='balanced'  # Handle imbalanced classes
)

model.fit(X_train, y_train)
print("✅ Model training complete")

# ==============================
# EVALUATION
# ==============================
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\n" + "="*50)
print("📊 MODEL PERFORMANCE")
print("="*50)
print(f"\nAccuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
print(f"\n{classification_report(y_test, y_pred, target_names=['Low Risk', 'High Risk'])}")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\n📊 Feature Importance:")
print(feature_importance.to_string(index=False))

# ==============================
# SAVE MODEL
# ==============================
joblib.dump(model, MODEL_PATH)
print(f"\n✅ Model saved to: {MODEL_PATH}")
print("\n" + "="*50)
print("✅ TRAINING COMPLETE")
print("="*50)