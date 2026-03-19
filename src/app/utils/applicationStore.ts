// ── Application records store backed by localStorage ─────────────────────────

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ApplicationRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  usage: string;
  applicationType: '日常领用' | '物品申购';
  applicationDate: string;
  status: ApplicationStatus;
  statusLabel: string;
  rejectReason?: string;
  applicant?: string;
  department?: string;
  employeeId?: string;
  expectedDate?: string;
}

const STORAGE_KEY = 'wms_application_records_v1';

export function getApplicationRecords(): ApplicationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ApplicationRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveApplicationRecord(
  payload: Omit<ApplicationRecord, 'id' | 'applicationDate' | 'status' | 'statusLabel'>
): ApplicationRecord {
  const existing = getApplicationRecords();
  const now = new Date();
  const record: ApplicationRecord = {
    ...payload,
    id: `app_${Date.now()}`,
    applicationDate: now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-'),
    status: 'pending',
    statusLabel: '待审核',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...existing]));
  return record;
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  rejectReason?: string
): void {
  const records = getApplicationRecords();
  const idx = records.findIndex((r) => r.id === id);
  if (idx !== -1) {
    const labelMap: Record<ApplicationStatus, string> = {
      pending: '待审核',
      approved: '已批准',
      rejected: '已驳回',
    };
    records[idx] = {
      ...records[idx],
      status,
      statusLabel: labelMap[status],
      rejectReason: rejectReason || records[idx].rejectReason,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}

export function deleteApplicationRecord(id: string): void {
  const records = getApplicationRecords().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
