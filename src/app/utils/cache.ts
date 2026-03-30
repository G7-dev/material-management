// 通用缓存工具
// 用于缓存不频繁变化的数据，减少网络请求和加载等待

const CACHE_PREFIX = 'ms_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 默认缓存 5 分钟

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    // 设置过期自动清理（实际清理在 getCache 时进行）
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function getCache<T>(key: string, ttlMs: number = DEFAULT_TTL): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > ttlMs) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function removeCache(key: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // ignore
  }
}

// 当库存变更时调用，清除物资相关缓存
export function invalidateMaterialCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX) && (k.includes('materials') || k.includes('approvals'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
