import { useEffect, useState, useCallback, useRef } from "react";
import {
  Button, Input, InputNumber, Select, ColorPicker, message, Space,
  Upload, Modal, Spin,
} from "antd";
import {
  PlusOutlined, SaveOutlined, DeleteOutlined, ArrowLeftOutlined,
  InboxOutlined, PictureOutlined,
} from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Rnd } from "react-rnd";
import { certificate } from "../../../../api";
import { getToken, checkUrl } from "../../../../utils/index";
import config from "../../../../js/config";

interface ElementItem {
  id: string;
  type: "other" | "name" | "number";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  lineHeight: number;
}

const ELEMENT_TYPE_OPTIONS = [
  { label: "静态文本", value: "other" },
  { label: "姓名（动态）", value: "name" },
  { label: "编号（动态）", value: "number" },
];

const FONT_FAMILIES = [
  { label: "微软雅黑", value: "Microsoft YaHei" },
  { label: "宋体", value: "SimSun" },
  { label: "黑体", value: "SimHei" },
  { label: "楷体", value: "KaiTi" },
  { label: "SansSerif", value: "SansSerif" },
];

const CertificateEditorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("id");
  const canvasRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [bgUrl, setBgUrl] = useState("");
  const [elements, setElements] = useState<ElementItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;
    setLoading(true);
    certificate.templateList().then((res: any) => {
      const tpl = (res.data || []).find((t: any) => t.id === Number(templateId));
      if (tpl) {
        setTemplate(tpl);
        try { setElements(JSON.parse(tpl.placeholders || "[]")); } catch { setElements([]); }
        if (tpl.background_image) {
          certificate.templatePreviewUrl(tpl.background_image).then((r: any) => {
            if (r.data) setBgUrl(r.data);
          });
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [templateId]);

  const selected = elements.find((e) => e.id === selectedId);

  const addElement = useCallback(() => {
    const id = Date.now().toString();
    const newEl: ElementItem = {
      id, type: "other", content: "新文本",
      x: 300, y: 300, width: 400, height: 60,
      fontSize: 28, color: "#333333",
      fontFamily: "Microsoft YaHei", fontWeight: "normal", lineHeight: 1.5,
    };
    const updated = [...elements, newEl];
    setElements(updated);
    setSelectedId(id);
  }, [elements]);

  const updateElement = useCallback((id: string, updates: Partial<ElementItem>) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const handleSave = () => {
    if (!template) return;
    setSaving(true);
    certificate.updateTemplate(template.id, {
      placeholders: JSON.stringify(elements),
    }).then(() => {
      message.success("保存成功");
      setSaving(false);
    }).catch((err: any) => {
      message.error(err?.data?.msg || "保存失败");
      setSaving(false);
    });
  };

  const uploadImage = (info: any, callback?: (path: string) => void) => {
    if (info.file.status === "done" && info.file.response?.code === 0) {
      const path = info.file.response.data?.path || "";
      certificate.templatePreviewUrl(path).then((r: any) => {
        if (r.data) {
          const id = Date.now().toString();
          const imgEl: ElementItem = {
            id, type: "other", content: `<img>${r.data}</img>`,
            x: 200, y: 200, width: 200, height: 200,
            fontSize: 14, color: "#333",
            fontFamily: "SansSerif", fontWeight: "normal", lineHeight: 1,
          };
          setElements((prev) => [...prev, imgEl]);
          setSelectedId(id);
        }
      });
      message.success("图片已添加");
    } else if (info.file.status === "error") {
      message.error("上传失败");
    }
  };

  if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  if (!template) return <div style={{ padding: 40, textAlign: "center" }}>模板不存在</div>;

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      {/* 顶部操作栏 */}
      <div style={{
        height: 56, display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px", borderBottom: "1px solid #f0f0f0", background: "#fff",
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/certificate/template")}>返回</Button>
        <span style={{ fontSize: 16, fontWeight: 500, flex: 1 }}>{template.name} — 模板编辑器</span>
        <Upload name="file" multiple={false} accept="image/*"
          action={checkUrl(config.app_url) + "backend/v1/upload/minio"}
          headers={{ authorization: "Bearer " + getToken() }}
          showUploadList={false} onChange={(info) => uploadImage(info)}>
          <Button icon={<PictureOutlined />}>添加图片</Button>
        </Upload>
        <Button type="default" icon={<PlusOutlined />} onClick={addElement}>添加文字</Button>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存设置</Button>
      </div>

      {/* 主体：左面板 + 右画布 */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* 左侧元素列表 */}
        <div style={{
          width: 340, borderRight: "1px solid #f0f0f0", overflow: "auto",
          background: "#fafafa", padding: 12,
        }}>
          <div style={{ marginBottom: 12, fontWeight: 500, fontSize: 13 }}>
            元素配置列表
          </div>
          {elements.map((el, idx) => (
            <div key={el.id} style={{
              marginBottom: 8, padding: 10, borderRadius: 6,
              background: selectedId === el.id ? "#e6f0ff" : "#fff",
              border: selectedId === el.id ? "1px solid #266bcb" : "1px solid #e8e8e8",
              cursor: "pointer",
            }} onClick={() => setSelectedId(el.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Space>
                  <span style={{
                    display: "inline-flex", width: 20, height: 20, borderRadius: "50%",
                    background: "#266bcb", color: "#fff", fontSize: 11,
                    alignItems: "center", justifyContent: "center",
                  }}>{idx + 1}</span>
                  <Select size="small" value={el.type} style={{ width: 110 }}
                    options={ELEMENT_TYPE_OPTIONS}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(v) => updateElement(el.id, { type: v })} />
                </Space>
                <DeleteOutlined style={{ color: "#ff4d4f", cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} />
              </div>

              {selectedId === el.id && (
                <>
                  <Input size="small" value={el.content}
                    placeholder="文本内容"
                    style={{ marginBottom: 6 }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateElement(el.id, { content: e.target.value })} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
                    <div><span style={{ fontSize: 11, color: "#999" }}>X</span>
                      <InputNumber size="small" value={el.x} style={{ width: "100%" }}
                        onChange={(v) => updateElement(el.id, { x: v || 0 })} /></div>
                    <div><span style={{ fontSize: 11, color: "#999" }}>Y</span>
                      <InputNumber size="small" value={el.y} style={{ width: "100%" }}
                        onChange={(v) => updateElement(el.id, { y: v || 0 })} /></div>
                    <div><span style={{ fontSize: 11, color: "#999" }}>宽度</span>
                      <InputNumber size="small" value={el.width} style={{ width: "100%" }}
                        onChange={(v) => updateElement(el.id, { width: v || 100 })} /></div>
                    <div><span style={{ fontSize: 11, color: "#999" }}>高度</span>
                      <InputNumber size="small" value={el.height} style={{ width: "100%" }}
                        onChange={(v) => updateElement(el.id, { height: v || 30 })} /></div>
                  </div>

                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    <Select size="small" value={el.fontFamily} style={{ flex: 1 }}
                      options={FONT_FAMILIES}
                      onChange={(v) => updateElement(el.id, { fontFamily: v })} />
                    <InputNumber size="small" value={el.fontSize} min={8} max={120}
                      style={{ width: 60 }} placeholder="字号"
                      onChange={(v) => updateElement(el.id, { fontSize: v || 14 })} />
                  </div>

                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    <InputNumber size="small" value={el.lineHeight} min={0.5} max={5} step={0.1}
                      style={{ width: 60 }} placeholder="行高"
                      onChange={(v) => updateElement(el.id, { lineHeight: v || 1.5 })} />
                    <ColorPicker size="small" value={el.color}
                      onChange={(_, hex) => updateElement(el.id, { color: hex })} />
                    <Select size="small" value={el.fontWeight} style={{ width: 80 }}
                      options={[{ label: "正常", value: "normal" }, { label: "加粗", value: "bold" }]}
                      onChange={(v) => updateElement(el.id, { fontWeight: v })} />
                  </div>
                </>
              )}
            </div>
          ))}

          {elements.length === 0 && (
            <div style={{ textAlign: "center", color: "#bbb", padding: 40 }}>
              暂无元素，点击「添加文字」开始编辑
            </div>
          )}
        </div>

        {/* 右侧画布预览 */}
        <div style={{
          flex: 1, overflow: "auto", background: "#e8e8e8",
          display: "flex", justifyContent: "center", alignItems: "flex-start",
          padding: 20,
        }}>
          <div ref={canvasRef} style={{
            width: template.width || 1200,
            height: template.height || 850,
            position: "relative",
            backgroundColor: "#fff",
            boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            {bgUrl && (
              <img src={bgUrl} alt="背景" style={{
                position: "absolute", width: "100%", height: "100%",
                objectFit: "cover", pointerEvents: "none",
              }} />
            )}
            {!bgUrl && (
              <div style={{
                position: "absolute", width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#ccc", fontSize: 24,
              }}>证书背景图</div>
            )}

            {elements.map((el) => {
              const isImage = el.content.startsWith("<img>") && el.content.endsWith("</img>");
              const imgSrc = isImage ? el.content.slice(5, -6) : "";

              return (
                <Rnd
                  key={el.id}
                  position={{ x: el.x, y: el.y }}
                  size={{ width: el.width, height: el.height }}
                  onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    updateElement(el.id, {
                      width: parseInt(ref.style.width, 10),
                      height: parseInt(ref.style.height, 10),
                      x: position.x,
                      y: position.y,
                    });
                  }}
                  onMouseDown={() => setSelectedId(el.id)}
                  style={{
                    border: selectedId === el.id ? "2px dashed #ff4d4f" : "1px dashed transparent",
                    cursor: "move",
                    zIndex: selectedId === el.id ? 20 : 10,
                    userSelect: "none",
                  }}
                  dragHandleClassName="cert-editor-drag-handle"
                  cancel="" 
                  bounds="parent"
                  enableResizing={{
                    top: false, right: true, bottom: false, left: false,
                    topRight: false, bottomRight: true, bottomLeft: false, topLeft: false,
                  }}
                >
                  <div style={{
                    width: "100%", height: "100%", overflow: "hidden",
                    userSelect: "none", WebkitUserSelect: "none",
                  }}>
                    {isImage ? (
                      <img
                        src={imgSrc} alt="" draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{ width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        fontFamily: el.fontFamily,
                        fontSize: el.fontSize,
                        color: el.color,
                        fontWeight: el.fontWeight as any,
                        lineHeight: el.lineHeight,
                        display: "flex",
                        alignItems: "center",
                        wordBreak: "break-word",
                      }}>
                        {el.content}
                      </div>
                    )}
                  </div>
                </Rnd>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateEditorPage;
