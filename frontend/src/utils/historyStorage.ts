import type { PRDHistoryItem } from '../types';

const STORAGE_KEY = 'prd_history_v1';
const MAX_HISTORY = 20;

export function loadHistory(): PRDHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: Omit<PRDHistoryItem, 'id' | 'createdAt'> & { id?: string }): PRDHistoryItem[] {
  const current = loadHistory();
  const newItem: PRDHistoryItem = {
    id: item.id || `prd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    idea: item.idea,
    model: item.model,
    sections: item.sections,
  };

  // Prepend new item and enforce limit
  const updated = [newItem, ...current.filter((h) => h.id !== newItem.id)].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full fallback: drop half
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 10)));
    } catch {
      // Ignore quota error
    }
  }
  return updated;
}

export function deleteHistoryItem(id: string): PRDHistoryItem[] {
  const current = loadHistory();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
  return updated;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore error
  }
}

export function exportHistoryJSON(): void {
  const current = loadHistory();
  if (current.length === 0) return;
  const jsonStr = JSON.stringify(current, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `prd_history_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
