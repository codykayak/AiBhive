#!/usr/bin/env python3
"""
Lab capture pipeline — ROI crop + simple target detection + latency metrics.

Works with:
  - Webcam (default index 0) — stand-in for HDMI capture card
  - Video file (--file)
  - Synthetic video (generate_synthetic_video.py)

Outputs JSON telemetry for the TypeScript detector (run-lab-from-capture.ts).

This is for OFFLINE anti-cheat research — not live game injection.
"""

import argparse
import json
import time
from pathlib import Path

import cv2
import numpy as np


def crop_center_roi(frame: np.ndarray, roi_w: int, roi_h: int) -> tuple[np.ndarray, int, int]:
    h, w = frame.shape[:2]
    x0 = max(0, (w - roi_w) // 2)
    y0 = max(0, (h - roi_h) // 2)
    return frame[y0:y0 + roi_h, x0:x0 + roi_w], x0, y0


def detect_red_target(roi: np.ndarray) -> tuple[bool, float, float]:
    """Simple color blob detector — fast baseline without YOLO weights."""
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    mask1 = cv2.inRange(hsv, (0, 120, 120), (10, 255, 255))
    mask2 = cv2.inRange(hsv, (170, 120, 120), (180, 255, 255))
    mask = cv2.bitwise_or(mask1, mask2)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return False, 0.0, 0.0

    largest = max(contours, key=cv2.contourArea)
    if cv2.contourArea(largest) < 80:
        return False, 0.0, 0.0

    m = cv2.moments(largest)
    if m["m00"] == 0:
        return False, 0.0, 0.0

    cx = m["m10"] / m["m00"]
    cy = m["m01"] / m["m00"]
    roi_h, roi_w = roi.shape[:2]
    offset_x = (cx - roi_w / 2) / (roi_w / 2)
    offset_y = (cy - roi_h / 2) / (roi_h / 2)
    return True, float(offset_x), float(offset_y)


def stick_from_offset(offset_x: float, offset_y: float, gain: float = 45.0) -> tuple[float, float]:
    rx = max(-100.0, min(100.0, offset_x * gain))
    ry = max(-100.0, min(100.0, -offset_y * gain))
    return rx, ry


def open_capture(source: str | int) -> cv2.VideoCapture:
    path = Path(str(source))
    cap_source = str(path.resolve()) if path.exists() else source
    cap = cv2.VideoCapture(cap_source)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video source: {source}")
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return cap


def main() -> None:
    parser = argparse.ArgumentParser(description="Anti-cheat lab capture pipeline")
    parser.add_argument("--camera", type=int, default=0, help="Webcam or capture card index")
    parser.add_argument("--file", type=str, default=None, help="Video file path")
    parser.add_argument("--roi", type=int, default=320, help="ROI width/height in pixels")
    parser.add_argument("--frames", type=int, default=300, help="Frames to process")
    parser.add_argument("--out", default="anticheat-lab/fixtures/capture_telemetry.json")
    parser.add_argument("--preview", action="store_true", help="Show ROI preview window")
    args = parser.parse_args()

    source: str | int = args.file if args.file else args.camera
    cap = open_capture(source)

    roi_size = args.roi
    samples = []
    pipeline_metrics = []

    frame_times: list[float] = []
    prev_loop = time.perf_counter()

    for i in range(args.frames):
        loop_start = time.perf_counter()
        ok, frame = cap.read()
        if not ok:
            break

        capture_ms = (time.perf_counter() - loop_start) * 1000

        infer_start = time.perf_counter()
        roi, x0, y0 = crop_center_roi(frame, roi_size, roi_size)
        detected, offset_x, offset_y = detect_red_target(roi)
        inference_ms = (time.perf_counter() - infer_start) * 1000

        rx, ry = stick_from_offset(offset_x, offset_y) if detected else (0.0, 0.0)
        t_ms = int(i * (1000 / 60))

        samples.append({
            "tMs": t_ms,
            "rx": rx,
            "ry": ry,
            "lx": 0,
            "ly": 0,
            "ads": 100 if detected else 0,
            "fire": 100 if detected else 0,
            "label": "cv_aimbot_soft",
        })

        pipeline_metrics.append({
            "tMs": t_ms,
            "captureLagMs": capture_ms,
            "inferenceMs": inference_ms,
            "roiWidth": roi_size,
            "roiHeight": roi_size,
            "fps": 0.0,
            "targetDetected": detected,
            "targetOffsetX": offset_x,
            "targetOffsetY": offset_y,
        })

        if args.preview:
            vis = roi.copy()
            if detected:
                cv2.circle(
                    vis,
                    (int(roi_size / 2 + offset_x * roi_size / 2), int(roi_size / 2 + offset_y * roi_size / 2)),
                    6,
                    (0, 255, 0),
                    2,
                )
            cv2.imshow("anticheat-lab ROI", vis)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

        frame_times.append(time.perf_counter() - loop_start)
        prev_loop = loop_start

    cap.release()
    if args.preview:
        cv2.destroyAllWindows()

    if frame_times:
        avg_loop_ms = sum(frame_times) / len(frame_times) * 1000
        fps = 1000 / avg_loop_ms if avg_loop_ms > 0 else 0
        for m in pipeline_metrics:
            m["fps"] = fps

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "meta": {
            "source": str(source),
            "roiSize": roi_size,
            "frameCount": len(samples),
            "avgLoopMs": sum(frame_times) / len(frame_times) * 1000 if frame_times else 0,
            "note": "Lab capture telemetry — not for live game use",
        },
        "samples": samples,
        "pipeline": pipeline_metrics,
    }

    out_path.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {len(samples)} samples to {out_path}")
    if frame_times:
        print(f"Average loop: {payload['meta']['avgLoopMs']:.1f} ms (~{1000 / payload['meta']['avgLoopMs']:.0f} FPS)")


if __name__ == "__main__":
    main()
