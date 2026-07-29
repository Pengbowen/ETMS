package xyz.playedu.certificate.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import java.util.Map;
import xyz.playedu.certificate.domain.CertificateTemplate;
import xyz.playedu.common.exception.NotFoundException;

public interface CertificateTemplateService extends IService<CertificateTemplate> {

    CertificateTemplate findOrFail(Integer id) throws NotFoundException;

    void create(String name, String backgroundImage, Integer width, Integer height,
                String placeholders, String qrConfig, Integer adminId);

    void update(Integer id, String name, String backgroundImage, Integer width, Integer height,
                String placeholders, String qrConfig);

    Map<Integer, CertificateTemplate> chunks(List<Integer> ids);
}
