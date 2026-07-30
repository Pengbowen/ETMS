import { useEffect, useState, useLayoutEffect, useRef } from "react";
import {
  Button, Input, Select, message, Space, Spin, Rate, Card, Radio,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import "@wangeditor/editor/dist/css/style.css";
import { createEditor, createToolbar } from "@wangeditor/editor";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { question } from "../../../api";
import { getToken, checkUrl } from "../../../utils/index";
import config from "../../../js/config";

const TYPE_OPTIONS = [
  { label: "单选题", value: "single_choice" },
  { label: "多选题", value: "multi_choice" },
  { label: "判断题", value: "true_false" },
  { label: "填空题", value: "fill_blank" },
  { label: "问答题", value: "short_answer" },
  { label: "完形填空", value: "cloze" },
];

const QuestionEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const titleEditorRef = useRef<IDomEditor | null>(null);
  const analysisEditorRef = useRef<IDomEditor | null>(null);

  const [qtype, setQtype] = useState("single_choice");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [difficulty, setDifficulty] = useState(3);
  const [tags, setTags] = useState("");

  const [choices, setChoices] = useState<string[]>(["", "", "", ""]);
  const [answerIndices, setAnswerIndices] = useState<number[]>([]);
  const [tfAnswer, setTfAnswer] = useState<boolean>(true);
  const [fillBlanks, setFillBlanks] = useState<{ answer: string; alternatives: string }[]>([
    { answer: "", alternatives: "" },
  ]);
  const [referenceAnswer, setReferenceAnswer] = useState("");
  const [scoringPoints, setScoringPoints] = useState<string[]>([""]);
  const [clozePassage, setClozePassage] = useState("");
  const [clozeBlanks, setClozeBlanks] = useState<
    { options: string[]; answerIndex: number }[]
  >([{ options: ["", "", "", ""], answerIndex: 0 }]);

  // 加载分类树
  useEffect(() => {
    question.categoryList().then((res: any) => {
      setCategoryTree(res.data || []);
    });
  }, []);

  // 初始化编辑器 - useLayoutEffect 确保 DOM 已挂载
  useLayoutEffect(() => {
    const uploadUrl = checkUrl(config.app_url) + "backend/v1/upload/minio";
    const authHeader = "Bearer " + getToken();

    const sharedConfig: Partial<IEditorConfig> = {
      MENU_CONF: {
        uploadImage: {
          server: uploadUrl,
          headers: { Authorization: authHeader },
          fieldName: "file",
        },
      },
    };

    const tbConfig: Partial<IToolbarConfig> = {
      excludeKeys: ["group-video"],
    };

    // 题干编辑器
    const titleEditor = createEditor({
      selector: "#qe-title-editor",
      config: { ...sharedConfig, placeholder: "请输入题干内容..." },
      html: "",
      mode: "simple",
    });
    titleEditorRef.current = titleEditor;
    createToolbar({
      editor: titleEditor,
      selector: "#qe-title-toolbar",
      config: tbConfig,
      mode: "simple",
    });

    // 解析编辑器
    const analysisEditor = createEditor({
      selector: "#qe-analysis-editor",
      config: { ...sharedConfig, placeholder: "请输入题目解析..." },
      html: "",
      mode: "simple",
    });
    analysisEditorRef.current = analysisEditor;
    createToolbar({
      editor: analysisEditor,
      selector: "#qe-analysis-toolbar",
      config: tbConfig,
      mode: "simple",
    });

    // 编辑模式：加载已有数据
    if (id) {
      setLoading(true);
      question.questionDetail(Number(id)).then((res: any) => {
        const q = res.data;
        setQtype(q.type);
        setCategoryId(q.category_id);
        setDifficulty(q.difficulty);
        setTags(q.tags || "");

        // 编辑器已创建完毕，直接设置内容
        if (q.title) titleEditor.setHtml(q.title);
        if (q.analysis) analysisEditor.setHtml(q.analysis);

        if (["single_choice", "multi_choice"].includes(q.type)) {
          try { setChoices(JSON.parse(q.options)); } catch { setChoices([]); }
          try { setAnswerIndices(JSON.parse(q.answer)); } catch { setAnswerIndices([]); }
        } else if (q.type === "true_false") {
          try { setTfAnswer(JSON.parse(q.answer)[0]); } catch { setTfAnswer(true); }
        } else if (q.type === "fill_blank") {
          try {
            const opts = JSON.parse(q.options);
            const blanks = (opts.blanks || []).map((b: any) => ({
              answer: b.answer || "",
              alternatives: (b.alternatives || []).join(", "),
            }));
            setFillBlanks(blanks.length > 0 ? blanks : [{ answer: "", alternatives: "" }]);
          } catch { setFillBlanks([{ answer: "", alternatives: "" }]); }
        } else if (q.type === "short_answer") {
          try {
            const ans = JSON.parse(q.answer);
            setReferenceAnswer(ans.reference_answer || "");
            setScoringPoints(ans.scoring_points || [""]);
          } catch { setReferenceAnswer(""); }
        } else if (q.type === "cloze") {
          try {
            const opts = JSON.parse(q.options);
            setClozePassage(opts.passage || "");
            setClozeBlanks(
              (opts.blanks || []).map((b: any) => ({
                options: b.options || ["", "", "", ""],
                answerIndex: b.answer_index || 0,
              }))
            );
          } catch { setClozeBlanks([{ options: ["", "", "", ""], answerIndex: 0 }]); }
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }

    return () => {
      titleEditor.destroy();
      analysisEditor.destroy();
    };
  }, []); // eslint-disable-line

  const buildOptionsAnswer = () => {
    let options: any;
    let answer: any;
    if (["single_choice", "multi_choice"].includes(qtype)) {
      options = JSON.stringify(choices);
      answer = JSON.stringify(answerIndices);
    } else if (qtype === "true_false") {
      options = "[]";
      answer = JSON.stringify([tfAnswer]);
    } else if (qtype === "fill_blank") {
      options = JSON.stringify({
        content: "",
        blanks: fillBlanks.map((b) => ({
          answer: b.answer,
          alternatives: b.alternatives ? b.alternatives.split(",").map((s) => s.trim()).filter(Boolean) : [],
        })),
      });
      answer = JSON.stringify(fillBlanks.map((b) => b.answer));
    } else if (qtype === "short_answer") {
      options = "{}";
      answer = JSON.stringify({
        reference_answer: referenceAnswer,
        scoring_points: scoringPoints.filter(Boolean),
      });
    } else if (qtype === "cloze") {
      options = JSON.stringify({
        passage: clozePassage,
        blanks: clozeBlanks.map((b, i) => ({
          blank_index: i,
          options: b.options,
          answer_index: b.answerIndex,
        })),
      });
      answer = JSON.stringify(clozeBlanks.map((b) => b.answerIndex));
    }
    return { options, answer };
  };

  const handleSave = () => {
    const titleHtml = titleEditorRef.current?.getHtml() || "";
    const analysisHtml = analysisEditorRef.current?.getHtml() || "";

    const { options, answer } = buildOptionsAnswer();

    setSaving(true);
    const data: any = {
      category_id: categoryId, type: qtype,
      title: titleHtml, options, answer,
      analysis: analysisHtml, difficulty, tags,
    };

    const apiCall = isEdit
      ? question.updateQuestion(Number(id), data)
      : question.storeQuestion(data);

    apiCall.then(() => {
      message.success(isEdit ? "更新成功" : "创建成功");
      setSaving(false);
      navigate("/question/index");
    }).catch((err: any) => {
      message.error(err?.data?.msg || "保存失败");
      setSaving(false);
    });
  };

  const flattenCategories = (nodes: any[], prefix = ""): { value: number; label: string }[] => {
    let result: { value: number; label: string }[] = [];
    for (const node of nodes) {
      result.push({ value: node.id, label: prefix + node.name });
      if (node.children) result = result.concat(flattenCategories(node.children, prefix + "  "));
    }
    return result;
  };

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", position: "relative" }}>
      {loading && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(255,255,255,0.7)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Spin size="large" />
        </div>
      )}
      <div style={{
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", borderBottom: "1px solid #f0f0f0",
      }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/question/index")}>返回</Button>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{isEdit ? "编辑试题" : "新建试题"}</span>
        </Space>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存试题</Button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ marginBottom: 4, fontSize: 12, color: "#999" }}>题型</div>
                <Select value={qtype} style={{ width: 160 }} options={TYPE_OPTIONS}
                  onChange={(v) => {
                    setQtype(v); setAnswerIndices([]); setTfAnswer(true);
                    setFillBlanks([{ answer: "", alternatives: "" }]);
                    setReferenceAnswer(""); setScoringPoints([""]);
                    setClozeBlanks([{ options: ["", "", "", ""], answerIndex: 0 }]);
                  }} />
              </div>
              <div>
                <div style={{ marginBottom: 4, fontSize: 12, color: "#999" }}>分类</div>
                <Select value={categoryId || undefined} style={{ width: 200 }}
                  placeholder="选择分类" onChange={(v) => setCategoryId(v || 0)}
                  options={flattenCategories(categoryTree)} />
              </div>
              <div>
                <div style={{ marginBottom: 4, fontSize: 12, color: "#999" }}>难度</div>
                <Rate value={difficulty} count={5} onChange={(v) => setDifficulty(v)} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ marginBottom: 4, fontSize: 12, color: "#999" }}>标签</div>
                <Input placeholder="如：Java,基础" value={tags}
                  onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* 题干编辑器 */}
          <Card size="small" title="题干" style={{ marginBottom: 16 }}>
            <div style={{ border: "1px solid #d9d9d9", borderRadius: 6 }}>
              <div id="qe-title-toolbar" style={{ borderBottom: "1px solid #d9d9d9" }} />
              <div id="qe-title-editor" style={{ minHeight: 200 }} />
            </div>
          </Card>

          {/* 答案设置 */}
          <Card size="small" title="答案设置" style={{ marginBottom: 16 }}>
            {(qtype === "single_choice" || qtype === "multi_choice") && (
              <div>
                {choices.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Radio checked={answerIndices.includes(i)}
                      onChange={() => {
                        if (qtype === "single_choice") setAnswerIndices([i]);
                        else setAnswerIndices((prev) =>
                          prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i]);
                      }} />
                    <span style={{ fontWeight: 600, minWidth: 24 }}>{String.fromCharCode(65 + i)}.</span>
                    <Input value={c} style={{ flex: 1 }} placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                      onChange={(e) => { const arr = [...choices]; arr[i] = e.target.value; setChoices(arr); }} />
                    {choices.length > 2 && (
                      <Button danger size="small" onClick={() => {
                        setChoices(choices.filter((_, idx) => idx !== i));
                        setAnswerIndices(answerIndices.filter((n) => n !== i).map((n) => n > i ? n - 1 : n));
                      }}>删除</Button>
                    )}
                  </div>
                ))}
                <Button type="dashed" size="small" onClick={() => setChoices([...choices, ""])}>+ 添加选项</Button>
              </div>
            )}

            {qtype === "true_false" && (
              <Radio.Group value={tfAnswer} onChange={(e) => setTfAnswer(e.target.value)}>
                <Radio value={true}>正确 ✓</Radio>
                <Radio value={false}>错误 ✗</Radio>
              </Radio.Group>
            )}

            {qtype === "fill_blank" && (
              <div>
                {fillBlanks.map((b, i) => (
                  <div key={i} style={{ marginBottom: 12, padding: 10, border: "1px solid #f0f0f0", borderRadius: 6 }}>
                    <div style={{ fontWeight: 500, marginBottom: 6 }}>填空位 {i + 1}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Input placeholder="正确答案" value={b.answer} style={{ flex: 1 }}
                        onChange={(e) => { const arr = [...fillBlanks]; arr[i].answer = e.target.value; setFillBlanks(arr); }} />
                      <Input placeholder="备选答案（逗号分隔）" value={b.alternatives} style={{ flex: 1 }}
                        onChange={(e) => { const arr = [...fillBlanks]; arr[i].alternatives = e.target.value; setFillBlanks(arr); }} />
                      {fillBlanks.length > 1 && (
                        <Button danger size="small" onClick={() => setFillBlanks(fillBlanks.filter((_, idx) => idx !== i))}>删除</Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="dashed" size="small" onClick={() => setFillBlanks([...fillBlanks, { answer: "", alternatives: "" }])}>+ 添加填空位</Button>
              </div>
            )}

            {qtype === "short_answer" && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>参考答案</div>
                <Input.TextArea rows={4} value={referenceAnswer} placeholder="请输入参考答案"
                  onChange={(e) => setReferenceAnswer(e.target.value)} />
                <div style={{ marginTop: 12, fontWeight: 500, marginBottom: 8 }}>得分要点</div>
                {scoringPoints.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <Input value={p} placeholder={`得分要点 ${i + 1}`}
                      onChange={(e) => { const arr = [...scoringPoints]; arr[i] = e.target.value; setScoringPoints(arr); }} />
                    {scoringPoints.length > 1 && (
                      <Button danger size="small" onClick={() => setScoringPoints(scoringPoints.filter((_, idx) => idx !== i))}>删除</Button>
                    )}
                  </div>
                ))}
                <Button type="dashed" size="small" onClick={() => setScoringPoints([...scoringPoints, ""])}>+ 添加得分要点</Button>
              </div>
            )}

            {qtype === "cloze" && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>段落内容</div>
                <Input.TextArea rows={4} value={clozePassage}
                  placeholder='使用 {"{{blank_0}}"} 和 {"{{blank_1}}"} 标记填空位置'
                  onChange={(e) => setClozePassage(e.target.value)} />
                <div style={{ marginTop: 16, fontWeight: 500, marginBottom: 8 }}>填空位设置</div>
                {clozeBlanks.map((b, i) => (
                  <Card key={i} size="small" title={`填空 ${i + 1}`} style={{ marginBottom: 8 }}>
                    {b.options.map((opt, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Radio checked={b.answerIndex === j}
                          onChange={() => { const arr = [...clozeBlanks]; arr[i].answerIndex = j; setClozeBlanks(arr); }} />
                        <span>{String.fromCharCode(65 + j)}.</span>
                        <Input value={opt} style={{ flex: 1 }} placeholder={`选项 ${String.fromCharCode(65 + j)}`}
                          onChange={(e) => { const arr = [...clozeBlanks]; arr[i].options[j] = e.target.value; setClozeBlanks(arr); }} />
                      </div>
                    ))}
                    {clozeBlanks.length > 1 && (
                      <Button danger size="small" onClick={() => setClozeBlanks(clozeBlanks.filter((_, idx) => idx !== i))}>删除此填空</Button>
                    )}
                  </Card>
                ))}
                <Button type="dashed" size="small" onClick={() => setClozeBlanks([...clozeBlanks, { options: ["", "", "", ""], answerIndex: 0 }])}>+ 添加填空位</Button>
              </div>
            )}
          </Card>

          {/* 解析编辑器 */}
          <Card size="small" title="题目解析" style={{ marginBottom: 16 }}>
            <div style={{ border: "1px solid #d9d9d9", borderRadius: 6 }}>
              <div id="qe-analysis-toolbar" style={{ borderBottom: "1px solid #d9d9d9" }} />
              <div id="qe-analysis-editor" style={{ minHeight: 200 }} />
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default QuestionEditPage;
