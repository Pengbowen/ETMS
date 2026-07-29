package xyz.playedu.certificate.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import java.util.Date;
import java.util.List;
import org.springframework.stereotype.Service;
import xyz.playedu.certificate.domain.CertificateRule;
import xyz.playedu.certificate.mapper.CertificateRuleMapper;
import xyz.playedu.certificate.service.CertificateRuleService;
import xyz.playedu.common.exception.NotFoundException;

@Service
public class CertificateRuleServiceImpl
        extends ServiceImpl<CertificateRuleMapper, CertificateRule>
        implements CertificateRuleService {

    @Override
    public CertificateRule findOrFail(Integer id) throws NotFoundException {
        CertificateRule rule = getById(id);
        if (rule == null) {
            throw new NotFoundException("证书规则不存在");
        }
        return rule;
    }

    @Override
    public void create(String name, Integer templateId, String triggerType,
                       String courseIds, Integer minProgress, Integer adminId) {
        CertificateRule rule = new CertificateRule();
        rule.setName(name);
        rule.setTemplateId(templateId);
        rule.setTriggerType(triggerType);
        rule.setCourseIds(courseIds);
        rule.setMinProgress(minProgress != null ? minProgress : 100);
        rule.setStatus(1);
        rule.setAdminId(adminId);
        rule.setCreatedAt(new Date());
        save(rule);
    }

    @Override
    public void update(Integer id, String name, Integer templateId, String triggerType,
                       String courseIds, Integer minProgress) {
        CertificateRule rule = new CertificateRule();
        rule.setId(id);
        rule.setName(name);
        rule.setTemplateId(templateId);
        rule.setTriggerType(triggerType);
        rule.setCourseIds(courseIds);
        rule.setMinProgress(minProgress != null ? minProgress : 100);
        updateById(rule);
    }

    @Override
    public List<CertificateRule> getEnabledRules(String triggerType) {
        LambdaQueryWrapper<CertificateRule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CertificateRule::getStatus, 1)
               .eq(CertificateRule::getTriggerType, triggerType);
        return list(wrapper);
    }
}
