# Tutorial Run: Wire, Code, And Drive

Captured: 2026-06-23 22:27 America/Detroit

This run is the simulator-ready version of the first robot car practice. It uses the UBO editor's Wokwi-style visual components and the real Velxio L293D motor-driver model so the wiring names match what you see in the canvas.

Open the editor:

```text
https://ubo.autonateai.com/editor/
```

## Files

| File | Purpose |
| --- | --- |
| `run-log.md` | Timestamped walkthrough notes and expected checks |
| `follow-along.md` | Step-by-step learner path for wiring, coding, and test drive |
| `firmware/robot_car_drive.ino` | Firmware to paste into the editor |
| `velxio/ubo-car-drive.vlx` | Velxio project export for the wired circuit |
| `velxio/diagram.json` | Wokwi-style diagram reference |
| `velxio/stages/*.vlx` | Stage-by-stage project imports used for screenshots |
| `capture-actual-app.mjs` | Playwright script that drives the live app and captures screenshots |
| `screenshots/*.png` | Screenshots captured from the actual app/editor |

## Hardware Map For This Run

This run uses one L293D channel for the left motor and the second L293D channel for the right motor. In the simulator, each motor is represented by a low-value resistor load because that is how the existing Velxio L293D examples model a DC motor winding.

| Robot Signal | Arduino Pin | L293D Pin |
| --- | --- | --- |
| Left speed | D5 PWM | EN1 |
| Left forward | D8 | IN1 |
| Left reverse | D7 | IN2 |
| Right speed | D6 PWM | EN2 |
| Right forward | D12 | IN3 |
| Right reverse | D11 | IN4 |
| Logic power | 5V | VCC1 |
| Motor power | 5V in simulator | VCC2 |
| Shared ground | GND | GND.1 and GND.2 |
| Left motor load | L293D OUT1/OUT2 | left load |
| Right motor load | L293D OUT3/OUT4 | right load |

## Game Controls

Use these controls as the behavior contract between firmware state and the driving game:

| Control | Firmware State | Expected Robot Behavior |
| --- | --- | --- |
| W | both motors forward | drive forward |
| S | both motors reverse | drive backward |
| A | left reverse, right forward | pivot left |
| D | left forward, right reverse | pivot right |
| Space | both motors stopped | stop/brake |

This starter firmware runs an automatic sequence first: forward, right pivot, left pivot, reverse, stop. After that is stable, wire keyboard/game input into the same helper functions.

## Pass Criteria

- The simulator has an Arduino Uno, L293D, and two motor-load resistors.
- `5V` feeds both `VCC1` and `VCC2` for the simulator practice.
- `GND` is shared with both L293D ground pins.
- Direction pins match the table above.
- The firmware serial output prints each state before the robot behavior changes.
- The game layer can map motor state to `W/A/S/D/Space` controls without guessing.
