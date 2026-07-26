const USERNAME_PATTERN = /^[a-z0-9_]{5,32}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function isValidUsername(raw: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(raw));
}

export function usernameValidationError(raw: string): string | null {
  const normalized = normalizeUsername(raw);
  if (normalized.length === 0) return "Username kiritilishi shart";
  if (normalized.length < 5) return "Username kamida 5 ta belgidan iborat bo'lishi kerak";
  if (normalized.length > 32) return "Username 32 ta belgidan oshmasligi kerak";
  if (!USERNAME_PATTERN.test(normalized)) {
    return "Faqat lotin harflari, raqamlar va pastki chiziqcha (_) ishlatiladi";
  }
  return null;
}
