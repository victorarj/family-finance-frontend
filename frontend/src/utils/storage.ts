export const STORAGE_KEYS = {
  token: "token",
  userId: "userId",
  userEmail: "userEmail",
  onboardingDismissed: "onboarding_dismissed",
  onboardingCompleted: "onboarding_completed",
  expenseLastCategory: "expense_last_categoria",
  expenseLastAccount: "expense_last_conta",
} as const;

export const USER_SCOPED_STORAGE_KEYS = [
  STORAGE_KEYS.token,
  STORAGE_KEYS.userId,
  STORAGE_KEYS.userEmail,
  STORAGE_KEYS.onboardingDismissed,
  STORAGE_KEYS.onboardingCompleted,
  STORAGE_KEYS.expenseLastCategory,
  STORAGE_KEYS.expenseLastAccount,
] as const;

export function buildUserScopedStorageKey(key: string, userId: number | string | null | undefined) {
  if (userId == null || userId === "") {
    return key;
  }
  return `${key}_${userId}`;
}

export function getUserScopedStorageItem(
  key: string,
  userId: number | string | null | undefined,
  storage: Storage = window.localStorage,
) {
  return storage.getItem(buildUserScopedStorageKey(key, userId));
}

export function setUserScopedStorageItem(
  key: string,
  userId: number | string | null | undefined,
  value: string,
  storage: Storage = window.localStorage,
) {
  storage.setItem(buildUserScopedStorageKey(key, userId), value);
}

export function removeUserScopedStorageItem(
  key: string,
  userId: number | string | null | undefined,
  storage: Storage = window.localStorage,
) {
  storage.removeItem(buildUserScopedStorageKey(key, userId));
}

export function clearUserScopedStorage(storage: Storage = window.localStorage) {
  USER_SCOPED_STORAGE_KEYS.forEach((key) => {
    storage.removeItem(key);

    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const currentKey = storage.key(index);
      if (currentKey?.startsWith(`${key}_`)) {
        storage.removeItem(currentKey);
      }
    }
  });
}
