package xyz.playedu.certificate.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "certificate_rules")
@Data
public class CertificateRule implements Serializable {

    @TableId(type = IdType.AUTO)
    private Integer id;

    private String name;

    @JsonProperty("template_id")
    private Integer templateId;

    @JsonProperty("trigger_type")
    private String triggerType;

    @JsonProperty("course_ids")
    private String courseIds;

    @JsonProperty("min_progress")
    private Integer minProgress;

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
