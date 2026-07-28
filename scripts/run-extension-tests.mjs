import { downloadAndUnzipVSCode } from "@vscode/test-electron";
import { execFileSync, spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, open, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const workspaceRoot = process.cwd();
const lockPath = path.join(workspaceRoot, ".annil-test.lock");
const extensionTestsPath = path.join(workspaceRoot, "out", "_test", "index.js");
const testFilter = process.argv.slice(2).join(",").trim();
const testTarget = testFilter || "manual focus";
// 首次创建隔离 profile 时，VS Code 的 Extension Host 启动可能超过一分钟。
const timeoutMs = Number.parseInt(process.env.ANNIL_TEST_TIMEOUT_MS ?? "90000", 10);
const outputLimit = 12_000;
let testOutput = "";

let hasLock = false;
let profilePath = "";
let activeChild;
let timedOut = false;

if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
  throw new Error("ANNIL_TEST_TIMEOUT_MS 必须是正整数。");
}

function appendOutput(chunk) {
  testOutput = `${testOutput}${chunk.toString()}`.slice(-outputLimit);
}

async function isExecutable(filePath) {
  try {
    await access(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function isArm64Mac() {
  if (process.platform !== "darwin") return false;

  try {
    return execFileSync("sysctl", ["-n", "hw.optional.arm64"], { encoding: "utf8" }).trim() === "1";
  } catch {
    return false;
  }
}

function isUniversalArm64Executable(filePath) {
  try {
    return execFileSync("file", ["-b", filePath], { encoding: "utf8" }).includes("arm64");
  } catch {
    return false;
  }
}

function getLocalVscodeCandidates() {
  if (process.platform === "darwin") {
    return [
      "/Applications/Visual Studio Code.app/Contents/MacOS/Electron",
      path.join(process.env.HOME ?? "", "Applications/Visual Studio Code.app/Contents/MacOS/Electron"),
    ];
  }

  if (process.platform === "win32") {
    return [
      path.join(process.env.LOCALAPPDATA ?? "", "Programs/Microsoft VS Code/Code.exe"),
      path.join(process.env.ProgramFiles ?? "", "Microsoft VS Code/Code.exe"),
    ];
  }

  return ["/usr/share/code/code", "/usr/bin/code"];
}

async function resolveVscodeExecutablePath() {
  const configuredPath = process.env.VSCODE_TEST_EXECUTABLE_PATH;
  if (configuredPath !== undefined) {
    if (!await isExecutable(configuredPath)) {
      throw new Error(`VSCODE_TEST_EXECUTABLE_PATH 不可执行：${configuredPath}`);
    }
    return configuredPath;
  }

  for (const candidate of getLocalVscodeCandidates()) {
    if (await isExecutable(candidate)) return candidate;
  }

  process.stdout.write("未找到本机 VS Code，正在下载测试版本。\n");
  return downloadAndUnzipVSCode({
    version: process.env.VSCODE_TEST_VERSION ?? "1.123.0",
  });
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "EPERM") return true;
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

async function acquireTestLock() {
  try {
    const lockFile = await open(lockPath, "wx");
    await lockFile.writeFile(`${process.pid}\n`);
    await lockFile.close();
    hasLock = true;
    return;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }

  const previousPid = Number.parseInt((await readFile(lockPath, "utf8")).trim(), 10);
  if (Number.isSafeInteger(previousPid) && isProcessRunning(previousPid)) {
    throw new Error(`已有扩展测试进程正在运行（pid: ${previousPid}）。`);
  }

  // 测试命令被手动中断时 finally 不会执行；删除其遗留锁后重新原子创建。
  await rm(lockPath, { force: true });
  return acquireTestLock();
}

async function terminateProcess(child) {
  if (child.exitCode !== null || child.pid === undefined) return;

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]).once("close", resolve);
    });
    return;
  }

  // 测试进程在独立进程组中启动，避免遗留 Extension Host 子进程。
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
  await new Promise((resolve) => setTimeout(resolve, 3_000));
  if (child.exitCode === null) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
}

async function runExtensionTests() {
  const vscodeExecutablePath = await resolveVscodeExecutablePath();
  // macOS 的 TMPDIR 路径很长，会超过 Electron IPC Unix socket 的长度限制。
  const temporaryRoot = process.platform === "win32" ? tmpdir() : "/tmp";
  const profileRoot = path.join(temporaryRoot, `annil-test-${process.pid}-${Date.now()}`);
  profilePath = profileRoot;
  const args = [
    workspaceRoot,
    "--no-sandbox",
    "--disable-gpu-sandbox",
    "--disable-updates",
    "--skip-welcome",
    "--skip-release-notes",
    "--disable-workspace-trust",
    `--extensionTestsPath=${extensionTestsPath}`,
    `--extensionDevelopmentPath=${workspaceRoot}`,
    `--extensions-dir=${path.join(profileRoot, "extensions")}`,
    `--user-data-dir=${path.join(profileRoot, "user-data")}`,
  ];
  // 当前终端可能自身由 Rosetta 启动。对通用 VS Code 显式选择 arm64，
  // 避免测试窗口以 Intel 模拟模式运行并显著拖慢 Extension Host 启动。
  const useNativeArm64 = isArm64Mac() && isUniversalArm64Executable(vscodeExecutablePath);
  const command = useNativeArm64 ? "arch" : vscodeExecutablePath;
  const commandArgs = useNativeArm64 ? ["-arm64", vscodeExecutablePath, ...args] : args;
  const child = spawn(command, commandArgs, {
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      ...(testFilter === "" ? {} : { ANNIL_TEST_FILTER: testFilter }),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  activeChild = child;

  child.stdout.on("data", appendOutput);
  child.stderr.on("data", appendOutput);

  return new Promise((resolve, reject) => {
    child.once("error", (error) => {
      reject(error);
    });
    child.once("close", (code, signal) => {
      if (code !== 0) {
        reject(new Error(`Extension Host 退出异常：${code ?? signal ?? "unknown"}。`));
      } else {
        resolve();
      }
    });
  });
}

const watchdog = setTimeout(async () => {
  timedOut = true;
  if (activeChild !== undefined) await terminateProcess(activeChild);
  if (hasLock) await rm(lockPath, { force: true });
  if (profilePath) await rm(profilePath, { force: true, recursive: true });
  if (testOutput.trim()) process.stderr.write(`${testOutput.trim()}\n`);
  process.stderr.write(`FAIL extension tests (${testTarget}): 测试超时（${timeoutMs}ms）。\n`);
  process.exit(124);
}, timeoutMs);

try {
  await acquireTestLock();

  await runExtensionTests();

  process.stdout.write(`PASS extension tests (${testTarget})\n`);
} catch (error) {
  if (!timedOut) {
    if (testOutput.trim()) process.stderr.write(`${testOutput.trim()}\n`);
    process.stderr.write(`FAIL extension tests (${testTarget}): ${String(error)}\n`);
    process.exitCode = 1;
  }
} finally {
  clearTimeout(watchdog);
  if (hasLock) await rm(lockPath, { force: true });
  if (profilePath) await rm(profilePath, { force: true, recursive: true });
}
