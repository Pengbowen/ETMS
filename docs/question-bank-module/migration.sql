-- 试题库模块 - 数据库迁移脚本
-- 执行方式：docker compose exec mysql mysql -u root -pplayeduxyz playedu < docs/question-bank-module/migration.sql

CREATE TABLE IF NOT EXISTS `question_categories` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `parent_id` int(11) unsigned NOT NULL DEFAULT 0 COMMENT '父级ID[0:根分类]',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '分类名称',
  `sort` int(11) NOT NULL DEFAULT 0 COMMENT '排序(升序)',
  `admin_id` int(11) NOT NULL DEFAULT 0 COMMENT '创建人ID',
  `created_at` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试题分类表';

CREATE TABLE IF NOT EXISTS `questions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `category_id` int(11) unsigned NOT NULL DEFAULT 0 COMMENT '分类ID',
  `type` varchar(20) NOT NULL DEFAULT 'single_choice' COMMENT '题型',
  `title` text COMMENT '题干(HTML)',
  `options` text COMMENT '选项/填空配置(JSON)',
  `answer` text COMMENT '答案(JSON)',
  `analysis` text COMMENT '解析(HTML)',
  `difficulty` tinyint(2) NOT NULL DEFAULT 3 COMMENT '难度[1-5]',
  `tags` varchar(500) NOT NULL DEFAULT '' COMMENT '标签(逗号分隔)',
  `use_count` int(11) NOT NULL DEFAULT 0 COMMENT '使用次数',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态[1:启用,0:禁用]',
  `admin_id` int(11) NOT NULL DEFAULT 0 COMMENT '创建人ID',
  `created_at` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_type` (`type`),
  KEY `idx_difficulty` (`difficulty`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试题表';
