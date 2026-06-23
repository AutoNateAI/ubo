# Voice-Over Draft

This mini practice connects electronics to robot behavior.

First, I place the controller, motor driver, motors, and battery. I want the layout to show the real signal flow: controller on one side, driver in the middle, motors on the output side.

The motor driver matters because the controller pins are logic signals. They are not meant to power motors directly. The driver listens to direction pins and PWM speed pins, then uses battery power to move the motors.

The most important wiring idea is common ground. The controller ground, motor-driver ground, and battery negative need a shared reference. Without that, a HIGH signal from the controller may not mean anything reliable to the driver.

Then I wire direction pins. For the left motor, one pin means forward and one pin means reverse. The right motor uses the same idea. After that, I wire PWM pins for speed.

Now the code becomes a translation layer. `driveForward()` sets both motors forward and writes PWM speed. `turnRight()` drives the left side forward and the right side backward. `stopRobot()` turns off both direction pairs and sets speed to zero.

When I run the simulation, I am watching for the link between pin state and robot state. If the serial monitor says forward, the motor behavior should match. If it does not, I debug power, ground, direction pins, and PWM in that order.

The bigger idea is that game logic can grow out of this same loop. Hardware signals become state. State becomes motion. Motion becomes strategy.
