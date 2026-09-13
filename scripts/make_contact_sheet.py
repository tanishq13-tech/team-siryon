import cv2
import os
import math

input_folder = r"C:\Border\data\frames"
output_file = r"C:\Border\data\frame_contact_sheet.jpg"

files = sorted([
    f for f in os.listdir(input_folder)
    if f.lower().endswith(".jpg")
])

if not files:
    print("No frames found.")
    exit()

# Size of each thumbnail
thumb_width = 240
thumb_height = 140

columns = 5
rows = math.ceil(len(files) / columns)

sheet = cv2.imread(os.path.join(input_folder, files[0]))

if sheet is None:
    print("Could not read frames.")
    exit()

contact_sheet = 255 * __import__("numpy").ones(
    (rows * thumb_height, columns * thumb_width, 3),
    dtype="uint8"
)

for i, filename in enumerate(files):

    path = os.path.join(input_folder, filename)
    image = cv2.imread(path)

    if image is None:
        continue

    image = cv2.resize(image, (thumb_width, thumb_height))

    row = i // columns
    col = i % columns

    y1 = row * thumb_height
    y2 = y1 + thumb_height

    x1 = col * thumb_width
    x2 = x1 + thumb_width

    contact_sheet[y1:y2, x1:x2] = image

    cv2.putText(
        contact_sheet,
        filename,
        (x1 + 5, y1 + 18),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        (0, 0, 0),
        1
    )

cv2.imwrite(output_file, contact_sheet)

print("Contact sheet created:")
print(output_file)