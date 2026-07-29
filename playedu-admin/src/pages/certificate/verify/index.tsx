import { useEffect, useState } from "react";
import { Card, Descriptions, Tag, Spin, Result } from "antd";
import { useSearchParams } from "react-router-dom";
import { certificate } from "../../../api";

const CertificateVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const certNo = searchParams.get("id") || "";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!certNo) {
      setError("缺少证书编号");
      setLoading(false);
      return;
    }
    certificate.verifyCert(certNo).then((res: any) => {
      if (res.code === 0) {
        setData(res.data);
      } else {
        setError(res.msg || "验证失败");
      }
      setLoading(false);
    }).catch(() => {
      setError("网络错误");
      setLoading(false);
    });
  }, [certNo]);

  if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

  if (error) {
    return (
      <Result status="error" title="证书验证失败" subTitle={error} />
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <Card title="证书验证">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="证书编号">{data.cert_no}</Descriptions.Item>
          <Descriptions.Item label="学员姓名">{data.user_name}</Descriptions.Item>
          <Descriptions.Item label="课程名称">{data.course_name}</Descriptions.Item>
          <Descriptions.Item label="模板名称">{data.template_name}</Descriptions.Item>
          <Descriptions.Item label="颁发时间">{data.issued_at}</Descriptions.Item>
          <Descriptions.Item label="证书状态">
            <Tag color={data.status === 1 ? "green" : "red"}>
              {data.status === 1 ? "有效" : "已撤销"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default CertificateVerifyPage;
