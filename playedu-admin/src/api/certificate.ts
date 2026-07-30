import client from "./internal/httpClient";

// ==================== 模板管理 ====================

export function templateList() {
  return client.get("/backend/v1/certificate/template/index", {});
}

export function storeTemplate(data: any) {
  return client.post("/backend/v1/certificate/template/store", data);
}

export function updateTemplate(id: number, data: any) {
  return client.put("/backend/v1/certificate/template/update/" + id, data);
}

export function destroyTemplate(id: number) {
  return client.destroy("/backend/v1/certificate/template/destroy/" + id);
}

export function templatePreviewUrl(path: string) {
  return client.get("/backend/v1/certificate/template/preview-url", { path });
}

// ==================== 规则管理 ====================

export function ruleList() {
  return client.get("/backend/v1/certificate/rule/index", {});
}

export function storeRule(data: any) {
  return client.post("/backend/v1/certificate/rule/store", data);
}

export function updateRule(id: number, data: any) {
  return client.put("/backend/v1/certificate/rule/update/" + id, data);
}

export function destroyRule(id: number) {
  return client.destroy("/backend/v1/certificate/rule/destroy/" + id);
}

// ==================== 发放记录 ====================

export function recordList(params: any) {
  return client.get("/backend/v1/certificate/record/index", params);
}

export function issueRecord(data: any) {
  return client.post("/backend/v1/certificate/record/issue", data);
}

export function revokeRecord(id: number) {
  return client.post("/backend/v1/certificate/record/revoke/" + id, {});
}

export function exportRecord(id: number) {
  return client.get("/backend/v1/certificate/record/export/" + id, {});
}

// ==================== 公开验证 ====================

export function verifyCert(id: string) {
  return client.get("/backend/v1/certificate/verify", { id });
}
