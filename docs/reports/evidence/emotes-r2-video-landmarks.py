#!/usr/bin/env python3
"""Run the site's three .task models in VIDEO mode over an MJPEG clip (every 3rd frame = 10 fps) and dump per-frame landmarks as JSON."""
import io, json, os, sys
import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
MODELS = "/Users/kalp/projects/emotes/public/mediapipe/models"
clip, out = sys.argv[1], sys.argv[2]
fps = 30; step = int(sys.argv[3]) if len(sys.argv) > 3 else 3
data = open(clip, "rb").read()
frames = []; i = 0
while True:
    a = data.find(b"\xff\xd8", i)
    if a < 0: break
    b = data.find(b"\xff\xd9", a) + 2
    frames.append(data[a:b]); i = b
B = mpp.BaseOptions
face = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=B(model_asset_path=f"{MODELS}/face_landmarker.task"), running_mode=vision.RunningMode.VIDEO, num_faces=1))
hands = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(base_options=B(model_asset_path=f"{MODELS}/hand_landmarker.task"), running_mode=vision.RunningMode.VIDEO, num_hands=2))
pose = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(base_options=B(model_asset_path=f"{MODELS}/pose_landmarker_lite.task"), running_mode=vision.RunningMode.VIDEO, num_poses=1))
pts = lambda lms: [[round(l.x, 5), round(l.y, 5)] for l in lms]
rows = []
for k in range(0, len(frames), step):
    im = np.array(Image.open(io.BytesIO(frames[k])).convert("RGB"))
    img = mp.Image(image_format=mp.ImageFormat.SRGB, data=im)
    ts = int(k * 1000 / fps)
    fr = face.detect_for_video(img, ts); hr = hands.detect_for_video(img, ts); pr = pose.detect_for_video(img, ts)
    rows.append({"ms": ts, "pose": pts(pr.pose_landmarks[0]) if pr.pose_landmarks else None, "hands": [pts(h) for h in hr.hand_landmarks], "face": pts(fr.face_landmarks[0]) if fr.face_landmarks else None})
json.dump({"aspect": im.shape[1] / im.shape[0], "frames": rows}, open(out, "w"))
print(len(frames), "frames,", len(rows), "sampled")
