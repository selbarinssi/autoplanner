import type { DispatchConfig } from '@/domain/types';
import { defaultDispatchConfig } from '@/config/defaultDispatchConfig';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';

export function getDispatchConfig(): DispatchConfig {
  return loadFromStorage<DispatchConfig>(
    STORAGE_KEYS.dispatchConfig,
    defaultDispatchConfig
  );
}

export function saveDispatchConfig(config: DispatchConfig): void {
  saveToStorage(STORAGE_KEYS.dispatchConfig, config);
}

export function resetDispatchConfig(): DispatchConfig {
  saveDispatchConfig(defaultDispatchConfig);
  return defaultDispatchConfig;
}
