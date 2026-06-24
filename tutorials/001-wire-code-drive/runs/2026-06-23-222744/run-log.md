# Run Log

Captured: 2026-06-23 22:27 America/Detroit

## 00:00 - Open The Editor

I opened the UBO editor at `/editor/` and used the wiring lab as the main simulator surface.

Screenshot: `screenshots/01-open-editor.png`

What to check:

- The editor is the simulator, not a separate Velxio marketing shell.
- The canvas is ready for Wokwi-style parts.
- The Run button and board selector are visible.

## 00:30 - Choose Parts

I used the components the simulator already supports well:

- Arduino Uno as the controller
- L293D dual H-bridge as the motor driver
- two low-value resistor loads as DC motor windings
- 5V and GND from the board for the first safe simulator pass

Screenshot: `screenshots/02-parts-layout.png`

Why this matters:

- The controller pins only send logic.
- The L293D converts logic into motor-output direction.
- The motor loads let the simulator solve the circuit without needing a custom motor model yet.

## 01:15 - Wire Power And Ground

I wired:

```text
Arduino 5V  -> L293D VCC1
Arduino 5V  -> L293D VCC2
Arduino GND -> L293D GND.1
Arduino GND -> L293D GND.2
```

Screenshot: `screenshots/03-power-ground.png`

Expected result:

- Logic side has 5V.
- Motor side has 5V for this simulator pass.
- Both sides share ground.

Real-life note:

- On a physical car, `VCC2` should normally come from the motor battery, not from the controller's 5V pin.
- Battery negative and controller ground still need to connect together.

## 02:00 - Wire Direction And PWM

I wired:

```text
D5  -> EN1   left speed PWM
D8  -> IN1   left forward
D7  -> IN2   left reverse
D6  -> EN2   right speed PWM
D12 -> IN3   right forward
D11 -> IN4   right reverse
```

Screenshot: `screenshots/04-direction-pwm.png`

Expected result:

- Forward means each side has forward HIGH and reverse LOW.
- Reverse means each side has forward LOW and reverse HIGH.
- Pivot turns are made by driving the two sides in opposite directions.

## 03:00 - Wire Motor Outputs

I wired:

```text
L293D OUT1 -> left motor/load pin 1
L293D OUT2 -> left motor/load pin 2
L293D OUT3 -> right motor/load pin 1
L293D OUT4 -> right motor/load pin 2
```

Screenshot: `screenshots/05-motor-outputs.png`

Expected result:

- The L293D owns the motor current path.
- The Arduino never powers the motor loads directly.
- If a side behaves backward, swap the two output wires for that side or invert that side in firmware.

## 04:00 - Add Firmware

I pasted `firmware/robot_car_drive.ino`.

Screenshot: `screenshots/06-firmware.png`

Expected serial output:

```text
UBO car firmware ready
state=forward left=180 right=180
state=pivot-right left=165 right=165
state=pivot-left left=165 right=165
state=reverse left=150 right=150
state=stop left=0 right=0
```

## 05:00 - Run And Compare Behavior

I used Run to compile/start the firmware, then watched the serial output and the motor-driver wiring state.

Screenshot: `screenshots/07-run-checklist.png`

Pass check:

- Forward: left and right motors use matching forward direction.
- Pivot right: left forward, right reverse.
- Pivot left: left reverse, right forward.
- Reverse: both sides reverse.
- Stop: all direction pins LOW and PWM set to zero.

## 06:00 - Connect It To Game Controls

I treated the firmware helpers as the API for the driving game.

Screenshot: `screenshots/08-game-controls.png`

Control mapping:

```text
W     -> driveForward()
S     -> driveBackward()
A     -> pivotLeft()
D     -> pivotRight()
Space -> stopRobot()
```

The important bridge is:

```js
const robotState = {
  leftMotor: "forward",
  rightMotor: "reverse",
  leftSpeed: 165,
  rightSpeed: 165,
  action: "pivot-right"
};
```

Hardware-like pin states create the robot state. The game should consume that state instead of inventing a separate movement model.
