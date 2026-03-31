/* eslint-env node */
import "dotenv/config";
import fs from "node:fs";
import cron from "node-cron";
import { Client } from "ssh2";

const DEFAULT_ANNOUNCEMENTS = [
  "[Zona Merah] Dummy announcement #1: Stay alert survivors, secure your base before nightfall.",
  "[Zona Merah] Dummy announcement #2: Join Discord for latest events, wipes, and server updates.",
];

const BOOL_TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function asBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return BOOL_TRUE_VALUES.has(String(value).trim().toLowerCase());
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function readPrivateKey() {
  const keyPath = process.env.SSH_PRIVATE_KEY_PATH;
  if (!keyPath) {
    return undefined;
  }

  return fs.readFileSync(keyPath);
}

function getSshConfig() {
  const port = Number(process.env.SSH_PORT ?? 22);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error("SSH_PORT must be a valid positive number.");
  }

  const config = {
    host: requireEnv("SSH_HOST"),
    port,
    username: requireEnv("SSH_USERNAME"),
    readyTimeout: 20_000,
  };

  const privateKey = readPrivateKey();
  if (privateKey) {
    config.privateKey = privateKey;
    if (process.env.SSH_PRIVATE_KEY_PASSPHRASE) {
      config.passphrase = process.env.SSH_PRIVATE_KEY_PASSPHRASE;
    }
  }

  if (process.env.SSH_PASSWORD) {
    config.password = process.env.SSH_PASSWORD;
  }

  if (!config.password && !config.privateKey) {
    throw new Error(
      "Provide SSH_PASSWORD or SSH_PRIVATE_KEY_PATH for SSH authentication."
    );
  }

  return config;
}

function buildRemoteCommand(message) {
  const lgsmScript = process.env.PZ_LGSM_SCRIPT ?? "./pzserver";
  const template =
    process.env.PZ_SENDSERVERMSG_COMMAND_TEMPLATE ??
    `${lgsmScript} send-servermsg {message}`;
  const withMessage = template.includes("{message}")
    ? template.replace("{message}", shellQuote(message))
    : `${template} ${shellQuote(message)}`;
  const serverDir = process.env.PZ_SERVER_DIR;

  if (!serverDir) {
    return withMessage;
  }

  return `cd ${shellQuote(serverDir)} && ${withMessage}`;
}

function loadAnnouncements() {
  const raw = process.env.PZ_ANNOUNCEMENTS;
  if (!raw) {
    return DEFAULT_ANNOUNCEMENTS;
  }

  const parsed = raw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parsed.length) {
    throw new Error("PZ_ANNOUNCEMENTS is set but contains no valid messages.");
  }

  return parsed;
}

function runCommandOverSsh(command) {
  const sshConfig = getSshConfig();

  return new Promise((resolve, reject) => {
    const conn = new Client();
    let settled = false;
    let stdout = "";
    let stderr = "";

    const resolveOnce = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    const rejectOnce = (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    conn.on("ready", () => {
      conn.exec(command, (error, stream) => {
        if (error) {
          conn.end();
          rejectOnce(error);
          return;
        }

        stream
          .on("close", (code) => {
            conn.end();
            if (code === 0) {
              resolveOnce({ code, stdout, stderr });
              return;
            }

            rejectOnce(
              new Error(
                `Remote command failed with exit code ${code}. stderr: ${stderr.trim()}`
              )
            );
          })
          .on("data", (chunk) => {
            stdout += chunk.toString();
          });

        stream.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });
      });
    });

    conn.on("error", (error) => {
      rejectOnce(error);
    });

    conn.connect(sshConfig);
  });
}

const announcements = loadAnnouncements();
const cronExpression = process.env.PZ_ANNOUNCEMENT_CRON ?? "0 * * * *";
const timezone = process.env.PZ_ANNOUNCEMENT_TIMEZONE ?? "Asia/Jakarta";
const runOnStart = asBoolean(process.env.PZ_ANNOUNCEMENT_RUN_ON_START, true);

if (!cron.validate(cronExpression)) {
  throw new Error(`Invalid cron expression: ${cronExpression}`);
}

let currentIndex = 0;
let isSending = false;

async function sendNextAnnouncement(trigger) {
  if (isSending) {
    console.warn(
      `[${new Date().toISOString()}] Previous send is still running, skipping ${trigger} run.`
    );
    return;
  }

  isSending = true;

  const message = announcements[currentIndex];
  const remoteCommand = buildRemoteCommand(message);
  const now = new Date().toISOString();

  try {
    console.log(
      `[${now}] Sending announcement ${currentIndex + 1}/${announcements.length} (${trigger}).`
    );
    const result = await runCommandOverSsh(remoteCommand);
    if (result.stdout.trim()) {
      console.log(result.stdout.trim());
    }
    if (result.stderr.trim()) {
      console.warn(result.stderr.trim());
    }
    console.log(`[${new Date().toISOString()}] Announcement sent successfully.`);
    currentIndex = (currentIndex + 1) % announcements.length;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Failed to send announcement:`,
      error.message
    );
  } finally {
    isSending = false;
  }
}

console.log(
  `[${new Date().toISOString()}] Hourly announcer started. Timezone=${timezone}, cron="${cronExpression}", announcements=${announcements.length}.`
);

cron.schedule(
  cronExpression,
  () => {
    void sendNextAnnouncement("cron");
  },
  { timezone }
);

if (runOnStart) {
  void sendNextAnnouncement("startup");
}
