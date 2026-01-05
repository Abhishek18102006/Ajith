import pandas as pd
import joblib

# ==============================
# LOAD DATA & MODEL
# ==============================
df = pd.read_csv("daily_schedule.csv")
model = joblib.load("model.pkl")

# ==============================
# HELPER FUNCTIONS
# ==============================
def get_train(train_id):
    row = df[df["train_id"] == int(train_id)]
    if row.empty:
        print(f"\n❌ ERROR: Train ID {train_id} not found in schedule.\n")
        return None
    return row.iloc[0]

# ==============================
# SAME TRACK CONFLICT (AI MODEL)
# ==============================
def same_track_conflict():
    print("\n--- SAME TRACK CONFLICT ---")

    t1_id = input("Enter Train 1 ID: ")
    t2_id = input("Enter Train 2 ID: ")

    cp1 = int(input("Checkpoint level for Train 1 (1–5): "))
    cp2 = int(input("Checkpoint level for Train 2 (1–5): "))

    t1 = get_train(t1_id)
    t2 = get_train(t2_id)

    if t1 is None or t2 is None:
        return

    features = [[
        t1["priority"],
        t2["priority"],
        cp1,
        cp2
    ]]

    decision = model.predict(features)[0]

    if decision == 0:
        priority_train = t1
        reduced_train = t2
    else:
        priority_train = t2
        reduced_train = t1

    reduced_speed = int(reduced_train["max_speed"] * 0.6)

    print("\n🚦 CONTROLLER DECISION")
    print(f"➡ Priority Train : {priority_train['train_id']}")
    print(f"⏸ Reduced Train  : {reduced_train['train_id']}")
    print(
        f"⚠ Suggested Speed Limit for {reduced_train['train_id']}: "
        f"{reduced_speed} km/h"
    )

# ==============================
# DELAY CONFLICT (BLOCK-BASED)
# ==============================
def delay_conflict():
    print("\n--- DELAY CONFLICT (REALISTIC CONTROL FLOW) ---")

    delayed_train_id = input("Enter Delayed Train ID: ")
    delayed_train = get_train(delayed_train_id)
    if delayed_train is None:
        return

    def time_to_minutes(t):
        h, m = map(int, t.split(":"))
        return h * 60 + m

    delayed_arrival = time_to_minutes(delayed_train["arrival_time"])

    upcoming_trains = df[
        df["arrival_time"].notna()
        & (df["arrival_time"].apply(time_to_minutes) > delayed_arrival)
    ].sort_values("arrival_time")

    print("\n🚦 REAL-TIME CONTROLLER DECISIONS")

    delay_cleared = False  # delay state

    for _, row in upcoming_trains.iterrows():
        print(
            f"\n➡ Upcoming Train {row['train_id']} "
            f"(Arrival {row['arrival_time']})"
        )

        # Phase 1: delay still active
        if not delay_cleared:
            cleared = input(
                "Has delayed train cleared the junction? (yes/no): "
            ).lower()

            if cleared == "no":
                reduced_speed = int(row["max_speed"] * 0.6)
                print(
                    f"⏸ Train {row['train_id']} → LOOP LINE | "
                    f"Speed {reduced_speed} km/h"
                )
                continue
            else:
                delay_cleared = True  # move to phase 2

        # Phase 2: delay cleared
        main_free = input(
            "Is MAIN LINE free for this train? (yes/no): "
        ).lower()

        if main_free == "yes":
            print(f"➡ Train {row['train_id']} → MAIN LINE")
        else:
            reduced_speed = int(row["max_speed"] * 0.6)
            print(
                f"⏸ Train {row['train_id']} → LOOP LINE | "
                f"Speed {reduced_speed} km/h"
            )



# ==============================
# CONTROLLER MENU
# ==============================
def controller_menu():
    while True:
        print("\n=================================")
        print("  TRAIN TRAFFIC CONTROLLER SYSTEM")
        print("=================================")
        print("1️⃣ Same Track Conflict")
        print("2️⃣ Delay Conflict")
        print("3️⃣ Exit")

        choice = input("Select option (1/2/3): ")

        if choice == "1":
            same_track_conflict()
        elif choice == "2":
            delay_conflict()
        elif choice == "3":
            print("Exiting controller system.")
            break
        else:
            print("❌ Invalid option. Try again.")

# ==============================
# START SYSTEM
# ==============================
if __name__ == "__main__":
    controller_menu()
