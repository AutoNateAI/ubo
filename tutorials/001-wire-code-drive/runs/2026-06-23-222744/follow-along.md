# Follow Along: Wire, Code, And Drive

Use this file while the simulator is open. The screenshots are evidence from the actual UBO app, but you should perform the steps yourself in the editor.

## 1. Open The Lab

Open:

```text
https://ubo.autonateai.com/
```

Start a session, choose `Guest run` if you do not need a saved login, then open `Wiring lab`.

Check against:

```text
screenshots/01-open-editor.png
```

## 2. Place The Core Parts

Add:

- `Arduino Uno`
- `L293D (Dual H-Bridge Motor Driver)`
- two `Resistor` parts with value `5`

Treat the two 5-ohm resistors as the motor windings for this simulator pass:

- top resistor = left motor load
- bottom resistor = right motor load

Check against:

```text
screenshots/02-parts-layout.png
```

## 3. Wire Power First

Wire:

```text
Arduino 5V  -> L293D VCC1
Arduino 5V  -> L293D VCC2
Arduino GND -> L293D GND.1
Arduino GND -> L293D GND.2
```

Why:

- `VCC1` powers the L293D logic side.
- `VCC2` powers the motor-output side for this simulator lesson.
- shared ground lets the driver understand the Arduino signals.

Check against:

```text
screenshots/03-power-ground.png
```

## 4. Wire Direction And Speed

Wire:

```text
D5  -> EN1   left speed PWM
D8  -> IN1   left forward
D7  -> IN2   left reverse
D6  -> EN2   right speed PWM
D12 -> IN3   right forward
D11 -> IN4   right reverse
```

Mental model:

- enable pins are throttle
- input pins are direction
- the L293D decides which way current flows through each motor load

Check against:

```text
screenshots/04-direction-pwm.png
```

## 5. Wire The Motor Loads

Wire the top 5-ohm resistor as the left motor:

```text
L293D OUT1 -> left motor load pin 1
L293D OUT2 -> left motor load pin 2
```

Wire the bottom 5-ohm resistor as the right motor:

```text
L293D OUT3 -> right motor load pin 1
L293D OUT4 -> right motor load pin 2
```

The current path should be:

```text
L293D output -> motor load resistor -> L293D output
```

Check against:

```text
screenshots/05-motor-outputs.png
```

## 6. Paste Firmware

Open `sketch.ino` and paste:

```text
firmware/robot_car_drive.ino
```

The important functions are:

- `driveForward()`
- `driveBackward()`
- `pivotRight()`
- `pivotLeft()`
- `stopRobot()`

Check against:

```text
screenshots/06-firmware.png
```

## 7. Run The Simulation

Click `Run`.

Expected serial sequence:

```text
UBO car firmware ready
state=forward left=180 right=180
state=pivot-right left=165 right=165
state=pivot-left left=165 right=165
state=reverse left=150 right=150
state=stop left=0 right=0
```

Check against:

```text
screenshots/07-run-checklist.png
```

## 8. Connect It To Driving Controls

Open `Test drive`.

Use this mapping for the game layer:

```text
W     -> driveForward()
S     -> driveBackward()
A     -> pivotLeft()
D     -> pivotRight()
Space -> stopRobot()
```

Check against:

```text
screenshots/08-game-controls.png
```

## Debug Order

Use this order when something looks wrong:

1. Confirm both L293D ground pins share Arduino ground.
2. Confirm `VCC1` and `VCC2` are powered.
3. Confirm each motor-load resistor is wired between an output pair, not to ground.
4. Confirm direction pins match the firmware constants.
5. Confirm PWM pins are on `D5` and `D6`.
6. Read serial output before changing the wiring.
