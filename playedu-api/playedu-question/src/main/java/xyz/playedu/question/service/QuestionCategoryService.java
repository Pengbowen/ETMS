package xyz.playedu.question.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import java.util.Map;
import xyz.playedu.common.exception.NotFoundException;
import xyz.playedu.question.domain.QuestionCategory;

public interface QuestionCategoryService extends IService<QuestionCategory> {

    QuestionCategory findOrFail(Integer id) throws NotFoundException;

    void create(String name, Integer parentId, Integer sort, Integer adminId);

    void update(Integer id, String name, Integer parentId, Integer sort);

    List<Map<String, Object>> getTree();

    boolean hasChildren(Integer id);
}
