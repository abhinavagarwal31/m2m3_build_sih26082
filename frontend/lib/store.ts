import { create } from "zustand";

interface AppState {
  selectedLocation: string;
  selectedHourIso: string;
  serverNowIso: string;
  setLocation: (location: string) => void;
  setHour: (hourIso: string) => void;
  setServerNow: (serverNowIso: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Deliberately empty — useBootstrap() is the sole source of truth for all
  // three of these on startup (see lib/hooks.ts). A hardcoded default here
  // would coincidentally match the backend's defaultLocation today but isn't
  // actually driven by it, which is fake synchronization.
  selectedLocation: "",
  selectedHourIso: "",
  serverNowIso: "",
  setLocation: (location) => set({ selectedLocation: location }),
  setHour: (hourIso) => set({ selectedHourIso: hourIso }),
  setServerNow: (serverNowIso) => set({ serverNowIso }),
}));
