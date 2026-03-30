// ── Application records store backed by Supabase ──────────────────────────────

import { supabase } from '../../lib/supabase';

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
  sizeLabel?: string;
}

// 获取所有日常领用申请记录
export async function getApplicationRecords(): Promise<ApplicationRecord[]> {
  try {
    const { data, error } = await supabase
      .from('application_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取申请记录失败:', error);
      return [];
    }

    const statusLabelMap: Record<ApplicationStatus, string> = {
      pending: '待审核',
      approved: '已批准',
      rejected: '已驳回',
    };

    return (data || []).map((r: any) => ({
      id: r.id,
      itemId: r.item_id || '',
      itemName: r.item_name || '',
      quantity: r.quantity || 0,
      unit: r.unit || '个',
      usage: r.usage || '',
      applicationType: r.application_type || '日常领用',
      applicationDate: r.application_date || r.created_at || '',
      status: r.status || 'pending',
      statusLabel: statusLabelMap[r.status as ApplicationStatus] || '待审核',
      rejectReason: r.reject_reason,
      applicant: r.applicant || '',
      department: r.department || '',
      employeeId: r.employee_id || '',
      expectedDate: r.expected_date || '',
      sizeLabel: r.size_label || '',
    }));
  } catch (error) {
    console.error('获取申请记录异常:', error);
    return [];
  }
}

// 保存新的日常领用申请记录
export async function saveApplicationRecord(
  payload: Omit<ApplicationRecord, 'id' | 'applicationDate' | 'status' | 'statusLabel'>
): Promise<ApplicationRecord | null> {
  try {
    const now = new Date();
    const applicationDate = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');

    const { data, error } = await supabase
      .from('application_records')
      .insert({
        item_id: payload.itemId,
        item_name: payload.itemName,
        quantity: payload.quantity,
        unit: payload.unit,
        usage: payload.usage,
        application_type: payload.applicationType,
        application_date: applicationDate,
        status: 'pending',
        applicant: payload.applicant,
        department: payload.department,
        employee_id: payload.employeeId,
        expected_date: payload.expectedDate,
        size_label: (payload as any).sizeLabel || '',
      })
      .select('id')
      .single();

    if (error) {
      console.error('保存申请记录失败:', error);
      return null;
    }

    return {
      ...payload,
      id: data?.id || `app_${Date.now()}`,
      applicationDate,
      status: 'pending',
      statusLabel: '待审核',
    };
  } catch (error) {
    console.error('保存申请记录异常:', error);
    return null;
  }
}

// 更新申请记录状态
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  rejectReason?: string
): Promise<void> {
  try {
    const updates: any = { status };
    if (rejectReason) {
      updates.reject_reason = rejectReason;
    }

    const { error } = await supabase
      .from('application_records')
      .update(updates)
      .filter('id', 'eq', id);

    if (error) {
      console.error('更新申请状态失败:', error);
    }
  } catch (error) {
    console.error('更新申请状态异常:', error);
  }
}

// 删除申请记录
export async function deleteApplicationRecord(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('application_records')
      .delete()
      .filter('id', 'eq', id);

    if (error) {
      console.error('删除申请记录失败:', error);
    }
  } catch (error) {
    console.error('删除申请记录异常:', error);
  }
}
