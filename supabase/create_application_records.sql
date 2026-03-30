-- ── 创建 application_records 表（日常领用申请记录） ──────────────────────────
-- 用于替代 localStorage 存储日常领用申请数据

CREATE TABLE IF NOT EXISTS public.application_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '个',
  usage TEXT,
  application_type TEXT DEFAULT '日常领用',
  application_date TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  status_label TEXT DEFAULT '待审核',
  reject_reason TEXT,
  applicant TEXT,
  department TEXT,
  employee_id TEXT,
  expected_date TEXT,
  size_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_application_records_status ON public.application_records(status);
CREATE INDEX IF NOT EXISTS idx_application_records_applicant ON public.application_records(applicant);
CREATE INDEX IF NOT EXISTS idx_application_records_created_at ON public.application_records(created_at DESC);

-- RLS 策略（如果启用了 RLS）
ALTER TABLE public.application_records ENABLE ROW LEVEL SECURITY;

-- 允许认证用户查看自己的申请记录
CREATE POLICY "Users can view own application records"
  ON public.application_records FOR SELECT
  USING (true);

-- 允许认证用户插入申请记录
CREATE POLICY "Users can insert application records"
  ON public.application_records FOR INSERT
  WITH CHECK (true);

-- 允许认证用户更新自己的申请记录
CREATE POLICY "Users can update application records"
  ON public.application_records FOR UPDATE
  USING (true);

-- 允许认证用户删除自己的申请记录
CREATE POLICY "Users can delete application records"
  ON public.application_records FOR DELETE
  USING (true);

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION public.update_application_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_application_records_updated_at ON public.application_records;
CREATE TRIGGER trg_application_records_updated_at
  BEFORE UPDATE ON public.application_records
  FOR EACH ROW EXECUTE FUNCTION public.update_application_records_updated_at();
