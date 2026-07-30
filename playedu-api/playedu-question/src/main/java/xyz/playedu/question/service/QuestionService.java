package xyz.playedu.question.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import xyz.playedu.common.exception.NotFoundException;
import xyz.playedu.common.types.paginate.PaginationResult;
import xyz.playedu.question.domain.Question;

public interface QuestionService extends IService<Question> {

    Question findOrFail(Integer id) throws NotFoundException;

    void create(Integer categoryId, String type, String title, String options,
                String answer, String analysis, Integer difficulty, String tags, Integer adminId);

    void update(Integer id, Integer categoryId, String type, String title, String options,
                String answer, String analysis, Integer difficulty, String tags);

    PaginationResult<Question> paginate(Integer page, Integer size, Integer categoryId,
                                        String type, Integer difficulty, String tags, String keyword,
                                        String sort, String order);

    List<Question> listForExport(Integer categoryId, String type, Integer difficulty,
                                 String tags, String keyword);
}
