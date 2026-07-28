#!/usr/bin/env python3
"""
Generate a synthetic 1080p60 test video — no capture card required.
Moving red target crosses the screen for CV pipeline validation.
"""

import argparse
from pathlib import Path

import cv2
import numpy as np


def main() -> None:
    parser = argparse.ArgumentParser(description="Synthetic target video for anticheat lab")
    parser.add_argument("--out", default="anticheat-lab/fixtures/synthetic_target.mp4")
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    parser.add_argument("--fps", type=int, default=60)
    parser.add_argument("--seconds", type=int, default=5)
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(out_path), fourcc, args.fps, (args.width, args.height))
    if not writer.isOpened():
        raise RuntimeError(f"VideoWriter failed for {out_path}")

    total_frames = args.fps * args.seconds
    for i in range(total_frames):
        frame = np.zeros((args.height, args.width, 3), dtype=np.uint8)
        frame[:] = (18, 22, 28)  # dark gray-blue "game" backdrop

        t = i / args.fps
        cx = int(args.width * 0.5 + np.sin(t * 1.2) * args.width * 0.25)
        cy = int(args.height * 0.5 + np.cos(t * 0.9) * args.height * 0.15)

        cv2.circle(frame, (cx, cy), 22, (0, 0, 220), -1)
        cv2.circle(frame, (cx, cy), 24, (40, 40, 40), 2)

        # Crosshair reference
        ch_x, ch_y = args.width // 2, args.height // 2
        cv2.line(frame, (ch_x - 12, ch_y), (ch_x + 12, ch_y), (200, 200, 200), 1)
        cv2.line(frame, (ch_x, ch_y - 12), (ch_x, ch_y + 12), (200, 200, 200), 1)

        writer.write(frame)

    writer.release()
    print(f"Wrote {total_frames} frames to {out_path}")


if __name__ == "__main__":
    main()
