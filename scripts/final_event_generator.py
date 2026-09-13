import csv
import os
from collections import defaultdict

INPUT_FILE = r"C:\Border\outputs\complete_surveillance_metadata.csv"
PERMIT_FILE = r"C:\Border\data\permit_database.csv"
OUTPUT_FILE = r"C:\Border\outputs\final_security_events.csv"


def normalize_vehicle_type(vehicle_type):
    if not vehicle_type:
        return ""

    vehicle_type = vehicle_type.lower().strip()

    # Keep this consistent with your permit database
    if vehicle_type in ["car", "automobile"]:
        return "car"

    if vehicle_type in ["truck", "lorry"]:
        return "truck"

    if vehicle_type in ["bus"]:
        return "bus"

    if vehicle_type in ["motorcycle", "bike"]:
        return "motorcycle"

    return vehicle_type


# ---------------------------------------------------------
# LOAD PERMIT DATABASE
# ---------------------------------------------------------

permits = {}

with open(PERMIT_FILE, "r", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        plate = row["plate_number"].strip().upper()

        permits[plate] = {
            "vehicle_type": normalize_vehicle_type(row["vehicle_type"]),
            "permit_status": row["permit_status"].strip().upper(),
            "owner_type": row["owner_type"].strip()
        }


# ---------------------------------------------------------
# LOAD METADATA
# ---------------------------------------------------------

vehicles = defaultdict(list)

with open(INPUT_FILE, "r", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:

        if row["object_type"].strip().lower() != "vehicle":
            continue

        vehicle_id = row["object_id"].strip()

        vehicles[vehicle_id].append(row)


# ---------------------------------------------------------
# GENERATE ONE EVENT PER VEHICLE
# ---------------------------------------------------------

events = []

event_id = 1

for vehicle_id, rows in vehicles.items():

    if not rows:
        continue

    # Sort by frame
    rows.sort(key=lambda x: int(x["frame"]))

    first_row = rows[0]
    last_row = rows[-1]

    vehicle_type = normalize_vehicle_type(
        first_row.get("vehicle_type", "")
    )

    # -----------------------------------------------------
    # Find all plate readings for this vehicle
    # -----------------------------------------------------

    plate_candidates = []

    best_confidence = 0.0
    best_plate = ""

    for row in rows:

        plate = row.get("plate_number", "").strip().upper()
        confidence_text = row.get("ocr_confidence", "").strip()

        if not plate:
            continue

        confidence = 0.0

        try:
            confidence = float(confidence_text)
        except:
            pass

        plate_candidates.append(plate)

        if confidence > best_confidence:
            best_confidence = confidence
            best_plate = plate

    # -----------------------------------------------------
    # If no OCR confidence was available, use most common
    # plate for this vehicle
    # -----------------------------------------------------

    if not best_plate and plate_candidates:

        counts = {}

        for plate in plate_candidates:
            counts[plate] = counts.get(plate, 0) + 1

        best_plate = max(counts, key=counts.get)

    # -----------------------------------------------------
    # Permit validation
    # -----------------------------------------------------

    registered_vehicle_type = ""
    permit_status = "NOT_FOUND"
    owner_type = "UNKNOWN"

    security_status = "ALERT"
    alert_reason = "PLATE_NOT_REGISTERED"

    if best_plate in permits:

        permit = permits[best_plate]

        registered_vehicle_type = permit["vehicle_type"]
        permit_status = permit["permit_status"]
        owner_type = permit["owner_type"]

        # Invalid permit
        if permit_status != "VALID":

            security_status = "ALERT"
            alert_reason = "INVALID_PERMIT"

        # Vehicle type mismatch
        elif vehicle_type != registered_vehicle_type:

            security_status = "ALERT"
            alert_reason = "VEHICLE_TYPE_MISMATCH"

        # Everything matches
        else:

            security_status = "ALLOWED"
            alert_reason = "VALID"

    # -----------------------------------------------------
    # Time
    # -----------------------------------------------------

    start_time = first_row["timestamp"]
    end_time = last_row["timestamp"]

    # -----------------------------------------------------
    # Save event
    # -----------------------------------------------------

    events.append({
        "event_id": event_id,
        "start_time": start_time,
        "end_time": end_time,
        "vehicle_id": vehicle_id,
        "vehicle_type": vehicle_type,
        "plate_number": best_plate,
        "ocr_confidence": round(best_confidence, 3),
        "registered_vehicle_type": registered_vehicle_type,
        "permit_status": permit_status,
        "owner_type": owner_type,
        "security_status": security_status,
        "alert_reason": alert_reason
    })

    event_id += 1


# ---------------------------------------------------------
# WRITE FINAL CSV
# ---------------------------------------------------------

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

fieldnames = [
    "event_id",
    "start_time",
    "end_time",
    "vehicle_id",
    "vehicle_type",
    "plate_number",
    "ocr_confidence",
    "registered_vehicle_type",
    "permit_status",
    "owner_type",
    "security_status",
    "alert_reason"
]

with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:

    writer = csv.DictWriter(
        f,
        fieldnames=fieldnames
    )

    writer.writeheader()
    writer.writerows(events)


print()
print("==========================================")
print(" FINAL SECURITY EVENTS GENERATED")
print("==========================================")
print()
print(f"Input metadata : {INPUT_FILE}")
print(f"Output events  : {OUTPUT_FILE}")
print(f"Vehicles found : {len(events)}")
print()

for event in events:

    print(
        f"Vehicle {event['vehicle_id']} | "
        f"{event['vehicle_type']} | "
        f"{event['plate_number']} | "
        f"{event['security_status']} | "
        f"{event['alert_reason']}"
    )

print()
print("Done.")

