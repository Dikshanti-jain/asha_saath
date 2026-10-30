import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { AppState, Platform } from "react-native";
import type { Actor, Lang, MobileState } from "./types";
import {
  ApiError,
  apiRequest,
  commandEnvelope,
  normalizeBase,
  type ApiResult,
} from "./api";
import {
  readCredential,
  saveCredential,
  type Credential,
} from "./session-vault";
const initialBase =
  Platform.OS === "web"
    ? ""
    : (process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:5186");
interface Context {
  state: MobileState | null;
  actor: Actor | null;
  actors: Actor[];
  lang: Lang;
  setLang: (v: Lang) => void;
  t: (en: string, hi: string) => string;
  busy: boolean;
  ready: boolean;
  error: string | null;
  notice: string | null;
  lastCheckedAt: number | null;
  base: string;
  setServer: (base: string) => Promise<void>;
  login: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  command: <T = unknown>(name: string, args: unknown[]) => Promise<T>;
}
const MobileContext = createContext<Context | null>(null);
export function MobileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MobileState | null>(null),
    [actor, setActor] = useState<Actor | null>(null),
    [actors, setActors] = useState<Actor[]>([]),
    [lang, setLang] = useState<Lang>("en"),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState<string | null>(null),
    [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null),
    [base, setBase] = useState(initialBase);
  const credential = useRef<Credential | null>(null),
    version = useRef(0),
    epoch = useRef(0),
    pending = useRef(false),
    baseRef = useRef(base),
    actorRef = useRef<Actor | null>(null);
  const clear = useCallback(() => {
    setState(null);
    setActor(null);
    actorRef.current = null;
    version.current = 0;
    setLastCheckedAt(null);
  }, []);
  const apply = useCallback((data: ApiResult) => {
    if (data.version < version.current) return;
    setState(data.state);
    setActor(data.session);
    actorRef.current = data.session;
    version.current = data.version;
    setLastCheckedAt(Date.now());
    setError(null);
  }, []);
  const expire = useCallback(async () => {
    ++epoch.current;
    credential.current = null;
    clear();
    await saveCredential(null);
  }, [clear]);
  const refresh = useCallback(async () => {
    const generation = epoch.current;
    if (!credential.current) return;
    try {
      const data = await apiRequest(
        baseRef.current,
        "state",
        credential.current.token,
      );
      if (generation === epoch.current) apply(data);
    } catch (e) {
      if (generation === epoch.current) {
        if (e instanceof ApiError && e.status === 401) await expire();
        else if (actorRef.current?.role === "provider") setState(null);
        setError((e as Error).message);
      }
      throw e;
    }
  }, [apply, expire]);
  useEffect(() => {
    let cancelled = false;
    const generation = epoch.current;
    void (async () => {
      try {
        const saved = await readCredential();
        if (cancelled || generation !== epoch.current) return;
        if (saved && saved.expiresAt > Date.now()) {
          credential.current = saved;
          baseRef.current = saved.base;
          setBase(saved.base);
        } else await saveCredential(null);
        const session = await apiRequest(
          baseRef.current,
          "session",
          credential.current?.token ?? null,
        );
        if (cancelled || generation !== epoch.current) return;
        setActors(session.actors ?? []);
        if (credential.current) await refresh();
      } catch (e) {
        if (cancelled || generation !== epoch.current) return;
        if (e instanceof ApiError && e.status === 401) {
          await expire().catch(() => {});
          const current = epoch.current;
          const session = await apiRequest(
            baseRef.current,
            "session",
            null,
          ).catch(() => null);
          if (session && !cancelled && current === epoch.current)
            setActors(session.actors ?? []);
        }
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    const listener = AppState.addEventListener("change", (next) => {
      if (next === "active" && !pending.current) void refresh().catch(() => {});
    });
    const poll = setInterval(() => {
      if (!pending.current && AppState.currentState === "active")
        void refresh().catch(() => {});
    }, 20000);
    return () => {
      cancelled = true;
      listener.remove();
      clearInterval(poll);
    };
  }, [refresh, expire]);
  async function login(id: string) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    const generation = ++epoch.current;
    clear();
    try {
      const data = await apiRequest(
        baseRef.current,
        "mobile/session",
        credential.current?.token ?? null,
        { actorId: id },
      );
      if (generation !== epoch.current) return;
      const next = {
        token: data.token,
        base: baseRef.current,
        expiresAt: data.expiresAt,
      };
      if (
        !/^[a-f0-9]{64}$/.test(next.token) ||
        !Number.isFinite(next.expiresAt)
      )
        throw new Error("Invalid session response.");
      credential.current = next;
      await saveCredential(next);
      if (generation === epoch.current) apply(data);
    } catch (e) {
      if (generation === epoch.current) {
        await expire().catch(() => {});
        setError((e as Error).message);
      }
      throw e;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function logout() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    const token = credential.current?.token;
    setNotice(null);
    setError(null);
    try {
      await expire().catch((e) => setError((e as Error).message));
      if (token)
        await apiRequest(baseRef.current, "mobile/session/logout", token, {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function setServer(value: string) {
    if (pending.current) return;
    let next: string;
    try {
      next = normalizeBase(value);
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
    pending.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    const token = credential.current?.token,
      oldBase = baseRef.current;
    try {
      await expire().catch((e) => setError((e as Error).message));
      if (token)
        await apiRequest(oldBase, "mobile/session/logout", token, {}).catch(
          () => {},
        );
      baseRef.current = next;
      setBase(next);
      setActors([]);
      const generation = epoch.current;
      const data = await apiRequest(next, "session", null);
      if (generation === epoch.current) setActors(data.actors ?? []);
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function command<T = unknown>(
    name: string,
    args: unknown[],
  ): Promise<T> {
    if (!credential.current) throw new Error("Choose a demo account first.");
    if (pending.current) throw new Error("Wait for the current save.");
    pending.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    const generation = epoch.current;
    const envelope = commandEnvelope(name, args, version.current);
    try {
      const data = await apiRequest(
        baseRef.current,
        "commands",
        credential.current.token,
        envelope,
      );
      if (generation === epoch.current) {
        apply(data);
        setNotice(
          lang === "hi"
            ? "सर्वर पर बदलाव सेव हुआ।"
            : "Change saved on the server.",
        );
      }
      return data.result as T;
    } catch (e) {
      if (generation === epoch.current) {
        await refresh().catch(() => {});
        setError((e as Error).message);
      }
      throw e;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <MobileContext.Provider
      value={{
        state,
        actor,
        actors,
        lang,
        setLang,
        t: (en, hi) => (lang === "hi" ? hi : en),
        busy,
        ready,
        error,
        notice,
        lastCheckedAt,
        base,
        setServer,
        login,
        logout,
        refresh,
        command,
      }}
    >
      {children}
    </MobileContext.Provider>
  );
}
export function useMobile() {
  const value = useContext(MobileContext);
  if (!value) throw new Error("MobileProvider missing");
  return value;
}
