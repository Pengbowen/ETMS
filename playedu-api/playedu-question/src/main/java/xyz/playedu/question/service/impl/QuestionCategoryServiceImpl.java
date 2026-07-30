package xyz.playedu.question.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import java.util.*;
import org.springframework.stereotype.Service;
import xyz.playedu.common.exception.NotFoundException;
import xyz.playedu.question.domain.QuestionCategory;
import xyz.playedu.question.mapper.QuestionCategoryMapper;
import xyz.playedu.question.service.QuestionCategoryService;

@Service
public class QuestionCategoryServiceImpl
        extends ServiceImpl<QuestionCategoryMapper, QuestionCategory>
        implements QuestionCategoryService {

    @Override
    public QuestionCategory findOrFail(Integer id) throws NotFoundException {
        QuestionCategory category = getById(id);
        if (category == null) {
            throw new NotFoundException("分类不存在");
        }
        return category;
    }

    @Override
    public void create(String name, Integer parentId, Integer sort, Integer adminId) {
        QuestionCategory category = new QuestionCategory();
        category.setName(name);
        category.setParentId(parentId != null ? parentId : 0);
        category.setSort(sort != null ? sort : 0);
        category.setAdminId(adminId);
        category.setCreatedAt(new Date());
        save(category);
    }

    @Override
    public void update(Integer id, String name, Integer parentId, Integer sort) {
        QuestionCategory category = new QuestionCategory();
        category.setId(id);
        if (name != null) category.setName(name);
        if (parentId != null) category.setParentId(parentId);
        if (sort != null) category.setSort(sort);
        updateById(category);
    }

    @Override
    public List<Map<String, Object>> getTree() {
        List<QuestionCategory> all = list();
        // parent_id -> children
        Map<Integer, List<Map<String, Object>>> childrenMap = new HashMap<>();
        Map<Integer, Map<String, Object>> nodeMap = new HashMap<>();

        for (QuestionCategory cat : all) {
            Map<String, Object> node = new HashMap<>();
            node.put("id", cat.getId());
            node.put("parent_id", cat.getParentId());
            node.put("name", cat.getName());
            node.put("sort", cat.getSort());
            node.put("children", new ArrayList<>());
            nodeMap.put(cat.getId(), node);
        }

        for (QuestionCategory cat : all) {
            Map<String, Object> node = nodeMap.get(cat.getId());
            if (cat.getParentId() == 0) {
                // root level
            } else {
                Map<String, Object> parent = nodeMap.get(cat.getParentId());
                if (parent != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> siblings = (List<Map<String, Object>>) parent.get("children");
                    siblings.add(node);
                }
            }
        }

        // Sort each level by sort field
        List<Map<String, Object>> roots = new ArrayList<>();
        for (QuestionCategory cat : all) {
            if (cat.getParentId() == 0) {
                Map<String, Object> node = nodeMap.get(cat.getId());
                sortChildren(node);
                roots.add(node);
            }
        }
        roots.sort(Comparator.comparingInt(n -> (Integer) n.get("sort")));
        return roots;
    }

    @SuppressWarnings("unchecked")
    private void sortChildren(Map<String, Object> node) {
        List<Map<String, Object>> children = (List<Map<String, Object>>) node.get("children");
        if (children != null && !children.isEmpty()) {
            children.sort(Comparator.comparingInt(n -> (Integer) n.get("sort")));
            for (Map<String, Object> child : children) {
                sortChildren(child);
            }
        }
    }

    @Override
    public boolean hasChildren(Integer id) {
        return lambdaQuery().eq(QuestionCategory::getParentId, id).count() > 0;
    }
}
