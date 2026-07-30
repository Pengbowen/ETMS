package xyz.playedu.certificate.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import xyz.playedu.certificate.domain.CertificateTemplate;
import xyz.playedu.certificate.mapper.CertificateTemplateMapper;
import xyz.playedu.certificate.service.CertificateTemplateService;
import xyz.playedu.common.exception.NotFoundException;

@Service
public class CertificateTemplateServiceImpl
        extends ServiceImpl<CertificateTemplateMapper, CertificateTemplate>
        implements CertificateTemplateService {

    @Override
    public CertificateTemplate findOrFail(Integer id) throws NotFoundException {
        CertificateTemplate template = getById(id);
        if (template == null) {
            throw new NotFoundException("证书模板不存在");
        }
        return template;
    }

    @Override
    public void create(String name, String type, String issuingAuthority, String numberingRule,
                       String backgroundImage, String sampleImage, Integer width, Integer height,
                       String placeholders, String qrConfig, Integer isEnabled, Integer isValid,
                       Integer expiryYears, String description, Integer adminId) {
        CertificateTemplate template = new CertificateTemplate();
        template.setName(name);
        template.setType(type != null ? type : "completion");
        template.setIssuingAuthority(issuingAuthority != null ? issuingAuthority : "");
        template.setNumberingRule(numberingRule != null ? numberingRule : "CERT{yyyyMMdd}{nnnn}");
        template.setBackgroundImage(backgroundImage != null ? backgroundImage : "");
        template.setSampleImage(sampleImage != null ? sampleImage : "");
        template.setWidth(width != null ? width : 1200);
        template.setHeight(height != null ? height : 850);
        template.setPlaceholders(placeholders != null ? placeholders : "[]");
        template.setQrConfig(qrConfig != null ? qrConfig : "{}");
        template.setStatus(isEnabled != null ? isEnabled : 1);
        template.setIsValid(isValid != null ? isValid : 1);
        template.setExpiryYears(expiryYears != null ? expiryYears : 0);
        template.setDescription(description != null ? description : "");
        template.setAdminId(adminId);
        template.setCreatedAt(new Date());
        save(template);
    }

    @Override
    public void update(Integer id, String name, String type, String issuingAuthority, String numberingRule,
                       String backgroundImage, String sampleImage, Integer width, Integer height,
                       String placeholders, String qrConfig, Integer isEnabled, Integer isValid,
                       Integer expiryYears, String description) {
        CertificateTemplate template = new CertificateTemplate();
        template.setId(id);
        if (name != null) template.setName(name);
        if (type != null) template.setType(type);
        if (issuingAuthority != null) template.setIssuingAuthority(issuingAuthority);
        if (numberingRule != null) template.setNumberingRule(numberingRule);
        if (backgroundImage != null) template.setBackgroundImage(backgroundImage);
        if (sampleImage != null) template.setSampleImage(sampleImage);
        if (width != null) template.setWidth(width);
        if (height != null) template.setHeight(height);
        if (placeholders != null) template.setPlaceholders(placeholders);
        if (qrConfig != null) template.setQrConfig(qrConfig);
        if (isEnabled != null) template.setStatus(isEnabled);
        if (isValid != null) template.setIsValid(isValid);
        if (expiryYears != null) template.setExpiryYears(expiryYears);
        if (description != null) template.setDescription(description);
        updateById(template);
    }

    @Override
    public Map<Integer, CertificateTemplate> chunks(List<Integer> ids) {
        Map<Integer, CertificateTemplate> result = new HashMap<>();
        if (ids == null || ids.isEmpty()) return result;
        List<CertificateTemplate> list = listByIds(ids);
        for (CertificateTemplate t : list) result.put(t.getId(), t);
        return result;
    }
}
