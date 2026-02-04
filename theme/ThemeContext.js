// theme/ThemeContext.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "APP_THEME_MODE"; // "light" | "dark"

const ThemeContext = createContext(null);

const light = {
  mode: "light",
  colors: {
    bg: "#ffffff",
    surface: "#ffffff",
    text: "#111111",
    muted: "gray",
    border: "#eeeeee",
    card: "#f6f6f6",
    primary: "#1f7a8c",
    dangerBg: "#fff0f0",
    dangerBorder: "#ffd0d0",
    dangerText: "#b00020",
    overlay: "rgba(0,0,0,0.35)",
  },
};

const dark = {
  mode: "dark",
  colors: {
    bg: "#0f1216",
    surface: "#141922",
    text: "#f3f4f6",
    muted: "#a3a3a3",
    border: "#232a36",
    card: "#1b2230",
    primary: "#1f7a8c",
    dangerBg: "#2a1216",
    dangerBorder: "#5a1a24",
    dangerText: "#ff6b81",
    overlay: "rgba(0,0,0,0.55)",
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "dark" || saved === "light") setMode(saved);
      } catch {}
      setReady(true);
    })();
  }, []);

  const theme = useMemo(() => (mode === "dark" ? dark : light), [mode]);

  const setThemeMode = async (nextMode) => {
    setMode(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch {}
  };

  const toggleTheme = () => setThemeMode(mode === "dark" ? "light" : "dark");

  const value = useMemo(
    () => ({ mode, theme, setThemeMode, toggleTheme, ready }),
    [mode, theme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
