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
    public void create(String name, String backgroundImage, Integer width, Integer height,
                       String placeholders, String qrConfig, Integer adminId) {
        CertificateTemplate template = new CertificateTemplate();
        template.setName(name);
        template.setBackgroundImage(backgroundImage);
        template.setWidth(width);
        template.setHeight(height);
        template.setPlaceholders(placeholders);
        template.setQrConfig(qrConfig);
        template.setStatus(1);
        template.setAdminId(adminId);
        template.setCreatedAt(new Date());
        save(template);
    }

    @Override
    public void update(Integer id, String name, String backgroundImage, Integer width,
                       Integer height, String placeholders, String qrConfig) {
        CertificateTemplate template = new CertificateTemplate();
        template.setId(id);
        template.setName(name);
        template.setBackgroundImage(backgroundImage);
        template.setWidth(width);
        template.setHeight(height);
        template.setPlaceholders(placeholders);
        template.setQrConfig(qrConfig);
        updateById(template);
    }

    @Override
    public Map<Integer, CertificateTemplate> chunks(List<Integer> ids) {
        Map<Integer, CertificateTemplate> result = new HashMap<>();
        if (ids == null || ids.isEmpty()) {
            return result;
        }
        List<CertificateTemplate> list = listByIds(ids);
        for (CertificateTemplate t : list) {
            result.put(t.getId(), t);
        }
        return result;
    }
}
