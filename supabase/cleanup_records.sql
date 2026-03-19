-- =============================================
-- 清除所有领用记录和审批记录
-- 运行前请确保已备份重要数据
-- =============================================

-- 1. 清除申购记录 (requisitions表)
-- 注意：这会删除所有的申购记录，包括待审批、已批准、已到货和已归档的记录
DELETE FROM requisitions;

-- 重置序列（让ID从1开始）
ALTER SEQUENCE requisitions_id_seq RESTART WITH 1;

-- 2. 清除审批记录相关的数据
-- 注意：如果还有其他表存储了审批记录，也需要清除

-- 3. 确认清除完成
SELECT '申购记录已清除' as message, COUNT(*) as count FROM requisitions;
