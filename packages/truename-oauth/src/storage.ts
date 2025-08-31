// Storage Adapter Implementation for OAuth Data Persistence

import type { StorageAdapter, OIDCClaims } from './types.js';

export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
try {
  return localStorage.getItem(key);
} catch {
  return null;
}
  }

  setItem(key: string, value: string): void {
try {
  localStorage.setItem(key, value);
} catch {
  // Silent fail
}
  }

  removeItem(key: string): void {
try {
  localStorage.removeItem(key);
} catch {
  // Silent fail
}
  }

  clear(): void {
try {
  localStorage.clear();
} catch {
  // Silent fail
}
  }
}

export class OAuthStorage {
  private storage: StorageAdapter;
  private keyPrefix: string;

  constructor(storage: StorageAdapter, appName: string) {
this.storage = storage;
this.keyPrefix = `truename_oauth_${appName}`;
  }

  storeToken(token: string): void {
this.storage.setItem(`${this.keyPrefix}_token`, token);
this.storage.setItem(`${this.keyPrefix}_expires`, Date.now().toString());
  }

  getToken(): string | null {
return this.storage.getItem(`${this.keyPrefix}_token`);
  }

  storeUserData(userData: OIDCClaims): void {
this.storage.setItem(`${this.keyPrefix}_user`, JSON.stringify(userData));
  }

  getUserData(): OIDCClaims | null {
const data = this.storage.getItem(`${this.keyPrefix}_user`);
try {
  return data ? JSON.parse(data) : null;
} catch {
  return null;
}
  }

  storeState(state: string): void {
this.storage.setItem(`${this.keyPrefix}_state`, state);
  }

  getState(): string | null {
return this.storage.getItem(`${this.keyPrefix}_state`);
  }

  clearAll(): void {
this.storage.removeItem(`${this.keyPrefix}_token`);
this.storage.removeItem(`${this.keyPrefix}_user`);
this.storage.removeItem(`${this.keyPrefix}_state`);
this.storage.removeItem(`${this.keyPrefix}_expires`);
  }
}
