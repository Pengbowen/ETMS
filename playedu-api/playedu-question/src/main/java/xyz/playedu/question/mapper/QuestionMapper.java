package xyz.playedu.question.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import xyz.playedu.question.domain.Question;

@Mapper
public interface QuestionMapper extends BaseMapper<Question> {}
