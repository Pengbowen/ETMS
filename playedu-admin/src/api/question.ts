import client from "./internal/httpClient";

// 分类
export function categoryList() {
  return client.get("/backend/v1/question/category/index", {});
}

export function storeCategory(data: any) {
  return client.post("/backend/v1/question/category/store", data);
}

export function updateCategory(id: number, data: any) {
  return client.put("/backend/v1/question/category/update/" + id, data);
}

export function destroyCategory(id: number) {
  return client.destroy("/backend/v1/question/category/destroy/" + id);
}

// 试题
export function questionList(params: any) {
  return client.get("/backend/v1/question/index", params);
}

export function questionDetail(id: number) {
  return client.get("/backend/v1/question/detail/" + id, {});
}

export function storeQuestion(data: any) {
  return client.post("/backend/v1/question/store", data);
}

export function updateQuestion(id: number, data: any) {
  return client.put("/backend/v1/question/update/" + id, data);
}

export function destroyQuestion(id: number) {
  return client.destroy("/backend/v1/question/destroy/" + id);
}

export function exportQuestions(params: any) {
  return client.get("/backend/v1/question/export", params);
}

// 公开接口
export function typeOptions() {
  return client.get("/backend/v1/question/public/type-options", {});
}

export function tagList() {
  return client.get("/backend/v1/question/public/tags", {});
}
