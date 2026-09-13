import cv2
import os

image_folder = r"C:\Border\data\dataset\images\train"
label_folder = r"C:\Border\data\dataset\labels\train"

images = [
    f for f in os.listdir(image_folder)
    if f.lower().endswith((".jpg", ".jpeg", ".png"))
]

for image_name in sorted(images):

    image_path = os.path.join(image_folder, image_name)
    label_name = os.path.splitext(image_name)[0] + ".txt"
    label_path = os.path.join(label_folder, label_name)

    image = cv2.imread(image_path)

    if image is None:
        continue

    height, width = image.shape[:2]

    if os.path.exists(label_path):

        with open(label_path, "r") as file:

            for line in file:

                values = line.strip().split()

                if len(values) != 5:
                    continue

                class_id, x_center, y_center, box_width, box_height = map(
                    float, values
                )

                # YOLO normalized coordinates -> pixel coordinates
                x_center *= width
                y_center *= height
                box_width *= width
                box_height *= height

                x1 = int(x_center - box_width / 2)
                y1 = int(y_center - box_height / 2)
                x2 = int(x_center + box_width / 2)
                y2 = int(y_center + box_height / 2)

                cv2.rectangle(
                    image,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2
                )

                cv2.putText(
                    image,
                    "license_plate",
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 0),
                    2
                )

    cv2.imshow("Annotation Check", image)

    key = cv2.waitKey(0)

    # ESC = stop
    if key == 27:
        break

cv2.destroyAllWindows()