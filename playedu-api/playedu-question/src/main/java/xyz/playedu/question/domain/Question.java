package xyz.playedu.question.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "questions")
@Data
public class Question implements Serializable {

    @TableId(type = IdType.AUTO)
    private Integer id;

    @JsonProperty("category_id")
    private Integer categoryId;

    private String type;

    private String title;

    private String options;

    private String answer;

    private String analysis;

    private Integer difficulty;

    private String tags;

    @JsonProperty("use_count")
    private Integer useCount;

    private Integer status;

    @JsonProperty("admin_id")
    private Integer adminId;

    @JsonProperty("created_at")
    private Date createdAt;

    @JsonProperty("updated_at")
    private Date updatedAt;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
