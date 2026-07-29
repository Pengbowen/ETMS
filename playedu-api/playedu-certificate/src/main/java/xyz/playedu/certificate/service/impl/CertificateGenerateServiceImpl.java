package xyz.playedu.certificate.service.impl;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.net.URL;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import xyz.playedu.certificate.service.CertificateGenerateService;
import xyz.playedu.certificate.util.QrCodeUtil;

@Service
@Slf4j
public class CertificateGenerateServiceImpl implements CertificateGenerateService {

    private static final Gson gson = new Gson();

    @Override
    public byte[] generate(String templatePlaceholders, String qrConfigJson, String backgroundImageUrl,
                           String userName, String courseName, String issueDate, String verifyUrl) throws Exception {
        // Parse placeholders
        Type listType = new TypeToken<List<Map<String, Object>>>() {}.getType();
        List<Map<String, Object>> placeholders = gson.fromJson(templatePlaceholders, listType);

        // Parse QR config
        Map<String, Object> qrConfig = null;
        if (qrConfigJson != null && !qrConfigJson.isEmpty()) {
            Type mapType = new TypeToken<Map<String, Object>>() {}.getType();
            qrConfig = gson.fromJson(qrConfigJson, mapType);
        }

        // Download background image
        BufferedImage bgImage;
        try (InputStream is = new URL(backgroundImageUrl).openStream()) {
            bgImage = ImageIO.read(is);
        }

        Graphics2D g2d = bgImage.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // Draw text placeholders
        for (Map<String, Object> ph : placeholders) {
            String key = (String) ph.get("key");
            int x = ((Number) ph.get("x")).intValue();
            int y = ((Number) ph.get("y")).intValue();
            int fontSize = ph.containsKey("fontSize") ? ((Number) ph.get("fontSize")).intValue() : 24;
            String colorStr = (String) ph.getOrDefault("color", "#333333");
            String align = (String) ph.getOrDefault("align", "center");

            String text = resolveText(key, userName, courseName, issueDate);
            if (text == null) continue;

            g2d.setColor(Color.decode(colorStr));
            g2d.setFont(new Font("SansSerif", Font.PLAIN, fontSize));

            FontMetrics fm = g2d.getFontMetrics();
            int textWidth = fm.stringWidth(text);
            int drawX = x;
            if ("center".equals(align)) {
                drawX = x - textWidth / 2;
            } else if ("right".equals(align)) {
                drawX = x - textWidth;
            }
            g2d.drawString(text, drawX, y + fm.getAscent());
        }

        // Draw QR code
        if (qrConfig != null && Boolean.TRUE.equals(qrConfig.get("enabled"))) {
            int qrX = ((Number) qrConfig.get("x")).intValue();
            int qrY = ((Number) qrConfig.get("y")).intValue();
            int qrSize = ((Number) qrConfig.getOrDefault("size", 120)).intValue();

            BufferedImage qrImage = QrCodeUtil.generateQrCode(verifyUrl, qrSize);
            g2d.drawImage(qrImage, qrX, qrY, null);
        }

        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(bgImage, "PNG", baos);
        return baos.toByteArray();
    }

    private String resolveText(String key, String userName, String courseName, String issueDate) {
        return switch (key) {
            case "user_name" -> userName;
            case "course_name" -> courseName;
            case "issue_date" -> issueDate;
            default -> key;
        };
    }
}
