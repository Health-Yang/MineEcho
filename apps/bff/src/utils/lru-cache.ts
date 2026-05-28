/**
 * LRU Cache Implementation
 * 带内存上限控制的LRU缓存，超出限制时自动淘汰最久未使用的条目
 */

import { logger } from "./logger.js";

/**
 * LRU Cache 配置选项
 */
export interface LRUCacheOptions {
  /** 最大缓存条目数 */
  maxSize: number;
  /** 缓存名称（用于日志） */
  name?: string;
  /** 是否记录淘汰警告日志 */
  logEviction?: boolean;
}

/**
 * LRU Cache 实现
 * 继承自 Map，保持 Map 接口兼容
 * 当达到上限时，自动删除最久未访问的条目
 */
export class LRUCache<K, V> extends Map<K, V> {
  private maxSize: number;
  private cacheName: string;
  private logEviction: boolean;
  private evictionCount: number = 0;

  constructor(options: LRUCacheOptions) {
    super();
    this.maxSize = options.maxSize;
    this.cacheName = options.name || "LRUCache";
    this.logEviction = options.logEviction ?? true;

    // 从环境变量读取配置（如果存在）
    this.loadConfigFromEnv();
  }

  /**
   * 从环境变量加载配置
   */
  private loadConfigFromEnv(): void {
    const envKey = `MAX_${this.cacheName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_SIZE`;
    const envValue = process.env[envKey];
    if (envValue) {
      const parsed = parseInt(envValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.maxSize = parsed;
        logger.info(`[${this.cacheName}] Loaded max size from env: ${this.maxSize}`);
      }
    }
  }

  /**
   * 设置缓存值
   * 如果达到上限且key不存在，淘汰最久未使用的条目
   */
  set(key: K, value: V): this {
    // 如果key已存在，先删除再添加（更新访问顺序）
    if (this.has(key)) {
      super.delete(key);
    } else if (this.size >= this.maxSize) {
      // 达到上限，淘汰最久未使用的条目（第一个）
      const firstKey = this.keys().next().value;
      if (firstKey !== undefined) {
        super.delete(firstKey);
        this.evictionCount++;

        if (this.logEviction) {
          logger.warn(
            `[${this.cacheName}] Cache limit reached (${this.maxSize}), evicted oldest entry. Total evictions: ${this.evictionCount}`
          );
        }
      }
    }

    super.set(key, value);
    return this;
  }

  /**
   * 获取缓存值
   * 访问后更新顺序（移至最新）
   */
  get(key: K): V | undefined {
    const value = super.get(key);
    if (value !== undefined) {
      // 移动到最新位置（删除后重新添加）
      super.delete(key);
      super.set(key, value);
    }
    return value;
  }

  /**
   * 检查是否存在key（不更新访问顺序）
   */
  has(key: K): boolean {
    return super.has(key);
  }

  /**
   * 删除指定key
   */
  delete(key: K): boolean {
    return super.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    super.clear();
    this.evictionCount = 0;
  }

  /**
   * 获取最大容量
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * 获取淘汰次数统计
   */
  getEvictionCount(): number {
    return this.evictionCount;
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    maxSize: number;
    evictionCount: number;
    utilizationRate: number;
  } {
    return {
      size: this.size,
      maxSize: this.maxSize,
      evictionCount: this.evictionCount,
      utilizationRate: Math.round((this.size / this.maxSize) * 100),
    };
  }
}

/**
 * 带TTL的LRU缓存条目
 */
interface TTLEntry<V> {
  value: V;
  expiresAt: number;
}

/**
 * 带TTL的LRU缓存
 * 条目过期后自动失效
 */
export class TTLCache<K, V> {
  private cache: LRUCache<K, TTLEntry<V>>;
  private defaultTTL: number;

  constructor(options: LRUCacheOptions & { defaultTTL: number }) {
    this.cache = new LRUCache<K, TTLEntry<V>>(options);
    this.defaultTTL = options.defaultTTL;
  }

  /**
   * 设置带TTL的值
   */
  set(key: K, value: V, ttl?: number): this {
    const entry: TTLEntry<V> = {
      value,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
    };
    this.cache.set(key, entry);
    return this;
  }

  /**
   * 获取值（自动检查过期）
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      // 已过期，删除并返回undefined
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * 检查是否存在key
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除指定key
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取当前大小
   */
  get size(): number {
    // 清理过期条目后返回大小
    this.cleanup();
    return this.cache.size;
  }

  /**
   * 清理过期条目
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): ReturnType<LRUCache<K, TTLEntry<V>>["getStats"]> {
    return this.cache.getStats();
  }
}

/**
 * 创建LRU缓存的工厂函数
 */
export function createLRUCache<K, V>(
  maxSize: number,
  name?: string,
  logEviction?: boolean
): LRUCache<K, V> {
  return new LRUCache<K, V>({
    maxSize,
    name,
    logEviction: logEviction ?? true,
  });
}

/**
 * 创建带TTL缓存的工厂函数
 */
export function createTTLCache<K, V>(
  maxSize: number,
  defaultTTL: number,
  name?: string
): TTLCache<K, V> {
  return new TTLCache<K, V>({
    maxSize,
    name,
    defaultTTL,
  });
}
