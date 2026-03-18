export const STORAGE_KEYS = {
  token: "token",
  userId: "userId",
  userEmail: "userEmail",
  onboardingDismissed: "onboarding_dismissed",
  expenseLastCategory: "expense_last_categoria",
  expenseLastAccount: "expense_last_conta",
} as const;

export const USER_SCOPED_STORAGE_KEYS = [
  STORAGE_KEYS.token,
  STORAGE_KEYS.userId,
  STORAGE_KEYS.userEmail,
  STORAGE_KEYS.onboardingDismissed,
  STORAGE_KEYS.expenseLastCategory,
  STORAGE_KEYS.expenseLastAccount,
] as const;

export function clearUserScopedStorage(storage: Storage = window.localStorage) {
  USER_SCOPED_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}
