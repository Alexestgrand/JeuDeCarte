import { useCallback, useEffect, useState } from "react";

// Sauvegarde locale (navigateur). À remplacer par un backend quand il y aura des comptes.

export const MAX_BOOSTERS = 6;
export const RECHARGE_MS = 3 * 60 * 1000; // un booster toutes les 3 minutes

export interface SaveData {
  /** id de carte → nombre d'exemplaires */
  owned: Record<number, number>;
  /** id de carte → date de première obtention */
  firstSeen: Record<number, number>;
  boosters: number;
  /** horodatage du dernier booster rechargé */
  lastRecharge: number;
  opened: number;
}

const KEY = "registre-save-v1";

const fresh = (): SaveData => ({
  owned: {},
  firstSeen: {},
  boosters: MAX_BOOSTERS,
  lastRecharge: Date.now(),
  opened: 0,
});

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    /* sauvegarde illisible : on repart de zéro */
  }
  return fresh();
}

function recharge(s: SaveData, now: number): SaveData {
  if (s.boosters >= MAX_BOOSTERS) return { ...s, lastRecharge: now };
  const gained = Math.floor((now - s.lastRecharge) / RECHARGE_MS);
  if (gained <= 0) return s;
  const boosters = Math.min(MAX_BOOSTERS, s.boosters + gained);
  return {
    ...s,
    boosters,
    lastRecharge: boosters >= MAX_BOOSTERS ? now : s.lastRecharge + gained * RECHARGE_MS,
  };
}

export function useSave() {
  const [save, setSave] = useState(() => recharge(load(), Date.now()));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      setSave((s) => recharge(s, n));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch {
      /* stockage indisponible (navigation privée…) */
    }
  }, [save]);

  /** Consomme un booster et ajoute ses cartes à la collection. */
  const spendBooster = useCallback((cardIds: number[]) => {
    setSave((s) => {
      if (s.boosters <= 0) return s;
      const owned = { ...s.owned };
      const firstSeen = { ...s.firstSeen };
      const t = Date.now();
      for (const id of cardIds) {
        owned[id] = (owned[id] ?? 0) + 1;
        firstSeen[id] ??= t;
      }
      const wasFull = s.boosters >= MAX_BOOSTERS;
      return {
        ...s,
        owned,
        firstSeen,
        boosters: s.boosters - 1,
        lastRecharge: wasFull ? t : s.lastRecharge,
        opened: s.opened + 1,
      };
    });
  }, []);

  const reset = useCallback(() => setSave(fresh()), []);

  const nextIn = save.boosters >= MAX_BOOSTERS ? 0 : Math.max(0, save.lastRecharge + RECHARGE_MS - now);

  return { save, spendBooster, reset, nextIn };
}
