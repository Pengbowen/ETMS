package xyz.playedu.certificate.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import xyz.playedu.certificate.domain.CertificateRule;
import xyz.playedu.common.exception.NotFoundException;

public interface CertificateRuleService extends IService<CertificateRule> {

    CertificateRule findOrFail(Integer id) throws NotFoundException;

    void create(String name, Integer templateId, String triggerType,
                String courseIds, Integer minProgress, Integer adminId);

    void update(Integer id, String name, Integer templateId, String triggerType,
                String courseIds, Integer minProgress);

    List<CertificateRule> getEnabledRules(String triggerType);
}
