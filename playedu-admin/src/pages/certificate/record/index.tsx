import { useEffect, useState } from "react";
import { Button, Table, Modal, Form, InputNumber, Select, message, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { certificate } from "../../../api";
import { dateFormat } from "../../../utils/index";

const CertificateRecordPage = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [showIssue, setShowIssue] = useState(false);
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<Record<number, string>>({});

  useEffect(() => {
    getList();
    loadTemplates();
  }, [page, size]);

  const getList = () => {
    setLoading(true);
    certificate.recordList({ page, size }).then((res: any) => {
      setList(res.data.result.data);
      setTotal(res.data.result.total);
      setTemplates(
        Object.fromEntries(
          Object.entries(res.data.templates || {}).map(([k, v]: any) => [k, v.name])
        )
      );
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const loadTemplates = () => {
    certificate.templateList().then((res: any) => {
      const map: Record<number, string> = {};
      (res.data || []).forEach((t: any) => { map[t.id] = t.name; });
      setTemplates(map);
    });
  };

  const handleIssue = () => {
    form.validateFields().then((values) => {
      certificate.issueRecord(values).then(() => {
        message.success("证书发放成功");
        setShowIssue(false);
        form.resetFields();
        getList();
      }).catch((err: any) => {
        message.error(err?.data?.msg || "发放失败");
      });
    });
  };

  const handleRevoke = (id: number) => {
    Modal.confirm({
      title: "确认撤销",
      content: "确定要撤销此证书吗？撤销后证书将失效。",
      onOk() {
        certificate.revokeRecord(id).then(() => {
          message.success("撤销成功");
          getList();
        });
      },
    });
  };

  const handleExport = (id: number) => {
    window.open(`/backend/v1/certificate/record/export/${id}`);
  };

  const columns: ColumnsType<any> = [
    { title: "证书编号", dataIndex: "cert_no" },
    { title: "学员", dataIndex: "user_name" },
    { title: "课程", dataIndex: "course_name" },
    { title: "模板", render: (_, r) => templates[r.template_id] || "-" },
    { title: "状态", dataIndex: "status", render: (s) => (s === 1 ? "有效" : "已撤销") },
    { title: "发放方式", dataIndex: "issue_type", render: (t) => (t === "auto" ? "自动" : "手动") },
    { title: "发放时间", dataIndex: "issued_at", render: (t) => dateFormat(t) },
    {
      title: "操作",
      render: (_, record) => (
        <Space>
          {record.status === 1 && (
            <Button type="link" size="small" danger onClick={() => handleRevoke(record.id)}>撤销</Button>
          )}
          <Button type="link" size="small" onClick={() => handleExport(record.id)}>导出PDF</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="playedu-main-title float-left mb-24">证书记录</div>
      <div className="float-left mb-24">
        <Button type="primary" onClick={() => setShowIssue(true)}>手动发放</Button>
      </div>
      <div className="float-left">
        <Table
          columns={columns}
          dataSource={list}
          loading={loading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: size,
            total,
            onChange: (p, s) => { setPage(p); setSize(s); },
          }}
        />
      </div>

      <Modal title="发放证书" open={showIssue} onCancel={() => setShowIssue(false)} onOk={handleIssue}>
        <Form form={form} layout="vertical">
          <Form.Item name="template_id" label="证书模板" rules={[{ required: true }]}>
            <Select
              placeholder="选择模板"
              options={Object.entries(templates).map(([k, v]) => ({ label: v, value: Number(k) }))}
            />
          </Form.Item>
          <Form.Item name="user_id" label="学员ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} placeholder="输入学员ID" />
          </Form.Item>
          <Form.Item name="course_id" label="课程ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} placeholder="输入课程ID" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CertificateRecordPage;
