import cv2
import easyocr
import os

# --------------------------------------------------
# PATHS
# --------------------------------------------------
VIDEO_PATH = r"C:\Border\data\raw\border_cctv.mp4"

OUTPUT_DIR = r"C:\Border\outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CROP_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "plate_crop.jpg"
)

PROCESSED_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "plate_processed.jpg"
)

# --------------------------------------------------
# OPEN VIDEO
# --------------------------------------------------
cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video.")
    exit()

cap.set(cv2.CAP_PROP_POS_FRAMES, 100)

success, frame = cap.read()
cap.release()

if not success:
    print("ERROR: Could not read frame.")
    exit()

# --------------------------------------------------
# SELECT PLATE
# --------------------------------------------------
print("Select ONLY the license plate.")
print("Try to avoid bumper/body around the plate.")
print("Press ENTER when finished.")

roi = cv2.selectROI(
    "Select License Plate",
    frame,
    showCrosshair=True,
    fromCenter=False
)

cv2.destroyAllWindows()

x, y, w, h = roi

if w == 0 or h == 0:
    print("No plate selected.")
    exit()

# --------------------------------------------------
# CROP
# --------------------------------------------------
plate = frame[
    y:y+h,
    x:x+w
]

cv2.imwrite(
    CROP_OUTPUT,
    plate
)

# --------------------------------------------------
# RESIZE
# --------------------------------------------------
scale = 4

plate_big = cv2.resize(
    plate,
    None,
    fx=scale,
    fy=scale,
    interpolation=cv2.INTER_CUBIC
)

# --------------------------------------------------
# GRAYSCALE
# --------------------------------------------------
gray = cv2.cvtColor(
    plate_big,
    cv2.COLOR_BGR2GRAY
)

# --------------------------------------------------
# DENOISE
# --------------------------------------------------
gray = cv2.GaussianBlur(
    gray,
    (3, 3),
    0
)

# --------------------------------------------------
# CONTRAST
# --------------------------------------------------
gray = cv2.equalizeHist(gray)

# --------------------------------------------------
# SHARPEN
# --------------------------------------------------
sharpened = cv2.addWeighted(
    gray,
    1.5,
    cv2.GaussianBlur(gray, (0, 0), 3),
    -0.5,
    0
)

# --------------------------------------------------
# THRESHOLD
# --------------------------------------------------
processed = cv2.threshold(
    sharpened,
    0,
    255,
    cv2.THRESH_BINARY + cv2.THRESH_OTSU
)[1]

# --------------------------------------------------
# SAVE PROCESSED IMAGE
# --------------------------------------------------
cv2.imwrite(
    PROCESSED_OUTPUT,
    processed
)

# --------------------------------------------------
# OCR
# --------------------------------------------------
print("\nStarting EasyOCR...")

reader = easyocr.Reader(
    ["en"],
    gpu=False
)

# Try OCR on processed plate
results = reader.readtext(
    processed,
    allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    detail=1
)

print("\nOCR RESULTS")
print("-----------")

if not results:

    print("No text detected.")

else:

    for detection in results:

        bbox = detection[0]
        text = detection[1]
        confidence = detection[2]

        print(
            f"Text       : {text}"
        )

        print(
            f"Confidence : {confidence:.2f}"
        )

        print(
            f"Box        : {bbox}"
        )

# --------------------------------------------------
# SHOW IMAGES
# --------------------------------------------------
cv2.imshow(
    "Original Plate",
    plate_big
)

cv2.imshow(
    "Processed Plate",
    processed
)

cv2.waitKey(0)
cv2.destroyAllWindows()

print("\nSaved:")
print(CROP_OUTPUT)
print(PROCESSED_OUTPUT)