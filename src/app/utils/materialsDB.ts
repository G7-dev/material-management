// 物资数据库操作工具函数
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { getCache, setCache, invalidateMaterialCache } from './cache';

// 规格接口
export interface MaterialSize {
  id: string;
  label: string;
  spec: string;
  stock: number;
}

// 物资接口
export interface Material {
  id: string;
  name: string;
  category: string;
  specification?: string;
  model?: string;
  unit: string;
  stock: number;
  safe_stock: number;
  unit_price?: number;
  item_code?: string;
  image_url?: string;
  status: 'active' | 'inactive';
  sizes: MaterialSize[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// 库存流水接口
export interface InventoryLog {
  id: string;
  material_id: string;
  operation_type: 'initial' | 'restock' | 'request_out' | 'adjustment';
  quantity: number;
  stock_before: number;
  stock_after: number;
  size_id?: string;
  size_label?: string;
  notes?: string;
  reference_id?: string;
  created_at: string;
  created_by?: string;
  created_by_name?: string;
}

// 库存状态类型
export type StockSeverity = 'empty' | 'critical' | 'warning' | 'normal';

// 获取所有物资（带库存状态和缓存）
export async function fetchMaterials(useCache = true): Promise<Material[]> {
  // 优先使用缓存
  if (useCache) {
    const cached = getCache<Material[]>('materials');
    if (cached) return cached;
  }

  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('获取物资失败:', error);
      toast.error('获取物资数据失败');
      return [];
    }

    const result = data || [];
    // 写入缓存
    setCache('materials', result);
    return result;
  } catch (error) {
    console.error('获取物资异常:', error);
    toast.error('获取物资数据异常');
    return [];
  }
}

// 获取单个物资
export async function fetchMaterialById(id: string): Promise<Material | null> {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取物资详情失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('获取物资详情异常:', error);
    return null;
  }
}

// 获取低库存物资
export async function fetchLowStockMaterials(): Promise<Material[]> {
  try {
    const materials = await fetchMaterials();
    
    return materials.filter(material => {
      if (!material.sizes || material.sizes.length === 0) {
        // 单规格物品
        return material.stock <= material.safe_stock;
      } else {
        // 多规格物品 - 只要有一个规格低于安全库存就算低库存
        return material.sizes.some(size => size.stock <= material.safe_stock);
      }
    });
  } catch (error) {
    console.error('获取低库存物资失败:', error);
    return [];
  }
}

// 获取物资的库存状态
export function getMaterialStockStatus(material: Material): {
  severity: StockSeverity;
  overallStock: number;
  lowStockSizes: MaterialSize[];
} {
  const safeStock = material.safe_stock;
  
  if (!material.sizes || material.sizes.length === 0) {
    // 单规格物品
    const stock = material.stock;
    let severity: StockSeverity = 'normal';
    
    if (stock === 0) {
      severity = 'empty';
    } else if (stock <= Math.ceil(safeStock * 0.3)) {
      severity = 'critical';
    } else if (stock <= safeStock) {
      severity = 'warning';
    }
    
    return {
      severity,
      overallStock: stock,
      lowStockSizes: []
    };
  } else {
    // 多规格物品
    const lowStockSizes = material.sizes.filter(size => size.stock <= safeStock);
    const hasEmpty = material.sizes.some(size => size.stock === 0);
    const hasCritical = material.sizes.some(size => size.stock <= Math.ceil(safeStock * 0.3));
    
    let severity: StockSeverity = 'normal';
    if (hasEmpty) {
      severity = 'empty';
    } else if (hasCritical) {
      severity = 'critical';
    } else if (lowStockSizes.length > 0) {
      severity = 'warning';
    }
    
    // 总库存为所有规格之和
    const overallStock = material.sizes.reduce((sum, size) => sum + size.stock, 0);
    
    return {
      severity,
      overallStock,
      lowStockSizes
    };
  }
}

// 添加新物资（物品上架）
export async function addMaterial(material: {
  name: string;
  category: string;
  specification?: string;
  model?: string;
  unit: string;
  stock: number;
  safe_stock: number;
  unit_price?: number;
  item_code?: string;
  image_url?: string;
  sizes?: MaterialSize[];
}): Promise<string | null> {
  try {
    // 确保 safe_stock 有合理值
    const safeStock = material.safe_stock || Math.max(1, Math.round(material.stock * 0.15));
    
    const { data, error } = await supabase
      .from('materials')
      .insert({
        name: material.name,
        category: material.category,
        specification: material.specification || '',
        model: material.model || '',
        unit: material.unit,
        stock: material.stock,
        safe_stock: safeStock,
        unit_price: material.unit_price || 0,
        item_code: material.item_code || null,
        image_url: material.image_url,
        sizes: material.sizes || [],
        status: 'active'
      })
      .select('id')
      .single();

    if (error) {
      console.error('添加物资失败:', error);
      toast.error('添加物资失败');
      return null;
    }

    // 记录库存流水（初始上架）
    if (data?.id) {
      await addInventoryLog({
        material_id: data.id,
        operation_type: 'initial',
        quantity: material.stock,
        stock_before: 0,
        stock_after: material.stock,
        notes: '初始上架'
      });
      
      toast.success('物资添加成功');
      return data.id;
    }
    
    return null;
  } catch (error) {
    console.error('添加物资异常:', error);
    toast.error('添加物资异常');
    return null;
  }
}

// 更新物资库存（支持多规格）
export async function updateMaterialStock(
  materialId: string,
  sizeId: string | null,
  quantity: number,
  operationType: 'restock' | 'request_out' | 'adjustment',
  notes?: string,
  referenceId?: string
): Promise<{ success: boolean; newStock?: number; newSizeStock?: number }> {
  try {
    // 使用数据库函数更新库存
    const { data, error } = await supabase.rpc('update_material_stock', {
      p_material_id: materialId,
      p_size_id: sizeId,
      p_quantity: quantity,
      p_operation_type: operationType,
      p_notes: notes,
      p_reference_id: referenceId
    });

    if (error) {
      console.error('更新库存失败:', error);
      toast.error('更新库存失败');
      return { success: false };
    }

    const result = data && data[0];
    if (result) {
      const action = operationType === 'restock' ? '补货' : operationType === 'request_out' ? '出库' : '调整';
      toast.success(`${action}成功`);
      
      // 触发库存更新事件
      window.dispatchEvent(new CustomEvent('inventoryUpdated'));

      // 清除缓存，下次获取会从数据库拉最新数据
      invalidateMaterialCache();
      
      return {
        success: true,
        newStock: result.new_stock,
        newSizeStock: result.new_size_stock
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('更新库存异常:', error);
    toast.error('更新库存异常');
    return { success: false };
  }
}

// 快速补货
export async function restockMaterial(
  materialId: string,
  sizeId: string | null,
  quantity: number,
  notes?: string
): Promise<{ success: boolean; newStock?: number; newSizeStock?: number }> {
  return updateMaterialStock(materialId, sizeId, quantity, 'restock', notes);
}

// 申领出库
export async function requestMaterialOut(
  materialId: string,
  sizeId: string | null,
  quantity: number,
  referenceId: string,
  notes?: string
): Promise<{ success: boolean; newStock?: number; newSizeStock?: number }> {
  return updateMaterialStock(materialId, sizeId, -quantity, 'request_out', notes, referenceId);
}

// 添加库存流水记录
export async function addInventoryLog(log: {
  material_id: string;
  operation_type: 'initial' | 'restock' | 'request_out' | 'adjustment';
  quantity: number;
  stock_before: number;
  stock_after: number;
  size_id?: string;
  size_label?: string;
  notes?: string;
  reference_id?: string;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('inventory_logs')
      .insert({
        material_id: log.material_id,
        operation_type: log.operation_type,
        quantity: log.quantity,
        stock_before: log.stock_before,
        stock_after: log.stock_after,
        size_id: log.size_id,
        size_label: log.size_label,
        notes: log.notes,
        reference_id: log.reference_id
      })
      .select('id')
      .single();

    if (error) {
      console.error('记录库存流水失败:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('记录库存流水异常:', error);
    return null;
  }
}

// 获取物资的库存流水
export async function fetchInventoryLogs(
  materialId: string,
  limit = 50
): Promise<InventoryLog[]> {
  try {
    const { data, error } = await supabase
      .from('inventory_logs_with_details')
      .select('*')
      .eq('material_id', materialId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取库存流水失败:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('获取库存流水异常:', error);
    return [];
  }
}

// 搜索物资
export async function searchMaterials(query: string): Promise<Material[]> {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .ilike('name', `%${query}%`)
      .or(`category.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('搜索物资失败:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('搜索物资异常:', error);
    return [];
  }
}

// 删除物资（硬删除 - 直接从数据库删除）
export async function deleteMaterial(materialId: string): Promise<boolean> {
  try {
    // 直接从数据库删除该物品
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId);

    if (error) {
      console.error('删除物资失败:', error);
      toast.error('删除物资失败');
      return false;
    }

    // 删除相关的库存流水记录（可选，根据需求决定）
    // 这里我们选择保留历史记录，只删除物品本身
    // await supabase
    //   .from('inventory_logs')
    //   .delete()
    //   .eq('material_id', materialId);

    toast.success('物资已从数据库中永久删除');
    return true;
  } catch (error) {
    console.error('删除物资异常:', error);
    toast.error('删除物资异常');
    return false;
  }
}

// 删除规格
export async function deleteMaterialSize(
  materialId: string,
  sizeId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // 获取当前物资信息
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (fetchError || !material) {
      console.error('获取物资失败:', fetchError);
      toast.error('获取物资信息失败');
      return { success: false };
    }

    // 检查是否有规格
    if (!material.sizes || material.sizes.length === 0) {
      toast.error('该物品没有规格');
      return { success: false };
    }

    // 查找要删除的规格
    const sizeToDelete = material.sizes.find((s: MaterialSize) => s.id === sizeId);
    if (!sizeToDelete) {
      toast.error('规格不存在');
      return { success: false };
    }

    // 如果只剩一个规格，不允许删除（至少保留一个规格）
    if (material.sizes.length === 1) {
      toast.error('至少保留一个规格，建议删除整个物品');
      return { success: false, message: '至少保留一个规格' };
    }

    // 从数组中移除规格
    const updatedSizes = material.sizes.filter((s: MaterialSize) => s.id !== sizeId);
    
    // 重新计算总库存（所有规格之和）
    const newTotalStock = updatedSizes.reduce((sum: number, s: MaterialSize) => sum + s.stock, 0);

    // 更新数据库
    const { error: updateError } = await supabase
      .from('materials')
      .update({
        sizes: updatedSizes,
        stock: newTotalStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', materialId);

    if (updateError) {
      console.error('删除规格失败:', updateError);
      toast.error('删除规格失败');
      return { success: false };
    }

    // 清除缓存
    invalidateMaterialCache();
    
    // 触发更新事件
    window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    
    toast.success(`规格 "${sizeToDelete.label}" 已删除`);
    return { success: true };
  } catch (error) {
    console.error('删除规格异常:', error);
    toast.error('删除规格异常');
    return { success: false };
  }
}

// 批量删除规格
export async function deleteMaterialSizes(
  materialId: string,
  sizeIds: string[]
): Promise<{ success: boolean; deletedCount?: number; message?: string }> {
  try {
    // 获取当前物资信息
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (fetchError || !material) {
      console.error('获取物资失败:', fetchError);
      toast.error('获取物资信息失败');
      return { success: false };
    }

    // 检查是否有规格
    if (!material.sizes || material.sizes.length === 0) {
      toast.error('该物品没有规格');
      return { success: false };
    }

    // 如果删除所有规格，不允许（至少保留一个规格）
    if (sizeIds.length >= material.sizes.length) {
      toast.error('至少保留一个规格，建议删除整个物品');
      return { success: false, message: '至少保留一个规格' };
    }

    // 从数组中移除选中的规格
    const updatedSizes = material.sizes.filter((s: MaterialSize) => !sizeIds.includes(s.id));
    
    // 重新计算总库存（所有规格之和）
    const newTotalStock = updatedSizes.reduce((sum: number, s: MaterialSize) => sum + s.stock, 0);

    // 更新数据库
    const { error: updateError } = await supabase
      .from('materials')
      .update({
        sizes: updatedSizes,
        stock: newTotalStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', materialId);

    if (updateError) {
      console.error('批量删除规格失败:', updateError);
      toast.error('批量删除规格失败');
      return { success: false };
    }

    // 清除缓存
    invalidateMaterialCache();
    
    // 触发更新事件
    window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    
    toast.success(`${sizeIds.length} 个规格已删除`);
    return { success: true, deletedCount: sizeIds.length };
  } catch (error) {
    console.error('批量删除规格异常:', error);
    toast.error('批量删除规格异常');
    return { success: false };
  }
}

// 库存状态配置
export const SEVERITY_CONFIG = {
  empty: {
    label: '缺货',
    color: 'text-red-600',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    bar: '#ef4444'
  },
  critical: {
    label: '危险',
    color: 'text-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    bar: '#f97316'
  },
  warning: {
    label: '预警',
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    bar: '#f59e0b'
  },
  normal: {
    label: '正常',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    bar: '#10b981'
  }
};

// 导出类型
export type { Material, MaterialSize, InventoryLog, StockSeverity };
