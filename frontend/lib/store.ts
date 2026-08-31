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
  selectedLocation: "Anand Vihar",
  selectedHourIso: "",
  serverNowIso: "",
  setLocation: (location) => set({ selectedLocation: location }),
  setHour: (hourIso) => set({ selectedHourIso: hourIso }),
  setServerNow: (serverNowIso) => set({ serverNowIso }),
}));
