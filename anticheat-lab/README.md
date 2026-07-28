# Anti-Cheat Research Lab

Offline lab stack for modeling cheat **behavior** and training **detectors** — not for deploying cheats in live games.

## What this is

| Layer | Purpose |
|-------|---------|
| **TypeScript simulators** | Cronus GPC logic + CV aimbot kinematics |
| **Feature extractor** | Stick stats, periodicity, lag, snap velocity |
| **Rule detector v0** | Scores cheat classes from telemetry |
| **Python capture lab** | ROI crop + blob detection on webcam/video (capture-card stand-in) |

This models the **budget hardware stack** (capture card + PC loop + fast input device) for **detection research**, not Titan-class memory cheats.

## Quick start (no hardware)

```bash
# Synthetic detector validation (7 labeled scenarios @ 1000 Hz)
npm run anticheat:lab

# Generate synthetic test video
npm run anticheat:lab:video

# Run capture pipeline on synthetic video (no camera needed)
npm run anticheat:lab:capture

# Analyze capture JSON with detector
npm run anticheat:lab:analyze
```

## Basic hardware test stack (~$20–30)

### 1. Input path — Raspberry Pi Pico + GP2040-CE

Use GP2040-CE for **1 kHz USB HID** on the **last mile** (PC → device). For Xbox Series X|S you still need **controller authentication passthrough** — a bare Pico is not enough on stock consoles.

1. Download [GP2040-CE](https://github.com/OpenStickCommunity/GP2040-CE) `.uf2` for Pico.
2. Hold BOOTSEL, plug USB, drag firmware onto the drive.
3. Boot into your target mode per GP2040-CE docs.

**Lab mode:** log stick corrections to JSON from this repo instead of injecting into a live console.

### 2. Capture path — USB 3.0 HDMI dongle or webcam

Generic `$12–15` HDMI capture cards work as a **webcam index** in OpenCV. Latency varies (often 30–80 ms, not always 10–20 ms).

```bash
pip install -r anticheat-lab/python/requirements.txt

# Webcam or capture card (try index 0, 1, 2…)
python anticheat-lab/python/lab_capture.py --camera 0 --frames 300 --preview

# HDMI capture card / file
python anticheat-lab/python/lab_capture.py --camera 1 --roi 320 --frames 600
```

### 3. Software loop — ROI crop (already implemented)

`lab_capture.py` crops a **320×320 center ROI** before detection — the main FPS optimization for lean PCs.

Optional upgrades (not in v0):

- YOLOv8n via `ultralytics` (GPU)
- DXGI desktop duplication on PC (lower lag than some dongles)

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Xbox / test │ HDMI│ Capture dongle   │     │ Python lab      │
│ video source│────►│ or webcam        │────►│ ROI + blob det  │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                        │ JSON
┌─────────────┐     ┌──────────────────┐               ▼
│ GP2040-CE   │◄────│ Stick corrections│     ┌─────────────────┐
│ (lab log)   │     │ (lab only)       │     │ TS detector     │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

## TypeScript modules

| File | Role |
|------|------|
| `cronus-simulator.ts` | Mirrors `cronus-zen/claw-xbox-premium.gpc` |
| `cv-aimbot-simulator.ts` | Lagged ROI-limited tracking |
| `feature-extractor.ts` | Telemetry → features |
| `detector.ts` | Rule-based classifier |
| `scenario-generator.ts` | Synthetic labeled data |

## Cronus reference

The Cronus simulator defaults match `cronus-zen/claw-xbox-premium.gpc`:

- AR vertical: 18, horizontal: 2
- Polar AA radius: 12, speed: 18
- 1000 Hz virtual sample rate in synthetic runs

## Detection signals

| Cheat class | Key features |
|-------------|--------------|
| Cronus anti-recoil | High mean RY compensation, low std while firing |
| Cronus polar AA | Periodic RX micro-movements |
| CV aimbot | High `cvLagMs`, smooth tracking, moderate snap |
| Memory aimbot (sim) | High snap velocity, low lag, pre-aim score |

## Ethics

- Use **synthetic data**, **your own footage**, or **isolated lab accounts**.
- Do not use this stack in ranked/live multiplayer.
- Goal: **detector training**, not player harm.

## Related repo files

- `cronus-zen/claw-xbox-premium.gpc` — real Cronus script used as simulation source
- `cronus-zen/claw-xbox-settings-guide.html` — hardware setup for Zen (input mods only)
