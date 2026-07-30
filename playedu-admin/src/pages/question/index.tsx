import { useEffect, useState } from "react";
import {
  Button, Table, Space, Tag, Select, Input, Rate, Tooltip,
  Modal, Tree, TreeSelect, message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined, ExportOutlined, EditOutlined, DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { question } from "../../api";

interface QuestionType {
  id: number;
  category_id: number;
  type: string;
  title: string;
  difficulty: number;
  tags: string;
  use_count: number;
  created_at: string;
}

interface CategoryNode {
  key: number;
  title: any;
  children?: CategoryNode[];
}

const TYPE_LABELS: Record<string, string> = {
  single_choice: "单选题",
  multi_choice: "多选题",
  true_false: "判断题",
  fill_blank: "填空题",
  short_answer: "问答题",
  cloze: "完形填空",
};

const TYPE_COLORS: Record<string, string> = {
  single_choice: "blue",
  multi_choice: "purple",
  true_false: "green",
  fill_blank: "orange",
  short_answer: "cyan",
  cloze: "magenta",
};

const QuestionIndexPage = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<QuestionType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<CategoryNode[]>([]);
  const [selectKeys, setSelectKeys] = useState<number[]>([]);
  const [selLabel, setLabel] = useState("全部试题");

  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterDifficulty, setFilterDifficulty] = useState<number | undefined>();
  const [filterKeyword, setFilterKeyword] = useState("");

  // 分类管理
  const [cateModalOpen, setCateModalOpen] = useState(false);
  const [editingCate, setEditingCate] = useState<any>(null);
  const [cateName, setCateName] = useState("");
  const [cateParentId, setCateParentId] = useState(0);

  const [cateSelectTree, setCateSelectTree] = useState<any[]>([]);

  const fetchCategories = () => {
    question.categoryList().then((res: any) => {
      const data = res.data || [];
      setTreeData(buildTree(data));
      setCateSelectTree(buildSelectTree(data));
    });
  };

  const buildSelectTree = (nodes: any[]): any[] =>
    nodes.map((n: any) => ({
      value: n.id,
      title: n.name,
      children: n.children ? buildSelectTree(n.children) : undefined,
    }));

  const buildTree = (nodes: any[]): CategoryNode[] =>
    nodes.map((n: any) => ({
      key: n.id,
      title: (
        <div className="d-flex j-b-flex" style={{ width: "100%" }}>
          <span className="tree-title-elli">{n.name}</span>
          <div className="d-flex">
            <Tooltip title="添加子分类">
              <i
                className="iconfont icon-icon-add mr-12"
                style={{ fontSize: 22 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCate(null);
                  setCateParentId(n.id);
                  setCateName("");
                  setCateModalOpen(true);
                }}
              />
            </Tooltip>
            <Tooltip title="编辑">
              <i
                className="iconfont icon-icon-edit mr-12"
                style={{ fontSize: 22 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCate({ id: n.id, name: n.name, parent_id: n.parent_id });
                  setCateName(n.name);
                  setCateParentId(n.parent_id);
                  setCateModalOpen(true);
                }}
              />
            </Tooltip>
            <Tooltip title="删除">
              <i
                className="iconfont icon-icon-delete"
                style={{ fontSize: 22 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCate(n.id, n.name);
                }}
              />
            </Tooltip>
          </div>
        </div>
      ),
      children: n.children ? buildTree(n.children) : undefined,
    }));

  const handleDeleteCate = (id: number, name: string) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定删除分类「${name}」？含子分类则无法删除。`,
      onOk() {
        question.destroyCategory(id).then(() => {
          message.success("删除成功");
          fetchCategories();
        }).catch(() => message.error("删除失败"));
      },
    });
  };

  const handleSaveCate = () => {
    if (!cateName.trim()) { message.warning("请输入分类名称"); return; }
    if (editingCate) {
      question.updateCategory(editingCate.id, { name: cateName, parent_id: cateParentId }).then(() => {
        message.success("更新成功");
        setCateModalOpen(false);
        fetchCategories();
      });
    } else {
      question.storeCategory({ name: cateName, parent_id: cateParentId, sort: 0 }).then(() => {
        message.success("创建成功");
        setCateModalOpen(false);
        fetchCategories();
      });
    }
  };

  const fetchList = () => {
    setLoading(true);
    question.questionList({
      page, size,
      category_id: selectKeys.length > 0 ? selectKeys[0] : undefined,
      type: filterType,
      difficulty: filterDifficulty,
      keyword: filterKeyword,
    }).then((res: any) => {
      setList(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchList(); }, [page, selectKeys, filterType, filterDifficulty]);

  const onSelect = (keys: any, info: any) => {
    setSelectKeys(keys);
    setPage(1);
    if (info?.node?.title?.props?.children?.[0]) {
      setLabel(info.node.title.props.children[0]);
    } else {
      setLabel("全部试题");
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除后不可恢复",
      onOk() { question.destroyQuestion(id).then(() => { message.success("删除成功"); fetchList(); }); },
    });
  };

  const handleExport = () => {
    question.exportQuestions({
      category_id: selectKeys.length > 0 ? selectKeys[0] : undefined,
      type: filterType, difficulty: filterDifficulty, keyword: filterKeyword,
    }).then(() => message.success("导出成功"));
  };

  const columns: ColumnsType<QuestionType> = [
    {
      title: "题干", dataIndex: "title", width: 320, ellipsis: true,
      render: (t: string, r: QuestionType) => (
        <span>
          <Tag color={TYPE_COLORS[r.type]}>{TYPE_LABELS[r.type]}</Tag>
          {stripHtml(t)}
        </span>
      ),
    },
    {
      title: "难度", dataIndex: "difficulty", width: 100,
      render: (v: number) => <Rate disabled value={v} count={5} style={{ fontSize: 14 }} />,
    },
    {
      title: "标签", dataIndex: "tags", width: 150, ellipsis: true,
      render: (t: string) => t ? t.split(",").map((tag, i) => <Tag key={i}>{tag.trim()}</Tag>) : "-",
    },
    { title: "使用", dataIndex: "use_count", width: 60 },
    {
      title: "创建时间", dataIndex: "created_at", width: 140,
      render: (t: string) => t?.substring(0, 16) || "-",
    },
    {
      title: "操作", width: 140, fixed: "right" as const,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => navigate(`/question/edit/${r.id}`)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(r.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="tree-main-body">
        <div className="left-box">
          <TreeCategory
            selected={selectKeys}
            type="no-cate"
            text="试题"
            onAddCate={(parentId) => { setEditingCate(null); setCateParentId(parentId); setCateName(""); setCateModalOpen(true); }}
            onEditCate={(item) => { setEditingCate(item); setCateName(item.name); setCateParentId(item.parent_id || 0); setCateModalOpen(true); }}
            onDeleteCate={(id, name) => { handleDeleteCate(id, name); }}
            onUpdate={(keys: any, title: any) => {
              setPage(1);
              setSelectKeys(keys);
              if (typeof title === "string") setLabel(title);
              else setLabel(title?.props?.children?.[0] || "全部试题");
            }}
          />
          <div style={{ padding: "0 12px 12px 12px" }}>
            <Button type="primary" icon={<PlusOutlined />} size="small" block
              onClick={() => { setEditingCate(null); setCateParentId(0); setCateName(""); setCateModalOpen(true); }}>
              新建分类
            </Button>
          </div>
        </div>
        <div className="right-box">
          <div className="d-flex playedu-main-title float-left mb-24 j-b-flex">
            <span>试题管理 | {selLabel}</span>
            <Space>
              <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
              <Button type="primary" icon={<PlusOutlined />}
                onClick={() => navigate("/question/edit")}>新建试题</Button>
            </Space>
          </div>

          <div className="float-left j-b-flex mb-24">
            <Space>
              <Input.Search
                placeholder="搜索题干关键词"
                allowClear style={{ width: 220 }}
                onSearch={(v) => { setFilterKeyword(v); setPage(1); fetchList(); }}
              />
              <Select placeholder="题型" allowClear style={{ width: 110 }}
                value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }}
                options={Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
              <Select placeholder="难度" allowClear style={{ width: 110 }}
                value={filterDifficulty} onChange={(v) => { setFilterDifficulty(v); setPage(1); }}
                options={[
                  { value: 1, label: "★ 容易" }, { value: 2, label: "★★ 较易" },
                  { value: 3, label: "★★★ 中等" }, { value: 4, label: "★★★★ 较难" },
                  { value: 5, label: "★★★★★ 困难" },
                ]} />
            </Space>
          </div>

          <div className="float-left">
            <Table
              columns={columns} dataSource={list} rowKey="id" loading={loading}
              pagination={{
                current: page, total, pageSize: size,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p) => setPage(p),
              }}
              scroll={{ x: 1000 }}
            />
          </div>
        </div>
      </div>

      {/* 分类管理弹窗 */}
      <Modal
        title={editingCate ? "编辑分类" : "新建分类"}
        open={cateModalOpen}
        onOk={handleSaveCate}
        onCancel={() => setCateModalOpen(false)}
        destroyOnClose
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ marginBottom: 4, fontSize: 13 }}>上级分类</div>
            <TreeSelect
              style={{ width: "100%" }}
              value={cateParentId || undefined}
              placeholder="无（根分类）"
              treeData={[
                { value: 0, title: "无（根分类）", children: cateSelectTree },
              ]}
              allowClear
              onChange={(v) => setCateParentId(v || 0)}
            />
          </div>
          <div style={{ marginBottom: 4, fontSize: 13 }}>分类名称</div>
          <Input value={cateName} placeholder="请输入分类名称"
            onChange={(e) => setCateName(e.target.value)} />
        </div>
      </Modal>
    </>
  );
};

function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").substring(0, 50);
}

// 内联 TreeCategory（项目标准组件）
const TreeCategory = (props: {
  type: string;
  text: string;
  selected: number[];
  onUpdate: (keys: number[], title: any) => void;
  onAddCate: (parentId: number) => void;
  onEditCate: (item: any) => void;
  onDeleteCate: (id: number, name: string) => void;
}) => {
  const [treeData, setTreeData] = useState<any>([]);
  const [selectKey, setSelectKey] = useState<number[]>([]);

  useEffect(() => {
    question.categoryList().then((res: any) => {
      const data = res.data || [];
      const build = (nodes: any[]): any[] =>
        nodes.map((n: any) => ({
          key: n.id,
          title: (
            <div className="d-flex j-b-flex" style={{ width: "100%" }}>
              <span className="tree-title-elli">{n.name}</span>
              <div className="d-flex">
                <Tooltip title="添加子分类">
                  <i className="iconfont icon-icon-add mr-12" style={{ fontSize: 22 }}
                    onClick={(e: any) => {
                      e.stopPropagation();
                      props.onAddCate(n.id);
                    }} />
                </Tooltip>
                <Tooltip title="编辑">
                  <i className="iconfont icon-icon-edit mr-12" style={{ fontSize: 22 }}
                    onClick={(e: any) => {
                      e.stopPropagation();
                      props.onEditCate({ id: n.id, name: n.name, parent_id: n.parent_id });
                    }} />
                </Tooltip>
                <Tooltip title="删除">
                  <i className="iconfont icon-icon-delete" style={{ fontSize: 22 }}
                    onClick={(e: any) => {
                      e.stopPropagation();
                      props.onDeleteCate(n.id, n.name);
                    }} />
                </Tooltip>
              </div>
            </div>
          ),
          children: n.children ? build(n.children) : undefined,
        }));
      const arr = build(data);
      if (props.type === "no-cate") {
        arr.unshift({ key: 0, title: <span className="tree-title-elli">未分类</span> });
      }
      setTreeData(arr);
    });
  }, []);

  useEffect(() => {
    if (props.selected?.length > 0) setSelectKey(props.selected);
  }, [props.selected]);

  const onSelect = (keys: any, info: any) => {
    let label = "全部" + props.text;
    if (info?.node?.title?.props?.children) {
      label = info.node.title.props.children;
    }
    props.onUpdate(keys, label);
    setSelectKey(keys);
  };

  return (
    <div className="playedu-tree">
      <div
        className={selectKey.length === 0 ? "mb-8 category-label active" : "mb-8 category-label"}
        onClick={() => onSelect([], null)}
      >
        <div className="j-b-flex"><span>全部{props.text}</span></div>
      </div>
      {treeData.length > 0 && (
        <Tree
          onSelect={onSelect}
          selectedKeys={selectKey}
          treeData={treeData}
          switcherIcon={<i className="iconfont icon-icon-fold c-gray" />}
        />
      )}
    </div>
  );
};

export default QuestionIndexPage;
