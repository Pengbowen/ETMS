package xyz.playedu.certificate.service.impl;

import cn.hutool.core.date.DateUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import java.util.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import xyz.playedu.certificate.domain.CertificateRecord;
import xyz.playedu.certificate.mapper.CertificateRecordMapper;
import xyz.playedu.certificate.service.CertificateRecordService;
import xyz.playedu.common.exception.NotFoundException;
import xyz.playedu.common.types.paginate.PaginationResult;
import xyz.playedu.common.util.S3Util;

@Service
public class CertificateRecordServiceImpl
        extends ServiceImpl<CertificateRecordMapper, CertificateRecord>
        implements CertificateRecordService {

    @Autowired private S3Util s3Util;

    @Override
    public PaginationResult<CertificateRecord> paginate(int page, int size, Integer userId,
                                                         Integer courseId, Integer templateId, String certNo) {
        LambdaQueryWrapper<CertificateRecord> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) wrapper.eq(CertificateRecord::getUserId, userId);
        if (courseId != null) wrapper.eq(CertificateRecord::getCourseId, courseId);
        if (templateId != null) wrapper.eq(CertificateRecord::getTemplateId, templateId);
        if (certNo != null && !certNo.isEmpty()) wrapper.eq(CertificateRecord::getCertNo, certNo);
        wrapper.orderByDesc(CertificateRecord::getId);

        Page<CertificateRecord> pageResult = page(new Page<>(page, size), wrapper);
        PaginationResult<CertificateRecord> result = new PaginationResult<>();
        result.setData(pageResult.getRecords());
        result.setTotal(pageResult.getTotal());
        return result;
    }

    @Override
    public CertificateRecord findByCertNo(String certNo) {
        return baseMapper.findByCertNo(certNo);
    }

    @Override
    public CertificateRecord findOrFail(Integer id) throws NotFoundException {
        CertificateRecord record = getById(id);
        if (record == null) {
            throw new NotFoundException("证书记录不存在");
        }
        return record;
    }

    @Override
    public void issue(Integer templateId, Integer userId, String userName, Integer courseId,
                      String courseName, String certImage, String issueType, Integer ruleId, Integer adminId) {
        CertificateRecord record = new CertificateRecord();
        record.setCertNo(generateCertNo());
        record.setTemplateId(templateId);
        record.setUserId(userId);
        record.setUserName(userName);
        record.setCourseId(courseId);
        record.setCourseName(courseName);
        record.setCertImage(certImage);
        record.setStatus(1);
        record.setIssueType(issueType);
        record.setRuleId(ruleId);
        record.setAdminId(adminId);
        record.setIssuedAt(new Date());
        record.setCreatedAt(new Date());
        save(record);
    }

    @Override
    public void revoke(Integer id) {
        CertificateRecord record = new CertificateRecord();
        record.setId(id);
        record.setStatus(0);
        record.setRevokedAt(new Date());
        updateById(record);
    }

    @Override
    public boolean existsByUserAndCourse(Integer userId, Integer courseId) {
        LambdaQueryWrapper<CertificateRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CertificateRecord::getUserId, userId)
               .eq(CertificateRecord::getCourseId, courseId)
               .eq(CertificateRecord::getStatus, 1);
        return count(wrapper) > 0;
    }

    @Override
    public byte[] exportPdf(Integer id) throws Exception {
        CertificateRecord record = getById(id);
        if (record == null || record.getCertImage().isEmpty()) {
            throw new NotFoundException("证书文件不存在");
        }
        byte[] imageBytes = s3Util.getObjectBytes(record.getCertImage());
        PDDocument document = new PDDocument();
        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);
        PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "cert");
        float pageW = page.getMediaBox().getWidth();
        float pageH = page.getMediaBox().getHeight();
        PDPageContentStream cs = new PDPageContentStream(document, page);
        cs.drawImage(pdImage, 30, 30, pageW - 60, pageH - 60);
        cs.close();
        byte[] pdfBytes = documentToBytes(document);
        document.close();
        return pdfBytes;
    }

    @Override
    public Map<Integer, CertificateRecord> chunks(List<Integer> ids) {
        Map<Integer, CertificateRecord> result = new HashMap<>();
        if (ids == null || ids.isEmpty()) return result;
        List<CertificateRecord> list = listByIds(ids);
        for (CertificateRecord r : list) result.put(r.getId(), r);
        return result;
    }

    private String generateCertNo() {
        return "CERT" + DateUtil.format(new Date(), "yyyyMMddHHmmss") +
               String.format("%04d", new Random().nextInt(10000));
    }

    private byte[] documentToBytes(PDDocument document) throws Exception {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        document.save(baos);
        return baos.toByteArray();
    }
}
