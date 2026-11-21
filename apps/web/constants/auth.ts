// The least time the sign-out screen stays up. The brand loader fades in after a third of a second
// and its 3D scene loads on demand, so a sign-out that finishes at once would flash the screen or
// skip the loader entirely.
export const SIGN_OUT_MIN_DURATION_MS = 1500
