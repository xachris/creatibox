import type { Vec2 } from '../model/types'

export type ViewMode = 'top-down' | 'oblique' | 'first-person'
export type FollowMode = 'none' | 'participant'

/** Display-only state. It must never be stored on an Entity or used by simulation. */
export interface ViewState {
  viewMode: ViewMode
  cameraTarget: string | null
  zoom: number
  rotation: number
  pitch?: number
  elevation?: number
  followMode: FollowMode
}

export const DEFAULT_EDIT_VIEW_STATE: Readonly<ViewState> = Object.freeze({
  viewMode: 'top-down',
  cameraTarget: null,
  zoom: 1,
  rotation: 0,
  followMode: 'none',
})

export function createRunViewState(cameraTarget: string | null = null): ViewState {
  return {
    viewMode: 'top-down',
    cameraTarget,
    zoom: 1,
    rotation: 0,
    followMode: 'participant',
  }
}

export interface Viewport {
  width: number
  height: number
}

export interface CameraFrame {
  viewport: Viewport
  target?: Pick<Vec2, 'x' | 'y'> | null
}
