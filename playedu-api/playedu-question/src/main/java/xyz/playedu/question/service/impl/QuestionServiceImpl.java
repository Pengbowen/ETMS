package xyz.playedu.question.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import java.util.Date;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import xyz.playedu.common.exception.NotFoundException;
import xyz.playedu.common.types.paginate.PaginationResult;
import xyz.playedu.question.domain.Question;
import xyz.playedu.question.mapper.QuestionMapper;
import xyz.playedu.question.service.QuestionService;

@Service
public class QuestionServiceImpl
        extends ServiceImpl<QuestionMapper, Question>
        implements QuestionService {

    @Override
    public Question findOrFail(Integer id) throws NotFoundException {
        Question question = getById(id);
        if (question == null) {
            throw new NotFoundException("试题不存在");
        }
        return question;
    }

    @Override
    public void create(Integer categoryId, String type, String title, String options,
                       String answer, String analysis, Integer difficulty, String tags, Integer adminId) {
        Question question = new Question();
        question.setCategoryId(categoryId != null ? categoryId : 0);
        question.setType(type != null ? type : "single_choice");
        question.setTitle(title != null ? title : "");
        question.setOptions(options != null ? options : "[]");
        question.setAnswer(answer != null ? answer : "[]");
        question.setAnalysis(analysis != null ? analysis : "");
        question.setDifficulty(difficulty != null ? difficulty : 3);
        question.setTags(tags != null ? tags : "");
        question.setUseCount(0);
        question.setStatus(1);
        question.setAdminId(adminId);
        question.setCreatedAt(new Date());
        save(question);
    }

    @Override
    public void update(Integer id, Integer categoryId, String type, String title, String options,
                       String answer, String analysis, Integer difficulty, String tags) {
        Question question = new Question();
        question.setId(id);
        if (categoryId != null) question.setCategoryId(categoryId);
        if (type != null) question.setType(type);
        if (title != null) question.setTitle(title);
        if (options != null) question.setOptions(options);
        if (answer != null) question.setAnswer(answer);
        if (analysis != null) question.setAnalysis(analysis);
        if (difficulty != null) question.setDifficulty(difficulty);
        if (tags != null) question.setTags(tags);
        updateById(question);
    }

    @Override
    public PaginationResult<Question> paginate(Integer page, Integer size, Integer categoryId,
                                               String type, Integer difficulty, String tags, String keyword,
                                               String sort, String order) {
        LambdaQueryWrapper<Question> wrapper = Wrappers.<Question>lambdaQuery();

        if (categoryId != null && categoryId > 0) {
            wrapper.eq(Question::getCategoryId, categoryId);
        }
        if (StringUtils.hasText(type)) {
            wrapper.eq(Question::getType, type);
        }
        if (difficulty != null && difficulty > 0) {
            wrapper.eq(Question::getDifficulty, difficulty);
        }
        if (StringUtils.hasText(tags)) {
            String[] tagArr = tags.split(",");
            for (String tag : tagArr) {
                if (StringUtils.hasText(tag.trim())) {
                    wrapper.like(Question::getTags, tag.trim());
                }
            }
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Question::getTitle, keyword);
        }

        // Sort
        if (StringUtils.hasText(sort)) {
            boolean isAsc = "asc".equalsIgnoreCase(order);
            if ("created_at".equals(sort)) {
                wrapper.orderBy(true, isAsc, Question::getCreatedAt);
            } else if ("difficulty".equals(sort)) {
                wrapper.orderBy(true, isAsc, Question::getDifficulty);
            } else if ("use_count".equals(sort)) {
                wrapper.orderBy(true, isAsc, Question::getUseCount);
            }
        } else {
            wrapper.orderByDesc(Question::getCreatedAt);
        }

        Page<Question> result = page(new Page<>(page, size), wrapper);

        PaginationResult<Question> paginationResult = new PaginationResult<>();
        paginationResult.setData(result.getRecords());
        paginationResult.setTotal(result.getTotal());
        return paginationResult;
    }

    @Override
    public List<Question> listForExport(Integer categoryId, String type, Integer difficulty,
                                        String tags, String keyword) {
        LambdaQueryWrapper<Question> wrapper = Wrappers.<Question>lambdaQuery();

        if (categoryId != null && categoryId > 0) {
            wrapper.eq(Question::getCategoryId, categoryId);
        }
        if (StringUtils.hasText(type)) {
            wrapper.eq(Question::getType, type);
        }
        if (difficulty != null && difficulty > 0) {
            wrapper.eq(Question::getDifficulty, difficulty);
        }
        if (StringUtils.hasText(tags)) {
            String[] tagArr = tags.split(",");
            for (String tag : tagArr) {
                if (StringUtils.hasText(tag.trim())) {
                    wrapper.like(Question::getTags, tag.trim());
                }
            }
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Question::getTitle, keyword);
        }
        wrapper.orderByDesc(Question::getCreatedAt);

        return list(wrapper);
    }
}
