import { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, InputNumber, Select, message, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { certificate } from "../../../api";
import { dateFormat } from "../../../utils/index";

const CertificateRulePage = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<Record<number, string>>({});

  useEffect(() => {
    getList();
    certificate.templateList().then((res: any) => {
      const map: Record<number, string> = {};
      (res.data || []).forEach((t: any) => { map[t.id] = t.name; });
      setTemplates(map);
    });
  }, []);

  const getList = () => {
    setLoading(true);
    certificate.ruleList().then((res: any) => {
      setList(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const data = {
        name: values.name,
        template_id: values.template_id,
        trigger_type: values.trigger_type,
        course_ids: values.course_ids,
        min_progress: values.min_progress || 100,
      };
      if (editingId) {
        certificate.updateRule(editingId, data).then(() => {
          message.success("更新成功");
          setShowModal(false);
          getList();
        });
      } else {
        certificate.storeRule(data).then(() => {
          message.success("创建成功");
          setShowModal(false);
          getList();
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除此规则吗？",
      onOk() {
        certificate.destroyRule(id).then(() => {
          message.success("删除成功");
          getList();
        });
      },
    });
  };

  const columns: ColumnsType<any> = [
    { title: "规则名称", dataIndex: "name" },
    { title: "模板", render: (_, r) => templates[r.template_id] || "-" },
    { title: "触发类型", dataIndex: "trigger_type", render: (t) => t === "course_complete" ? "课程完成" : "考试通过" },
    { title: "最小进度", dataIndex: "min_progress", render: (v) => `${v}%` },
    { title: "状态", dataIndex: "status", render: (s) => (s === 1 ? "启用" : "禁用") },
    { title: "创建时间", dataIndex: "created_at", render: (t) => dateFormat(t) },
    {
      title: "操作",
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => {
            setEditingId(record.id);
            form.setFieldsValue(record);
            setShowModal(true);
          }}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="playedu-main-title float-left mb-24">证书规则</div>
      <div className="float-left mb-24">
        <Button type="primary" onClick={() => { setEditingId(null); form.resetFields(); setShowModal(true); }}>
          新建规则
        </Button>
      </div>
      <div className="float-left">
        <Table columns={columns} dataSource={list} loading={loading} rowKey="id" />
      </div>

      <Modal title={editingId ? "编辑规则" : "新建规则"} open={showModal}
        onCancel={() => setShowModal(false)} onOk={handleSubmit}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input placeholder="如：完成课程自动发证" />
          </Form.Item>
          <Form.Item name="template_id" label="证书模板" rules={[{ required: true }]}>
            <Select options={Object.entries(templates).map(([k, v]) => ({ label: v, value: Number(k) }))} />
          </Form.Item>
          <Form.Item name="trigger_type" label="触发类型" initialValue="course_complete">
            <Select options={[
              { label: "课程完成", value: "course_complete" },
              { label: "考试通过", value: "exam_pass" },
            ]} />
          </Form.Item>
          <Form.Item name="course_ids" label="适用课程ID(逗号分隔)">
            <Input placeholder="如：1,2,3" />
          </Form.Item>
          <Form.Item name="min_progress" label="最小完成进度(%)" initialValue={100}>
            <InputNumber style={{ width: "100%" }} min={1} max={100} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CertificateRulePage;
