/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

import runtimeConfig from './runtime';

export interface ApiSite {
  key: string;
  api: string;
  name: string;
  detail?: string;
}

export interface StorageConfig {
  type: 'localstorage' | 'database';
  database?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
  };
}

export interface Config {
  cache_time?: number;
  api_site: {
    [key: string]: ApiSite;
  };
  storage?: StorageConfig;
}

export const API_CONFIG = {
  search: {
    path: '?ac=videolist&wd=',
    pagePath: '?ac=videolist&wd={query}&pg={page}',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  },
  detail: {
    path: '?ac=videolist&ids=',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  },
};

// 在模块加载时根据环境决定配置来源
let cachedConfig: Config;

if (process.env.DOCKER_ENV === 'true') {
  // 为了兼容 Edge Runtime，这里通过 eval("require") 的方式按需加载 fs 和 path，
  // 避免在打包阶段将 Node 内置模块打进 Edge bundle。
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const req = eval('require') as any;
    const fs = req('fs') as typeof import('fs');
    const path = req('path') as typeof import('path');

    const configPath = path.join(process.cwd(), 'config.json');
    const raw = fs.readFileSync(configPath, 'utf-8');
    cachedConfig = JSON.parse(raw) as Config;
  } catch (error) {
    console.error(
      '[config] 读取 config.json 失败，回退至编译时配置 →',
      (error as Error).message
    );
    cachedConfig = runtimeConfig as unknown as Config;
  }
} else {
  // 默认使用编译时生成的配置
  cachedConfig = runtimeConfig as unknown as Config;
}

export function getConfig(): Config {
  return cachedConfig;
}

export function getCacheTime(): number {
  const config = getConfig();
  return config.cache_time || 300; // 默认5分钟缓存
}

export function getApiSites(): ApiSite[] {
  const config = getConfig();
  return Object.entries(config.api_site).map(([key, site]) => ({
    ...site,
    key,
  }));
}
