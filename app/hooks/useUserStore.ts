"use client";

import { useState, useEffect } from "react";
import type { StoredUserData } from "../types/shopping";

const STORAGE_KEY = "credpay_user";

export function useUserStore() {
  const [data, setData] = useState<StoredUserData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  const save = (d: StoredUserData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    setData(d);
  };

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(null);
  };

  return { data, loaded, save, clear };
}
