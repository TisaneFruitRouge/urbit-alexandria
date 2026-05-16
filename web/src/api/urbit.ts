import Urbit from "@urbit/http-api";

const DEFAULT_SHIP = (import.meta.env.VITE_URBIT_SHIP as string | undefined) ?? "~zod";
const DEFAULT_DESK = "alexandria";
const CODE_STORAGE_KEY = "alexandria.urbitCode";

export const ship = window.ship ?? DEFAULT_SHIP;
export const desk = window.desk ?? DEFAULT_DESK;
export const shipUrls = window.shipUrls ?? parseShipUrls();

export const api = new Urbit("", "", desk);
api.ship = ship.replace(/^~/, "");

let connected = false;
let connectPromise: Promise<void> | null = null;

function getLoginCode() {
  const envCode = import.meta.env.VITE_URBIT_CODE as string | undefined;
  if (envCode) return envCode;

  const storedCode = window.sessionStorage.getItem(CODE_STORAGE_KEY);
  if (storedCode) return storedCode;

  const enteredCode = window.prompt("Enter the Urbit web login code from +code");
  if (!enteredCode) return null;

  const code = enteredCode.trim();
  window.sessionStorage.setItem(CODE_STORAGE_KEY, code);
  return code;
}

export async function connectUrbit() {
  if (connected) return;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const code = getLoginCode();
    if (!code) {
      throw new Error("Urbit login code required");
    }

    api.code = code;
    await api.connect();
    connected = true;
  })().catch((error) => {
    connectPromise = null;
    throw error;
  });

  return connectPromise;
}

export function clearUrbitLoginCode() {
  connected = false;
  connectPromise = null;
  window.sessionStorage.removeItem(CODE_STORAGE_KEY);
}

function parseShipUrls() {
  const raw = import.meta.env.VITE_URBIT_SHIP_URLS as string | undefined;
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    console.warn("Invalid VITE_URBIT_SHIP_URLS; expected JSON object");
    return {};
  }
}
