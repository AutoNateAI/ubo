import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const runDir = path.dirname(__filename);
const repoRoot = path.resolve(runDir, "../../../..");
const appUrl = process.env.UBO_APP_URL || "https://ubo.autonateai.com/";
const screenshotsDir = path.join(runDir, "screenshots");
const stagesDir = path.join(runDir, "velxio", "stages");
const finalProjectPath = path.join(runDir, "velxio", "ubo-car-drive.vlx");
const firmwarePath = path.join(runDir, "firmware", "robot_car_drive.ino");

const stageSpecs = [
  { id: "02-parts-layout", title: "UBO Car Drive - Parts Layout", wireIds: [] },
  {
    id: "03-power-ground",
    title: "UBO Car Drive - Power And Ground",
    wireIds: ["w-vcc1", "w-vcc2", "w-gnd1", "w-gnd2"],
  },
  {
    id: "04-direction-pwm",
    title: "UBO Car Drive - Direction And PWM",
    wireIds: [
      "w-vcc1",
      "w-vcc2",
      "w-gnd1",
      "w-gnd2",
      "w-left-pwm",
      "w-left-fwd",
      "w-left-rev",
      "w-right-pwm",
      "w-right-fwd",
      "w-right-rev",
    ],
  },
  { id: "05-motor-outputs", title: "UBO Car Drive - Motor Outputs", wireIds: null },
  { id: "06-firmware", title: "UBO Car Drive - Firmware", wireIds: null },
  { id: "07-run-checklist", title: "UBO Car Drive - Run Check", wireIds: null },
  { id: "09-live-editor", title: "UBO Car Drive - Live Editor", wireIds: null },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeProject(project, title, wireIds) {
  const firmware = fs.readFileSync(firmwarePath, "utf8");
  const selectedWireIds = wireIds ? new Set(wireIds) : null;
  return {
    ...project,
    exportedAt: new Date().toISOString(),
    name: title,
    boards: project.boards.map((board) => ({
      ...board,
      name: "UBO Car Controller",
      serialOutput: "",
      running: false,
      compiledProgram: null,
    })),
    fileGroups: {
      "group-arduino-uno": [{ name: "sketch.ino", content: firmware }],
    },
    wires: selectedWireIds ? project.wires.filter((wire) => selectedWireIds.has(wire.id)) : project.wires,
  };
}

function createStageFiles() {
  const finalProject = readJson(finalProjectPath);
  const normalizedFinal = normalizeProject(finalProject, "UBO Car Drive Practice", null);
  writeJson(finalProjectPath, normalizedFinal);

  return stageSpecs.map((stage) => {
    const stageProject = normalizeProject(finalProject, stage.title, stage.wireIds);
    const stagePath = path.join(stagesDir, `${stage.id}.vlx`);
    writeJson(stagePath, stageProject);
    return { ...stage, path: stagePath };
  });
}

async function findEditorFrame(page) {
  await page.waitForSelector('iframe[title="UBO wiring simulator"]', { timeout: 30000 });
  await page.waitForTimeout(8000);
  const frame = page
    .frames()
    .find((candidate) => /ubo-velxio-editor|localhost:3081|run\.app/.test(candidate.url()));

  if (!frame) {
    throw new Error("Could not find the embedded Velxio editor frame.");
  }

  await frame.locator("body").waitFor({ timeout: 30000 });
  return frame;
}

async function importProject(frame, stagePath) {
  await frame.locator('input[type="file"][accept*=".vlx"]').first().setInputFiles(stagePath);
  await frame.locator("text=UBO Car Controller").first().waitFor({ timeout: 30000 });
  await frame.waitForTimeout(2500);
}

async function clickIfVisible(scope, selector) {
  const locator = scope.locator(selector).first();
  if (await locator.isVisible().catch(() => false)) {
    await locator.click();
    return true;
  }
  return false;
}

async function capture(page, name) {
  await page.screenshot({
    path: path.join(screenshotsDir, `${name}.png`),
    fullPage: false,
  });
}

async function enterAppAsGuest(page) {
  await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByRole("button", { name: "Start session" }).click();
  await page.getByRole("button", { name: "Guest run" }).click();
  await page.getByText("Session dashboard").waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: /Wiring lab/i }).click();
  await page.waitForSelector('iframe[title="UBO wiring simulator"]', { timeout: 30000 });
}

async function run() {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  const stages = createStageFiles();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  try {
    await enterAppAsGuest(page);
    const frame = await findEditorFrame(page);
    await capture(page, "01-open-editor");

    for (const stage of stages) {
      await importProject(frame, stage.path);

      if (stage.id === "06-firmware") {
        await clickIfVisible(frame, 'button:has-text("Code")');
        await frame.locator("text=driveForward(180)").first().waitFor({ timeout: 30000 });
      } else {
        await clickIfVisible(frame, 'button:has-text("Circuit")');
      }

      if (stage.id === "07-run-checklist") {
        await clickIfVisible(frame, 'button:has-text("Both")');
        await clickIfVisible(frame, 'button:has-text("Run")');
        await clickIfVisible(frame, 'button:has-text("Run anyway")');
        await frame.waitForTimeout(5000);
      }

      await capture(page, stage.id);
    }

    await page.getByRole("button", { name: /Test drive/i }).click();
    await page.getByText("Balance speed, steering, and battery draw.").waitFor({ timeout: 15000 });
    await capture(page, "08-game-controls");
  } finally {
    await browser.close();
  }

  console.log(`Captured actual app screenshots into ${path.relative(repoRoot, screenshotsDir)}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
