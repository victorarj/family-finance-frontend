import { clearUserScopedStorage } from "./storage";

export function clearClientSession() {
  clearUserScopedStorage();
}
