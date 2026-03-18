// ── Shared item store backed by localStorage ──────────────────────────────────
// Items uploaded via ItemUpload are persisted here and read by ItemPermission.

export interface StoredItem {
  id: string;
  name: string;
  category: string;
  specModel: string;
  unit: string;           // 单位，如：件、包、张、个
  quantity: number;
  lowStockThreshold: number;
  stockPlatform: string;
  expiry: string;
  notes: string;
  image?: string;
  uploadedAt: string;
}

const STORAGE_KEY = 'wms_uploaded_items_v1';

export function getStoredItems(): StoredItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredItem[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredItem(
  payload: Omit<StoredItem, 'id' | 'uploadedAt'>
): StoredItem {
  const existing = getStoredItems();
  const newItem: StoredItem = {
    ...payload,
    id: `custom_${Date.now()}`,
    uploadedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newItem]));
  return newItem;
}

export function updateStoredItemStock(id: string, newStock: number): void {
  const items = getStoredItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], quantity: newStock };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

export function clearStoredItems(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function deleteStoredItem(id: string): void {
  const items = getStoredItems().filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}