package xyz.playedu.certificate.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import java.util.Map;
import xyz.playedu.certificate.domain.CertificateTemplate;
import xyz.playedu.common.exception.NotFoundException;

public interface CertificateTemplateService extends IService<CertificateTemplate> {

    CertificateTemplate findOrFail(Integer id) throws NotFoundException;

    void create(String name, String type, String issuingAuthority, String numberingRule,
                String backgroundImage, String sampleImage, Integer width, Integer height,
                String placeholders, String qrConfig, Integer isEnabled, Integer isValid,
                Integer expiryYears, String description, Integer adminId);

    void update(Integer id, String name, String type, String issuingAuthority, String numberingRule,
                String backgroundImage, String sampleImage, Integer width, Integer height,
                String placeholders, String qrConfig, Integer isEnabled, Integer isValid,
                Integer expiryYears, String description);

    Map<Integer, CertificateTemplate> chunks(List<Integer> ids);
}
