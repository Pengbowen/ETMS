import { useEffect, useRef, useState } from "react";
import { Modal, Spin } from "antd";
import { Document, Page, pdfjs } from "react-pdf";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { init } from "pptx-preview";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PropInterface {
  open: boolean;
  resource: {
    id: number;
    name: string;
    type: string;
    url: string;
    extension: string;
  } | null;
  onCancel: () => void;
}

export const DocumentPreview = (props: PropInterface) => {
  const { open, resource, onCancel } = props;
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [numPages, setNumPages] = useState(0);
  const pptxRef = useRef<HTMLDivElement>(null);
  const pptxInstanceRef = useRef<any>(null);

  const resetState = () => {
    if (pptxInstanceRef.current) {
      pptxInstanceRef.current.destroy();
      pptxInstanceRef.current = null;
    }
    setLoading(false);
    setHtmlContent("");
    setNumPages(0);
  };

  useEffect(() => {
    if (!open || !resource?.url) return;

    resetState();
    loadDocument();

    return () => {
      if (pptxInstanceRef.current) {
        pptxInstanceRef.current.destroy();
        pptxInstanceRef.current = null;
      }
    };
  }, [open, resource?.url]);

  const loadDocument = async () => {
    if (!resource) return;
    setLoading(true);
    try {
      const type = resource.type?.toUpperCase();

      switch (type) {
        case "PDF":
          break;
        case "WORD":
          await loadDocx();
          break;
        case "EXCEL":
          await loadExcel();
          break;
        case "PPT":
          await loadPptx();
          break;
        case "TXT":
          await loadTxt();
          break;
        default:
          console.warn("Unsupported preview type:", type);
      }
    } catch (err) {
      console.error("Preview load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    return response.arrayBuffer();
  };

  const loadDocx = async () => {
    const arrayBuffer = await fetchArrayBuffer(resource!.url);
    const result = await mammoth.convertToHtml({ arrayBuffer });
    setHtmlContent(result.value);
  };

  const loadExcel = async () => {
    const arrayBuffer = await fetchArrayBuffer(resource!.url);
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    const firstSheet = workbook.SheetNames[0];
    const html = XLSX.utils.sheet_to_html(workbook.Sheets[firstSheet]);
    setHtmlContent(html);
  };

  const loadPptx = async () => {
    if (!pptxRef.current) return;
    const arrayBuffer = await fetchArrayBuffer(resource!.url);

    const previewer = init(pptxRef.current, {
      width: pptxRef.current.clientWidth || 960,
      mode: "slide",
    });
    pptxInstanceRef.current = previewer;
    await previewer.preview(arrayBuffer);
  };

  const loadTxt = async () => {
    const response = await fetch(resource!.url);
    const text = await response.text();
    setHtmlContent(
      `<pre style="white-space:pre-wrap;word-break:break-all;padding:16px;font-size:14px;line-height:1.6;">${escapeHtml(text)}</pre>`
    );
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const type = resource?.type?.toUpperCase();
  const containerHeight = "calc(100vh - 250px)";

  return (
    <Modal
      open={open}
      onCancel={() => {
        resetState();
        onCancel();
      }}
      title={resource?.name ? `${resource.name}.${resource.extension}` : "文档预览"}
      width="90%"
      style={{ top: 20 }}
      footer={null}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <div
          style={{
            height: containerHeight,
            overflow: "auto",
            display: "flex",
            justifyContent: "center",
            background: type === "PPT" ? "#f0f2f5" : "#fff",
          }}
        >
          {type === "PDF" && resource?.url && (
            <Document
              file={resource.url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Spin style={{ marginTop: 40 }} />}
            >
              {Array.from(new Array(numPages), (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={800}
                />
              ))}
            </Document>
          )}

          {(type === "WORD" || type === "EXCEL") && htmlContent && (
            <div
              className="doc-preview-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{ padding: 24, width: "100%", maxWidth: 900 }}
            />
          )}

          {type === "TXT" && htmlContent && (
            <div
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{ width: "100%" }}
            />
          )}

          {type === "PPT" && (
            <div
              ref={pptxRef}
              style={{ width: "100%", minHeight: 500 }}
            />
          )}
        </div>
      </Spin>
    </Modal>
  );
};

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
