import { create } from 'zustand'

export type ActiveStack = 'initial' | 'home'

type NavigationState = {
  activeStack: ActiveStack
  setActiveStack: (stack: ActiveStack) => void
  goToHome: () => void
  goToInitial: () => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeStack: 'initial',
  setActiveStack: (stack) => set({ activeStack: stack }),
  goToHome: () => set({ activeStack: 'home' }),
  goToInitial: () => set({ activeStack: 'initial' }),
}))


interface AppClickState {
  clickCount: number
  incrementClick: () => void
  resetClick: () => void
}

export const useAppClickStore = create<AppClickState>((set) => ({
  clickCount: 0,
  incrementClick: () => set((s) => ({ clickCount: s.clickCount + 1 })),
  resetClick: () => set({ clickCount: 0 }),
}))


interface YoutubeClickState {
  youtubeClickCount: number
  incrementYoutubeClick: () => void
  resetYoutubeClick: () => void
}

export const useYoutubeClickStore = create<YoutubeClickState>((set) => ({
  youtubeClickCount: 0,
  incrementYoutubeClick: () =>
    set((s) => ({ youtubeClickCount: s.youtubeClickCount + 1 })),
  resetYoutubeClick: () => set({ youtubeClickCount: 0 }),
}))
