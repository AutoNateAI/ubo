import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  CircuitBoard,
  ClipboardList,
  Code2,
  Flag,
  Gauge,
  Home,
  KeyRound,
  LogIn,
  Moon,
  Play,
  Radio,
  Route,
  Save,
  Sparkles,
  Sun,
  Timer,
  Unplug,
  Zap,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";
import { createSession, logAction, submitReport, type ActionKind } from "./api";

type Screen = "landing" | "auth" | "dashboard" | "lab";
type StepId = "kit" | "wiring" | "coding" | "driving" | "race";

type LogEntry = {
  kind: ActionKind;
  label: string;
  time: string;
};

const modules: Array<{
  id: StepId;
  label: string;
  kicker: string;
  icon: typeof CircuitBoard;
}> = [
  { id: "kit", label: "Kit check", kicker: "Parts and signal map", icon: CircuitBoard },
  { id: "wiring", label: "Wiring lab", kicker: "ESP32 to L298N harness", icon: Unplug },
  { id: "coding", label: "Robot brain", kicker: "Drive logic and AI assists", icon: Code2 },
  { id: "driving", label: "Test drive", kicker: "Telemetry and tuning", icon: Route },
  { id: "race", label: "Race control", kicker: "Timed run and report", icon: Flag },
];

const wiringChecks = [
  ["VIN", "7.4V battery +", "Power rail", "red"],
  ["GND", "Battery - and L298N GND", "Common reference", "black"],
  ["GPIO 26", "L298N IN1", "Left motor forward", "yellow"],
  ["GPIO 27", "L298N IN2", "Left motor reverse", "orange"],
  ["GPIO 14", "L298N IN3", "Right motor forward", "blue"],
  ["GPIO 12", "L298N IN4", "Right motor reverse", "green"],
];

const starterCode = `function drive(sensor) {
  const clear = sensor.front > 35;
  return {
    leftMotor: clear ? 78 : -35,
    rightMotor: clear ? 82 : 55,
    turbo: sensor.battery > 42 && clear
  };
}`;

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [screen, setScreen] = useState<Screen>("landing");
  const [activeStep, setActiveStep] = useState<StepId>("wiring");
  const [editorMode, setEditorMode] = useState<"code" | "both" | "circuit">("circuit");
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("Team Turbo");
  const [sessionId, setSessionId] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [code, setCode] = useState(starterCode);
  const [speed, setSpeed] = useState(62);
  const [steering, setSteering] = useState(56);
  const [battery, setBattery] = useState(88);
  const [collisions, setCollisions] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Ready.");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (user && screen === "auth") {
      setScreen("dashboard");
    }
  }, [screen, user]);

  const score = useMemo(
    () => Math.max(0, Math.round(speed * 1.7 + steering - collisions * 14 + battery * 0.35)),
    [battery, collisions, speed, steering],
  );

  async function ensureSession(currentUser = user) {
    if (!currentUser) {
      throw new Error("Sign in first.");
    }
    if (sessionId) {
      return sessionId;
    }
    const created = await createSession(currentUser, teamName);
    setSessionId(created.sessionId);
    return created.sessionId;
  }

  async function record(kind: ActionKind, label: string, detail: Record<string, unknown> = {}) {
    if (!user) {
      setStatus("Sign in to save this action.");
      setScreen("auth");
      return;
    }

    try {
      const currentSessionId = await ensureSession(user);
      await logAction(user, {
        kind,
        label,
        sessionId: currentSessionId,
        detail: { ...detail, activeStep, score, speed, steering, battery, collisions },
      });
      setLogs((current) => [
        { kind, label, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) },
        ...current,
      ].slice(0, 12));
      setStatus(`Saved: ${label}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save action.");
    }
  }

  async function handleEmailAuth(mode: "sign-in" | "create") {
    try {
      const credential =
        mode === "create"
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password);
      const created = await createSession(credential.user, teamName);
      setSessionId(created.sessionId);
      setStatus("Signed in and session started.");
      setScreen("dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  async function handleGuest() {
    try {
      const credential = await signInAnonymously(auth);
      const created = await createSession(credential.user, teamName);
      setSessionId(created.sessionId);
      setStatus("Guest session started.");
      setScreen("dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Guest sign-in failed.");
    }
  }

  async function openModule(step: StepId) {
    setActiveStep(step);
    setScreen("lab");
    const kind: ActionKind =
      step === "race" ? "race" : step === "coding" ? "coding" : step === "driving" ? "driving" : "wiring";
    await record(kind, `Opened ${modules.find((module) => module.id === step)?.label || step}`);
  }

  async function runRace() {
    const variance = Math.round(Math.random() * 18 - 8);
    const nextSpeed = Math.min(98, Math.max(30, speed + variance));
    const nextBattery = Math.max(12, battery - Math.round(nextSpeed / 12));
    const nextCollisions = collisions + (steering < 50 ? 1 : 0) + (nextSpeed > 88 ? 1 : 0);
    setSpeed(nextSpeed);
    setBattery(nextBattery);
    setCollisions(nextCollisions);
    setActiveStep("race");
    await record("race", "Ran timed race", { nextSpeed, nextBattery, nextCollisions });
  }

  async function finishReport() {
    if (!user) {
      setStatus("Sign in before submitting a report.");
      setScreen("auth");
      return;
    }
    try {
      const currentSessionId = await ensureSession(user);
      await submitReport(user, { sessionId: currentSessionId, teamName, notes, score });
      await record("report", "Submitted review report", { notesLength: notes.length });
      setStatus("Report submitted for review.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Report submit failed.");
    }
  }

  const shellProps = {
    theme,
    user,
    status,
    setTheme,
    setScreen,
  };

  return (
    <main className={`app ${theme}`}>
      {screen === "landing" && (
        <LandingScreen
          {...shellProps}
          onStart={() => setScreen(user ? "dashboard" : "auth")}
          onPreview={() => {
            setActiveStep("wiring");
            setScreen("lab");
          }}
        />
      )}
      {screen === "auth" && (
        <AuthScreen
          {...shellProps}
          email={email}
          password={password}
          teamName={teamName}
          setEmail={setEmail}
          setPassword={setPassword}
          setTeamName={setTeamName}
          onEmailAuth={handleEmailAuth}
          onGuest={handleGuest}
        />
      )}
      {screen === "dashboard" && (
        <DashboardScreen
          {...shellProps}
          teamName={teamName}
          score={score}
          battery={battery}
          logs={logs}
          onOpenModule={openModule}
        />
      )}
      {screen === "lab" && (
        <LabScreen
          {...shellProps}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          code={code}
          setCode={setCode}
          speed={speed}
          setSpeed={setSpeed}
          steering={steering}
          setSteering={setSteering}
          battery={battery}
          setBattery={setBattery}
          collisions={collisions}
          notes={notes}
          setNotes={setNotes}
          score={score}
          logs={logs}
          editorMode={editorMode}
          setEditorMode={setEditorMode}
          onRecord={record}
          onRunRace={runRace}
          onFinishReport={finishReport}
        />
      )}
    </main>
  );
}

function TopBar({
  theme,
  user,
  status,
  setTheme,
  setScreen,
}: {
  theme: "light" | "dark";
  user: User | null;
  status: string;
  setTheme: (theme: "light" | "dark") => void;
  setScreen: (screen: Screen) => void;
}) {
  return (
    <header className="topBar">
      <button className="brandButton" onClick={() => setScreen("landing")}>
        <CircuitBoard size={20} />
        <span>UBO Robotics</span>
      </button>
      <nav>
        <button onClick={() => setScreen("landing")}><Home size={17} /> Home</button>
        <button onClick={() => setScreen(user ? "dashboard" : "auth")}><ClipboardList size={17} /> Dashboard</button>
        <button onClick={() => setScreen("lab")}><Unplug size={17} /> Lab</button>
      </nav>
      <div className="topActions">
        <span className="topStatus">{status}</span>
        <button className="iconButton" aria-label="Toggle theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        {user ? (
          <button onClick={() => void signOut(auth)}><KeyRound size={17} /> Sign out</button>
        ) : (
          <button onClick={() => setScreen("auth")}><LogIn size={17} /> Sign in</button>
        )}
      </div>
    </header>
  );
}

function LandingScreen({
  onStart,
  onPreview,
  ...shell
}: Parameters<typeof TopBar>[0] & { onStart: () => void; onPreview: () => void }) {
  return (
    <>
      <TopBar {...shell} />
      <section className="landing">
        <div className="landingCopy">
          <p className="eyebrow">GVSU Upward Bound Robotics Olympics</p>
          <h1>One hour. One robot. Real engineering habits.</h1>
          <p>
            A virtual ESP32 go-kart lab where students inspect hardware, wire a motor
            controller, tune code, test drive, and race while every meaningful action is logged.
          </p>
          <div className="heroActions">
            <button className="primary" onClick={onStart}><Play size={18} /> Start session</button>
            <button onClick={onPreview}><Unplug size={18} /> Preview wiring lab</button>
          </div>
        </div>
        <RealBenchHero />
      </section>
      <section className="landingBand">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div className="moduleStrip" key={module.id}>
              <Icon size={20} />
              <strong>{module.label}</strong>
              <span>{module.kicker}</span>
            </div>
          );
        })}
      </section>
    </>
  );
}

function AuthScreen({
  email,
  password,
  teamName,
  setEmail,
  setPassword,
  setTeamName,
  onEmailAuth,
  onGuest,
  ...shell
}: Parameters<typeof TopBar>[0] & {
  email: string;
  password: string;
  teamName: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setTeamName: (value: string) => void;
  onEmailAuth: (mode: "sign-in" | "create") => Promise<void>;
  onGuest: () => Promise<void>;
}) {
  return (
    <>
      <TopBar {...shell} />
      <section className="authScreen">
        <div>
          <p className="eyebrow">Team access</p>
          <h1>Sign in before the lab clock starts.</h1>
          <p>
            The session connects your team name to wiring, coding, AI-assist, drive,
            race, and report events for review afterward.
          </p>
        </div>
        <form className="authCard" onSubmit={(event) => event.preventDefault()}>
          <label>
            Team name
            <input value={teamName} onChange={(event) => setTeamName(event.target.value)} />
          </label>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@example.com" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="8+ characters" />
          </label>
          <div className="authActions">
            <button className="primary" onClick={() => void onEmailAuth("sign-in")}>Sign in</button>
            <button onClick={() => void onEmailAuth("create")}>Create account</button>
            <button onClick={() => void onGuest()}>Guest run</button>
          </div>
        </form>
      </section>
    </>
  );
}

function DashboardScreen({
  teamName,
  score,
  battery,
  logs,
  onOpenModule,
  ...shell
}: Parameters<typeof TopBar>[0] & {
  teamName: string;
  score: number;
  battery: number;
  logs: LogEntry[];
  onOpenModule: (step: StepId) => Promise<void>;
}) {
  return (
    <>
      <TopBar {...shell} />
      <section className="dashboard">
        <div className="dashboardHeader">
          <div>
            <p className="eyebrow">{teamName}</p>
            <h1>Session dashboard</h1>
          </div>
          <div className="dashboardStats">
            <Metric icon={Timer} label="Score" value={score.toString()} />
            <Metric icon={Zap} label="Battery" value={`${battery}%`} />
            <Metric icon={Radio} label="Logs" value={logs.length.toString()} />
          </div>
        </div>
        <div className="moduleGrid">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button className="moduleCard" key={module.id} onClick={() => void onOpenModule(module.id)}>
                <Icon size={24} />
                <span>{module.kicker}</span>
                <strong>{module.label}</strong>
              </button>
            );
          })}
        </div>
        <ActionStream logs={logs} />
      </section>
    </>
  );
}

function LabScreen({
  activeStep,
  setActiveStep,
  code,
  setCode,
  speed,
  setSpeed,
  steering,
  setSteering,
  battery,
  setBattery,
  collisions,
  notes,
  setNotes,
  score,
  logs,
  editorMode,
  setEditorMode,
  onRecord,
  onRunRace,
  onFinishReport,
  ...shell
}: Parameters<typeof TopBar>[0] & {
  activeStep: StepId;
  setActiveStep: (step: StepId) => void;
  code: string;
  setCode: (value: string) => void;
  speed: number;
  setSpeed: (value: number) => void;
  steering: number;
  setSteering: (value: number) => void;
  battery: number;
  setBattery: (value: number) => void;
  collisions: number;
  notes: string;
  setNotes: (value: string) => void;
  score: number;
  logs: LogEntry[];
  editorMode: "code" | "both" | "circuit";
  setEditorMode: (mode: "code" | "both" | "circuit") => void;
  onRecord: (kind: ActionKind, label: string, detail?: Record<string, unknown>) => Promise<void>;
  onRunRace: () => Promise<void>;
  onFinishReport: () => Promise<void>;
}) {
  return (
    <>
      <TopBar {...shell} />
      <section className="labShell">
        <aside className="labRail">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                className={activeStep === module.id ? "selected" : ""}
                onClick={() => {
                  setActiveStep(module.id);
                  const kind: ActionKind =
                    module.id === "race" ? "race" : module.id === "coding" ? "coding" : module.id === "driving" ? "driving" : "wiring";
                  void onRecord(kind, `Opened ${module.label}`);
                }}
              >
                <Icon size={18} />
                <span>{module.label}</span>
              </button>
            );
          })}
        </aside>
        <section className="labMain">
          {activeStep === "wiring" || activeStep === "kit" ? (
            <WiringLab
              code={code}
              setCode={setCode}
              editorMode={editorMode}
              setEditorMode={setEditorMode}
              onRecord={onRecord}
            />
          ) : activeStep === "coding" ? (
            <CodingLab code={code} setCode={setCode} onRecord={onRecord} />
          ) : activeStep === "driving" ? (
            <DrivingLab
              speed={speed}
              setSpeed={setSpeed}
              steering={steering}
              setSteering={setSteering}
              battery={battery}
              setBattery={setBattery}
              collisions={collisions}
              score={score}
              onRunRace={onRunRace}
            />
          ) : (
            <RaceLab notes={notes} setNotes={setNotes} score={score} logs={logs} onRunRace={onRunRace} onFinishReport={onFinishReport} />
          )}
        </section>
      </section>
    </>
  );
}

function WiringLab({
  code,
  setCode,
  editorMode,
  setEditorMode,
  onRecord,
}: {
  code: string;
  setCode: (value: string) => void;
  editorMode: "code" | "both" | "circuit";
  setEditorMode: (mode: "code" | "both" | "circuit") => void;
  onRecord: (kind: ActionKind, label: string, detail?: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <VelxioStyleEditor
      code={code}
      setCode={setCode}
      editorMode={editorMode}
      setEditorMode={setEditorMode}
      onRecord={onRecord}
    />
  );
}

function VelxioStyleEditor({
  code,
  setCode,
  editorMode,
  setEditorMode,
  onRecord,
}: {
  code: string;
  setCode: (value: string) => void;
  editorMode: "code" | "both" | "circuit";
  setEditorMode: (mode: "code" | "both" | "circuit") => void;
  onRecord: (kind: ActionKind, label: string, detail?: Record<string, unknown>) => Promise<void>;
}) {
  const showCode = editorMode === "code" || editorMode === "both";
  const showCircuit = editorMode === "circuit" || editorMode === "both";

  return (
    <section className="simEditor">
      <header className="simTopbar">
        <div className="simBrand"><CircuitBoard size={19} /> Robotics Lab</div>
        <button className={editorMode === "code" ? "active" : ""} onClick={() => setEditorMode("code")}><Code2 size={16} /> Code</button>
        <button className={editorMode === "both" ? "active" : ""} onClick={() => setEditorMode("both")}><PanelIcon /> Both</button>
        <button className={editorMode === "circuit" ? "active" : ""} onClick={() => setEditorMode("circuit")}><CircuitBoard size={16} /> Circuit</button>
        <span className="simDivider" />
        <button title="Verify wiring" onClick={() => void onRecord("wiring", "Verified ESP32 motor harness", { checks: wiringChecks.length })}>
          <CheckCircle2 size={16} /> Verify
        </button>
        <button className="runButton" onClick={() => void onRecord("driving", "Ran simulator from wiring editor", { editorMode })}>
          <Play size={16} /> Run
        </button>
        <button title="Stop"><span className="stopIcon" /></button>
        <button title="Reset"><RotateIcon /></button>
        <span className="simDivider" />
        <button><Bot size={16} /> ESP32 DevKit</button>
        <button><Radio size={16} /> Serial</button>
        <button><Gauge size={16} /> Scope</button>
        <button><span className="minusIcon" /> 135% <span className="plusIcon" /></button>
        <button className="addButton">+ Add</button>
      </header>

      <div className={`simBody mode-${editorMode}`}>
        <aside className="simSidebar">
          <div className="sideToolbar">
            <button title="New lab">+</button>
            <button title="Import">↑</button>
            <button title="Save"><Save size={15} /></button>
          </div>
          <p>WORKSPACE</p>
          <button className="treeItem active"><CircuitBoard size={16} /> ESP32 go-kart</button>
          <button className="treeItem"><Code2 size={16} /> robot_brain.js</button>
          <button className="treeItem"><Unplug size={16} /> wiring.json</button>
          <div className="simChecklist">
            <strong>Harness</strong>
            {wiringChecks.map(([pin, target, reason, color]) => (
              <button
                key={pin}
                onClick={() => void onRecord("wiring", `Checked ${pin} to ${target}`, { pin, target, reason })}
              >
                <i className={`dot ${color}`} />
                <span>{pin}</span>
              </button>
            ))}
          </div>
        </aside>

        {showCode && (
          <section className="simCodePane">
            <div className="editorTab">robot_brain.js <span>×</span></div>
            <textarea
              className="simCodeEditor"
              value={code}
              spellCheck={false}
              onChange={(event) => setCode(event.target.value)}
              onBlur={() => void onRecord("coding", "Edited robot brain from simulator", { codeLength: code.length })}
            />
            <div className="outputConsole">
              <strong>OUTPUT</strong>
              <span>Ready: ESP32 harness mapped to L298N motor driver</span>
              <span>Serial: waiting for run</span>
            </div>
          </section>
        )}

        {showCircuit && (
          <section className="simCanvas">
            <div className="canvasStatus">DC&nbsp;&nbsp;SPICE 8 nets&nbsp;&nbsp;0 ms</div>
            <RealisticCircuitCanvas />
            <div className="miniMap"><span /></div>
          </section>
        )}
      </div>
    </section>
  );
}

function PanelIcon() {
  return (
    <span className="panelIcon" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

function RotateIcon() {
  return <span className="rotateIcon" aria-hidden="true" />;
}

function RealisticCircuitCanvas() {
  return (
    <div className="realCircuit">
      <svg className="circuitWires" viewBox="0 0 1320 760" aria-hidden="true">
        <path className="velWire red" d="M422 336 H770 V214 H858" />
        <path className="velWire black" d="M408 356 H690 V510 H1026 V314" />
        <path className="velWire yellow" d="M410 278 H736 V270 H858" />
        <path className="velWire orange" d="M410 300 H736 V292 H858" />
        <path className="velWire blue" d="M410 322 H736 V314 H858" />
        <path className="velWire green" d="M410 344 H736 V336 H858" />
        <path className="velWire motorLeftWire" d="M1000 250 H1122 V198" />
        <path className="velWire motorRightWire" d="M1000 344 H1122 V398" />
      </svg>
      <ArduinoUnoReal />
      <L298NReal />
      <MotorPart className="motorPartLeft" label="Motor A" />
      <MotorPart className="motorPartRight" label="Motor B" />
      <BatteryPart />
      <UltrasonicPart />
      <div className="voltageProbe">7.4V</div>
      <div className="logicProbe">PWM 1.2 kHz</div>
    </div>
  );
}

function ArduinoUnoReal() {
  const digitalPins = ["AREF", "GND", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "0"];
  const powerPins = ["RESET", "3V3", "5V", "GND", "GND", "VIN"];
  const analogPins = ["A0", "A1", "A2", "A3", "A4", "A5"];

  return (
    <div className="arduinoReal">
      <div className="usbJack" />
      <div className="barrelJack" />
      <div className="resetButton" />
      <div className="unoLogo">UNO</div>
      <div className="arduinoMark">ARDUINO</div>
      <div className="mcuChip" />
      <div className="crystal" />
      <div className="ledOn">ON</div>
      <div className="pinHeader digitalHeader">
        {digitalPins.map((pin) => <span key={pin} data-pin={pin} />)}
      </div>
      <div className="pinHeader powerHeader">
        {powerPins.map((pin) => <span key={pin} data-pin={pin} />)}
      </div>
      <div className="pinHeader analogHeader">
        {analogPins.map((pin) => <span key={pin} data-pin={pin} />)}
      </div>
      <div className="pinLabels digitalLabels">{digitalPins.map((pin) => <small key={pin}>{pin}</small>)}</div>
      <div className="pinLabels powerLabels">{powerPins.map((pin) => <small key={pin}>{pin}</small>)}</div>
      <div className="pinLabels analogLabels">{analogPins.map((pin) => <small key={pin}>{pin}</small>)}</div>
    </div>
  );
}

function L298NReal() {
  return (
    <div className="l298nReal">
      <div className="heatSinkReal" />
      <div className="driverChip left" />
      <div className="driverChip right" />
      <div className="blueTerminal top" />
      <div className="blueTerminal bottom" />
      <span className="l298Label">L298N</span>
      <div className="driverPins inputPins">{Array.from({ length: 6 }, (_, index) => <i key={index} />)}</div>
      <div className="driverPins outputPins">{Array.from({ length: 4 }, (_, index) => <i key={index} />)}</div>
    </div>
  );
}

function MotorPart({ className, label }: { className: string; label: string }) {
  return (
    <div className={`motorReal ${className}`}>
      <div className="motorCan" />
      <div className="shaft" />
      <span>{label}</span>
    </div>
  );
}

function BatteryPart() {
  return (
    <div className="batteryReal">
      <span>7.4V Li-ion</span>
      <strong>88%</strong>
    </div>
  );
}

function UltrasonicPart() {
  return (
    <div className="ultrasonicReal">
      <i />
      <i />
      <span>HC-SR04</span>
    </div>
  );
}

function CodingLab({
  code,
  setCode,
  onRecord,
}: {
  code: string;
  setCode: (value: string) => void;
  onRecord: (kind: ActionKind, label: string, detail?: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <div className="codingLab">
      <div className="labTitle">
        <div>
          <p className="eyebrow">Robot brain</p>
          <h1>Tune the drive loop.</h1>
        </div>
        <button onClick={() => void onRecord("ai_prompt", "Asked AI for tuning help", { codeLength: code.length })}>
          <Sparkles size={18} /> Log AI assist
        </button>
      </div>
      <textarea
        className="codeEditor"
        spellCheck={false}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        onBlur={() => void onRecord("coding", "Edited robot brain", { codeLength: code.length })}
      />
    </div>
  );
}

function DrivingLab({
  speed,
  setSpeed,
  steering,
  setSteering,
  battery,
  setBattery,
  collisions,
  score,
  onRunRace,
}: {
  speed: number;
  setSpeed: (value: number) => void;
  steering: number;
  setSteering: (value: number) => void;
  battery: number;
  setBattery: (value: number) => void;
  collisions: number;
  score: number;
  onRunRace: () => Promise<void>;
}) {
  return (
    <div className="drivingLab">
      <div className="labTitle">
        <div>
          <p className="eyebrow">Test drive</p>
          <h1>Balance speed, steering, and battery draw.</h1>
        </div>
        <button className="primary" onClick={() => void onRunRace()}><Flag size={18} /> Run test</button>
      </div>
      <div className="driveGrid">
        <RaceTrackPreview />
        <section className="controlPanel">
          <Slider label="Speed curve" value={speed} setValue={setSpeed} />
          <Slider label="Steering trim" value={steering} setValue={setSteering} />
          <Slider label="Battery reserve" value={battery} setValue={setBattery} />
          <div className="dashboardStats">
            <Metric icon={Timer} label="Score" value={score.toString()} />
            <Metric icon={Zap} label="Battery" value={`${battery}%`} />
            <Metric icon={Flag} label="Hits" value={collisions.toString()} />
          </div>
        </section>
      </div>
    </div>
  );
}

function RaceLab({
  notes,
  setNotes,
  score,
  logs,
  onRunRace,
  onFinishReport,
}: {
  notes: string;
  setNotes: (value: string) => void;
  score: number;
  logs: LogEntry[];
  onRunRace: () => Promise<void>;
  onFinishReport: () => Promise<void>;
}) {
  return (
    <div className="raceLab">
      <div className="labTitle">
        <div>
          <p className="eyebrow">Race control</p>
          <h1>Run the final heat and submit evidence.</h1>
        </div>
        <button className="primary" onClick={() => void onRunRace()}><Flag size={18} /> Run race</button>
      </div>
      <div className="raceGrid">
        <RaceTrackPreview />
        <section className="reportPanel">
          <Metric icon={Timer} label="Current score" value={score.toString()} />
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What changed? What worked? What should the instructor review?" />
          <button className="primary" onClick={() => void onFinishReport()}><Save size={18} /> Submit report</button>
        </section>
        <ActionStream logs={logs} />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
}) {
  return (
    <label className="slider">
      <span>{label}</span>
      <input type="range" min="0" max="100" value={value} onChange={(event) => setValue(Number(event.target.value))} />
      <output>{value}</output>
    </label>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Bot; label: string; value: string }) {
  return (
    <div className="metric">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ActionStream({ logs }: { logs: LogEntry[] }) {
  return (
    <section className="actionStream">
      <div className="panelHeader">
        <Radio size={18} />
        <h2>Action stream</h2>
      </div>
      {logs.length === 0 ? (
        <p className="empty">No saved actions yet.</p>
      ) : (
        logs.map((log, index) => (
          <div className="logItem" key={`${log.time}-${index}`}>
            <span>{log.kind}</span>
            <strong>{log.label}</strong>
            <small>{log.time}</small>
          </div>
        ))
      )}
    </section>
  );
}

function RealBenchHero() {
  return (
    <div className="benchHero" aria-label="ESP32 robot kit on a lab bench">
      <div className="heroSupply"><span>7.4V</span><strong>1.2A</strong></div>
      <div className="heroBoard">
        <span className="heroChip">ESP32</span>
        {Array.from({ length: 16 }, (_, index) => <i key={index} />)}
      </div>
      <div className="heroDriver"><b />L298N</div>
      <div className="heroMotor leftMotorHero" />
      <div className="heroMotor rightMotorHero" />
      <svg viewBox="0 0 760 420" aria-hidden="true">
        <path className="wire red" d="M190 120 C300 48 434 54 520 138" />
        <path className="wire black" d="M188 154 C310 228 435 224 520 172" />
        <path className="wire yellow" d="M274 148 C350 96 432 101 522 205" />
        <path className="wire blue" d="M548 244 C624 274 650 308 680 348" />
      </svg>
    </div>
  );
}

function HardwareBoard() {
  return (
    <div className="labBoard">
      <div className="breadboard">
        {Array.from({ length: 70 }, (_, index) => <span key={index} />)}
      </div>
      <div className="esp32Board">
        <span className="usbPort" />
        <span className="chip">ESP32</span>
        {Array.from({ length: 24 }, (_, index) => <i key={index} />)}
      </div>
      <div className="motorDriver">
        <span className="heatSink" />
        <span className="terminal terminalA" />
        <span className="terminal terminalB" />
        <strong>L298N</strong>
      </div>
      <div className="battery">7.4V</div>
      <div className="motor motorLeft"><span /></div>
      <div className="motor motorRight"><span /></div>
      <svg className="wiringHarness" viewBox="0 0 820 500" aria-hidden="true">
        <path className="wire red" d="M236 142 C328 58 492 70 578 158" />
        <path className="wire black" d="M236 174 C340 250 486 245 578 188" />
        <path className="wire yellow" d="M260 208 C378 145 462 153 578 225" />
        <path className="wire orange" d="M262 232 C380 305 486 296 602 252" />
        <path className="wire blue" d="M648 244 C706 294 735 338 765 390" />
        <path className="wire green" d="M578 262 C454 357 284 360 142 396" />
      </svg>
    </div>
  );
}

function RaceTrackPreview() {
  return (
    <div className="raceTrack">
      <div className="trackLane" />
      <span className="trackCone coneA" />
      <span className="trackCone coneB" />
      <span className="trackCone coneC" />
      <div className="raceCar">
        <span />
        <strong />
      </div>
    </div>
  );
}
