import { spawn } from "node:child_process";

const viteBin = process.platform === "win32"
  ? "node_modules/.bin/vite.cmd"
  : "node_modules/.bin/vite";

const busUrl = process.env.BUS_URL ?? "http://localhost";
const zodUrl = process.env.ZOD_URL ?? "http://localhost:8080";
const shipUrls = JSON.stringify({ "~bus": busUrl, "~zod": zodUrl });

const servers = [
  {
    label: "bus",
    port: "5174",
    env: {
      VITE_URBIT_SHIP: "~bus",
      VITE_URBIT_URL: busUrl,
      VITE_URBIT_SHIP_URLS: shipUrls,
    },
  },
  {
    label: "zod",
    port: "5173",
    env: {
      VITE_URBIT_SHIP: "~zod",
      VITE_URBIT_URL: zodUrl,
      VITE_URBIT_SHIP_URLS: shipUrls,
    },
  },
];

const children = servers.map(({ label, port, env }) => {
  const child = spawn(
    viteBin,
    ["--host", "0.0.0.0", "--port", port, "--strictPort"],
    {
      env: { ...process.env, ...env },
      stdio: ["inherit", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => writePrefixed(label, chunk));
  child.stderr.on("data", (chunk) => writePrefixed(label, chunk));
  child.on("exit", (code) => {
    if (code === 0) return;
    console.error(`[${label}] exited with code ${code}`);
    shutdown();
  });

  return child;
});

function writePrefixed(label, chunk) {
  for (const line of chunk.toString().split(/\r?\n/)) {
    if (line.length > 0) console.log(`[${label}] ${line}`);
  }
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(143);
});
