# Follow Along: Wire, Code, And Drive

The fastest way to understand robot motion is to build the signal chain yourself. In this lab, you will wire a controller to a motor driver, add firmware that behaves like real robot code, run the circuit in the simulator, and connect those motor states to the driving screen.

Move slowly. Each checkpoint builds on the last one. By the end, `forward`, `reverse`, `pivot`, and `stop` will no longer feel like game commands. They will feel like electrical states you can inspect.

## The Goal

You are building the first complete robotics loop:

```text
wire the circuit -> write firmware -> run the simulator -> map behavior to driving controls
```

The board pins are not just decorations. A pin going HIGH or LOW creates motor-driver state. Motor-driver state becomes left/right wheel behavior. That is the bridge between electronics and the game.

## 1. Start Inside The UBO Lab

Open:

```text
https://ubo.autonateai.com/
```

Start a session. If you do not need a saved student login, choose `Guest run`. From the dashboard, open `Wiring lab`.

You should see the UBO shell around the embedded Velxio editor. This matters because the lesson should happen inside the same app where your wiring, coding, driving, and reporting data gets logged.

![Open the UBO wiring editor](screenshots/01-open-editor.png)

Before moving on, confirm:

- `Wiring lab` is selected on the left.
- The embedded editor toolbar is visible.
- The canvas has the real Wokwi-style dark grid.
- You can see `Code`, `Both`, `Circuit`, and `Run` controls.

## 2. Place The Parts Like A Workbench

Now place the core parts. Keep them in a left-to-right flow:

```text
Arduino Uno -> L293D motor driver -> two motor loads
```

Use:

- `Arduino Uno`
- `L293D (Dual H-Bridge Motor Driver)`
- two `Resistor` parts set to `5 ohm`

The current editor does not expose a DC motor part yet, so the two `5 ohm` resistors are our motor windings for this simulation. Think of the top resistor as the left motor load and the bottom resistor as the right motor load.

![Place the Arduino, L293D, and two motor loads](screenshots/02-parts-layout.png)

Do not wire everything yet. First, get the layout readable. When the parts are laid out cleanly, debugging later is much easier.

## 3. Wire Power And Shared Ground First

The L293D needs power before the Arduino direction pins mean anything. Wire the supply side first:

```text
Arduino 5V  -> L293D VCC1
Arduino 5V  -> L293D VCC2
Arduino GND -> L293D GND.1
Arduino GND -> L293D GND.2
```

`VCC1` is the logic power. `VCC2` is the motor-output power. In a physical robot, `VCC2` would usually come from a battery pack, not the Arduino `5V` pin. In this first simulator pass, using `5V` keeps the circuit simple and safe.

The most important idea is common ground. The Arduino and the motor driver need the same ground reference, otherwise `HIGH` and `LOW` signals are not meaningful to the driver.

![Wire 5V and shared ground](screenshots/03-power-ground.png)

Before moving on, check:

- `VCC1` has power.
- `VCC2` has power.
- both L293D ground pins connect back to Arduino ground.

## 4. Wire Direction And PWM

Now connect the Arduino pins that control motion.

Wire the left side:

```text
D5 -> EN1
D8 -> IN1
D7 -> IN2
```

Wire the right side:

```text
D6  -> EN2
D12 -> IN3
D11 -> IN4
```

The `EN` pins are speed control. They receive PWM. The `IN` pins are direction control. One direction pin HIGH and the other LOW makes that motor load drive one way. Swap the pattern and the motor load drives the other way.

![Wire direction pins and PWM speed pins](screenshots/04-direction-pwm.png)

This is the point where firmware and wiring start to lock together. The pin constants in the code must match this physical wiring map.

## 5. Wire The Two Motor Loads

Now connect the load side of the L293D.

Top resistor, treated as the left motor load:

```text
L293D OUT1 -> left motor load pin 1
L293D OUT2 -> left motor load pin 2
```

Bottom resistor, treated as the right motor load:

```text
L293D OUT3 -> right motor load pin 1
L293D OUT4 -> right motor load pin 2
```

The important current path is:

```text
L293D output -> motor load resistor -> L293D output
```

Do not wire these motor loads straight to Arduino ground. The whole point of the H-bridge is that the driver controls which side of the load is high or low.

![Wire the left and right motor loads](screenshots/05-motor-outputs.png)

If a motor behaves backward later, that is not a crisis. Either swap that output pair or invert that side in firmware.

## 6. Paste The Firmware

Open `sketch.ino` and paste the firmware from:

```text
firmware/robot_car_drive.ino
```

The code is organized around behavior helpers:

```text
driveForward()
driveBackward()
pivotRight()
pivotLeft()
stopRobot()
```

Each helper writes a direction pattern and a PWM speed. That means the firmware is acting like a translator between human driving language and electrical pin state.

![Paste robot car firmware into sketch.ino](screenshots/06-firmware.png)

The key constants should match your wiring:

```cpp
const int LEFT_PWM = 5;
const int LEFT_FWD = 8;
const int LEFT_REV = 7;
const int RIGHT_PWM = 6;
const int RIGHT_FWD = 12;
const int RIGHT_REV = 11;
```

## 7. Run And Read The Evidence

Click `Run`.

You are not just looking for “it runs.” You are checking whether the serial story matches the circuit behavior.

Expected serial sequence:

```text
UBO car firmware ready
state=forward left=180 right=180
state=pivot-right left=165 right=165
state=pivot-left left=165 right=165
state=reverse left=150 right=150
state=stop left=0 right=0
```

![Run the firmware and compare behavior](screenshots/07-run-checklist.png)

Use this pass check:

- `forward`: both motor loads receive the forward direction pattern.
- `pivot-right`: left side forward, right side reverse.
- `pivot-left`: left side reverse, right side forward.
- `reverse`: both sides reverse.
- `stop`: direction pins LOW and PWM set to `0`.

## 8. Connect The Circuit To Driving Controls

Now switch to `Test drive`.

This screen is where the electronics lesson becomes a game/simulation lesson. The driving controls should call the same behavior helpers that the firmware used.

![Open the test drive screen](screenshots/08-game-controls.png)

Use this mapping:

```text
W     -> driveForward()
S     -> driveBackward()
A     -> pivotLeft()
D     -> pivotRight()
Space -> stopRobot()
```

The game should consume motor state like this:

```js
const robotState = {
  leftMotor: "forward",
  rightMotor: "reverse",
  leftSpeed: 165,
  rightSpeed: 165,
  action: "pivot-right"
};
```

That is the big idea: hardware-like pin states create robot state, and robot state drives the simulation.

## 9. Keep One Live Editor Reference

The final screenshot is the live editor after the staged project import. Use this as a quick reference if your canvas gets messy and you want to compare the overall layout.

![Live editor reference](screenshots/09-live-editor.png)

## Debug Order

When something looks wrong, debug in this order:

1. Confirm both L293D ground pins share Arduino ground.
2. Confirm `VCC1` and `VCC2` are powered.
3. Confirm each motor-load resistor is wired between an output pair, not to ground.
4. Confirm direction pins match the firmware constants.
5. Confirm PWM pins are on `D5` and `D6`.
6. Read serial output before changing the wiring.

## What You Learned

You did not just wire a toy circuit. You built a chain:

```text
Arduino pin state -> L293D output state -> left/right motor load behavior -> robot driving state
```

That chain is what lets this tutorial scale. The next lessons can swap in better motor visuals, sensors, line following, obstacle avoidance, telemetry, or race strategy, but the core loop stays the same: wire it, code it, run it, compare the evidence.
