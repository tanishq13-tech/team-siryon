import csv
import os
from collections import Counter

# =========================================================
# FILES
# =========================================================

FRAME_METADATA = r"C:\Border\outputs\complete_surveillance_metadata.csv"

EVENT_METADATA = r"C:\Border\outputs\border_security_events.csv"

MASTER_OUTPUT = r"C:\Border\outputs\master_surveillance_metadata.csv"

SUMMARY_OUTPUT = r"C:\Border\outputs\physical_vehicle_summary.csv"


# =========================================================
# VIDEO INFORMATION
# =========================================================

VIDEO_FILENAME = "border_cctv.mp4"

VIDEO_WIDTH = 1920
VIDEO_HEIGHT = 1080
VIDEO_FPS = 24.0
VIDEO_TOTAL_FRAMES = 496
VIDEO_DURATION_SECONDS = 20.67


# =========================================================
# LOAD FRAME-LEVEL METADATA
# =========================================================

if not os.path.exists(FRAME_METADATA):
    print("ERROR: Frame metadata file not found:")
    print(FRAME_METADATA)
    exit()

with open(
    FRAME_METADATA,
    "r",
    newline="",
    encoding="utf-8"
) as f:

    frame_rows = list(csv.DictReader(f))


# =========================================================
# LOAD FINAL EVENT METADATA
# =========================================================

if not os.path.exists(EVENT_METADATA):
    print("ERROR: Event metadata file not found:")
    print(EVENT_METADATA)
    exit()

with open(
    EVENT_METADATA,
    "r",
    newline="",
    encoding="utf-8"
) as f:

    event_rows = list(csv.DictReader(f))


# =========================================================
# BUILD TRACK → PHYSICAL VEHICLE MAP
# =========================================================

track_to_physical = {}

for event in event_rows:

    physical_id = event["physical_vehicle_id"]

    tracker_ids = event["tracker_ids"].split(",")

    for tracker_id in tracker_ids:

        tracker_id = tracker_id.strip()

        if tracker_id:
            track_to_physical[tracker_id] = physical_id


# =========================================================
# CREATE MASTER FRAME-LEVEL METADATA
# =========================================================

master_rows = []

for row in frame_rows:

    object_type = row.get(
        "object_type",
        ""
    ).strip().lower()

    object_id = row.get(
        "object_id",
        ""
    ).strip()

    # -----------------------------------------------------
    # BASIC INFORMATION
    # -----------------------------------------------------

    master = {

        "video_filename": VIDEO_FILENAME,

        "video_width": VIDEO_WIDTH,

        "video_height": VIDEO_HEIGHT,

        "resolution":
            f"{VIDEO_WIDTH}x{VIDEO_HEIGHT}",

        "fps": VIDEO_FPS,

        "total_video_frames":
            VIDEO_TOTAL_FRAMES,

        "video_duration_seconds":
            VIDEO_DURATION_SECONDS,

        "frame":
            row.get("frame", ""),

        "timestamp_seconds":
            row.get("timestamp", ""),

        "object_type":
            object_type,

        "object_id":
            object_id,

        # -------------------------------------------------
        # PERSON INFORMATION
        # -------------------------------------------------

        "person_id": "",

        "person_authorization": "",

        "face_detected": "",

        # -------------------------------------------------
        # VEHICLE INFORMATION
        # -------------------------------------------------

        "vehicle_tracker_id": "",

        "physical_vehicle_id": "",

        "vehicle_type":
            row.get("vehicle_type", ""),

        "plate_number":
            row.get("plate_number", ""),

        "ocr_confidence":
            row.get("ocr_confidence", ""),

        # -------------------------------------------------
        # PERMIT / SECURITY INFORMATION
        # -------------------------------------------------

        "permit_status": "",

        "event_status": "",

        "event_reason": "",

        # -------------------------------------------------
        # AUTHORIZATION
        # -------------------------------------------------

        "authorization":
            row.get("authorization", ""),

    }


    # =====================================================
    # PERSON
    # =====================================================

    if object_type == "person":

        master["person_id"] = object_id

        master["person_authorization"] = (
            row.get("authorization", "")
        )

        master["face_detected"] = (
            row.get("face_detected", "")
        )


    # =====================================================
    # VEHICLE
    # =====================================================

    elif object_type == "vehicle":

        master["vehicle_tracker_id"] = object_id

        # Map tracker ID → physical vehicle
        master["physical_vehicle_id"] = (
            track_to_physical.get(
                object_id,
                ""
            )
        )


    master_rows.append(master)


# =========================================================
# CREATE LOOKUP FOR EVENT INFORMATION
# =========================================================

event_lookup = {}

for event in event_rows:

    physical_id = event[
        "physical_vehicle_id"
    ]

    event_lookup[physical_id] = event


# =========================================================
# ADD FINAL EVENT INFORMATION TO VEHICLE ROWS
# =========================================================

for row in master_rows:

    physical_id = row[
        "physical_vehicle_id"
    ]

    if physical_id and physical_id in event_lookup:

        event = event_lookup[
            physical_id
        ]

        row["permit_status"] = event[
            "permit_status"
        ]

        row["event_status"] = event[
            "event_status"
        ]

        row["event_reason"] = event[
            "event_reason"
        ]


# =========================================================
# WRITE MASTER METADATA
# =========================================================

fieldnames = [

    # Video
    "video_filename",
    "video_width",
    "video_height",
    "resolution",
    "fps",
    "total_video_frames",
    "video_duration_seconds",

    # Frame
    "frame",
    "timestamp_seconds",

    # Object
    "object_type",
    "object_id",

    # Person
    "person_id",
    "person_authorization",
    "face_detected",

    # Vehicle
    "vehicle_tracker_id",
    "physical_vehicle_id",
    "vehicle_type",
    "plate_number",
    "ocr_confidence",

    # Security
    "permit_status",
    "event_status",
    "event_reason",

    # General authorization
    "authorization",
]


with open(
    MASTER_OUTPUT,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=fieldnames
    )

    writer.writeheader()

    writer.writerows(master_rows)


# =========================================================
# CREATE PHYSICAL VEHICLE SUMMARY
# =========================================================

summary_rows = []

for event in event_rows:

    summary_rows.append({

        "physical_vehicle_id":
            event["physical_vehicle_id"],

        "tracker_ids":
            event["tracker_ids"],

        "first_frame":
            event["first_frame"],

        "last_frame":
            event["last_frame"],

        "start_time_seconds":
            event["start_time"],

        "end_time_seconds":
            event["end_time"],

        "duration_seconds":
            event["duration_seconds"],

        "vehicle_type":
            event["vehicle_type"],

        "plate_number":
            event["plate_number"],

        "best_ocr_confidence":
            event["ocr_confidence"],

        "permit_status":
            event["permit_status"],

        "event_status":
            event["event_status"],

        "event_reason":
            event["event_reason"],
    })


summary_fields = [

    "physical_vehicle_id",
    "tracker_ids",
    "first_frame",
    "last_frame",
    "start_time_seconds",
    "end_time_seconds",
    "duration_seconds",
    "vehicle_type",
    "plate_number",
    "best_ocr_confidence",
    "permit_status",
    "event_status",
    "event_reason",
]


with open(
    SUMMARY_OUTPUT,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=summary_fields
    )

    writer.writeheader()

    writer.writerows(summary_rows)


# =========================================================
# FINAL REPORT
# =========================================================

print()
print("=" * 60)
print(" MASTER SURVEILLANCE METADATA")
print("=" * 60)

print(
    f"\nTotal frame-level records: "
    f"{len(master_rows)}"
)

print(
    f"Physical vehicles: "
    f"{len(summary_rows)}"
)

print(
    f"\nMaster metadata:"
)

print(MASTER_OUTPUT)

print(
    f"\nPhysical vehicle summary:"
)

print(SUMMARY_OUTPUT)


# =========================================================
# OBJECT STATISTICS
# =========================================================

object_counts = Counter(
    row["object_type"]
    for row in master_rows
)


print()
print("OBJECT STATISTICS")
print("-" * 40)

for object_type, count in object_counts.items():

    print(
        f"{object_type}: {count} records"
    )


# =========================================================
# PERSON STATISTICS
# =========================================================

person_ids = sorted({

    row["person_id"]

    for row in master_rows

    if row["person_id"]
})


print()
print("PERSON TRACKING")
print("-" * 40)

print(
    f"Unique person IDs: "
    f"{len(person_ids)}"
)

if person_ids:

    print(
        "Person IDs: "
        + ", ".join(person_ids)
    )


# =========================================================
# VEHICLE TRACKING
# =========================================================

vehicle_ids = sorted({

    row["vehicle_tracker_id"]

    for row in master_rows

    if row["vehicle_tracker_id"]
})


print()
print("VEHICLE TRACKING")
print("-" * 40)

print(
    f"Unique tracker IDs: "
    f"{len(vehicle_ids)}"
)

if vehicle_ids:

    print(
        "Tracker IDs: "
        + ", ".join(vehicle_ids)
    )


# =========================================================
# PHYSICAL VEHICLES
# =========================================================

physical_ids = sorted({

    row["physical_vehicle_id"]

    for row in master_rows

    if row["physical_vehicle_id"]
})


print()
print("PHYSICAL VEHICLES")
print("-" * 40)

print(
    f"Physical vehicles: "
    f"{len(physical_ids)}"
)

if physical_ids:

    print(
        "Physical IDs: "
        + ", ".join(physical_ids)
    )


print()
print("=" * 60)
print("METADATA GENERATION COMPLETE")
print("=" * 60)