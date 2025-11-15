import cv2
from matplotlib.pylab import angle
import mediapipe as mp
import numpy as np

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180:
        angle = 360 - angle
    return angle

cap = cv2.VideoCapture(1)
cap.set(3, 1280)
cap.set(4, 720)

with mp_pose.Pose(min_detection_confidence=0.5,
                  min_tracking_confidence=0.5,
                  model_complexity=1) as pose:

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        left_feedback = "Detecting..."
        right_feedback = "Detecting..."

        if results.pose_landmarks:
            lm = results.pose_landmarks.landmark

            left_shoulder = [lm[11].x, lm[11].y]
            left_elbow    = [lm[13].x, lm[13].y]
            left_wrist    = [lm[15].x, lm[15].y]

            left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)

            if left_angle > 160:
                left_feedback = "Left Arm Straight ✔"
            elif left_angle < 50:
                left_feedback = "Left Arm Bent ❗"
            else:
                left_feedback = "Left Arm Mid Position"

            right_shoulder = [lm[12].x, lm[12].y]
            right_elbow    = [lm[14].x, lm[14].y]
            right_wrist    = [lm[16].x, lm[16].y]

            right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)

            if right_angle > 160:
                right_feedback = "Right Arm Straight ✔"
            elif right_angle < 50:
                right_feedback = "Right Arm Bent ❗"
            else:
                right_feedback = "Right Arm Mid Position"

            mp_drawing.draw_landmarks(
                image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0,255,0), thickness=3, circle_radius=3),
                mp_drawing.DrawingSpec(color=(255,0,0), thickness=2)
            )

            cv2.putText(image, f"Left Angle: {int(left_angle)}°",
                        (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,255), 3)

            cv2.putText(image, left_feedback,
                        (30, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 3)

            cv2.putText(image, f"Right Angle: {int(right_angle)}°",
                        (900, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,255), 3)

            cv2.putText(image, right_feedback,
                        (900, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 3)

        cv2.imshow("Pose Skeleton Test", image)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
cap.release()
cv2.destroyAllWindows()
