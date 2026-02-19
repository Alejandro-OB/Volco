// src/utils/decodeToken.js
export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = atob(base64);
    const jsonPayload = new TextDecoder().decode(
      Uint8Array.from(payload, c => c.charCodeAt(0))
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
  
