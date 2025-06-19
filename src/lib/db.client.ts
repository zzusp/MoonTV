/* eslint-disable no-console */
'use client';

/**
 * 仅在浏览器端使用的数据库工具，目前基于 localStorage 实现。
 * 之所以单独拆分文件，是为了避免在客户端 bundle 中引入 `fs`, `path` 等 Node.js 内置模块，
 * 从而解决诸如 "Module not found: Can't resolve 'fs'" 的问题。
 *
 * 功能：
 * 1. 获取全部播放记录（getAllPlayRecords）。
 * 2. 保存播放记录（savePlayRecord）。
 *
 * 如后续需要在客户端读取收藏等其它数据，可按同样方式在此文件中补充实现。
 */

// ---- 类型 ----
export interface PlayRecord {
  title: string;
  source_name: string;
  cover: string;
  index: number; // 第几集
  total_episodes: number; // 总集数
  play_time: number; // 播放进度（秒）
  total_time: number; // 总进度（秒）
  save_time: number; // 记录保存时间（时间戳）
  user_id: number; // 用户 ID，本地存储情况下恒为 0
}

// ---- 常量 ----
const PLAY_RECORDS_KEY = 'moontv_play_records';

// ---- 环境变量 ----
const STORAGE_TYPE =
  (process.env.NEXT_PUBLIC_STORAGE_TYPE as
    | 'localstorage'
    | 'database'
    | undefined) || 'localstorage';

// ---- 工具函数 ----
async function fetchFromApi<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`请求 ${path} 失败: ${res.status}`);
  return (await res.json()) as T;
}

/**
 * 生成存储key
 */
export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}

// ---- API ----
/**
 * 读取 localStorage 中的全部播放记录。
 * 在服务端渲染阶段 (window === undefined) 时返回空对象，避免报错。
 */
export async function getAllPlayRecords(): Promise<Record<string, PlayRecord>> {
  // 若配置标明使用数据库，则从后端 API 拉取
  if (STORAGE_TYPE === 'database') {
    return fetchFromApi<Record<string, PlayRecord>>('/api/playrecords');
  }

  // 默认 / localstorage 流程
  if (typeof window === 'undefined') {
    // 服务器端渲染阶段直接返回空，交由客户端 useEffect 再行请求
    return {};
  }

  try {
    const raw = localStorage.getItem(PLAY_RECORDS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PlayRecord>;
  } catch (err) {
    console.error('读取播放记录失败:', err);
    return {};
  }
}

/**
 * 保存播放记录到 localStorage 或通过 API 保存到数据库
 */
export async function savePlayRecord(
  source: string,
  id: string,
  record: Omit<PlayRecord, 'user_id'>
): Promise<void> {
  const key = generateStorageKey(source, id);
  const fullRecord: PlayRecord = { ...record, user_id: 0 };

  // 若配置标明使用数据库，则通过 API 保存
  if (STORAGE_TYPE === 'database') {
    try {
      const res = await fetch('/api/playrecords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, record: fullRecord }),
      });
      if (!res.ok) throw new Error(`保存播放记录失败: ${res.status}`);
    } catch (err) {
      console.error('保存播放记录到数据库失败:', err);
      throw err;
    }
    return;
  }

  // 默认 / localstorage 流程
  if (typeof window === 'undefined') {
    console.warn('无法在服务端保存播放记录到 localStorage');
    return;
  }

  try {
    const allRecords = await getAllPlayRecords();
    allRecords[key] = fullRecord;
    localStorage.setItem(PLAY_RECORDS_KEY, JSON.stringify(allRecords));
  } catch (err) {
    console.error('保存播放记录失败:', err);
    throw err;
  }
}

/**
 * 删除播放记录
 */
export async function deletePlayRecord(
  source: string,
  id: string
): Promise<void> {
  const key = generateStorageKey(source, id);

  // 若配置标明使用数据库，则通过 API 删除
  if (STORAGE_TYPE === 'database') {
    try {
      const res = await fetch(
        `/api/playrecords?key=${encodeURIComponent(key)}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) throw new Error(`删除播放记录失败: ${res.status}`);
    } catch (err) {
      console.error('删除播放记录到数据库失败:', err);
      throw err;
    }
    return;
  }

  // 默认 / localstorage 流程
  if (typeof window === 'undefined') {
    console.warn('无法在服务端删除播放记录到 localStorage');
    return;
  }

  try {
    const allRecords = await getAllPlayRecords();
    delete allRecords[key];
    localStorage.setItem(PLAY_RECORDS_KEY, JSON.stringify(allRecords));
    console.log('播放记录已删除:', key);
  } catch (err) {
    console.error('删除播放记录失败:', err);
    throw err;
  }
}
