export async function withDeadline<T>(work: Promise<T>, message: string, ms = 90000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })]);
  } finally { clearTimeout(timer); }
}
export function runError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/KEYS_NOT_SET/.test(message)) return "KROWE's model or search key is missing. Please try again once it is set.";
  if (/unauthorized|jwt|session|refresh token/i.test(message)) return "I couldn't open your guest session. Please reload and try again.";
  if (/fetch|network|load failed/i.test(message)) return "I couldn't reach the service. Check your connection and try again.";
  if (/timeout|timed out|aborted/i.test(message)) return "The service took too long to reply. Your idea is still here; please try again.";
  if (/Model.*returned|valid JSON/i.test(message)) return "The model couldn't finish its reply. Your idea is still here; please try again.";
  return message && message.length <= 180 ? message : "I couldn't finish this work. Your idea is still here; please try again.";
}