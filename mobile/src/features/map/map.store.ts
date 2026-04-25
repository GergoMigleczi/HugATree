import { create } from "zustand";

type MapRefreshStore = {
  needsRefresh: boolean;
  requestRefresh: () => void;
  clearRefresh: () => void;
};

export const useMapRefreshStore = create<MapRefreshStore>((set) => ({
  needsRefresh: false,
  requestRefresh: () => set({ needsRefresh: true }),
  clearRefresh: () => set({ needsRefresh: false }),
}));