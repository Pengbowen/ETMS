import { useState, useCallback, useRef } from "react";
import { Rnd } from "react-rnd";
import { Button, Space, Tooltip, ColorPicker, InputNumber, Modal } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  QrcodeOutlined,
  FontSizeOutlined,
} from "@ant-design/icons";

export interface Placeholder {
  id: string;
  type: "text" | "qrcode";
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  size?: number; // for qrcode
}

interface Props {
  backgroundImage: string;
  backgroundUrl?: string;
  width: number;
  height: number;
  placeholders: Placeholder[];
  onChange: (placeholders: Placeholder[]) => void;
  previewData?: Record<string, string>;
}

const SAMPLE_DATA: Record<string, string> = {
  user_name: "张三",
  course_name: "企业安全管理培训",
  issue_date: "2026-07-29",
};

const TEXT_KEYS = [
  { key: "user_name", label: "学员姓名" },
  { key: "course_name", label: "课程名称" },
  { key: "issue_date", label: "发证日期" },
];

export const TemplateEditor = ({
    backgroundUrl,
  backgroundImage,
  width,
  height,
  placeholders,
  onChange,
}: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = placeholders.find((p) => p.id === selectedId);

  const addPlaceholder = useCallback(
    (type: "text" | "qrcode") => {
      const id = Date.now().toString();
      const newItem: Placeholder =
        type === "text"
          ? {
              id,
              type: "text",
              key: "user_name",
              label: "学员姓名",
              x: width / 2 - 100,
              y: height / 2 - 25,
              width: 200,
              height: 50,
              fontSize: 32,
              color: "#333333",
            }
          : {
              id,
              type: "qrcode",
              key: "qrcode",
              label: "二维码",
              x: width - 160,
              y: height - 160,
              width: 120,
              height: 120,
              fontSize: 14,
              color: "#000",
              size: 120,
            };
      onChange([...placeholders, newItem]);
      setSelectedId(id);
    },
    [placeholders, width, height, onChange]
  );

  const updatePlaceholder = useCallback(
    (id: string, updates: Partial<Placeholder>) => {
      onChange(placeholders.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    },
    [placeholders, onChange]
  );

  const deletePlaceholder = useCallback(
    (id: string) => {
      onChange(placeholders.filter((p) => p.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [placeholders, selectedId, onChange]
  );

  const canvasStyle = { width, height, position: "relative" as const };

  return (
    <div style={{ display: "flex", gap: 16, minHeight: 500 }}>
      {/* 工具栏 */}
      <div style={{ width: 160, flexShrink: 0 }}>
        <div style={{ marginBottom: 12, fontWeight: 500 }}>添加元素</div>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button block icon={<FontSizeOutlined />} onClick={() => addPlaceholder("text")}>
            添加文字
          </Button>
          <Button block icon={<QrcodeOutlined />} onClick={() => addPlaceholder("qrcode")}>
            添加二维码
          </Button>
        </Space>

        {selected && (
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>属性</div>
            {selected.type === "text" && (
              <>
                <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>文本内容</div>
                <select
                  value={selected.key}
                  onChange={(e) => updatePlaceholder(selected.id, { key: e.target.value, label: TEXT_KEYS.find(t => t.key === e.target.value)?.label || "" })}
                  style={{ width: "100%", marginBottom: 8, padding: 4 }}
                >
                  {TEXT_KEYS.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
                <div style={{ marginBottom: 4, fontSize: 12, color: "#666" }}>字体大小</div>
                <InputNumber
                  size="small"
                  value={selected.fontSize}
                  min={12}
                  max={72}
                  onChange={(v) => updatePlaceholder(selected.id, { fontSize: v || 24 })}
                  style={{ width: "100%", marginBottom: 8 }}
                />
                <div style={{ marginBottom: 4, fontSize: 12, color: "#666" }}>颜色</div>
                <ColorPicker
                  size="small"
                  value={selected.color}
                  onChange={(_, hex) => updatePlaceholder(selected.id, { color: hex })}
                  style={{ marginBottom: 8 }}
                />
              </>
            )}
            {selected.type === "qrcode" && (
              <>
                <div style={{ marginBottom: 4, fontSize: 12, color: "#666" }}>尺寸</div>
                <InputNumber
                  size="small"
                  value={selected.size || 120}
                  min={60}
                  max={200}
                  onChange={(v) => updatePlaceholder(selected.id, { size: v || 120, width: v || 120, height: v || 120 })}
                  style={{ width: "100%", marginBottom: 8 }}
                />
              </>
            )}
            <div style={{ marginBottom: 4, fontSize: 12, color: "#666" }}>位置</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 11, width: 16 }}>X</span>
              <InputNumber size="small" value={Math.round(selected.x)} onChange={(v) => updatePlaceholder(selected.id, { x: v || 0 })} style={{ flex: 1 }} />
              <span style={{ fontSize: 11, width: 16 }}>Y</span>
              <InputNumber size="small" value={Math.round(selected.y)} onChange={(v) => updatePlaceholder(selected.id, { y: v || 0 })} style={{ flex: 1 }} />
            </div>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => deletePlaceholder(selected.id)}
              style={{ marginTop: 8 }}
              block
            >
              删除元素
            </Button>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <Button
            block
            type={preview ? "default" : "primary"}
            icon={preview ? <EditOutlined /> : <EyeOutlined />}
            onClick={() => setPreview(!preview)}
          >
            {preview ? "退出预览" : "预览效果"}
          </Button>
        </div>
      </div>

      {/* 画布 */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          background: "#e8e8e8",
          display: "flex",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          ref={containerRef}
          style={{
            ...canvasStyle,
            backgroundColor: "#fff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            overflow: "hidden",
          }}
        >
          {backgroundUrl && (
            <img
              src={backgroundUrl}
              alt="背景图"
              style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          {!backgroundUrl && !backgroundImage && (
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#bbb",
                fontSize: 18,
              }}
            >
              请上传背景图片
            </div>
          )}
          {!preview &&
            placeholders.map((p) => (
              <Rnd
                key={p.id}
                position={{ x: p.x, y: p.y }}
                size={{ width: p.width, height: p.height }}
                onDragStop={(_, d) => updatePlaceholder(p.id, { x: d.x, y: d.y })}
                onResizeStop={(_, __, ref, ___, pos) =>
                  updatePlaceholder(p.id, {
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                    ...pos,
                  })
                }
                onClick={() => setSelectedId(p.id)}
                style={{
                  border: selectedId === p.id ? "2px dashed #266bcb" : "1px dashed transparent",
                  cursor: "move",
                }}
                enableResizing={p.type === "text"}
                disableDragging={false}
                bounds="parent"
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {p.type === "text" && (
                    <span
                      style={{
                        fontSize: p.fontSize,
                        color: p.color,
                        opacity: 0.6,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.label}
                    </span>
                  )}
                  {p.type === "qrcode" && (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: `repeating-linear-gradient(45deg, #999 0, #999 2px, transparent 2px, transparent 8px)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                        fontSize: 12,
                      }}
                    >
                      QR
                    </div>
                  )}
                </div>
              </Rnd>
            ))}

          {preview &&
            placeholders.map((p) => (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  width: p.width,
                  height: p.height,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {p.type === "text" && (
                  <span
                    style={{
                      fontSize: p.fontSize,
                      color: p.color,
                      fontWeight: 500,
                    }}
                  >
                    {SAMPLE_DATA[p.key] || p.label}
                  </span>
                )}
                {p.type === "qrcode" && (
                  <div
                    style={{
                      width: p.size || 120,
                      height: p.size || 120,
                      background: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 10,
                    }}
                  >
                    QR
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
