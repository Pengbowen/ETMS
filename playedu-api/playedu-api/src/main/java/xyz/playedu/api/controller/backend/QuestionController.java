package xyz.playedu.api.controller.backend;

import java.io.*;
import java.util.*;
import org.apache.commons.collections4.MapUtils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.playedu.common.annotation.BackendPermission;
import xyz.playedu.common.annotation.Log;
import xyz.playedu.common.constant.BPermissionConstant;
import xyz.playedu.common.constant.BusinessTypeConstant;
import xyz.playedu.common.context.BCtx;
import xyz.playedu.common.exception.NotFoundException;
import xyz.playedu.common.types.JsonResponse;
import xyz.playedu.common.types.paginate.PaginationResult;
import xyz.playedu.question.domain.Question;
import xyz.playedu.question.domain.QuestionCategory;
import xyz.playedu.question.service.QuestionCategoryService;
import xyz.playedu.question.service.QuestionService;

@RestController
@RequestMapping("/backend/v1/question")
public class QuestionController {

    @Autowired private QuestionCategoryService categoryService;
    @Autowired private QuestionService questionService;

    private static final String[] QUESTION_TYPES = {
        "single_choice", "multi_choice", "true_false", "fill_blank", "short_answer", "cloze"
    };

    // ==================== 分类管理 ====================

    @BackendPermission(slug = BPermissionConstant.QUESTION_CATEGORY)
    @GetMapping("/category/index")
    @Log(title = "试题分类-列表", businessType = BusinessTypeConstant.GET)
    public JsonResponse categoryIndex() {
        List<Map<String, Object>> tree = categoryService.getTree();
        return JsonResponse.data(tree);
    }

    @BackendPermission(slug = BPermissionConstant.QUESTION_CATEGORY)
    @PostMapping("/category/store")
    @Log(title = "试题分类-创建", businessType = BusinessTypeConstant.INSERT)
    public JsonResponse categoryStore(@RequestBody Map<String, Object> params) {
        String name = MapUtils.getString(params, "name");
        Integer parentId = MapUtils.getInteger(params, "parent_id", 0);
        Integer sort = MapUtils.getInteger(params, "sort", 0);
        Integer adminId = BCtx.getId();
        categoryService.create(name, parentId, sort, adminId);
        return JsonResponse.success();
    }

    @BackendPermission(slug = BPermissionConstant.QUESTION_CATEGORY)
    @PutMapping("/category/update/{id}")
    @Log(title = "试题分类-更新", businessType = BusinessTypeConstant.UPDATE)
    public JsonResponse categoryUpdate(@PathVariable Integer id, @RequestBody Map<String, Object> params)
            throws NotFoundException {
        categoryService.findOrFail(id);
        String name = MapUtils.getString(params, "name");
        Integer parentId = MapUtils.getInteger(params, "parent_id");
        Integer sort = MapUtils.getInteger(params, "sort");
        categoryService.update(id, name, parentId, sort);
        return JsonResponse.success();
    }

    @BackendPermission(slug = BPermissionConstant.QUESTION_CATEGORY)
    @DeleteMapping("/category/destroy/{id}")
    @Log(title = "试题分类-删除", businessType = BusinessTypeConstant.DELETE)
    public JsonResponse categoryDestroy(@PathVariable Integer id) throws NotFoundException {
        categoryService.findOrFail(id);
        if (categoryService.hasChildren(id)) {
            return JsonResponse.error("该分类下有子分类，无法删除");
        }
        categoryService.removeById(id);
        return JsonResponse.success();
    }

    // ==================== 试题管理 ====================

    @BackendPermission(slug = BPermissionConstant.QUESTION)
    @GetMapping("/index")
    @Log(title = "试题-列表", businessType = BusinessTypeConstant.GET)
    public JsonResponse index(@RequestParam Map<String, Object> params) {
        Integer page = MapUtils.getInteger(params, "page", 1);
        Integer size = MapUtils.getInteger(params, "size", 20);
        Integer categoryId = MapUtils.getInteger(params, "category_id");
        String type = MapUtils.getString(params, "type");
        Integer difficulty = MapUtils.getInteger(params, "difficulty");
        String tags = MapUtils.getString(params, "tags");
        String keyword = MapUtils.getString(params, "keyword");
        String sort = MapUtils.getString(params, "sort");
        String order = MapUtils.getString(params, "order");

        PaginationResult<Question> result = questionService.paginate(
                page, size, categoryId, type, difficulty, tags, keyword, sort, order);

        // Attach category names
        List<Integer> categoryIds = result.getData().stream().map(Question::getCategoryId).distinct().toList();
        Map<Integer, QuestionCategory> categoryMap = new HashMap<>();
        for (Integer cid : categoryIds) {
            if (cid > 0) {
                QuestionCategory cat = categoryService.getById(cid);
                if (cat != null) categoryMap.put(cid, cat);
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("data", result.getData());
        resp.put("total", result.getTotal());
        resp.put("categories", categoryMap);
        return JsonResponse.data(resp);
    }

    @BackendPermission(slug = BPermissionConstant.QUESTION)
    @GetMapping("/detail/{id}")
    @Log(title = "试题-详情", businessType = BusinessTypeConstant.GET)
    public JsonResponse detail(@PathVariable Integer id) throws NotFoundException {
        Question question = questionService.findOrFail(id);
        return JsonResponse.data(question);
    }

    @BackendPermission(slug = BPermissionConstant.QUESTION)
    @PostMapping("/store")
    @Log(title = "试题-创建", businessType = BusinessTypeConstant.INSERT)
    public JsonResponse store(@RequestBody Map<String, Object> params) {
        Integer categoryId = MapUtils.getInteger(params, "category_id");
        String type = MapUtils.getString(params, "type", "single_choice");
        String title = MapUtils.getString(params, "title");
        String options = MapUtils.getString(params, "options", "[]");
        String answer = MapUtils.getString(params, "answer", "[]");
        String analysis = MapUtils.getString(params, "analysis");
        Integer difficulty = MapUtils.getInteger(params, "difficulty", 3);
        String tags = MapUtils.getString(params, "tags");
        Integer adminId = BCtx.getId();

        questionService.create(categoryId, type, title, options, answer, analysis, difficulty, tags, adminId);
        return JsonResponse.success();
    }

    @BackendPermission(slug = BPermissionConstant.QUESTION)
    @PutMapping("/update/{id}")
    @Log(title = "试题-更新", businessType = BusinessTypeConstant.UPDATE)
    public JsonResponse update(@PathVariable Integer id, @RequestBody Map<String, Object> params)
            throws NotFoundException {
        questionService.findOrFail(id);
        Integer categoryId = MapUtils.getInteger(params, "category_id");
        String type = MapUtils.getString(params, "type");
        String title = MapUtils.getString(params, "title");
        String options = MapUtils.getString(params, "options");
        String answer = MapUtils.getString(params, "answer");
        String analysis = MapUtils.getString(params, "analysis");
        Integer difficulty = MapUtils.getInteger(params, "difficulty");
        String tags = MapUtils.getString(params, "tags");

        questionService.update(id, categoryId, type, title, options, answer, analysis, difficulty, tags);
        return JsonResponse.success();
    }

    @BackendPermission(slug = BPermissionConstant.QUESTION)
    @DeleteMapping("/destroy/{id}")
    @Log(title = "试题-删除", businessType = BusinessTypeConstant.DELETE)
    public JsonResponse destroy(@PathVariable Integer id) throws NotFoundException {
        questionService.findOrFail(id);
        questionService.removeById(id);
        return JsonResponse.success();
    }

    // ==================== 导出 ====================

    @BackendPermission(slug = BPermissionConstant.QUESTION)
    @GetMapping("/export")
    @Log(title = "试题-导出", businessType = BusinessTypeConstant.GET)
    public ResponseEntity<byte[]> export(@RequestParam Map<String, Object> params) throws IOException {
        Integer categoryId = MapUtils.getInteger(params, "category_id");
        String type = MapUtils.getString(params, "type");
        Integer difficulty = MapUtils.getInteger(params, "difficulty");
        String tags = MapUtils.getString(params, "tags");
        String keyword = MapUtils.getString(params, "keyword");

        String[] TYPE_LABELS = {"单选题", "多选题", "判断题", "填空题", "问答题", "完形填空"};

        List<Question> list = questionService.listForExport(categoryId, type, difficulty, tags, keyword);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("试题导出");
            Row header = sheet.createRow(0);
            String[] headers = {"编号", "题型", "分类ID", "题干", "选项", "答案", "难度", "标签", "使用次数", "创建时间"};
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }

            for (int i = 0; i < list.size(); i++) {
                Question q = list.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(q.getId());
                String typeLabel = q.getType();
                for (String tl : TYPE_LABELS) {
                    for (int j = 0; j < QUESTION_TYPES.length; j++) {
                        if (QUESTION_TYPES[j].equals(q.getType())) {
                            typeLabel = TYPE_LABELS[j];
                            break;
                        }
                    }
                }
                row.createCell(1).setCellValue(typeLabel);
                row.createCell(2).setCellValue(q.getCategoryId());
                // Strip HTML for title
                String plainTitle = q.getTitle() != null ? q.getTitle().replaceAll("<[^>]+>", "") : "";
                row.createCell(3).setCellValue(plainTitle);
                row.createCell(4).setCellValue(q.getOptions() != null ? q.getOptions() : "");
                row.createCell(5).setCellValue(q.getAnswer() != null ? q.getAnswer() : "");
                row.createCell(6).setCellValue(q.getDifficulty());
                row.createCell(7).setCellValue(q.getTags() != null ? q.getTags() : "");
                row.createCell(8).setCellValue(q.getUseCount());
                row.createCell(9).setCellValue(q.getCreatedAt() != null ? q.getCreatedAt().toString() : "");
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            byte[] bytes = bos.toByteArray();

            HttpHeaders respHeaders = new HttpHeaders();
            respHeaders.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            respHeaders.setContentDispositionFormData("attachment", "questions_export.xlsx");
            return ResponseEntity.ok().headers(respHeaders).body(bytes);
        }
    }

    // ==================== 公开接口 ====================

    @GetMapping("/public/type-options")
    public JsonResponse typeOptions() {
        List<Map<String, String>> options = new ArrayList<>();
        String[] labels = {"单选题", "多选题", "判断题", "填空题", "问答题", "完形填空"};
        for (int i = 0; i < QUESTION_TYPES.length; i++) {
            Map<String, String> item = new HashMap<>();
            item.put("value", QUESTION_TYPES[i]);
            item.put("label", labels[i]);
            options.add(item);
        }
        return JsonResponse.data(options);
    }

    @GetMapping("/public/tags")
    public JsonResponse tags() {
        List<Question> all = questionService.list();
        Set<String> tagSet = new TreeSet<>();
        for (Question q : all) {
            if (q.getTags() != null && !q.getTags().isEmpty()) {
                String[] arr = q.getTags().split(",");
                for (String t : arr) {
                    String trimmed = t.trim();
                    if (!trimmed.isEmpty()) tagSet.add(trimmed);
                }
            }
        }
        return JsonResponse.data(new ArrayList<>(tagSet));
    }
}
