package xyz.playedu.question.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "question_categories")
@Data
public class QuestionCategory implements Serializable {

    @TableId(type = IdType.AUTO)
    private Integer id;

    @JsonProperty("parent_id")
    private Integer parentId;

    private String name;

    private Integer sort;

    @JsonProperty("admin_id")
    private Integer adminId;

    @JsonProperty("created_at")
    private Date createdAt;

    @JsonProperty("updated_at")
    private Date updatedAt;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
