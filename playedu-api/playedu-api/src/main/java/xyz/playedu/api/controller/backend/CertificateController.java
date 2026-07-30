package xyz.playedu.api.controller.backend;

import cn.hutool.core.date.DateUtil;
import java.util.*;
import org.apache.commons.collections4.MapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import xyz.playedu.certificate.domain.CertificateRecord;
import xyz.playedu.certificate.domain.CertificateRule;
import xyz.playedu.certificate.domain.CertificateTemplate;
import xyz.playedu.certificate.service.CertificateGenerateService;
import xyz.playedu.certificate.service.CertificateRecordService;
import xyz.playedu.certificate.service.CertificateRuleService;
import xyz.playedu.certificate.service.CertificateTemplateService;
import xyz.playedu.common.annotation.BackendPermission;
import xyz.playedu.common.annotation.Log;
import xyz.playedu.common.constant.BPermissionConstant;
import xyz.playedu.common.constant.BusinessTypeConstant;
import xyz.playedu.common.context.BCtx;
import xyz.playedu.common.domain.AdminUser;
import xyz.playedu.common.domain.User;
import xyz.playedu.common.exception.NotFoundException;
import xyz.playedu.common.service.AdminUserService;
import xyz.playedu.common.service.AppConfigService;
import xyz.playedu.common.service.UserService;
import xyz.playedu.common.types.JsonResponse;
import xyz.playedu.common.types.paginate.PaginationResult;
import xyz.playedu.common.util.S3Util;
import xyz.playedu.course.domain.Course;
import xyz.playedu.course.service.CourseService;

@RestController
@RequestMapping("/backend/v1/certificate")
public class CertificateController {

    @Autowired private CertificateTemplateService templateService;
    @Autowired private CertificateRecordService recordService;
    @Autowired private CertificateRuleService ruleService;
    @Autowired private CertificateGenerateService generateService;
    @Autowired private CourseService courseService;
    @Autowired private AppConfigService appConfigService;
    @Autowired private UserService userService;
    @Autowired private AdminUserService adminUserService;

    // ==================== Template ====================

    @BackendPermission(slug = "certificate-template")
    @GetMapping("/template/index")
    @Log(title = "证书模板-列表", businessType = BusinessTypeConstant.GET)
    public JsonResponse templateIndex() {
        List<CertificateTemplate> list = templateService.list();
        return JsonResponse.data(list);
    }

    @BackendPermission(slug = "certificate-template")
    @PostMapping("/template/store")
    @Log(title = "证书模板-创建", businessType = BusinessTypeConstant.INSERT)
    public JsonResponse templateStore(@RequestBody Map<String, Object> params) {
        String name = MapUtils.getString(params, "name");
        String backgroundImage = MapUtils.getString(params, "background_image");
        Integer width = MapUtils.getInteger(params, "width", 1200);
        Integer height = MapUtils.getInteger(params, "height", 850);
        String placeholders = MapUtils.getString(params, "placeholders");
        String qrConfig = MapUtils.getString(params, "qr_config");
        Integer adminId = BCtx.getId();

        templateService.create(name, backgroundImage, width, height, placeholders, qrConfig, adminId);
        return JsonResponse.success();
    }

    @BackendPermission(slug = "certificate-template")
    @PutMapping("/template/update/{id}")
    @Log(title = "证书模板-更新", businessType = BusinessTypeConstant.UPDATE)
    public JsonResponse templateUpdate(@PathVariable Integer id, @RequestBody Map<String, Object> params)
            throws NotFoundException {
        templateService.findOrFail(id);
        String name = MapUtils.getString(params, "name");
        String backgroundImage = MapUtils.getString(params, "background_image");
        Integer width = MapUtils.getInteger(params, "width", 1200);
        Integer height = MapUtils.getInteger(params, "height", 850);
        String placeholders = MapUtils.getString(params, "placeholders");
        String qrConfig = MapUtils.getString(params, "qr_config");

        templateService.update(id, name, backgroundImage, width, height, placeholders, qrConfig);
        return JsonResponse.success();
    }

    @BackendPermission(slug = "certificate-template")
    @DeleteMapping("/template/destroy/{id}")
    @Log(title = "证书模板-删除", businessType = BusinessTypeConstant.DELETE)
    public JsonResponse templateDestroy(@PathVariable Integer id) throws NotFoundException {
        templateService.findOrFail(id);
        templateService.removeById(id);
        return JsonResponse.success();
    }

    // ==================== Rule ====================

    @BackendPermission(slug = "certificate-rule")
    @GetMapping("/rule/index")
    @Log(title = "证书规则-列表", businessType = BusinessTypeConstant.GET)
    public JsonResponse ruleIndex() {
        List<CertificateRule> list = ruleService.list();
        Map<Integer, CertificateTemplate> templates = templateService.chunks(
                list.stream().map(CertificateRule::getTemplateId).distinct().toList());
        Map<String, Object> result = new HashMap<>();
        result.put("data", list);
        result.put("templates", templates);
        return JsonResponse.data(result);
    }

    @BackendPermission(slug = "certificate-rule")
    @PostMapping("/rule/store")
    @Log(title = "证书规则-创建", businessType = BusinessTypeConstant.INSERT)
    public JsonResponse ruleStore(@RequestBody Map<String, Object> params) {
        String name = MapUtils.getString(params, "name");
        Integer templateId = MapUtils.getInteger(params, "template_id");
        String triggerType = MapUtils.getString(params, "trigger_type", "course_complete");
        String courseIds = MapUtils.getString(params, "course_ids");
        Integer minProgress = MapUtils.getInteger(params, "min_progress", 100);
        Integer adminId = BCtx.getId();

        ruleService.create(name, templateId, triggerType, courseIds, minProgress, adminId);
        return JsonResponse.success();
    }

    @BackendPermission(slug = "certificate-rule")
    @PutMapping("/rule/update/{id}")
    @Log(title = "证书规则-更新", businessType = BusinessTypeConstant.UPDATE)
    public JsonResponse ruleUpdate(@PathVariable Integer id, @RequestBody Map<String, Object> params)
            throws NotFoundException {
        ruleService.findOrFail(id);
        String name = MapUtils.getString(params, "name");
        Integer templateId = MapUtils.getInteger(params, "template_id");
        String triggerType = MapUtils.getString(params, "trigger_type", "course_complete");
        String courseIds = MapUtils.getString(params, "course_ids");
        Integer minProgress = MapUtils.getInteger(params, "min_progress", 100);

        ruleService.update(id, name, templateId, triggerType, courseIds, minProgress);
        return JsonResponse.success();
    }

    @BackendPermission(slug = "certificate-rule")
    @DeleteMapping("/rule/destroy/{id}")
    @Log(title = "证书规则-删除", businessType = BusinessTypeConstant.DELETE)
    public JsonResponse ruleDestroy(@PathVariable Integer id) throws NotFoundException {
        ruleService.findOrFail(id);
        ruleService.removeById(id);
        return JsonResponse.success();
    }

    // ==================== Record ====================

    @BackendPermission(slug = "certificate-record")
    @GetMapping("/record/index")
    @Log(title = "证书记录-列表", businessType = BusinessTypeConstant.GET)
    public JsonResponse recordIndex(@RequestParam HashMap<String, Object> params) {
        Integer page = MapUtils.getInteger(params, "page", 1);
        Integer size = MapUtils.getInteger(params, "size", 10);
        Integer userId = MapUtils.getInteger(params, "user_id");
        Integer courseId = MapUtils.getInteger(params, "course_id");
        Integer templateId = MapUtils.getInteger(params, "template_id");
        String certNo = MapUtils.getString(params, "cert_no");

        PaginationResult<CertificateRecord> result = recordService.paginate(page, size, userId, courseId, templateId, certNo);

        Map<Integer, CertificateTemplate> templates = templateService.chunks(
                result.getData().stream().map(CertificateRecord::getTemplateId).distinct().toList());
        Map<Integer, AdminUser> adminUsers = new HashMap<>();
        for (CertificateRecord r : result.getData()) {
            if (!adminUsers.containsKey(r.getAdminId())) {
                AdminUser admin = adminUserService.getById(r.getAdminId());
                if (admin != null) adminUsers.put(r.getAdminId(), admin);
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("result", result);
        resp.put("templates", templates);
        resp.put("admin_users", adminUsers);
        return JsonResponse.data(resp);
    }

    @BackendPermission(slug = "certificate-record")
    @PostMapping("/record/issue")
    @Log(title = "证书记录-发放", businessType = BusinessTypeConstant.INSERT)
    @Transactional
    public JsonResponse recordIssue(@RequestBody Map<String, Object> params) throws Exception {
        Integer templateId = MapUtils.getInteger(params, "template_id");
        Integer userId = MapUtils.getInteger(params, "user_id");
        Integer courseId = MapUtils.getInteger(params, "course_id");

        CertificateTemplate template = templateService.findOrFail(templateId);
        Course course = courseService.findOrFail(courseId);
        User user = userService.findOrFail(userId);

        // 检查是否已经发放过
        if (recordService.existsByUserAndCourse(userId, courseId)) {
            return JsonResponse.error("该学员已获得此课程的证书");
        }

        // 生成证书图片
        String s3Url = new S3Util(appConfigService.getS3Config()).getUrl(template.getBackgroundImage());
        String certNo = "CERT" + DateUtil.format(new Date(), "yyyyMMddHHmmss") +
                        String.format("%04d", new Random().nextInt(10000));
        String verifyUrl = "/certificate/verify?id=" + certNo;
        String issueDate = DateUtil.format(new Date(), "yyyy-MM-dd");

        byte[] certImageBytes = generateService.generate(
                template.getPlaceholders(),
                template.getQrConfig(),
                s3Url,
                user.getName(),
                course.getTitle(),
                issueDate,
                verifyUrl
        );

        // 上传证书图片到S3
        String certImageKey = "certificates/" + certNo + ".png";
        new S3Util(appConfigService.getS3Config()).uploadObject(certImageKey, certImageBytes, "image/png");

        recordService.issue(templateId, userId, user.getName(), courseId, course.getTitle(),
                certImageKey, "manual", null, BCtx.getId());

        return JsonResponse.success();
    }

    @BackendPermission(slug = "certificate-record")
    @PostMapping("/record/revoke/{id}")
    @Log(title = "证书记录-撤销", businessType = BusinessTypeConstant.UPDATE)
    public JsonResponse recordRevoke(@PathVariable Integer id) throws NotFoundException {
        recordService.findOrFail(id);
        recordService.revoke(id);
        return JsonResponse.success();
    }

    @BackendPermission(slug = "certificate-record")
    @GetMapping("/record/export/{id}")
    @Log(title = "证书记录-导出", businessType = BusinessTypeConstant.GET)
    public ResponseEntity<byte[]> recordExport(@PathVariable Integer id) throws Exception {
        byte[] pdfBytes = recordService.exportPdf(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "certificate_" + id + ".pdf");
        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    // ==================== Preview URL ====================

    @BackendPermission(slug = "certificate-template")
    @GetMapping("/template/preview-url")
    public JsonResponse templatePreviewUrl(@RequestParam("path") String path) {
        String url = new S3Util(appConfigService.getS3Config()).getUrl(path);
        return JsonResponse.data(url);
    }

    // ==================== Public Verify ====================

    @GetMapping("/verify")
    public JsonResponse verify(@RequestParam("id") String certNo) {
        CertificateRecord record = recordService.findByCertNo(certNo);
        if (record == null) {
            return JsonResponse.error("证书不存在或已被撤销");
        }

        CertificateTemplate template = templateService.getById(record.getTemplateId());

        Map<String, Object> result = new HashMap<>();
        result.put("cert_no", record.getCertNo());
        result.put("user_name", record.getUserName());
        result.put("course_name", record.getCourseName());
        result.put("issued_at", record.getIssuedAt());
        result.put("status", record.getStatus());
        result.put("template_name", template != null ? template.getName() : "");
        result.put("cert_image", new S3Util(appConfigService.getS3Config()).getUrl(record.getCertImage()));
        return JsonResponse.data(result);
    }
}
