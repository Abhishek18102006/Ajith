import sys
import json
import joblib
import numpy as np
import os

# ==============================
# PATHS
# ==============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

# ==============================
# LOAD MODEL
# ==============================
try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ Model loaded from {MODEL_PATH}", file=sys.stderr)
except Exception as e:
    print(f"❌ Failed to load model: {e}", file=sys.stderr)
    sys.exit(1)

def calculate_features(data):
    """
    Calculate derived features to match training model
    """
    passengers = float(data["passengers"])
    distance_km = float(data["distance_km"])
    travel_time_hr = float(data["travel_time_hr"])
    train_capacity = float(data["train_capacity"])
    is_peak_hour = float(data["is_peak_hour"])
    
    # Calculate derived features
    load_ratio = passengers / train_capacity if train_capacity > 0 else 0
    avg_speed = distance_km / travel_time_hr if travel_time_hr > 0 else 0
    
    # Distance type categorization
    if distance_km < 150:
        distance_type = 0.0
    elif distance_km < 400:
        distance_type = 1.0
    else:
        distance_type = 2.0
    
    # Return features as numpy array
    features = np.array([[
        passengers,
        distance_km,
        travel_time_hr,
        load_ratio,
        avg_speed,
        distance_type,
        is_peak_hour
    ]])
    
    print(f"📊 Features: {features[0].tolist()}", file=sys.stderr)
    return features

def calculate_priority_score(train_data):
    """
    Calculate comprehensive priority score based on:
    - Number of passengers
    - Distance already traveled
    - Remaining distance to travel
    """
    passengers = float(train_data.get("passengers", 0))
    distance_km = float(train_data.get("distance_km", 0))
    travel_time_hr = float(train_data.get("travel_time_hr", 1))
    train_capacity = float(train_data.get("train_capacity", 800))
    
    # Calculate metrics
    load_ratio = passengers / train_capacity if train_capacity > 0 else 0
    avg_speed = distance_km / travel_time_hr if travel_time_hr > 0 else 60
    
    # Priority scoring factors
    score = 0
    
    # 1. Passenger count (more passengers = higher priority)
    score += passengers * 0.1
    
    # 2. Load ratio (fuller trains get priority)
    score += load_ratio * 50
    
    # 3. Distance traveled (trains that have traveled further get priority)
    # Assuming they've already consumed resources and should complete journey
    if distance_km > 400:
        score += 30
    elif distance_km > 200:
        score += 20
    else:
        score += 10
    
    # 4. Remaining distance consideration
    # Trains with shorter remaining distance get slight boost to complete journey
    if distance_km < 150:
        score += 15
    
    return score

def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        print(f"📥 Input: {input_data[:100]}...", file=sys.stderr)
        
        data = json.loads(input_data)
        
        # Validate required fields
        required = [
            "priority_train",
            "affected_train",
            "passengers",
            "distance_km",
            "travel_time_hr",
            "train_capacity",
            "is_peak_hour"
        ]
        
        for field in required:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
        
        # Check if we need priority-based decision
        priority_train_level = data.get("priority_train_level", None)
        affected_train_level = data.get("affected_train_level", None)
        
        # If both trains have same priority, use advanced scoring
        if priority_train_level is not None and affected_train_level is not None:
            if priority_train_level == affected_train_level:
                print("⚖️ Same priority detected - using passenger/distance analysis", file=sys.stderr)
                
                # Get data for both trains
                priority_train_data = {
                    "passengers": float(data.get("priority_train_passengers", data["passengers"])),
                    "distance_km": float(data.get("priority_train_distance", data["distance_km"])),
                    "travel_time_hr": float(data.get("priority_train_travel_time", data["travel_time_hr"])),
                    "train_capacity": float(data.get("priority_train_capacity", data["train_capacity"]))
                }
                
                affected_train_data = {
                    "passengers": float(data.get("affected_train_passengers", data["passengers"])),
                    "distance_km": float(data.get("affected_train_distance", data["distance_km"])),
                    "travel_time_hr": float(data.get("affected_train_travel_time", data["travel_time_hr"])),
                    "train_capacity": float(data.get("affected_train_capacity", data["train_capacity"]))
                }
                
                # Calculate scores
                priority_score = calculate_priority_score(priority_train_data)
                affected_score = calculate_priority_score(affected_train_data)
                
                print(f"📊 Priority train score: {priority_score:.2f}", file=sys.stderr)
                print(f"📊 Affected train score: {affected_score:.2f}", file=sys.stderr)
                
                # Determine winner
                if priority_score > affected_score:
                    decision = "REDUCE_SPEED"
                    priority_train = data["priority_train"]
                    reduced_train = data["affected_train"]
                    suggested_speed = 60
                    confidence = min(95, 70 + abs(priority_score - affected_score) / 2)
                    reason = f"Equal priority - Priority train has higher operational score ({priority_score:.1f} vs {affected_score:.1f}) based on passengers ({priority_train_data['passengers']:.0f}) and distance ({priority_train_data['distance_km']:.0f}km)"
                else:
                    decision = "HOLD_TRAIN"
                    priority_train = data["affected_train"]
                    reduced_train = data["priority_train"]
                    suggested_speed = 60
                    confidence = min(95, 70 + abs(priority_score - affected_score) / 2)
                    reason = f"Equal priority - Affected train has higher operational score ({affected_score:.1f} vs {priority_score:.1f}) based on passengers ({affected_train_data['passengers']:.0f}) and distance ({affected_train_data['distance_km']:.0f}km)"
                
                # Build result
                result = {
                    "success": True,
                    "decision": decision,
                    "priority_train": priority_train,
                    "reduced_train": reduced_train,
                    "suggested_speed": suggested_speed,
                    "confidence": round(confidence, 2),
                    "reason": reason,
                    "prediction": 1 if decision == "HOLD_TRAIN" else 0,
                    "priority_analysis": {
                        "priority_train_score": round(priority_score, 2),
                        "affected_train_score": round(affected_score, 2),
                        "priority_train_passengers": priority_train_data["passengers"],
                        "affected_train_passengers": affected_train_data["passengers"],
                        "priority_train_distance": priority_train_data["distance_km"],
                        "affected_train_distance": affected_train_data["distance_km"]
                    }
                }
                
                # Output and return
                print(json.dumps(result))
                sys.stdout.flush()
                return
        
        # Otherwise, use ML model prediction
        # Calculate features
        features = calculate_features(data)
        
        # Make prediction
        prediction = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]
        confidence = float(max(probabilities))
        
        print(f"🎯 Prediction: {prediction}, Confidence: {confidence:.4f}", file=sys.stderr)
        
        # Build response based on prediction
        if prediction == 0:
            # Low delay risk - reduce speed of affected train
            decision = "REDUCE_SPEED"
            priority_train = data["priority_train"]
            reduced_train = data["affected_train"]
            suggested_speed = 60
            reason = "ML model predicts low delay risk - reduce speed to maintain safe separation"
        else:
            # High delay risk - hold the affected train
            decision = "HOLD_TRAIN"
            priority_train = data["priority_train"]
            reduced_train = data["affected_train"]
            suggested_speed = 0
            reason = "ML model predicts high delay risk - hold train to prevent conflict escalation"
        
        # Build final result
        result = {
            "success": True,
            "decision": decision,
            "priority_train": priority_train,
            "reduced_train": reduced_train,
            "suggested_speed": suggested_speed,
            "confidence": round(confidence * 100, 2),
            "reason": reason,
            "prediction": prediction,
            "probabilities": {
                "low_risk": round(float(probabilities[0]) * 100, 2),
                "high_risk": round(float(probabilities[1]) * 100, 2) if len(probabilities) > 1 else 0
            }
        }
        
        # CRITICAL: Output ONLY the JSON to stdout (no extra text)
        print(json.dumps(result))
        sys.stdout.flush()
        
    except json.JSONDecodeError as e:
        error_result = {
            "success": False,
            "error": f"Invalid JSON input: {str(e)}"
        }
        print(json.dumps(error_result))
        sys.stdout.flush()
        sys.exit(1)
        
    except ValueError as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.stdout.flush()
        sys.exit(1)
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Prediction failed: {str(e)}"
        }
        print(json.dumps(error_result))
        sys.stdout.flush()
        sys.exit(1)

if __name__ == "__main__":
    main()