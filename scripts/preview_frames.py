import cv2
import os

input_folder = r"C:\Border\data\frames"

files = sorted([
    f for f in os.listdir(input_folder)
    if f.lower().endswith(".jpg")
])

for i, filename in enumerate(files):

    path = os.path.join(input_folder, filename)

    image = cv2.imread(path)

    if image is None:
        continue

    cv2.putText(
        image,
        f"Frame index: {i}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 0, 255),
        2
    )

    cv2.imshow("Frame Preview", image)

    key = cv2.waitKey(0)

    # ESC = stop
    if key == 27:
        break

cv2.destroyAllWindows()
