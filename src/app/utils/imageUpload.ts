import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const BUCKET_NAME = 'material-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.8;

/**
 * 压缩图片，将大图缩小到指定尺寸以内
 */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // 如果图片尺寸在限制内且大小在 500KB 以内，不压缩
        if (width <= MAX_WIDTH && height <= MAX_HEIGHT && file.size <= 500 * 1024) {
          resolve(file);
          return;
        }

        // 按比例缩放
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 Canvas 上下文'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          'image/jpeg',
          QUALITY
        );
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 上传图片到 Supabase Storage
 * @param file 用户选择的图片文件
 * @param folder 子文件夹名称（如 'items'、'purchase'）
 * @returns 上传后的公开访问 URL，失败返回 null
 */
export async function uploadImage(
  file: File,
  folder: string = 'items'
): Promise<string | null> {
  try {
    // 1. 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return null;
    }

    // 2. 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      toast.error('图片大小不能超过 5MB');
      return null;
    }

    // 3. 压缩图片
    const compressed = await compressImage(file);

    // 4. 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // 5. 上传到 Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, compressed, {
        cacheControl: '3600',
        upsert: false,
        contentType: compressed.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('图片上传失败:', uploadError);

      // 如果存储桶不存在，给出友好提示
      if (uploadError.message.includes('Bucket') || uploadError.message.includes('bucket')) {
        toast.error('图片存储桶未创建，请联系管理员在 Supabase 中创建 material-images 存储桶');
      } else if (uploadError.message.includes('Row level security') || uploadError.message.includes('RLS')) {
        toast.error('没有上传权限，请联系管理员配置存储桶权限');
      } else {
        toast.error('图片上传失败，请重试');
      }
      return null;
    }

    // 6. 获取公开 URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('图片上传异常:', error);
    toast.error('图片上传异常');
    return null;
  }
}

/**
 * 删除 Supabase Storage 中的图片
 * @param url 图片的公开 URL
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    // 从 URL 中提取文件路径
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/(.+)/);
    if (!pathMatch) return false;

    const filePath = pathMatch[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('图片删除失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('图片删除异常:', error);
    return false;
  }
}
