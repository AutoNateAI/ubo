# Wire, Code, And Test A Robot Car

## Goal

Build the first full robotics loop:

1. Wire an ESP32-style controller to a motor driver.
2. Add firmware as if the robot were real.
3. Run the behavior in the simulator.
4. Debug the connection between circuit behavior and game/simulation logic.

The point is not just “make motors spin.” The point is to see how a physical signal becomes a simulated action: a pin goes high, the motor driver receives it, the motor direction changes, and the car logic updates.

## What You Are Practicing

- Common ground and battery power
- Motor-driver direction pins
- PWM speed control
- Serial diagnostics
- Mapping hardware signals to simulation state
- Testing one behavior at a time

## Parts

| Part | Role |
| --- | --- |
| ESP32 DevKit or Arduino-compatible board | Robot brain |
| L298N or similar H-bridge motor driver | Controls motor direction and speed |
| 2 DC motors | Left and right drive wheels |
| 7.4 V battery pack | Motor power |
| Jumper wires | Signal and power connections |
| Optional HC-SR04 ultrasonic sensor | Simple front-distance input |

In the simulator, choose equivalent parts. Exact board artwork can vary; the signal names matter more than the visual model.

## Pin Map

| Signal | Controller Pin | Motor Driver Pin | Purpose |
| --- | --- | --- | --- |
| Left forward | GPIO 26 | IN1 | Left motor forward direction |
| Left reverse | GPIO 27 | IN2 | Left motor reverse direction |
| Right forward | GPIO 14 | IN3 | Right motor forward direction |
| Right reverse | GPIO 12 | IN4 | Right motor reverse direction |
| Left speed | GPIO 25 | ENA | Left motor PWM speed |
| Right speed | GPIO 33 | ENB | Right motor PWM speed |
| Motor power | Battery + | 12V/VIN | Motor supply |
| Ground | GND | GND | Shared electrical reference |

Critical rule: the controller ground, motor-driver ground, and battery negative must share ground. Without common ground, the driver may not understand the controller’s HIGH/LOW signals.

## Mental Model

Think of the robot as two layers:

| Electronics Layer | Simulation/Game Layer |
| --- | --- |
| GPIO 26 HIGH and GPIO 27 LOW | Left wheel moves forward |
| GPIO 26 LOW and GPIO 27 HIGH | Left wheel moves backward |
| PWM duty cycle increases | Wheel speed increases |
| Distance sensor reads close object | Game logic chooses turn/stop |
| Serial output prints state | Debug overlay or action log explains decision |

The simulator is useful because you can pause and ask: “What signal changed, and what behavior did that cause?”

## Checkpoint 1: Open The Simulator

Use the UBO editor:

```text
https://ubo.autonateai.com/editor/
```

For local development:

```sh
npm run simulator:start
npm run simulator:frontend
npm run dev
```

Then open:

```text
http://localhost:5173/editor
```

## Checkpoint 2: Place The Core Parts

Add or confirm these parts on the canvas:

- controller board
- motor driver
- left DC motor
- right DC motor
- battery or power source
- optional ultrasonic sensor

Do not start by wiring everything. Place parts first so the flow is readable: controller on the left, motor driver in the middle, motors on the right, battery near the driver.

## Checkpoint 3: Wire Power

Wire:

```text
Battery +  -> motor driver VIN/12V
Battery -  -> motor driver GND
Controller GND -> motor driver GND
```

Expected understanding:

- Battery power feeds the motors.
- Controller logic signals only make sense because ground is shared.
- The controller should not power the motors directly.

## Checkpoint 4: Wire Motor Outputs

Wire:

```text
Motor driver OUT1/OUT2 -> left motor
Motor driver OUT3/OUT4 -> right motor
```

If a motor spins backward later, that is not a crisis. Swap the two motor leads or invert the direction logic in code.

## Checkpoint 5: Wire Direction Signals

Wire:

```text
GPIO 26 -> IN1
GPIO 27 -> IN2
GPIO 14 -> IN3
GPIO 12 -> IN4
```

Expected behavior:

- IN1 HIGH, IN2 LOW means left motor forward.
- IN1 LOW, IN2 HIGH means left motor reverse.
- IN1 LOW, IN2 LOW means left motor coast/stop.

The right motor follows the same pattern with IN3 and IN4.

## Checkpoint 6: Wire PWM Speed

Wire:

```text
GPIO 25 -> ENA
GPIO 33 -> ENB
```

PWM is how the code says “not just forward, but how fast.” In game terms, PWM maps to throttle.

## Checkpoint 7: Add Firmware

Create or open the controller code file and paste this starter sketch:

```cpp
const int LEFT_FWD = 26;
const int LEFT_REV = 27;
const int RIGHT_FWD = 14;
const int RIGHT_REV = 12;
const int LEFT_PWM = 25;
const int RIGHT_PWM = 33;

const int PWM_FREQ = 1000;
const int PWM_RESOLUTION = 8;
const int LEFT_CHANNEL = 0;
const int RIGHT_CHANNEL = 1;

void setup() {
  Serial.begin(115200);

  pinMode(LEFT_FWD, OUTPUT);
  pinMode(LEFT_REV, OUTPUT);
  pinMode(RIGHT_FWD, OUTPUT);
  pinMode(RIGHT_REV, OUTPUT);

  ledcSetup(LEFT_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcSetup(RIGHT_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(LEFT_PWM, LEFT_CHANNEL);
  ledcAttachPin(RIGHT_PWM, RIGHT_CHANNEL);

  stopRobot();
  Serial.println("Robot ready");
}

void loop() {
  driveForward(180);
  Serial.println("forward speed=180");
  delay(1500);

  turnRight(160);
  Serial.println("turn right speed=160");
  delay(700);

  stopRobot();
  Serial.println("stop");
  delay(1000);
}

void driveForward(int speed) {
  digitalWrite(LEFT_FWD, HIGH);
  digitalWrite(LEFT_REV, LOW);
  digitalWrite(RIGHT_FWD, HIGH);
  digitalWrite(RIGHT_REV, LOW);
  setSpeed(speed, speed);
}

void turnRight(int speed) {
  digitalWrite(LEFT_FWD, HIGH);
  digitalWrite(LEFT_REV, LOW);
  digitalWrite(RIGHT_FWD, LOW);
  digitalWrite(RIGHT_REV, HIGH);
  setSpeed(speed, speed);
}

void stopRobot() {
  digitalWrite(LEFT_FWD, LOW);
  digitalWrite(LEFT_REV, LOW);
  digitalWrite(RIGHT_FWD, LOW);
  digitalWrite(RIGHT_REV, LOW);
  setSpeed(0, 0);
}

void setSpeed(int leftSpeed, int rightSpeed) {
  ledcWrite(LEFT_CHANNEL, constrain(leftSpeed, 0, 255));
  ledcWrite(RIGHT_CHANNEL, constrain(rightSpeed, 0, 255));
}
```

If your simulator board uses Arduino Uno instead of ESP32, replace ESP32 `ledc*` PWM setup with normal `analogWrite()` on PWM-capable pins. The lesson stays the same: direction pins choose motor direction, PWM chooses motor speed.

## Checkpoint 8: Run The Simulation

Run/compile the project.

Expected results:

- Motors run forward.
- Robot/car model moves forward or motor outputs show forward behavior.
- Robot turns right.
- Robot stops.
- Serial monitor prints each state.

Write down what you saw:

```text
Forward worked:
Turn worked:
Stop worked:
Serial messages matched behavior:
```

## Checkpoint 9: Debug Like A Builder

Use this order:

1. If nothing moves, check power and common ground.
2. If one motor moves, check that motor’s output wires and direction pins.
3. If a motor moves backward, swap motor leads or invert that side in code.
4. If speed does not change, check ENA/ENB and PWM pin support.
5. If the simulator behavior does not match the code, add serial prints before changing wiring.

## Checkpoint 10: Connect It To Game Logic

Once the basic sequence works, think about the simulation/game mapping:

```js
const robotState = {
  leftMotor: "forward",
  rightMotor: "reverse",
  leftSpeed: 160,
  rightSpeed: 160,
  action: "turn-right"
};
```

That state is the bridge between electronics and gameplay. Hardware pins create the state; the simulator uses the state to move the car.

## Mini Challenges

- Change the turn from right to left.
- Make the robot drive slower, then faster.
- Add a `driveBackward()` function.
- Add serial output before every motor command.
- Add a pretend obstacle value and stop when it is too close.

## Voice-Over Notes

Use this if recording a short learning video:

```text
Today I am wiring a robot car from the electronics side first.
The controller does not drive motors directly. It sends direction and speed signals to a motor driver.
The motor driver uses battery power to move the motors.
The key idea is common ground: without it, the driver cannot trust the controller signals.
Once the wiring is clear, the code becomes a translation layer.
Forward means left forward and right forward pins go HIGH, reverse pins go LOW, and PWM sets throttle.
In the simulator, the car movement is not magic. It is the visible result of those pin states.
```

## Evidence To Save

- screenshot of wiring
- final code
- short note on what failed first
- short note on how the simulation connected to real hardware logic
