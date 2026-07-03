// Auto-save functionality with debounce

import type { CongregationData } from '../domain';

export interface AutoSaveConfig {
  enabled: boolean;
  debounceMs: number;
  onSave: (data: CongregationData) => Promise<void>;
  onError?: (error: Error) => void;
}

export class AutoSaveManager {
  private config: AutoSaveConfig;
  private timeoutId: number | null = null;
  private isSaving = false;
  private pendingData: CongregationData | null = null;

  constructor(config: AutoSaveConfig) {
    this.config = config;
  }

  schedule(data: CongregationData): void {
    if (!this.config.enabled) {
      return;
    }

    this.pendingData = data;

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.executeSave();
    }, this.config.debounceMs);
  }

  async flush(): Promise<void> {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.pendingData) {
      await this.executeSave();
    }
  }

  private async executeSave(): Promise<void> {
    if (this.isSaving || !this.pendingData) {
      return;
    }

    this.isSaving = true;
    const dataToSave = this.pendingData;
    this.pendingData = null;

    try {
      await this.config.onSave(dataToSave);
    } catch (error) {
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
    } finally {
      this.isSaving = false;

      // If new data arrived while saving, schedule another save
      if (this.pendingData) {
        this.schedule(this.pendingData);
      }
    }
  }

  updateConfig(config: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...config };
  }

  disable(): void {
    this.config.enabled = false;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  enable(): void {
    this.config.enabled = true;
  }

  get isEnabled(): boolean {
    return this.config.enabled;
  }

  get isPending(): boolean {
    return this.pendingData !== null || this.isSaving;
  }
}
