const int LEFT_PWM = 5;
const int LEFT_FWD = 8;
const int LEFT_REV = 7;

const int RIGHT_PWM = 6;
const int RIGHT_FWD = 12;
const int RIGHT_REV = 11;

void setup() {
  Serial.begin(115200);

  pinMode(LEFT_PWM, OUTPUT);
  pinMode(LEFT_FWD, OUTPUT);
  pinMode(LEFT_REV, OUTPUT);
  pinMode(RIGHT_PWM, OUTPUT);
  pinMode(RIGHT_FWD, OUTPUT);
  pinMode(RIGHT_REV, OUTPUT);

  stopRobot();
  Serial.println("UBO car firmware ready");
}

void loop() {
  driveForward(180);
  delay(1500);

  pivotRight(165);
  delay(900);

  pivotLeft(165);
  delay(900);

  driveBackward(150);
  delay(1200);

  stopRobot();
  delay(1200);
}

void driveForward(int speed) {
  setLeftMotor(true, speed);
  setRightMotor(true, speed);
  logState("forward", speed, speed);
}

void driveBackward(int speed) {
  setLeftMotor(false, speed);
  setRightMotor(false, speed);
  logState("reverse", speed, speed);
}

void pivotRight(int speed) {
  setLeftMotor(true, speed);
  setRightMotor(false, speed);
  logState("pivot-right", speed, speed);
}

void pivotLeft(int speed) {
  setLeftMotor(false, speed);
  setRightMotor(true, speed);
  logState("pivot-left", speed, speed);
}

void stopRobot() {
  digitalWrite(LEFT_FWD, LOW);
  digitalWrite(LEFT_REV, LOW);
  digitalWrite(RIGHT_FWD, LOW);
  digitalWrite(RIGHT_REV, LOW);
  analogWrite(LEFT_PWM, 0);
  analogWrite(RIGHT_PWM, 0);
  logState("stop", 0, 0);
}

void setLeftMotor(bool forward, int speed) {
  digitalWrite(LEFT_FWD, forward ? HIGH : LOW);
  digitalWrite(LEFT_REV, forward ? LOW : HIGH);
  analogWrite(LEFT_PWM, clampSpeed(speed));
}

void setRightMotor(bool forward, int speed) {
  digitalWrite(RIGHT_FWD, forward ? HIGH : LOW);
  digitalWrite(RIGHT_REV, forward ? LOW : HIGH);
  analogWrite(RIGHT_PWM, clampSpeed(speed));
}

int clampSpeed(int speed) {
  return constrain(speed, 0, 255);
}

void logState(const char* state, int leftSpeed, int rightSpeed) {
  Serial.print("state=");
  Serial.print(state);
  Serial.print(" left=");
  Serial.print(leftSpeed);
  Serial.print(" right=");
  Serial.println(rightSpeed);
}
