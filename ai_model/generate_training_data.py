import pandas as pd
import random

NUM_ROWS = 200_000   # increase to 1_000_000 if your system allows

trains = [
    ("Chennai Express", "Chennai", "Bangalore"),
    ("Coimbatore Intercity", "Coimbatore", "Chennai"),
    ("Madurai Superfast", "Madurai", "Chennai"),
    ("Trichy Passenger", "Trichy", "Salem"),
    ("Kovai Express", "Coimbatore", "Bangalore"),
    ("Pandian Express", "Chennai", "Madurai"),
    ("Nilgiri Express", "Coimbatore", "Chennai"),
    ("Salem Fast Passenger", "Salem", "Erode"),
    ("Kanyakumari Express", "Kanyakumari", "Chennai"),
    ("Vellore MEMU", "Vellore", "Chennai")
]

rows = []

for i in range(NUM_ROWS):
    train_id = 100 + (i % 500)
    train_name, source, destination = random.choice(trains)

    distance_km = random.randint(50, 900)
    speed = random.uniform(40, 80)
    travel_time_hr = round(distance_km / speed, 2)

    train_capacity = random.choice([600, 700, 800, 900, 1000])
    passengers = random.randint(
        int(0.3 * train_capacity),
        int(1.05 * train_capacity)
    )

    is_peak_hour = random.choice([0, 1])
    load_ratio = passengers / train_capacity

    # ==============================
    # REALISTIC DELAY LOGIC + NOISE
    # ==============================
    if load_ratio > 0.9 and is_peak_hour == 1:
        delay_risk = 1 if random.random() > 0.1 else 0   # 90%
    elif load_ratio < 0.6:
        delay_risk = 0 if random.random() > 0.1 else 1   # rare delays
    else:
        delay_risk = random.choice([0, 1])               # uncertainty

    rows.append([
        train_id,
        train_name,
        source,
        destination,
        passengers,
        distance_km,
        travel_time_hr,
        train_capacity,
        is_peak_hour,
        delay_risk
    ])

df = pd.DataFrame(rows, columns=[
    "train_id",
    "train_name",
    "source",
    "destination",
    "passengers",
    "distance_km",
    "travel_time_hr",
    "train_capacity",
    "is_peak_hour",
    "delay_risk"
])

df.to_csv("ml_training_data.csv", index=False)

print(f"✅ Generated ml_training_data.csv with {len(df)} rows")
