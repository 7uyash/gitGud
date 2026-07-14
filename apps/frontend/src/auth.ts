const tokenKey = 'gitgud.token';

export function getToken() {
  return localStorage.getItem(tokenKey);
}

export function setToken(token: string) {
  localStorage.setItem(tokenKey, token);
}

export function clearToken() {
  localStorage.removeItem(tokenKey);
}

export function readJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}