import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib
import random

# Load schedule
df = pd.read_csv("daily_schedule.csv")

# Create synthetic training data
X = []
y = []

trains = df[["train_id", "priority"]].values

for _ in range(2000):
    t1, t2 = random.sample(list(trains), 2)

    cp1 = random.randint(1, 5)
    cp2 = random.randint(1, 5)

    X.append([t1[1], t2[1], cp1, cp2])

    # Decision logic (GROUND TRUTH)
    if t1[1] > t2[1]:
        y.append(0)
    elif t2[1] > t1[1]:
        y.append(1)
    else:
        # Same priority → checkpoint decides
        y.append(0 if cp1 > cp2 else 1)

# Train model
model = DecisionTreeClassifier(max_depth=5)
model.fit(X, y)

# Save model
joblib.dump(model, "model.pkl")

print("✅ Model trained and saved as model.pkl")
