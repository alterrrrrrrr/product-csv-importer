const TOKEN_KEY = "pkmr_token";

/** Session-scoped storage of the signed admin/seller token issued by the server. */
export function setPanelToken(token: string) {
  try {
    globalThis.sessionStorage?.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

export function getPanelToken(): string {
  try {
    return globalThis.sessionStorage?.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearPanelToken() {
  try {
    globalThis.sessionStorage?.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}
