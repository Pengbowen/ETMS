package xyz.playedu.certificate.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import java.util.Map;
import xyz.playedu.certificate.domain.CertificateRecord;
import xyz.playedu.common.exception.NotFoundException;
import xyz.playedu.common.types.paginate.PaginationResult;

public interface CertificateRecordService extends IService<CertificateRecord> {

    PaginationResult<CertificateRecord> paginate(int page, int size, Integer userId,
                                                  Integer courseId, Integer templateId, String certNo);

    CertificateRecord findByCertNo(String certNo);

    CertificateRecord findOrFail(Integer id) throws NotFoundException;

    void issue(Integer templateId, Integer userId, String userName, Integer courseId,
               String courseName, String certImage, String issueType, Integer ruleId, Integer adminId);

    void revoke(Integer id);

    boolean existsByUserAndCourse(Integer userId, Integer courseId);

    byte[] exportPdf(Integer id) throws Exception;

    Map<Integer, CertificateRecord> chunks(List<Integer> ids);
}
