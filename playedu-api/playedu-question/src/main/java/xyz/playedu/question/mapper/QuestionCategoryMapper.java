package xyz.playedu.question.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import xyz.playedu.question.domain.QuestionCategory;

@Mapper
public interface QuestionCategoryMapper extends BaseMapper<QuestionCategory> {}
