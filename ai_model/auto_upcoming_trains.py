import pandas as pd

df = pd.read_csv("daily_schedule.csv")

def time_to_minutes(t):
    h, m = map(int, t.split(":"))
    return h * 60 + m

def handle_delay(delayed_train_id, delayed_train_cleared):
    delayed = df[df["train_id"] == int(delayed_train_id)].iloc[0]
    delayed_time = time_to_minutes(delayed["arrival_time"])
    delayed_priority = delayed["priority"]

    decisions = []

    for _, row in df.iterrows():
        if pd.isna(row["arrival_time"]):
            continue

        train_time = time_to_minutes(row["arrival_time"])

        if train_time > delayed_time:
            if not delayed_train_cleared:
                # HOLD IN LOOP
                if row["priority"] <= delayed_priority:
                    decisions.append({
                        "train_id": row["train_id"],
                        "decision": "LOOP_LINE",
                        "reason": "Waiting for delayed train to clear junction"
                    })
                else:
                    decisions.append({
                        "train_id": row["train_id"],
                        "decision": "MAIN_LINE",
                        "reason": "Higher priority than delayed train"
                    })
            else:
                # RELEASE TO MAIN LINE
                decisions.append({
                    "train_id": row["train_id"],
                    "decision": "MAIN_LINE",
                    "reason": "Delayed train cleared junction"
                })

    return decisions
