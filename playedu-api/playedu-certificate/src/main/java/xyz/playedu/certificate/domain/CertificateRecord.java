package xyz.playedu.certificate.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "certificate_records")
@Data
public class CertificateRecord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Integer id;

    @JsonProperty("cert_no")
    private String certNo;

    @JsonProperty("template_id")
    private Integer templateId;

    @JsonProperty("user_id")
    private Integer userId;

    @JsonProperty("user_name")
    private String userName;

    @JsonProperty("course_id")
    private Integer courseId;

    @JsonProperty("course_name")
    private String courseName;

    @JsonProperty("cert_image")
    private String certImage;

    private Integer status;

    @JsonProperty("issue_type")
    private String issueType;

    @JsonProperty("rule_id")
    private Integer ruleId;

    @JsonProperty("admin_id")
    private Integer adminId;

    @JsonProperty("issued_at")
    private Date issuedAt;

    @JsonProperty("revoked_at")
    private Date revokedAt;

    @JsonProperty("created_at")
    private Date createdAt;

    @com.baomidou.mybatisplus.annotation.TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
