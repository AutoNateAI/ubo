import { useEffect, useMemo, useState } from "react";
import {
  Cpu,
  Flag,
  Gauge,
  Github,
  Keyboard,
  LogIn,
  Moon,
  Play,
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

type StepId = "kit" | "wiring" | "coding" | "driving" | "race";

type LogEntry = {
  kind: ActionKind;
  label: string;
  time: string;
};

const steps: Array<{ id: StepId; label: string; icon: typeof Cpu }> = [
  { id: "kit", label: "Kit check", icon: Cpu },
  { id: "wiring", label: "Wiring", icon: Unplug },
  { id: "coding", label: "Coding", icon: Keyboard },
  { id: "driving", label: "Driving", icon: Route },
  { id: "race", label: "Race", icon: Flag },
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
  const [activeStep, setActiveStep] = useState<StepId>("kit");
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
  const [status, setStatus] = useState("Ready for a 60-minute build and race.");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

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
      ].slice(0, 9));
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
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Guest sign-in failed.");
    }
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

  return (
    <main className={`app ${theme}`}>
      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">GVSU Upward Bound Robotics Olympics</p>
          <h1>Build, tune, and race a virtual ESP32 go-kart in one hour.</h1>
          <p>
            Students move through the same physical workflow they would use at a
            workbench: inspect the kit, wire the board, tune code, test drive, then race.
          </p>
          <div className="heroActions">
            <button className="primary" onClick={() => void record("wiring", "Started kit workflow")}>
              <Play size={18} /> Start logging
            </button>
            <button className="iconButton" aria-label="Toggle theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
        <RealKitScene />
      </section>

      <section className="workspace">
        <aside className="panel authPanel">
          <div className="panelHeader">
            <LogIn size={18} />
            <h2>Team access</h2>
          </div>
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
          <div className="buttonRow">
            <button onClick={() => void handleEmailAuth("sign-in")}>Sign in</button>
            <button onClick={() => void handleEmailAuth("create")}>Create</button>
            <button onClick={() => void handleGuest()}>Guest</button>
          </div>
          {user && (
            <button className="quiet" onClick={() => void signOut(auth)}>
              Sign out {user.isAnonymous ? "guest" : user.email}
            </button>
          )}
          <p className="status">{status}</p>
        </aside>

        <section className="mainStage">
          <div className="stepBar" aria-label="Build steps">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  className={activeStep === step.id ? "selected" : ""}
                  onClick={() => {
                    setActiveStep(step.id);
                    void record(step.id === "kit" ? "wiring" : step.id === "race" ? "race" : step.id, `Opened ${step.label}`);
                  }}
                >
                  <Icon size={18} />
                  {step.label}
                </button>
              );
            })}
          </div>

          <div className="boardAndControls">
            <HardwareBoard activeStep={activeStep} />
            <section className="panel controls">
              <div className="panelHeader">
                <Gauge size={18} />
                <h2>Robot tuning</h2>
              </div>
              <Slider label="Speed curve" value={speed} setValue={setSpeed} />
              <Slider label="Steering trim" value={steering} setValue={setSteering} />
              <Slider label="Battery reserve" value={battery} setValue={setBattery} />
              <div className="metrics">
                <Metric icon={Timer} label="Score" value={score.toString()} />
                <Metric icon={Zap} label="Battery" value={`${battery}%`} />
                <Metric icon={Flag} label="Hits" value={collisions.toString()} />
              </div>
              <button className="primary" onClick={() => void runRace()}>
                <Flag size={18} /> Run race
              </button>
            </section>
          </div>

          <section className="codeAndReport">
            <div className="panel codePanel">
              <div className="panelHeader">
                <Keyboard size={18} />
                <h2>Robot brain</h2>
              </div>
              <textarea
                spellCheck={false}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                onBlur={() => void record("coding", "Edited robot brain", { codeLength: code.length })}
              />
              <button onClick={() => void record("ai_prompt", "Asked AI for tuning help", { codeLength: code.length })}>
                <Sparkles size={18} /> Log AI assist
              </button>
            </div>
            <div className="panel">
              <div className="panelHeader">
                <Save size={18} />
                <h2>Review report</h2>
              </div>
              <textarea
                className="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="What changed? What worked? What should the instructor review?"
              />
              <button className="primary" onClick={() => void finishReport()}>
                <Save size={18} /> Submit report
              </button>
            </div>
          </section>
        </section>

        <aside className="panel logPanel">
          <div className="panelHeader">
            <Github size={18} />
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
        </aside>
      </section>
    </main>
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
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
      <output>{value}</output>
    </label>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return (
    <div className="metric">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RealKitScene() {
  return (
    <div className="kitScene" aria-label="ESP32 robot kit on a classroom workbench">
      <div className="trackMat">
        <div className="trackLine" />
        <span className="cone coneOne" />
        <span className="cone coneTwo" />
      </div>
      <div className="kitCar">
        <span className="wheel leftFront" />
        <span className="wheel leftRear" />
        <span className="wheel rightFront" />
        <span className="wheel rightRear" />
        <div className="acrylicBase" />
        <div className="batteryPack"><span /></div>
        <div className="esp32Mini"><i /><i /><i /></div>
        <div className="driverMini"><b /><b /></div>
        <svg className="wiresMini" viewBox="0 0 260 160" role="img" aria-hidden="true">
          <path d="M90 65 C115 20 165 28 180 78" />
          <path d="M104 88 C138 120 166 115 198 82" />
          <path d="M72 92 C98 132 151 136 204 102" />
        </svg>
      </div>
    </div>
  );
}

function HardwareBoard({ activeStep }: { activeStep: StepId }) {
  return (
    <section className="hardware">
      <div className="woodBench">
        <div className={`esp32Board ${activeStep === "coding" ? "activePart" : ""}`}>
          <span className="usbPort" />
          <span className="chip">ESP32</span>
          {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
        </div>
        <div className={`motorDriver ${activeStep === "wiring" ? "activePart" : ""}`}>
          <span className="heatSink" />
          <span className="terminal terminalA" />
          <span className="terminal terminalB" />
          <strong>L298N</strong>
        </div>
        <div className={`battery ${activeStep === "driving" ? "activePart" : ""}`}>7.4V</div>
        <div className="motor motorLeft"><span /></div>
        <div className="motor motorRight"><span /></div>
        <svg className="wiringHarness" viewBox="0 0 760 460" aria-hidden="true">
          <path className="wire red" d="M255 166 C333 92 438 94 493 172" />
          <path className="wire black" d="M252 190 C322 235 427 232 493 200" />
          <path className="wire yellow" d="M561 212 C620 260 651 301 682 350" />
          <path className="wire blue" d="M494 236 C390 315 254 324 143 356" />
          <path className="wire green" d="M403 147 C426 84 528 71 612 98" />
        </svg>
      </div>
    </section>
  );
}
