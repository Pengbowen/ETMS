package xyz.playedu.certificate.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "certificate_templates")
@Data
public class CertificateTemplate implements Serializable {

    @TableId(type = IdType.AUTO)
    private Integer id;

    private String name;

    @JsonProperty("background_image")
    private String backgroundImage;

    private Integer width;

    private Integer height;

    private String placeholders;

    @JsonProperty("qr_config")
    private String qrConfig;

    private Integer status;

    @JsonProperty("admin_id")
    private Integer adminId;

    @JsonProperty("created_at")
    private Date createdAt;

    @JsonProperty("updated_at")
    private Date updatedAt;

    @com.baomidou.mybatisplus.annotation.TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
