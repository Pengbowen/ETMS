package xyz.playedu.certificate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import xyz.playedu.common.service.AppConfigService;
import xyz.playedu.common.util.S3Util;

@Configuration
public class CertificateConfig {

    @Bean
    public S3Util s3Util(AppConfigService appConfigService) {
        return new S3Util(appConfigService.getS3Config());
    }
}
