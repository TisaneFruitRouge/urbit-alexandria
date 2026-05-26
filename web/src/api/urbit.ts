import Urbit from "@urbit/http-api";

const DEFAULT_SHIP = (import.meta.env.VITE_URBIT_SHIP as string | undefined) ?? inferShipFromHost() ?? "~zod";
const DEFAULT_DESK = "alexandria";
const CODE_STORAGE_KEY = "alexandria.urbitCode";

export let ship = normalizeShip(window.ship ?? DEFAULT_SHIP);
export let desk = window.desk ?? DEFAULT_DESK;
export const shipUrls = window.shipUrls ?? parseShipUrls();

export const api = new Urbit("", "", desk);
api.ship = shipWithoutSig(ship);

let connected = false;
let connectPromise: Promise<void> | null = null;
let identityPromise: Promise<void> | null = null;
const identityListeners = new Set<() => void>();

void discoverUrbitIdentity();

function getLoginCode() {
  const envCode = import.meta.env.VITE_URBIT_CODE as string | undefined;
  if (envCode) return envCode;

  const storedCode = window.sessionStorage.getItem(CODE_STORAGE_KEY);
  if (storedCode) return storedCode;

  if (!import.meta.env.DEV) return null;

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
    await discoverUrbitIdentity();

    const code = getLoginCode();
    if (!code && import.meta.env.DEV) {
      throw new Error("Urbit login code required");
    }

    if (code) {
      api.code = code;
      await api.connect();
    }

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

export function getUrbitIdentity() {
  return { ship, desk };
}

export function onUrbitIdentityChange(listener: () => void) {
  identityListeners.add(listener);
  return () => {
    identityListeners.delete(listener);
  };
}

export async function discoverUrbitIdentity() {
  if (identityPromise) return identityPromise;

  identityPromise = (async () => {
    try {
      const response = await fetch("/alexandria?meta=1", {
        credentials: "include",
        headers: { accept: "text/plain" },
      });
      if (!response.ok) return;

      const nextShip = (await response.text()).trim();
      if (nextShip) setUrbitIdentity(nextShip);
    } catch {
      // Local dev without a bound Gall backend still uses Vite/env defaults.
    }
  })();

  return identityPromise;
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

function setUrbitIdentity(nextShip: string, nextDesk = desk) {
  const normalizedShip = normalizeShip(nextShip);
  const normalizedDesk = nextDesk || DEFAULT_DESK;
  if (normalizedShip === ship && normalizedDesk === desk) return;

  ship = normalizedShip;
  desk = normalizedDesk;
  api.ship = shipWithoutSig(ship);
  api.desk = desk;

  for (const listener of identityListeners) listener();
}

function normalizeShip(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("~") ? trimmed : `~${trimmed}`;
}

function shipWithoutSig(value: string) {
  return normalizeShip(value).replace(/^~/, "");
}

function inferShipFromHost() {
  const host = window.location.hostname;
  if (host === "localhost" || host.endsWith(".localhost")) return null;

  const firstLabel = host.split(".")[0];
  return firstLabel && /^[a-z-]+$/.test(firstLabel) ? `~${firstLabel}` : null;
}
