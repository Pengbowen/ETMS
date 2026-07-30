import { useEffect, useState } from "react";
import { Button, Table, Modal, Input, Upload, message, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, InboxOutlined, LinkOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { certificate } from "../../../api";
import { dateFormat, getToken, checkUrl } from "../../../utils/index";
import config from "../../../js/config";
import { TemplateEditor, Placeholder } from "../../../compenents/template-editor";

const { Dragger } = Upload;

interface DataType {
  id: number;
  name: string;
  background_image: string;
  width: number;
  height: number;
  placeholders: string;
  qr_config: string;
  status: number;
  created_at: string;
}

const CertificateTemplatePage = () => {
  const [list, setList] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // 编辑器状态
  const [bgImage, setBgImage] = useState("");
  const [bgUrl, setBgUrl] = useState("");
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(850);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    getList();
  }, []);

  const getList = () => {
    setLoading(true);
    certificate
      .templateList()
      .then((res: any) => {
        setList(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const openEditor = (record?: DataType) => {
    if (record) {
      setEditingId(record.id);
      setTemplateName(record.name);
      setBgImage(record.background_image);
      setCanvasWidth(record.width);
      setCanvasHeight(record.height);
      try {
        setPlaceholders(JSON.parse(record.placeholders || "[]"));
      } catch {
        setPlaceholders([]);
      }
      setBgUrl("");
      // 获取现有背景图预览 URL
      if (record.background_image) {
        certificate.templatePreviewUrl(record.background_image).then((res: any) => {
          if (res.data) setBgUrl(res.data);
        });
      }
      setShowManualInput(true);
    } else {
      setEditingId(null);
      setTemplateName("");
      setBgImage("");
      setBgUrl("");
      setCanvasWidth(1200);
      setCanvasHeight(850);
      setPlaceholders([]);
      setShowManualInput(false);
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      message.error("请输入模板名称");
      return;
    }
    if (!bgImage) {
      message.error("请上传背景图片");
      return;
    }

    const qrPlaceholder = placeholders.find((p) => p.type === "qrcode");
    const qrConfig = qrPlaceholder
      ? { enabled: true, x: qrPlaceholder.x, y: qrPlaceholder.y, size: qrPlaceholder.size || 120 }
      : { enabled: false };

    const data = {
      name: templateName,
      background_image: bgImage,
      width: canvasWidth,
      height: canvasHeight,
      placeholders: JSON.stringify(placeholders),
      qr_config: JSON.stringify(qrConfig),
    };

    setSaving(true);
    try {
      if (editingId) {
        await certificate.updateTemplate(editingId, data);
        message.success("更新成功");
      } else {
        await certificate.storeTemplate(data);
        message.success("创建成功");
      }
      setShowEditor(false);
      getList();
    } catch (err: any) {
      message.error(err?.data?.msg || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除此证书模板吗？",
      onOk() {
        certificate.destroyTemplate(id).then(() => {
          message.success("删除成功");
          getList();
        });
      },
    });
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: "image/png,image/jpeg,image/jpg",
    action: checkUrl(config.app_url) + "backend/v1/upload/minio",
    headers: {
      authorization: "Bearer " + getToken(),
    },
    showUploadList: false,
    onChange(info) {
      const { status, response } = info.file;
      if (status === "done") {
        if (response && response.code === 0) {
          const path = response.data?.path || "";
          setBgImage(path);
          // 获取预览 URL
          certificate.templatePreviewUrl(path).then((res: any) => {
            if (res.data) setBgUrl(res.data);
          });
          message.success("背景图上传成功");
        } else {
          message.error(response?.msg || "上传失败");
        }
      } else if (status === "error") {
        message.error("上传失败，请重试");
      }
    },
  };

  const columns: ColumnsType<DataType> = [
    { title: "模板名称", dataIndex: "name" },
    {
      title: "尺寸",
      render: (_, r) => `${r.width}×${r.height}`,
    },
    {
      title: "元素数量",
      render: (_, r) => {
        try { return JSON.parse(r.placeholders || "[]").length; } catch { return 0; }
      },
    },
    { title: "状态", dataIndex: "status", render: (s) => (s === 1 ? "启用" : "禁用") },
    { title: "创建时间", dataIndex: "created_at", render: (t) => dateFormat(t) },
    {
      title: "操作",
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEditor(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="playedu-main-title float-left mb-24">证书模板</div>
      <div className="float-left mb-24">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
          新建模板
        </Button>
      </div>
      <div className="float-left">
        <Table columns={columns} dataSource={list} loading={loading} rowKey="id" />
      </div>

      <Modal
        title={editingId ? "编辑证书模板" : "新建证书模板"}
        open={showEditor}
        onCancel={() => setShowEditor(false)}
        width="95%"
        style={{ top: 20 }}
        footer={
          <Space>
            <Button onClick={() => setShowEditor(false)}>取消</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              保存模板
            </Button>
          </Space>
        }
        destroyOnClose
      >
        <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1, maxWidth: 300 }}>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>模板名称</div>
            <Input
              placeholder="如：结业证书"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div style={{ flex: 2 }}>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>
              背景图片
              <Button
                type="link"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => setShowManualInput(!showManualInput)}
                style={{ marginLeft: 8 }}
              >
                {showManualInput ? "隐藏" : "手动输入路径"}
              </Button>
            </div>

            {showManualInput ? (
              <Input
                placeholder="输入 S3 路径"
                value={bgImage}
                onChange={(e) => {
                const val = e.target.value;
                setBgImage(val);
                setBgUrl("");
                if (val) {
                  certificate.templatePreviewUrl(val).then((res: any) => {
                    if (res.data) setBgUrl(res.data);
                  });
                }
              }}
              />
            ) : (
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                {bgImage ? (
                  <p style={{ color: "#52c41a" }}>✓ 背景图已就绪（{bgImage}）</p>
                ) : (
                  <>
                    <p className="ant-upload-text">点击或拖拽上传背景图</p>
                    <p className="ant-upload-hint">支持 PNG / JPG 格式</p>
                  </>
                )}
              </Dragger>
            )}
          </div>
        </div>

        {bgImage && (
          <TemplateEditor
            backgroundImage={bgImage}
            backgroundUrl={bgUrl || undefined}
            width={canvasWidth}
            height={canvasHeight}
            placeholders={placeholders}
            onChange={setPlaceholders}
          />
        )}

        {!bgImage && (
          <div
            style={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f5f5f5",
              borderRadius: 8,
              color: "#999",
            }}
          >
            请先上传背景图，然后开始编辑
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CertificateTemplatePage;
