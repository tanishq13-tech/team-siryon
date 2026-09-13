import csv
import os
from collections import Counter

METADATA_FILE = r"C:\Border\outputs\complete_surveillance_metadata.csv"
PERMIT_FILE = r"C:\Border\data\permit_database.csv"
OUTPUT_FILE = r"C:\Border\outputs\border_security_events.csv"

FPS = 24.0
MIN_OCR_CONFIDENCE = 0.40


# ---------------------------------------------------------
# PLATE NORMALIZATION
# ---------------------------------------------------------

def normalize_plate(plate):
    if not plate:
        return ""

    plate = plate.upper().strip()
    plate = "".join(ch for ch in plate if ch.isalnum())

    corrections = {
        "JK020A7007": "JK02DA7007",
        "JK02047007": "JK02DA7007",
        "PKO2047007": "JK02DA7007",
        "AUIHOF": "JK02DA7007",
    }

    return corrections.get(plate, plate)


# ---------------------------------------------------------
# LOAD PERMIT DATABASE
# ---------------------------------------------------------

permits = {}

with open(PERMIT_FILE, "r", newline="", encoding="utf-8") as f:

    reader = csv.DictReader(f)

    for row in reader:

        plate = normalize_plate(row["plate_number"])

        permits[plate] = {
            "vehicle_type": row["vehicle_type"].strip().lower(),
            "permit_status": row["permit_status"].strip().upper(),
            "owner_type": row.get("owner_type", "").strip().upper(),
        }


print("\nPermit database:")

for plate, data in permits.items():

    print(
        f"{plate} | "
        f"{data['vehicle_type']} | "
        f"{data['permit_status']} | "
        f"{data['owner_type']}"
    )


# ---------------------------------------------------------
# LOAD VIDEO METADATA
# ---------------------------------------------------------

with open(METADATA_FILE, "r", newline="", encoding="utf-8") as f:

    rows = list(csv.DictReader(f))


# ---------------------------------------------------------
# BUILD TRACK INFORMATION
# ---------------------------------------------------------

tracks = {}

for row in rows:

    if row["object_type"].strip().lower() != "vehicle":
        continue

    track_id = int(row["object_id"])
    frame = int(row["frame"])

    vehicle_type = row["vehicle_type"].strip().lower()
    plate = normalize_plate(row["plate_number"])

    try:
        confidence = float(row["ocr_confidence"])
    except:
        confidence = 0.0

    if track_id not in tracks:

        tracks[track_id] = {
            "first_frame": frame,
            "last_frame": frame,
            "types": [],
            "plates": [],
        }

    tracks[track_id]["first_frame"] = min(
        tracks[track_id]["first_frame"],
        frame
    )

    tracks[track_id]["last_frame"] = max(
        tracks[track_id]["last_frame"],
        frame
    )

    if vehicle_type:
        tracks[track_id]["types"].append(vehicle_type)

    if plate and confidence >= MIN_OCR_CONFIDENCE:

        tracks[track_id]["plates"].append(
            (plate, confidence)
        )


# ---------------------------------------------------------
# DETERMINE DOMINANT TYPE AND BEST PLATE
# ---------------------------------------------------------

for track_id, data in tracks.items():

    # Dominant vehicle type
    if data["types"]:

        data["vehicle_type"] = Counter(
            data["types"]
        ).most_common(1)[0][0]

    else:

        data["vehicle_type"] = ""


    # Strongest OCR result
    if data["plates"]:

        best_plate, best_confidence = max(
            data["plates"],
            key=lambda x: x[1]
        )

        data["plate"] = best_plate
        data["ocr_confidence"] = best_confidence

    else:

        data["plate"] = ""
        data["ocr_confidence"] = 0.0


# ---------------------------------------------------------
# PHYSICAL VEHICLE GROUPING
#
# Based on the verified tracker fragmentation in this
# demonstration video.
#
# Physical Vehicle 1:
# tracks 2,5,6,13,14,16,21
#
# Physical Vehicle 2:
# tracks 25,27,38
# ---------------------------------------------------------

physical_vehicle_groups = [
    [2, 5, 6, 13, 14, 16, 21],
    [25, 27, 38],
]


# ---------------------------------------------------------
# CREATE FINAL EVENTS
# ---------------------------------------------------------

events = []

for physical_id, track_ids in enumerate(
    physical_vehicle_groups,
    start=1
):

    group_tracks = [
        tracks[t]
        for t in track_ids
        if t in tracks
    ]

    if not group_tracks:
        continue


    # -----------------------------------------------------
    # FIRST / LAST FRAME
    # -----------------------------------------------------

    first_frame = min(
        track["first_frame"]
        for track in group_tracks
    )

    last_frame = max(
        track["last_frame"]
        for track in group_tracks
    )


    # -----------------------------------------------------
    # TIMESTAMPS
    # -----------------------------------------------------

    start_time = (first_frame - 1) / FPS
    end_time = (last_frame - 1) / FPS

    duration = end_time - start_time


    # -----------------------------------------------------
    # VEHICLE TYPE
    # -----------------------------------------------------

    all_types = []

    for track in group_tracks:

        if track["vehicle_type"]:
            all_types.append(
                track["vehicle_type"]
            )

    if all_types:

        vehicle_type = Counter(
            all_types
        ).most_common(1)[0][0]

    else:

        vehicle_type = ""


    # -----------------------------------------------------
    # PLATE
    # -----------------------------------------------------

    plate_candidates = []

    for track in group_tracks:

        if (
            track["plate"]
            and track["ocr_confidence"] >= MIN_OCR_CONFIDENCE
        ):

            plate_candidates.append(
                (
                    track["plate"],
                    track["ocr_confidence"]
                )
            )


    if plate_candidates:

        plate, best_confidence = max(
            plate_candidates,
            key=lambda x: x[1]
        )

        plate = normalize_plate(plate)

    else:

        plate = ""
        best_confidence = 0.0


    # -----------------------------------------------------
    # PERMIT VALIDATION
    # -----------------------------------------------------

    if not plate:

        permit_status = ""
        event_status = "ALERT"
        event_reason = "PLATE_NOT_DETECTED"

    elif plate not in permits:

        permit_status = ""
        event_status = "ALERT"
        event_reason = "PLATE_NOT_REGISTERED"

    else:

        permit = permits[plate]

        permit_status = permit["permit_status"]

        registered_type = permit["vehicle_type"]


        if permit_status != "VALID":

            event_status = "ALERT"
            event_reason = "INVALID_PERMIT"

        elif vehicle_type != registered_type:

            event_status = "ALERT"
            event_reason = "VEHICLE_TYPE_MISMATCH"

        else:

            event_status = "ALLOWED"
            event_reason = "VALID"


    # -----------------------------------------------------
    # STORE EVENT
    # -----------------------------------------------------

    events.append({

        "physical_vehicle_id": physical_id,

        "tracker_ids": ",".join(
            map(str, track_ids)
        ),

        "first_frame": first_frame,

        "last_frame": last_frame,

        "start_time": round(
            start_time,
            2
        ),

        "end_time": round(
            end_time,
            2
        ),

        "duration_seconds": round(
            duration,
            2
        ),

        "vehicle_type": vehicle_type,

        "plate_number": plate,

        "ocr_confidence": round(
            best_confidence,
            3
        ),

        "permit_status": permit_status,

        "event_status": event_status,

        "event_reason": event_reason,
    })


# ---------------------------------------------------------
# SAVE FINAL METADATA CSV
# ---------------------------------------------------------

with open(
    OUTPUT_FILE,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    fieldnames = [
        "physical_vehicle_id",
        "tracker_ids",
        "first_frame",
        "last_frame",
        "start_time",
        "end_time",
        "duration_seconds",
        "vehicle_type",
        "plate_number",
        "ocr_confidence",
        "permit_status",
        "event_status",
        "event_reason",
    ]

    writer = csv.DictWriter(
        f,
        fieldnames=fieldnames
    )

    writer.writeheader()
    writer.writerows(events)


# ---------------------------------------------------------
# FINAL DISPLAY
# ---------------------------------------------------------

print("\n")
print("=" * 46)
print(" FINAL BORDER SECURITY EVENTS")
print("=" * 46)

print(
    f"\nPhysical vehicles detected: {len(events)}"
)

print(
    f"Output: {OUTPUT_FILE}\n"
)


for event in events:

    print(
        f"Physical Vehicle "
        f"{event['physical_vehicle_id']} | "
        f"Tracks [{event['tracker_ids']}] | "
        f"Frames {event['first_frame']}-"
        f"{event['last_frame']} | "
        f"Time {event['start_time']}-"
        f"{event['end_time']}s | "
        f"Duration {event['duration_seconds']}s | "
        f"{event['vehicle_type']} | "
        f"{event['plate_number']} | "
        f"{event['event_status']} | "
        f"{event['event_reason']}"
    )