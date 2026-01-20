export type RetryOptions = {
  retries: number;          // כמה ניסיונות נוספים (למשל 4 => עד 5 ניסיונות סה"כ)
  baseDelayMs: number;      // דיליי בסיסי
  maxDelayMs: number;       // תקרה
  jitterRatio?: number;     // 0.2 = עד 20% ג'יטר
  shouldRetry?: (err: unknown) => boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function withJitter(ms: number, jitterRatio: number) {
  const jitter = ms * jitterRatio;
  const delta = (Math.random() * 2 - 1) * jitter;
  return Math.max(0, Math.round(ms + delta));
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const jitterRatio = opts.jitterRatio ?? 0.2;

  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= opts.retries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const ok = opts.shouldRetry ? opts.shouldRetry(err) : true;
      if (!ok || attempt === opts.retries) break;

      const delay = Math.min(opts.maxDelayMs, opts.baseDelayMs * Math.pow(2, attempt));
      const wait = withJitter(delay, jitterRatio);

      console.log(`[Retry] attempt=${attempt + 1}/${opts.retries} wait=${wait}ms reason=${String((err as any)?.message ?? err)}`);
      await sleep(wait);
      attempt++;
    }
  }

  throw lastErr;
}
