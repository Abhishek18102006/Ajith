import pandas as pd
import joblib

# Load model and schedule
model = joblib.load("model.pkl")
df = pd.read_csv("daily_schedule.csv")

def get_train_details(train_id):
    row = df[df["train_id"] == int(train_id)]
    if row.empty:
        raise ValueError("Train ID not found in schedule")
    return {
        "priority": int(row.iloc[0]["priority"]),
        "max_speed": int(row.iloc[0]["max_speed"]),
        "train_type": row.iloc[0]["train_type"]
    }

# ============================
# CONTROLLER INPUT
# ============================
train1 = input("Enter Train 1 ID: ")
train2 = input("Enter Train 2 ID: ")

cp1 = int(input("Checkpoint level for Train 1 (1–5): "))
cp2 = int(input("Checkpoint level for Train 2 (1–5): "))

t1 = get_train_details(train1)
t2 = get_train_details(train2)

features = [[
    t1["priority"],
    t2["priority"],
    cp1,
    cp2
]]

decision = model.predict(features)[0]

print("\n🚦 CONTROLLER DECISION")

if decision == 0:
    priority_train = train1
    reduced_train = train2
    reduced_speed = int(t2["max_speed"] * 0.6)
else:
    priority_train = train2
    reduced_train = train1
    reduced_speed = int(t1["max_speed"] * 0.6)

print(f"➡ Priority Train : {priority_train}")
print(f"⏸ Reduced Train  : {reduced_train}")
print(f"⚠ Suggested Speed Limit for {reduced_train}: {reduced_speed} km/h")
