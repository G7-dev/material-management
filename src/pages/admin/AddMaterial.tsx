import { useState } from 'react'
import { Card, Form, Input, InputNumber, Button, Upload, message, Row, Col, Typography, Tag } from 'antd'
import { InboxOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import type { UploadProps } from 'antd'
import axios from 'axios'

const { Title, Text } = Typography
const { Dragger } = Upload

// Cloudinary 配置 - 替换为你的信息
const CLOUDINARY_CLOUD_NAME = 'dmi90dnec'  // 从Cloudinary Dashboard获取
const CLOUDINARY_UPLOAD_PRESET = 'material-management'  // 你的上传预设名称

/**
 * 物品上架页面 - 使用 Cloudinary 存储图片
 * 功能: 上传照片到 Cloudinary、填写物品信息、上架新物品
 */
export default function AddMaterial() {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  /**
   * 上传图片到 Cloudinary
   */
  const handleImageUpload: UploadProps = {
    name: 'file',
    multiple: false,
    accept: 'image/*',
    beforeUpload: (file) => {
      // 检查文件大小（限制5MB）
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        message.error('图片大小不能超过5MB!')
        return Upload.LIST_IGNORE
      }
      return true
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploading(true)
        
        const formData = new FormData()
        formData.append('file', file as File)
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
        
        // 上传到 Cloudinary
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
              console.log(`上传进度: ${percent}%`)
            }
          }
        )
        
        if (response.data?.secure_url) {
          setImageUrl(response.data.secure_url)
          onSuccess && onSuccess(response.data)
          message.success('图片上传成功！')
        } else {
          throw new Error('上传失败')
        }
      } catch (error) {
        console.error('图片上传失败:', error)
        message.error('图片上传失败，请重试')
        onError && onError(new Error('上传失败'))
      } finally {
        setUploading(false)
      }
    },
    onRemove: () => {
      setImageUrl('')
      return true
    }
  }

  /**
   * 提交物品信息
   */
  const handleSubmit = async (values: any) => {
    // 检查是否上传了图片
    if (!imageUrl) {
      message.error('请上传物品图片')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        message.error('请先登录')
        setSubmitting(false)
        return
      }

      // 创建新物资
      const { data: newMaterial, error } = await supabase
        .from('materials')
        .insert({
          name: values.name,
          category: values.category,
          specification: values.specification || '',
          model: values.model || '',
          unit: values.unit,
          stock: values.stock,
          safe_stock: values.safe_stock,
          location: values.location || '',
          image_url: imageUrl,  // 使用 Cloudinary 的 URL
          status: 'active',
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      // 记录初始库存流水
      await supabase
        .from('inventory_logs')
        .insert({
          material_id: newMaterial.id,
          operation_type: 'initial',
          quantity: values.stock,
          stock_before: 0,
          stock_after: values.stock,
          created_by: user.id
        })

      message.success('物品上架成功！')
      form.resetFields()
      setImageUrl('')
    } catch (error) {
      console.error('物品上架失败:', error)
      message.error('物品上架失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ 
      padding: '40px 24px', 
      display: 'flex', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: 'calc(100vh - 64px)'
    }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PlusOutlined style={{ color: '#667eea', fontSize: 24 }} />
            <Title level={3} style={{ margin: 0, color: '#1f2937' }}>物品上架</Title>
            <Tag color="blue" style={{ marginLeft: 'auto' }}>Cloudinary存储</Tag>
          </div>
        }
        style={{ 
          borderRadius: 16, 
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
          width: '100%',
          maxWidth: 900,
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}
        bodyStyle={{ padding: '32px 48px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* 图片上传 - Cloudinary */}
          <Form.Item
            label="物品图片"
            required
          >
            <Dragger {...handleImageUpload} showUploadList={false}>
              {imageUrl ? (
                <div style={{ padding: 20 }}>
                  <img src={imageUrl} alt="物品图片" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8 }} />
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary">点击或拖拽更换图片</Text>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 40 }}>
                  <p style={{ marginBottom: 8 }}>
                    <InboxOutlined style={{ fontSize: 48, color: '#667eea' }} />
                  </p>
                  <p style={{ marginBottom: 8, fontSize: 16, color: '#1f2937' }}>
                    点击或拖拽上传物品图片
                  </p>
                  <p style={{ color: '#6b7280' }}>
                    支持 JPG, PNG 格式，最大 5MB
                  </p>
                  {uploading && <Text type="secondary">上传中...</Text>}
                </div>
              )}
            </Dragger>
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="物品名称"
                rules={[{ required: true, message: '请输入物品名称' }]}
              >
                <Input placeholder="请输入物品名称" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="category"
                label="物品分类"
                rules={[{ required: true, message: '请选择物品分类' }]}
              >
                <Input placeholder="如：办公用品、电子设备、劳保用品等" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="specification"
                label="物品规格"
              >
                <Input placeholder="如：A4、100页、蓝色等" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="model"
                label="物品型号"
              >
                <Input placeholder="如：HP-1020、得力-001等" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="unit"
                label="计量单位"
                rules={[{ required: true, message: '请输入计量单位' }]}
              >
                <Input placeholder="如：个、箱、包、件" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="stock"
                label="上架数量"
                rules={[{ required: true, message: '请输入上架数量' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="请输入数量"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="safe_stock"
                label="最低库存"
                rules={[{ required: true, message: '请输入最低库存' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="库存预警值"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="location"
            label="存放位置"
          >
            <Input placeholder="如：A区-1号货架-第3层" size="large" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注信息"
          >
            <Input.TextArea
              rows={3}
              placeholder="可填写物品的详细信息、使用说明等..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              icon={<CheckOutlined />}
              style={{
                width: '100%',
                height: 48,
                fontSize: 16,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
              }}
              disabled={!imageUrl}  // 必须上传图片才能提交
            >
              确认上架
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
