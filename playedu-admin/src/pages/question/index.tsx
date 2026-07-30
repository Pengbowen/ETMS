import { useEffect, useState, useCallback } from "react";
import {
  Button, Table, Space, Tag, Select, Input, InputNumber,
  Modal, Form, Tree, message, Rate,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { DataNode } from "antd/es/tree";
import {
  PlusOutlined, SearchOutlined, ExportOutlined,
  EditOutlined, DeleteOutlined, FolderAddOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { question } from "../../api";

interface QuestionType {
  id: number;
  category_id: number;
  type: string;
  title: string;
  options: string;
  answer: string;
  analysis: string;
  difficulty: number;
  tags: string;
  use_count: number;
  status: number;
  created_at: string;
}

interface CategoryNode extends DataNode {
  id: number;
  parent_id: number;
  title?: string;
  name?: string;
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

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "极简单", 2: "容易", 3: "中等", 4: "较难", 5: "困难",
};

const QuestionIndexPage = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<QuestionType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 筛选条件
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterDifficulty, setFilterDifficulty] = useState<number | undefined>();
  const [filterKeyword, setFilterKeyword] = useState("");

  // 分类树
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm] = Form.useForm();

  const fetchCategories = useCallback(() => {
    question.categoryList().then((res: any) => {
      const list2 = res.data || [];
      const buildTree = (nodes: any[]): CategoryNode[] =>
        nodes.map((n: any) => ({
          key: n.id,
          id: n.id,
          parent_id: n.parent_id,
          title: n.name,
          name: n.name,
          children: n.children ? buildTree(n.children) : [],
        }));
      setCategoryTree(buildTree(list2));
    });
  }, []);

  const fetchList = useCallback(() => {
    setLoading(true);
    question.questionList({
      page, size,
      category_id: selectedCategory,
      type: filterType,
      difficulty: filterDifficulty,
      keyword: filterKeyword,
    }).then((res: any) => {
      setList(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, size, selectedCategory, filterType, filterDifficulty, filterKeyword]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除后不可恢复",
      onOk() {
        question.destroyQuestion(id).then(() => {
          message.success("删除成功");
          fetchList();
        });
      },
    });
  };

  const handleExport = () => {
    question.exportQuestions({
      category_id: selectedCategory,
      type: filterType,
      difficulty: filterDifficulty,
      keyword: filterKeyword,
    }).then(() => message.success("导出成功"));
  };

  // 分类管理
  const handleAddCategory = (parentId: number = 0) => {
    setEditingCategory(null);
    categoryForm.resetFields();
    categoryForm.setFieldsValue({ parent_id: parentId });
    setCategoryModalOpen(true);
  };

  const handleEditCategory = (node: CategoryNode) => {
    setEditingCategory({ id: node.id, name: node.name, parent_id: node.parent_id });
    categoryForm.setFieldsValue({ name: node.name, parent_id: node.parent_id });
    setCategoryModalOpen(true);
  };

  const handleDeleteCategory = (node: CategoryNode) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定删除分类「${node.name}」？若含子分类则无法删除。`,
      onOk() {
        question.destroyCategory(node.id as number).then((res: any) => {
          if (res.data?.code === -1) {
            message.warning(res.data?.msg || "删除失败");
          } else {
            message.success("删除成功");
            fetchCategories();
          }
        }).catch(() => message.error("删除失败"));
      },
    });
  };

  const handleCategoryOk = () => {
    categoryForm.validateFields().then((values) => {
      if (editingCategory) {
        question.updateCategory(editingCategory.id, values).then(() => {
          message.success("更新成功");
          setCategoryModalOpen(false);
          fetchCategories();
        });
      } else {
        question.storeCategory(values).then(() => {
          message.success("创建成功");
          setCategoryModalOpen(false);
          fetchCategories();
        });
      }
    });
  };

  const columns: ColumnsType<QuestionType> = [
    {
      title: "题干", dataIndex: "title", width: 380,
      render: (t: string, record: QuestionType) => (
        <div>
          <Tag color={TYPE_COLORS[record.type]}>{TYPE_LABELS[record.type]}</Tag>
          <div
            style={{
              marginTop: 4,
              maxHeight: 48,
              overflow: "hidden",
              lineHeight: "24px",
              color: "#333",
            }}
            dangerouslySetInnerHTML={{ __html: t || "" }}
          />
        </div>
      ),
    },
    {
      title: "难度", dataIndex: "difficulty", width: 100,
      render: (v: number) => <Rate disabled value={v} count={5} style={{ fontSize: 14 }} />,
    },
    {
      title: "标签", dataIndex: "tags", width: 150, ellipsis: true,
      render: (t: string) => t ? t.split(",").map((tag, i) => (
        <Tag key={i} style={{ marginBottom: 2 }}>{tag.trim()}</Tag>
      )) : "-",
    },
    {
      title: "使用", dataIndex: "use_count", width: 60,
      render: (v: number) => v || 0,
    },
    {
      title: "创建时间", dataIndex: "created_at", width: 140,
      render: (t: string) => t ? t.substring(0, 16) : "-",
    },
    {
      title: "操作", width: 160, fixed: "right" as const,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => navigate(`/question/edit/${record.id}`)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      {/* 顶部操作栏 */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px", borderBottom: "1px solid #f0f0f0",
      }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>试题管理</div>
        <Space>
          <Input.Search
            placeholder="搜索题干关键词"
            allowClear style={{ width: 220 }}
            onSearch={(v) => { setFilterKeyword(v); setPage(1); }}
          />
          <Select placeholder="题型" allowClear style={{ width: 110 }}
            value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }}
            options={Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
          <Select placeholder="难度" allowClear style={{ width: 100 }}
            value={filterDifficulty} onChange={(v) => { setFilterDifficulty(v); setPage(1); }}
            options={[
              { value: 1, label: "★ 极简单" }, { value: 2, label: "★★ 容易" },
              { value: 3, label: "★★★ 中等" }, { value: 4, label: "★★★★ 较难" },
              { value: 5, label: "★★★★★ 困难" },
            ]} />
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => navigate("/question/edit")}>新建试题</Button>
        </Space>
      </div>

      {/* 主体 */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* 左侧分类树 */}
        <div style={{
          width: 240, borderRight: "1px solid #f0f0f0", overflow: "auto",
          background: "#fafafa", padding: 12,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 8,
          }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>试题分类</span>
            <Button type="link" size="small" icon={<FolderAddOutlined />}
              onClick={() => handleAddCategory(0)}>新增</Button>
          </div>
          <Tree
            treeData={categoryTree}
            blockNode
            selectedKeys={selectedCategory ? [selectedCategory] : []}
            onSelect={(keys) => {
              setSelectedCategory(keys[0] as number);
              setPage(1);
            }}
            titleRender={(node: any) => (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                paddingRight: 4,
              }}>
                <span>{node.name}</span>
                <Space size={4} style={{ visibility: "hidden" }} className="category-actions">
                  <Button type="link" size="small"
                    onClick={(e) => { e.stopPropagation(); handleAddCategory(node.id); }}>+</Button>
                  <Button type="link" size="small"
                    onClick={(e) => { e.stopPropagation(); handleEditCategory(node); }}>✎</Button>
                  <Button type="link" size="small" danger
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(node); }}>×</Button>
                </Space>
              </div>
            )}
          />
          <style>{`
            .ant-tree-treenode:hover .category-actions { visibility: visible !important; }
          `}</style>
        </div>

        {/* 右侧试题列表 */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          <Table
            columns={columns} dataSource={list} rowKey="id" loading={loading}
            pagination={{
              current: page, total, pageSize: size, showTotal: (t) => `共 ${t} 条`,
              onChange: (p) => setPage(p),
            }}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>

      {/* 分类弹窗 */}
      <Modal
        title={editingCategory ? "编辑分类" : "新增分类"}
        open={categoryModalOpen}
        onOk={handleCategoryOk}
        onCancel={() => setCategoryModalOpen(false)}
        destroyOnClose
      >
        <Form form={categoryForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="parent_id" hidden><Input /></Form.Item>
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};


export default QuestionIndexPage;
