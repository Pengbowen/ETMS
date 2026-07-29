package xyz.playedu.certificate.service;

public interface CertificateGenerateService {

    byte[] generate(String templatePlaceholders, String qrConfig, String backgroundImageUrl,
                    String userName, String courseName, String issueDate, String verifyUrl) throws Exception;
}
