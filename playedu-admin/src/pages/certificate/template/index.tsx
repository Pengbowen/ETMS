import { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, InputNumber, Select, message, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { certificate } from "../../../api";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { dateFormat } from "../../../utils/index";

const { confirm } = Modal;

interface DataType {
  id: number;
  name: string;
  background_image: string;
  width: number;
  height: number;
  status: number;
  created_at: string;
}

const CertificateTemplatePage = () => {
  const [list, setList] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    getList();
  }, []);

  const getList = () => {
    setLoading(true);
    certificate
      .templateList()
      .then((res: any) => {
        setList(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const data = {
        name: values.name,
        background_image: values.background_image,
        width: values.width || 1200,
        height: values.height || 850,
        placeholders: JSON.stringify(values.placeholders || []),
        qr_config: JSON.stringify(
          values.qr_enabled
            ? { enabled: true, x: values.qr_x || 950, y: values.qr_y || 650, size: values.qr_size || 120 }
            : { enabled: false }
        ),
      };

      if (editingId) {
        certificate.updateTemplate(editingId, data).then(() => {
          message.success("更新成功");
          setShowModal(false);
          getList();
        });
      } else {
        certificate.storeTemplate(data).then(() => {
          message.success("创建成功");
          setShowModal(false);
          getList();
        });
      }
    });
  };

  const handleEdit = (record: DataType) => {
    setEditingId(record.id);
    let placeholders = [];
    let qrConfig: any = { enabled: false };
    try {
      placeholders = JSON.parse((record as any).placeholders || "[]");
      qrConfig = JSON.parse((record as any).qr_config || '{"enabled":false}');
    } catch (e) {}

    form.setFieldsValue({
      name: record.name,
      background_image: record.background_image,
      width: record.width,
      height: record.height,
      placeholders,
      qr_enabled: qrConfig.enabled || false,
      qr_x: qrConfig.x || 950,
      qr_y: qrConfig.y || 650,
      qr_size: qrConfig.size || 120,
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    confirm({
      title: "确认删除",
      icon: <ExclamationCircleFilled />,
      content: "确定要删除此证书模板吗？",
      onOk() {
        certificate.destroyTemplate(id).then(() => {
          message.success("删除成功");
          getList();
        });
      },
    });
  };

  const columns: ColumnsType<DataType> = [
    { title: "模板名称", dataIndex: "name" },
    { title: "尺寸", render: (_, r) => `${r.width}×${r.height}` },
    { title: "状态", dataIndex: "status", render: (s) => (s === 1 ? "启用" : "禁用") },
    { title: "创建时间", dataIndex: "created_at", render: (t) => dateFormat(t) },
    {
      title: "操作",
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="playedu-main-title float-left mb-24">证书模板</div>
      <div className="float-left mb-24">
        <Button
          type="primary"
          onClick={() => {
            setEditingId(null);
            form.resetFields();
            setShowModal(true);
          }}
        >
          新建模板
        </Button>
      </div>
      <div className="float-left">
        <Table columns={columns} dataSource={list} loading={loading} rowKey="id" />
      </div>

      <Modal
        title={editingId ? "编辑模板" : "新建模板"}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: "请输入模板名称" }]}>
            <Input placeholder="如：完成证书" />
          </Form.Item>
          <Form.Item name="background_image" label="背景图路径(S3 key)" rules={[{ required: true, message: "请输入背景图路径" }]}>
            <Input placeholder="如：cert-bg/default.png" />
          </Form.Item>
          <Form.Item name="width" label="宽度(px)" initialValue={1200}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="height" label="高度(px)" initialValue={850}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="qr_enabled" label="启用二维码" valuePropName="checked">
            <Select
              options={[
                { label: "是", value: true },
                { label: "否", value: false },
              ]}
            />
          </Form.Item>
          <Form.Item name="qr_x" label="二维码 X 坐标" initialValue={950}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="qr_y" label="二维码 Y 坐标" initialValue={650}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="qr_size" label="二维码尺寸(px)" initialValue={120}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CertificateTemplatePage;
