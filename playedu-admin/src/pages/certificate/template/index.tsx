import { useEffect, useState } from "react";
import {
  Button, Table, Modal, Form, Input, Select, InputNumber, Switch,
  Upload, message, Space, Tag, Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined, InboxOutlined, SettingOutlined, LinkOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useNavigate } from "react-router-dom";
import { certificate } from "../../../api";
import { dateFormat, getToken, checkUrl } from "../../../utils/index";
import config from "../../../js/config";

const { Dragger } = Upload;
const { TextArea } = Input;

interface DataType {
  id: number;
  name: string;
  type: string;
  issuing_authority: string;
  numbering_rule: string;
  status: number;
  is_valid: number;
  expiry_years: number;
  created_at: string;
}

const CERT_TYPES: Record<string, string> = {
  completion: "结业证书",
  training: "培训证书",
  honor: "荣誉证书",
  other: "其他",
};

const CertificateTemplatePage = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [bgImage, setBgImage] = useState("");
  const [sampleImage, setSampleImage] = useState("");

  useEffect(() => { getList(); }, []);

  const getList = () => {
    setLoading(true);
    certificate.templateList().then((res: any) => {
      setList(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleCreate = () => {
    form.validateFields().then((values) => {
      const data = {
        ...values,
        background_image: bgImage,
        sample_image: sampleImage,
        is_enabled: values.is_enabled ? 1 : 0,
        is_valid: values.is_valid ? 1 : 0,
      };
      setSaving(true);
      certificate.storeTemplate(data).then(() => {
        message.success("证书创建成功");
        setShowCreate(false);
        form.resetFields();
        setBgImage("");
        setSampleImage("");
        getList();
        setSaving(false);
      }).catch((err: any) => {
        message.error(err?.data?.msg || "创建失败");
        setSaving(false);
      });
    });
  };

  const handleEdit = (record: DataType) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      issuing_authority: record.issuing_authority,
      numbering_rule: record.numbering_rule,
      description: (record as any).description || "",
      is_valid: record.is_valid === 1,
      expiry_years: record.expiry_years,
      is_enabled: (record as any).is_enabled === 1,
    });
    setBgImage((record as any).background_image || "");
    setSampleImage((record as any).sample_image || "");
    setShowCreate(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    form.validateFields().then((values) => {
      const data = {
        ...values,
        background_image: bgImage,
        sample_image: sampleImage,
        is_enabled: values.is_enabled ? 1 : 0,
        is_valid: values.is_valid ? 1 : 0,
      };
      setSaving(true);
      certificate.updateTemplate(editingId, data).then(() => {
        message.success("证书更新成功");
        setShowCreate(false);
        setEditingId(null);
        form.resetFields();
        setBgImage("");
        setSampleImage("");
        getList();
        setSaving(false);
      }).catch((err: any) => {
        message.error(err?.data?.msg || "更新失败");
        setSaving(false);
      });
    });
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditingId(null);
    form.resetFields();
    setBgImage("");
    setSampleImage("");
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除后证书模板及关联数据将无法恢复",
      onOk() {
        certificate.destroyTemplate(id).then(() => {
          message.success("删除成功");
          getList();
        });
      },
    });
  };

  const uploadBgProps: UploadProps = {
    name: "file", multiple: false,
    accept: "image/png,image/jpeg,image/jpg",
    action: checkUrl(config.app_url) + "backend/v1/upload/minio",
    headers: { authorization: "Bearer " + getToken() },
    showUploadList: false,
    onChange(info) {
      if (info.file.status === "done" && info.file.response?.code === 0) {
        setBgImage(info.file.response.data?.path || "");
        message.success("背景图上传成功");
      } else if (info.file.status === "error") {
        message.error("上传失败");
      }
    },
  };

  const uploadSampleProps: UploadProps = {
    ...uploadBgProps,
    onChange(info) {
      if (info.file.status === "done" && info.file.response?.code === 0) {
        setSampleImage(info.file.response.data?.path || "");
        message.success("样例图上传成功");
      } else if (info.file.status === "error") {
        message.error("上传失败");
      }
    },
  };

  const columns: ColumnsType<DataType> = [
    { title: "证书名称", dataIndex: "name", width: 160 },
    { title: "类型", dataIndex: "type", width: 100,
      render: (t) => <Tag>{CERT_TYPES[t] || t}</Tag> },
    { title: "发证单位", dataIndex: "issuing_authority", width: 140 },
    { title: "编号规则", dataIndex: "numbering_rule", width: 160 },
    { title: "有效", dataIndex: "is_valid", width: 70,
      render: (v) => v === 1 ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag> },
    { title: "有效期", dataIndex: "expiry_years", width: 80,
      render: (v) => v === 0 ? "永久" : `${v}年` },
    { title: "创建时间", dataIndex: "created_at", width: 140,
      render: (t) => dateFormat(t) },
    {
      title: "操作", width: 160, fixed: "right" as const,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small"
            onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<SettingOutlined />}
            onClick={() => navigate(`/certificate/template/editor?id=${record.id}`)}>
            配置
          </Button>
          <Button type="link" size="small" danger
            onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div className="playedu-main-title">证书管理</div>
        <Button type="primary" icon={<PlusOutlined />} size="large"
          onClick={() => setShowCreate(true)}>
          新建证书
        </Button>
      </div>
      <Table columns={columns} dataSource={list} loading={loading} rowKey="id"
        scroll={{ x: 1100 }} />

      <Modal title={editingId ? "编辑证书" : "新建证书"} open={showCreate} width={720}
        onCancel={closeModal} onOk={editingId ? handleUpdate : handleCreate}
        confirmLoading={saving} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="证书名称" rules={[{ required: true }]}>
            <Input placeholder="如：新员工入职培训结业证书" />
          </Form.Item>
          <Form.Item name="type" label="证书类型" initialValue="completion">
            <Select options={[
              { label: "结业证书", value: "completion" },
              { label: "培训证书", value: "training" },
              { label: "荣誉证书", value: "honor" },
              { label: "其他", value: "other" },
            ]} />
          </Form.Item>
          <Form.Item name="issuing_authority" label="发证单位">
            <Input placeholder="如：XX公司培训部" />
          </Form.Item>
          <Form.Item name="numbering_rule" label="编号规则" initialValue="CERT{yyyyMMdd}{nnnn}"
            tooltip="{yyyyMMdd}=日期, {nnnn}=4位随机数">
            <Input placeholder="CERT{yyyyMMdd}{nnnn}" />
          </Form.Item>

          <Form.Item label="证书背景图">
            <Dragger {...uploadBgProps}>
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              {bgImage ? (
                <p style={{ color: "#52c41a" }}>✓ {bgImage}</p>
              ) : (
                <p className="ant-upload-text">上传背景底图</p>
              )}
            </Dragger>
          </Form.Item>

          <Form.Item label="证书样例图">
            <Dragger {...uploadSampleProps}>
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              {sampleImage ? (
                <p style={{ color: "#52c41a" }}>✓ {sampleImage}</p>
              ) : (
                <p className="ant-upload-text">上传样例预览图</p>
              )}
            </Dragger>
          </Form.Item>

          <Form.Item name="description" label="证书描述">
            <TextArea rows={3} placeholder="证书描述说明..." />
          </Form.Item>

          <Space size="large">
            <Form.Item name="is_valid" label="是否有效" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            <Form.Item name="expiry_years" label="有效期(年)" initialValue={0}
              tooltip="0 表示永久有效">
              <InputNumber min={0} max={99} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="is_enabled" label="启用" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default CertificateTemplatePage;
