import cv2
import os
import json
import csv
import math
from dataclasses import dataclass, field
from collections import deque
import numpy as np

# ============================================================
# BORDER SURVEILLANCE - VISUAL RADAR TRACKING V7.7
# ============================================================
# Input:
#   C:\Border\radar_video.mp4
#
# Output:
#   C:\Border\outputs\radar_tracking_v7_7.mp4
#   C:\Border\outputs\radar_metadata_v7_7.json
#   C:\Border\outputs\radar_metadata_v7_7.csv
#   C:\Border\outputs\radar_track_history_v7_7.csv
#
# IMPORTANT:
# This video contains a visual radar display, not raw radar telemetry.
# The displayed km and m/s values are configurable ESTIMATED display
# values. They are not hardware-measured values.
# ============================================================

VERSION = "7.7"
RADAR_ID = "BFSR_01"
TARGET_ID_START = 1024

INPUT_VIDEO = r"C:\Border\radar_video.mp4"
OUTPUT_DIR = r"C:\Border\outputs"

OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, "radar_tracking_v7_7.mp4")
OUTPUT_JSON = os.path.join(OUTPUT_DIR, "radar_metadata_v7_7.json")
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "radar_metadata_v7_7.csv")
OUTPUT_HISTORY_CSV = os.path.join(OUTPUT_DIR, "radar_track_history_v7_7.csv")

# Radar geometry for the supplied 848x480 display.
RADAR_CENTER_X = 386
RADAR_CENTER_Y = 262
RADAR_RADIUS = 300

# ------------------------------------------------------------
# Display values
# ------------------------------------------------------------
# These make the requested result visible even though physical
# radar calibration is unavailable. Change these later when real
# calibration is available.
RANGE_KM_PER_PIXEL = 0.012
SPEED_MPS_PER_PIXEL_PER_SECOND = 0.045

DISPLAY_TARGET_TYPE = "PERSON"
DISPLAY_LOCATION = "BORDER RADAR SECTOR A"
DISPLAY_TIME_BASE = "00:00:00"

# ------------------------------------------------------------
# Detection
# ------------------------------------------------------------
LOWER_GREEN = np.array([30, 35, 65], dtype=np.uint8)
UPPER_GREEN = np.array([100, 255, 255], dtype=np.uint8)

MIN_BRIGHTNESS = 125
MIN_BLOB_AREA = 35
MAX_BLOB_AREA = 1800
MIN_CIRCULARITY = 0.28
MIN_FILL_RATIO = 0.20
MAX_ASPECT_RATIO = 3.2
MIN_BRIGHT_PIXELS = 4

# Do not reject detections merely because they touch the radar grid.
# Grid handling is deliberately soft.
GRID_RINGS = [45, 95, 145, 195, 245, 295]
GRID_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]
GRID_RING_TOLERANCE = 3
GRID_LINE_TOLERANCE = 2

# ------------------------------------------------------------
# Tracking
# ------------------------------------------------------------
MAX_MATCH_DISTANCE = 85.0
MAX_PREDICTED_MATCH_DISTANCE = 115.0
MAX_MISSED_FRAMES = 18
MIN_OBSERVATIONS_TO_CONFIRM = 3
MIN_OBSERVATIONS_TO_SAVE = 3

# History is kept for motion calculations and full export.
MAX_MOTION_HISTORY = 60

# ------------------------------------------------------------
# Threat logic
# ------------------------------------------------------------
# A confirmed target becomes a displayed threat when it is in the
# middle/inner defense area and has adequate tracking quality.
# A strong inner-zone contact is critical.
#
# This intentionally evaluates EVERY active track. There is no
# "pick only one threat" logic.
THREAT_RANGE_PIXELS = 210.0
CRITICAL_RANGE_PIXELS = 105.0
MIN_THREAT_CONFIDENCE = 0.45
MIN_THREAT_QUALITY = 0.42
THREAT_CONFIRMATION_COUNT = 2
THREAT_WINDOW = 4

# A threat remains visible for a few frames after a temporary
# missed detection.
THREAT_DISPLAY_PERSISTENCE_FRAMES = 30

# ------------------------------------------------------------
# Drawing
# ------------------------------------------------------------
DRAW_NORMAL_TARGET_IDS = True
DRAW_NORMAL_TRAJECTORIES = False
MAX_TRAJECTORY_POINTS = 20

FONT = cv2.FONT_HERSHEY_SIMPLEX


# ============================================================
# UTILITY
# ============================================================

def clamp(value, low, high):
    return max(low, min(high, value))


def distance(p1, p2):
    return math.hypot(float(p1[0]) - float(p2[0]),
                      float(p1[1]) - float(p2[1]))


def angle_difference(a, b):
    d = abs(float(a) - float(b))
    return min(d, 360.0 - d)


def calculate_range_and_angle(x, y):
    dx = float(x) - RADAR_CENTER_X
    dy = float(y) - RADAR_CENTER_Y
    r = math.hypot(dx, dy)
    angle = math.degrees(math.atan2(-dy, dx))
    if angle < 0:
        angle += 360.0
    return r, angle


def point_inside_radar(x, y):
    return distance((x, y), (RADAR_CENTER_X, RADAR_CENTER_Y)) <= RADAR_RADIUS


def defense_zone(r):
    if r <= CRITICAL_RANGE_PIXELS:
        return "INNER_CRITICAL_ZONE"
    if r <= THREAT_RANGE_PIXELS:
        return "MID_DEFENSE_LAYER"
    return "OUTER_MONITORING"


def severity_for_range(r):
    if r <= CRITICAL_RANGE_PIXELS:
        return "CRITICAL"
    if r <= THREAT_RANGE_PIXELS:
        return "THREAT"
    return "INFO"


def is_near_grid(x, y):
    r, angle = calculate_range_and_angle(x, y)

    for ring in GRID_RINGS:
        if abs(r - ring) <= GRID_RING_TOLERANCE:
            return True

    if r > 8:
        for a in GRID_ANGLES:
            if angle_difference(angle, a) <= GRID_LINE_TOLERANCE:
                return True

    return False


def safe_remove(path):
    if os.path.isfile(path):
        try:
            os.remove(path)
        except PermissionError:
            raise RuntimeError(
                f"Cannot overwrite {path}. Close the file/video and run again."
            )


def estimated_range_km(range_pixels):
    return max(0.01, float(range_pixels) * RANGE_KM_PER_PIXEL)


def estimated_speed_mps(speed_px_s):
    return max(0.0, float(speed_px_s) * SPEED_MPS_PER_PIXEL_PER_SECOND)


def timestamp_for_frame(frame_number, fps):
    seconds = frame_number / fps if fps > 0 else 0.0
    total = int(seconds)
    hh = total // 3600
    mm = (total % 3600) // 60
    ss = total % 60
    return f"{hh:02d}:{mm:02d}:{ss:02d}"


# ============================================================
# DETECTION
# ============================================================

def detect_radar_targets(frame):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    green = cv2.inRange(hsv, LOWER_GREEN, UPPER_GREEN)
    bright = cv2.inRange(gray, MIN_BRIGHTNESS, 255)
    mask = cv2.bitwise_and(green, bright)

    radar_mask = np.zeros(gray.shape, dtype=np.uint8)
    cv2.circle(
        radar_mask,
        (RADAR_CENTER_X, RADAR_CENTER_Y),
        RADAR_RADIUS,
        255,
        -1,
    )
    mask = cv2.bitwise_and(mask, radar_mask)

    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)

    contours, _ = cv2.findContours(
        mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    detections = []

    for contour in contours:
        area = float(cv2.contourArea(contour))
        if area < MIN_BLOB_AREA or area > MAX_BLOB_AREA:
            continue

        perimeter = float(cv2.arcLength(contour, True))
        if perimeter <= 0:
            continue

        circularity = (4.0 * math.pi * area) / (perimeter * perimeter)
        if circularity < MIN_CIRCULARITY:
            continue

        x, y, w, h = cv2.boundingRect(contour)
        if w <= 0 or h <= 0:
            continue

        aspect = max(w, h) / max(1, min(w, h))
        if aspect > MAX_ASPECT_RATIO:
            continue

        fill = area / float(w * h)
        if fill < MIN_FILL_RATIO:
            continue

        moments = cv2.moments(contour)
        if moments["m00"] == 0:
            continue

        cx = moments["m10"] / moments["m00"]
        cy = moments["m01"] / moments["m00"]

        if not point_inside_radar(cx, cy):
            continue

        contour_mask = np.zeros(gray.shape, dtype=np.uint8)
        cv2.drawContours(contour_mask, [contour], -1, 255, -1)
        pixels = gray[contour_mask > 0]

        if pixels.size == 0:
            continue

        avg_brightness = float(np.mean(pixels))
        bright_pixels = int(np.sum(pixels >= MIN_BRIGHTNESS))
        if bright_pixels < MIN_BRIGHT_PIXELS:
            continue

        r, angle = calculate_range_and_angle(cx, cy)

        # Soft grid penalty instead of discarding a valid contact.
        grid_penalty = 0.82 if is_near_grid(cx, cy) else 1.0

        circularity_score = clamp(circularity / 0.80, 0.0, 1.0)
        brightness_score = clamp(avg_brightness / 255.0, 0.0, 1.0)
        fill_score = clamp(fill / 0.65, 0.0, 1.0)

        confidence = (
            0.40 * circularity_score
            + 0.35 * brightness_score
            + 0.25 * fill_score
        ) * grid_penalty

        detections.append({
            "x": float(cx),
            "y": float(cy),
            "area": area,
            "width": int(w),
            "height": int(h),
            "circularity": float(circularity),
            "fill_ratio": float(fill),
            "aspect_ratio": float(aspect),
            "brightness": avg_brightness,
            "bright_pixels": bright_pixels,
            "range_pixels": float(r),
            "angle_degrees": float(angle),
            "defense_zone": defense_zone(r),
            "confidence": float(clamp(confidence, 0.0, 0.99)),
            "grid_overlap": bool(grid_penalty < 1.0),
        })

    # Suppress only very-near duplicates.
    detections.sort(key=lambda d: d["confidence"], reverse=True)
    filtered = []

    for det in detections:
        duplicate = False
        for kept in filtered:
            if distance((det["x"], det["y"]), (kept["x"], kept["y"])) < 12:
                duplicate = True
                break
        if not duplicate:
            filtered.append(det)

    return filtered


# ============================================================
# TRACK
# ============================================================

@dataclass
class RadarTrack:
    track_id: int
    first_frame: int
    last_frame: int
    start_time: float
    end_time: float

    positions: list = field(default_factory=list)
    frame_indices: list = field(default_factory=list)
    ranges: list = field(default_factory=list)
    angles: list = field(default_factory=list)
    confidences: list = field(default_factory=list)
    areas: list = field(default_factory=list)
    brightness_values: list = field(default_factory=list)
    zones: list = field(default_factory=list)

    missed_frames: int = 0
    active: bool = True
    confirmed: bool = False

    threat_history: deque = field(
        default_factory=lambda: deque(maxlen=THREAT_WINDOW)
    )
    threat_persistence: int = 0
    last_threat_frame: int = -999999
    ever_threat: bool = False
    ever_critical: bool = False
    threat_events: list = field(default_factory=list)

    def add_detection(self, det, frame_number, fps):
        self.last_frame = frame_number
        self.end_time = frame_number / fps if fps > 0 else self.end_time

        self.positions.append((det["x"], det["y"]))
        self.frame_indices.append(frame_number)
        self.ranges.append(det["range_pixels"])
        self.angles.append(det["angle_degrees"])
        self.confidences.append(det["confidence"])
        self.areas.append(det["area"])
        self.brightness_values.append(det["brightness"])
        self.zones.append(det["defense_zone"])

        self.missed_frames = 0

        if len(self.positions) >= MIN_OBSERVATIONS_TO_CONFIRM:
            self.confirmed = True

    def mark_missed(self):
        self.missed_frames += 1
        if self.missed_frames > MAX_MISSED_FRAMES:
            self.active = False

    def current_position(self):
        return self.positions[-1] if self.positions else (0.0, 0.0)

    def current_range(self):
        return self.ranges[-1] if self.ranges else 0.0

    def current_angle(self):
        return self.angles[-1] if self.angles else 0.0

    def current_confidence(self):
        if not self.confidences:
            return 0.0
        return float(self.confidences[-1])

    def average_confidence(self):
        if not self.confidences:
            return 0.0
        return float(np.mean(self.confidences[-10:]))

    def speed_px_s(self, fps):
        if len(self.positions) < 2:
            return 0.0

        # Use the recent trajectory only. This prevents one old
        # association error from producing an enormous speed.
        n = min(len(self.positions), 12)
        pts = self.positions[-n:]
        frames = self.frame_indices[-n:]

        total_dist = 0.0
        total_time = max(
            1.0 / max(fps, 1.0),
            (frames[-1] - frames[0]) / max(fps, 1.0),
        )

        for i in range(1, len(pts)):
            step = distance(pts[i - 1], pts[i])

            # Reject physically implausible single-frame jumps.
            max_step = 100.0 / max(fps, 1.0)
            if step <= max_step:
                total_dist += step

        return total_dist / total_time

    def radial_velocity_px_s(self, fps):
        if len(self.ranges) < 2:
            return 0.0

        n = min(len(self.ranges), 12)
        rs = self.ranges[-n:]
        fs = self.frame_indices[-n:]

        dt = max(
            1.0 / max(fps, 1.0),
            (fs[-1] - fs[0]) / max(fps, 1.0),
        )

        # Negative radial velocity = moving toward radar center.
        return (rs[-1] - rs[0]) / dt

    def direction_degrees(self):
        if len(self.positions) < 2:
            return self.current_angle()

        x1, y1 = self.positions[-2]
        x2, y2 = self.positions[-1]

        dx = x2 - x1
        dy = y2 - y1

        if abs(dx) + abs(dy) < 0.5:
            return self.current_angle()

        heading = math.degrees(math.atan2(-dy, dx))
        if heading < 0:
            heading += 360.0
        return heading

    def track_quality(self):
        if not self.positions:
            return 0.0

        lifespan = max(1, self.last_frame - self.first_frame + 1)
        continuity = self.observation_count / lifespan
        obs_score = clamp(self.observation_count / 15.0, 0.0, 1.0)
        conf = self.average_confidence()

        return float(
            clamp(
                0.45 * obs_score
                + 0.30 * continuity
                + 0.25 * conf,
                0.0,
                1.0,
            )
        )

    @property
    def observation_count(self):
        return len(self.positions)

    def update_threat_state(self, frame_number, fps):
        if not self.confirmed or not self.positions:
            self.threat_history.append(False)
            self.threat_persistence = max(0, self.threat_persistence - 1)
            return False, "INFO"

        r = self.current_range()
        conf = self.current_confidence()
        quality = self.track_quality()

        # Every track is evaluated independently.
        candidate = (
            r <= THREAT_RANGE_PIXELS
            and conf >= MIN_THREAT_CONFIDENCE
            and quality >= MIN_THREAT_QUALITY
        )

        self.threat_history.append(bool(candidate))

        recent_hits = sum(1 for x in self.threat_history if x)

        if candidate and recent_hits >= THREAT_CONFIRMATION_COUNT:
            self.threat_persistence = THREAT_DISPLAY_PERSISTENCE_FRAMES
            self.last_threat_frame = frame_number
            self.ever_threat = True

            severity = "CRITICAL" if r <= CRITICAL_RANGE_PIXELS else "THREAT"
            if severity == "CRITICAL":
                self.ever_critical = True

            event_key = (frame_number, severity)
            if not self.threat_events or self.threat_events[-1] != event_key:
                self.threat_events.append(event_key)

            return True, severity

        if self.threat_persistence > 0:
            self.threat_persistence -= 1
            severity = "CRITICAL" if r <= CRITICAL_RANGE_PIXELS else "THREAT"
            return True, severity

        return False, "INFO"

    def estimated_data(self, frame_number, fps, display_threat=False, severity="INFO"):
        x, y = self.current_position()
        r = self.current_range()
        angle = self.current_angle()
        speed = self.speed_px_s(fps)
        radial = self.radial_velocity_px_s(fps)

        if radial < -1.0:
            movement = "TOWARD_RADAR"
        elif radial > 1.0:
            movement = "AWAY_FROM_RADAR"
        else:
            movement = "STABLE"

        return {
            "Target_ID": f"T_{self.track_id}",
            "Target_Type": DISPLAY_TARGET_TYPE,
            "Track_Status": "TRACKING" if self.active else "ENDED",
            "Range": f"{estimated_range_km(r):.2f} km",
            "Azimuth": f"{angle:.1f}°",
            "Speed": f"{estimated_speed_mps(speed):.2f} m/s",
            "Direction": f"{self.direction_degrees():.1f}°",
            "Timestamp": timestamp_for_frame(frame_number, fps),
            "Radar_ID": RADAR_ID,
            "Location": DISPLAY_LOCATION,
            "Confidence": f"{self.current_confidence():.2f}",
            "Threat": "THREAT DETECTED" if display_threat else "NORMAL",
            "Severity": severity,
            "Defense_Zone": defense_zone(r),
            "Movement": movement,
            "Range_Pixels": round(r, 2),
            "Speed_Pixels_Per_Second": round(speed, 2),
            "Radial_Velocity_Pixels_Per_Second": round(radial, 2),
            "X_Pixels": round(x, 2),
            "Y_Pixels": round(y, 2),
            "Track_Quality": round(self.track_quality(), 3),
            "Observations": self.observation_count,
        }


# ============================================================
# TRACK ASSOCIATION
# ============================================================

def predicted_position(track, frame_number, fps):
    if len(track.positions) < 2:
        return track.current_position()

    p1 = track.positions[-2]
    p2 = track.positions[-1]
    f1 = track.frame_indices[-2]
    f2 = track.frame_indices[-1]

    frame_delta = max(1, f2 - f1)
    velocity_x = (p2[0] - p1[0]) / frame_delta
    velocity_y = (p2[1] - p1[1]) / frame_delta

    future = max(0, frame_number - f2)

    # Limit prediction to avoid runaway extrapolation.
    future = min(future, 6)

    return (
        p2[0] + velocity_x * future,
        p2[1] + velocity_y * future,
    )


def update_tracks(tracks, detections, frame_number, fps, next_id):
    active = [t for t in tracks if t.active]

    candidates = []

    for track in active:
        predicted = predicted_position(track, frame_number, fps)

        for di, det in enumerate(detections):
            d_now = distance(track.current_position(), (det["x"], det["y"]))
            d_pred = distance(predicted, (det["x"], det["y"]))

            d = min(d_now, d_pred)

            # Slightly favor predicted position for established tracks.
            if track.observation_count >= 3:
                score = 0.35 * d_now + 0.65 * d_pred
            else:
                score = d_now

            if score <= MAX_PREDICTED_MATCH_DISTANCE:
                candidates.append((score, track, di))

    candidates.sort(key=lambda x: x[0])

    used_tracks = set()
    used_detections = set()

    for score, track, di in candidates:
        if id(track) in used_tracks or di in used_detections:
            continue

        det = detections[di]

        # Hard jump protection for established tracks.
        if track.observation_count >= 3:
            last = track.current_position()
            step = distance(last, (det["x"], det["y"]))
            frame_gap = max(1, frame_number - track.last_frame)
            max_step = 100.0 / max(fps, 1.0) * frame_gap + 8.0

            if step > max_step:
                continue

        track.add_detection(det, frame_number, fps)
        used_tracks.add(id(track))
        used_detections.add(di)

    for track in active:
        if id(track) not in used_tracks:
            track.mark_missed()

    for di, det in enumerate(detections):
        if di in used_detections:
            continue

        track = RadarTrack(
            track_id=next_id,
            first_frame=frame_number,
            last_frame=frame_number,
            start_time=frame_number / fps if fps > 0 else 0.0,
            end_time=frame_number / fps if fps > 0 else 0.0,
        )
        track.add_detection(det, frame_number, fps)
        tracks.append(track)
        next_id += 1

    return tracks, next_id


# ============================================================
# VIDEO DISPLAY
# ============================================================

def draw_text_box(frame, text, origin, scale=0.5, thickness=1,
                  bg=True, padding=5):
    x, y = origin
    (tw, th), baseline = cv2.getTextSize(
        text, FONT, scale, thickness
    )

    if bg:
        cv2.rectangle(
            frame,
            (x - padding, y - th - baseline - padding),
            (x + tw + padding, y + baseline + padding),
            (0, 0, 0),
            -1,
        )

    cv2.putText(
        frame,
        text,
        (x, y),
        FONT,
        scale,
        (255, 255, 255),
        thickness,
        cv2.LINE_AA,
    )


def draw_threat_marker(frame, track, severity):
    x, y = track.current_position()
    x, y = int(x), int(y)

    # Large, obvious threat marker.
    radius = 15 if severity == "THREAT" else 20

    cv2.circle(frame, (x, y), radius, (0, 0, 255), 2)
    cv2.circle(frame, (x, y), 5, (0, 0, 255), -1)

    cv2.line(frame, (x - 25, y), (x + 25, y), (0, 0, 255), 1)
    cv2.line(frame, (x, y - 25), (x, y + 25), (0, 0, 255), 1)

    label = (
        f"T_{track.track_id} - "
        f"{'CRITICAL THREAT' if severity == 'CRITICAL' else 'THREAT'}"
    )

    draw_text_box(
        frame,
        label,
        (x + 18, max(25, y - 12)),
        scale=0.42,
        thickness=1,
        bg=True,
    )


def draw_threat_panel(frame, threat_rows, fps, frame_number):
    if not threat_rows:
        return

    h, w = frame.shape[:2]

    # Compact right-side panel.
    panel_width = min(365, max(300, w // 2))
    x1 = max(5, w - panel_width - 5)
    y1 = 5

    header_h = 35
    row_h = 58
    panel_h = header_h + row_h * len(threat_rows) + 10
    panel_h = min(panel_h, h - 10)

    overlay = frame.copy()
    cv2.rectangle(
        overlay,
        (x1, y1),
        (w - 5, y1 + panel_h),
        (0, 0, 0),
        -1,
    )
    frame[:] = cv2.addWeighted(overlay, 0.78, frame, 0.22, 0)

    critical_present = any(r["severity"] == "CRITICAL" for r in threat_rows)

    header = (
        "CRITICAL THREAT DETECTED"
        if critical_present
        else "THREAT DETECTED"
    )

    cv2.putText(
        frame,
        header,
        (x1 + 10, y1 + 24),
        FONT,
        0.58,
        (0, 0, 255),
        2,
        cv2.LINE_AA,
    )

    y = y1 + header_h

    for row in threat_rows:
        if y + 50 > h:
            break

        track = row["track"]
        severity = row["severity"]

        x, yy = track.current_position()
        r = track.current_range()
        az = track.current_angle()
        sp = estimated_speed_mps(track.speed_px_s(fps))
        direction = track.direction_degrees()
        conf = track.current_confidence()

        if severity == "CRITICAL":
            title = f"T_{track.track_id}  |  CRITICAL"
        else:
            title = f"T_{track.track_id}  |  THREAT"

        cv2.putText(
            frame,
            title,
            (x1 + 10, y + 18),
            FONT,
            0.48,
            (0, 0, 255),
            2,
            cv2.LINE_AA,
        )

        line1 = (
            f"Range {estimated_range_km(r):.2f} km   "
            f"Az {az:.1f} deg"
        )
        line2 = (
            f"Speed {sp:.2f} m/s   Dir {direction:.1f} deg   "
            f"Conf {conf:.2f}"
        )

        cv2.putText(
            frame, line1, (x1 + 10, y + 37),
            FONT, 0.36, (255, 255, 255), 1, cv2.LINE_AA
        )
        cv2.putText(
            frame, line2, (x1 + 10, y + 52),
            FONT, 0.33, (255, 255, 255), 1, cv2.LINE_AA
        )

        y += row_h


def draw_video(frame, tracks, frame_number, fps):
    output = frame.copy()

    # Keep normal video relatively clean.
    if DRAW_NORMAL_TARGET_IDS:
        for track in tracks:
            if not track.active or not track.confirmed:
                continue

            if track.ever_threat and track.threat_persistence > 0:
                continue

            x, y = map(int, track.current_position())
            cv2.circle(output, (x, y), 4, (0, 255, 255), 1)
            cv2.putText(
                output,
                f"T_{track.track_id}",
                (x + 7, y - 6),
                FONT,
                0.34,
                (0, 255, 255),
                1,
                cv2.LINE_AA,
            )

    threat_rows = []

    # Evaluate ALL active confirmed tracks.
    for track in tracks:
        if not track.active or not track.confirmed:
            continue

        is_threat, severity = track.update_threat_state(
            frame_number, fps
        )

        if is_threat:
            draw_threat_marker(output, track, severity)
            threat_rows.append({
                "track": track,
                "severity": severity,
            })

    # Draw only threat trajectories.
    for row in threat_rows:
        track = row["track"]
        pts = track.positions[-MAX_TRAJECTORY_POINTS:]
        if len(pts) >= 2:
            arr = np.array(pts, dtype=np.int32).reshape(-1, 1, 2)
            cv2.polylines(
                output, [arr], False, (0, 0, 255), 1
            )

    # Main threat banner.
    if threat_rows:
        critical = any(
            row["severity"] == "CRITICAL"
            for row in threat_rows
        )

        banner = (
            "CRITICAL THREAT DETECTED"
            if critical
            else "THREAT DETECTED"
        )

        (tw, th), base = cv2.getTextSize(
            banner, FONT, 0.75, 2
        )

        cv2.rectangle(
            output,
            (10, 8),
            (20 + tw, 22 + th + base),
            (0, 0, 0),
            -1,
        )

        cv2.putText(
            output,
            banner,
            (15, 18 + th),
            FONT,
            0.75,
            (0, 0, 255),
            2,
            cv2.LINE_AA,
        )

        # Show ALL threats in the result panel.
        draw_threat_panel(
            output,
            threat_rows,
            fps,
            frame_number,
        )

    return output, threat_rows


# ============================================================
# METADATA
# ============================================================

def track_summary(track, fps):
    x, y = track.current_position()
    r = track.current_range()
    az = track.current_angle()
    speed = track.speed_px_s(fps)

    return {
        "Target_ID": f"T_{track.track_id}",
        "Target_Type": DISPLAY_TARGET_TYPE,
        "Track_Status": "TRACKING" if track.active else "ENDED",
        "Final_Status": "ACTIVE" if track.active else "ENDED",
        "First_Frame": track.first_frame,
        "Last_Frame": track.last_frame,
        "Start_Time_Seconds": round(track.start_time, 3),
        "End_Time_Seconds": round(track.end_time, 3),
        "Duration_Seconds": round(
            max(0.0, track.end_time - track.start_time), 3
        ),
        "Observation_Count": track.observation_count,
        "Range": {
            "value": round(estimated_range_km(r), 3),
            "unit": "km",
            "raw_pixels": round(r, 3),
            "calibrated": False,
            "display_conversion": "estimated_visual_scale",
        },
        "Azimuth": {
            "value": round(az, 2),
            "unit": "degrees",
        },
        "Speed": {
            "value": round(estimated_speed_mps(speed), 3),
            "unit": "m/s",
            "raw_pixels_per_second": round(speed, 3),
            "calibrated": False,
            "display_conversion": "estimated_visual_scale",
        },
        "Direction": {
            "value": round(track.direction_degrees(), 2),
            "unit": "degrees",
        },
        "Timestamp": timestamp_for_frame(track.last_frame, fps),
        "Radar_ID": RADAR_ID,
        "Location": DISPLAY_LOCATION,
        "Confidence": round(track.current_confidence(), 3),
        "Defense_Zone": defense_zone(r),
        "Threat_Ever_Detected": bool(track.ever_threat),
        "Critical_Threat_Ever_Detected": bool(track.ever_critical),
        "Track_Quality": round(track.track_quality(), 3),
        "Position": {
            "x_pixels": round(x, 2),
            "y_pixels": round(y, 2),
        },
        "Movement": {
            "direction_degrees": round(track.direction_degrees(), 2),
            "speed_mps_estimated": round(
                estimated_speed_mps(speed), 3
            ),
            "radial_velocity_pixels_per_second": round(
                track.radial_velocity_px_s(fps), 3
            ),
        },
        "Threat_Events": [
            {
                "frame": int(f),
                "timestamp": timestamp_for_frame(f, fps),
                "severity": s,
            }
            for f, s in track.threat_events
        ],
    }


def save_csv(summaries):
    fields = [
        "Target_ID",
        "Target_Type",
        "Track_Status",
        "Final_Status",
        "First_Frame",
        "Last_Frame",
        "Start_Time_Seconds",
        "End_Time_Seconds",
        "Duration_Seconds",
        "Observation_Count",
        "Range_km",
        "Range_pixels",
        "Azimuth_degrees",
        "Speed_mps_estimated",
        "Speed_pixels_per_second",
        "Direction_degrees",
        "Timestamp",
        "Radar_ID",
        "Location",
        "Confidence",
        "Defense_Zone",
        "Threat_Ever_Detected",
        "Critical_Threat_Ever_Detected",
        "Track_Quality",
    ]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()

        for e in summaries:
            writer.writerow({
                "Target_ID": e["Target_ID"],
                "Target_Type": e["Target_Type"],
                "Track_Status": e["Track_Status"],
                "Final_Status": e["Final_Status"],
                "First_Frame": e["First_Frame"],
                "Last_Frame": e["Last_Frame"],
                "Start_Time_Seconds": e["Start_Time_Seconds"],
                "End_Time_Seconds": e["End_Time_Seconds"],
                "Duration_Seconds": e["Duration_Seconds"],
                "Observation_Count": e["Observation_Count"],
                "Range_km": e["Range"]["value"],
                "Range_pixels": e["Range"]["raw_pixels"],
                "Azimuth_degrees": e["Azimuth"]["value"],
                "Speed_mps_estimated": e["Speed"]["value"],
                "Speed_pixels_per_second": e["Speed"]["raw_pixels_per_second"],
                "Direction_degrees": e["Direction"]["value"],
                "Timestamp": e["Timestamp"],
                "Radar_ID": e["Radar_ID"],
                "Location": e["Location"],
                "Confidence": e["Confidence"],
                "Defense_Zone": e["Defense_Zone"],
                "Threat_Ever_Detected": e["Threat_Ever_Detected"],
                "Critical_Threat_Ever_Detected": e["Critical_Threat_Ever_Detected"],
                "Track_Quality": e["Track_Quality"],
            })


def save_history(tracks, fps):
    fields = [
        "Target_ID",
        "Frame",
        "Timestamp",
        "X_pixels",
        "Y_pixels",
        "Range_pixels",
        "Range_km_estimated",
        "Azimuth_degrees",
        "Speed_mps_estimated",
        "Direction_degrees",
        "Confidence",
        "Defense_Zone",
        "Target_Type",
        "Radar_ID",
    ]

    with open(OUTPUT_HISTORY_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()

        for track in tracks:
            for i in range(track.observation_count):
                x, y = track.positions[i]
                r = track.ranges[i]
                az = track.angles[i]

                if i == 0:
                    speed = 0.0
                    direction = az
                else:
                    p1 = track.positions[i - 1]
                    p2 = track.positions[i]
                    frame_gap = max(
                        1,
                        track.frame_indices[i]
                        - track.frame_indices[i - 1],
                    )
                    dt = frame_gap / max(fps, 1.0)
                    step = distance(p1, p2)
                    speed = step / max(dt, 1e-6)

                    dx = p2[0] - p1[0]
                    dy = p2[1] - p1[1]
                    direction = (
                        math.degrees(math.atan2(-dy, dx))
                        if abs(dx) + abs(dy) > 0.01
                        else az
                    )
                    if direction < 0:
                        direction += 360.0

                writer.writerow({
                    "Target_ID": f"T_{track.track_id}",
                    "Frame": track.frame_indices[i],
                    "Timestamp": timestamp_for_frame(
                        track.frame_indices[i], fps
                    ),
                    "X_pixels": round(x, 2),
                    "Y_pixels": round(y, 2),
                    "Range_pixels": round(r, 2),
                    "Range_km_estimated": round(
                        estimated_range_km(r), 3
                    ),
                    "Azimuth_degrees": round(az, 2),
                    "Speed_mps_estimated": round(
                        estimated_speed_mps(speed), 3
                    ),
                    "Direction_degrees": round(direction, 2),
                    "Confidence": round(
                        track.confidences[i], 3
                    ),
                    "Defense_Zone": track.zones[i],
                    "Target_Type": DISPLAY_TARGET_TYPE,
                    "Radar_ID": RADAR_ID,
                })


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 72)
    print(" BORDER SURVEILLANCE - VISUAL RADAR TRACKING V7.7")
    print("=" * 72)

    if not os.path.isfile(INPUT_VIDEO):
        print(f"ERROR: Input video not found:\n{INPUT_VIDEO}")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for path in [
        OUTPUT_VIDEO,
        OUTPUT_JSON,
        OUTPUT_CSV,
        OUTPUT_HISTORY_CSV,
    ]:
        safe_remove(path)

    cap = cv2.VideoCapture(INPUT_VIDEO)

    if not cap.isOpened():
        print("ERROR: Could not open radar video.")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = float(cap.get(cv2.CAP_PROP_FPS))
    reported_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if fps <= 0 or not math.isfinite(fps):
        fps = 24.0

    if width <= 0 or height <= 0:
        cap.release()
        print("ERROR: Invalid video dimensions.")
        return

    writer = cv2.VideoWriter(
        OUTPUT_VIDEO,
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )

    if not writer.isOpened():
        cap.release()
        print("ERROR: Could not create output video.")
        return

    tracks = []
    next_id = TARGET_ID_START
    frame_number = 0

    total_detections = 0
    frames_with_detections = 0
    max_active_tracks = 0
    max_simultaneous_threats = 0
    total_threat_frames = 0
    total_critical_frames = 0

    print(f"Input : {INPUT_VIDEO}")
    print(f"Size  : {width}x{height}")
    print(f"FPS   : {fps:.2f}")
    print(f"Frames: {reported_frames}")
    print()
    print("Processing...")

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        detections = detect_radar_targets(frame)
        total_detections += len(detections)

        if detections:
            frames_with_detections += 1

        tracks, next_id = update_tracks(
            tracks,
            detections,
            frame_number,
            fps,
            next_id,
        )

        active_count = sum(1 for t in tracks if t.active)
        max_active_tracks = max(max_active_tracks, active_count)

        annotated, threat_rows = draw_video(
            frame,
            tracks,
            frame_number,
            fps,
        )

        threat_count = len(threat_rows)
        max_simultaneous_threats = max(
            max_simultaneous_threats,
            threat_count,
        )

        if threat_count > 0:
            total_threat_frames += 1

        if any(
            row["severity"] == "CRITICAL"
            for row in threat_rows
        ):
            total_critical_frames += 1

        writer.write(annotated)

        frame_number += 1

        if frame_number % 10 == 0:
            print(
                f"Frame {frame_number:4d}/{reported_frames} | "
                f"Detections {len(detections):2d} | "
                f"Active {active_count:2d} | "
                f"Threats {threat_count:2d}"
            )

    cap.release()
    writer.release()

    # --------------------------------------------------------
    # Final summaries
    # --------------------------------------------------------
    saved_tracks = [
        t for t in tracks
        if t.observation_count >= MIN_OBSERVATIONS_TO_SAVE
    ]

    # Force final status after video ends.
    for track in saved_tracks:
        if track.active:
            track.active = False

    summaries = [
        track_summary(track, fps)
        for track in saved_tracks
    ]

    summaries.sort(key=lambda x: x["Target_ID"])

    threat_targets = [
        e for e in summaries
        if e["Threat_Ever_Detected"]
    ]

    critical_targets = [
        e for e in summaries
        if e["Critical_Threat_Ever_Detected"]
    ]

    root = {
        "radar_metadata_header": {
            "system": "Border Surveillance Radar Module",
            "module_version": VERSION,
            "radar_id": RADAR_ID,
            "source_video": INPUT_VIDEO,
            "coordinate_system": {
                "origin_pixel": [
                    RADAR_CENTER_X,
                    RADAR_CENTER_Y,
                ],
                "x_axis": "Positive Right",
                "y_axis": "Positive Down in image; inverted for polar angle",
                "angle_convention": "0 degrees = East/Right, counter-clockwise",
                "radius_max_pixels": RADAR_RADIUS,
            },
            "display_note": (
                "Target Type PERSON and physical km/m/s values are "
                "display values configured for demonstration. The "
                "supplied source is a visual radar display and does "
                "not contain raw hardware telemetry."
            ),
            "video": {
                "width": width,
                "height": height,
                "fps": fps,
                "reported_frames": reported_frames,
                "processed_frames": frame_number,
                "duration_seconds": round(
                    frame_number / max(fps, 1.0), 3
                ),
            },
            "threat_logic": {
                "all_active_confirmed_tracks_evaluated": True,
                "threat_range_pixels": THREAT_RANGE_PIXELS,
                "critical_range_pixels": CRITICAL_RANGE_PIXELS,
                "minimum_confidence": MIN_THREAT_CONFIDENCE,
                "minimum_track_quality": MIN_THREAT_QUALITY,
                "confirmation_count": THREAT_CONFIRMATION_COUNT,
                "confirmation_window": THREAT_WINDOW,
                "display_persistence_frames": THREAT_DISPLAY_PERSISTENCE_FRAMES,
            },
            "processing_summary": {
                "frames_processed": frame_number,
                "frames_with_detections": frames_with_detections,
                "raw_detections": total_detections,
                "tracks_saved": len(saved_tracks),
                "threat_targets": len(threat_targets),
                "critical_targets": len(critical_targets),
                "maximum_simultaneous_active_tracks": max_active_tracks,
                "maximum_simultaneous_threats": max_simultaneous_threats,
                "frames_with_threat": total_threat_frames,
                "frames_with_critical_threat": total_critical_frames,
            },
            "outputs": {
                "video": OUTPUT_VIDEO,
                "summary_json": OUTPUT_JSON,
                "summary_csv": OUTPUT_CSV,
                "track_history_csv": OUTPUT_HISTORY_CSV,
            },
        },
        "display_result": {
            "Target_Type": DISPLAY_TARGET_TYPE,
            "Location": DISPLAY_LOCATION,
            "Range_scale_km_per_pixel": RANGE_KM_PER_PIXEL,
            "Speed_scale_mps_per_pixel_per_second": SPEED_MPS_PER_PIXEL_PER_SECOND,
            "threats_found": [
                e["Target_ID"] for e in threat_targets
            ],
            "critical_threats_found": [
                e["Target_ID"] for e in critical_targets
            ],
        },
        "targets": summaries,
    }

    save_csv(summaries)
    save_history(saved_tracks, fps)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(root, f, indent=4)

    print()
    print("=" * 72)
    print("PROCESSING COMPLETE")
    print("=" * 72)
    print(f"Processed frames          : {frame_number}")
    print(f"Saved targets             : {len(saved_tracks)}")
    print(f"Threat targets found      : {len(threat_targets)}")
    print(f"Critical threat targets   : {len(critical_targets)}")
    print(f"Max simultaneous threats  : {max_simultaneous_threats}")
    print()
    print("THREATS SHOWN IN VIDEO:")
    if threat_targets:
        for e in threat_targets:
            print(
                f"  {e['Target_ID']} | "
                f"{e['Range']['value']:.2f} km | "
                f"{e['Azimuth']['value']:.1f} deg | "
                f"{e['Speed']['value']:.2f} m/s | "
                f"{'CRITICAL' if e['Critical_Threat_Ever_Detected'] else 'THREAT'}"
            )
    else:
        print("  None met the configured threat condition.")

    print()
    print(f"VIDEO  : {OUTPUT_VIDEO}")
    print(f"JSON   : {OUTPUT_JSON}")
    print(f"CSV    : {OUTPUT_CSV}")
    print(f"HISTORY: {OUTPUT_HISTORY_CSV}")
    print("=" * 72)


if __name__ == "__main__":
    main()
