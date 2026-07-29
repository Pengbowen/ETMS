-- 证书模块数据库迁移脚本
-- 执行方式：mysql -u root -p playedu < migration.sql

-- 证书模板表
CREATE TABLE IF NOT EXISTS `certificate_templates` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '模板名称',
  `background_image` varchar(500) NOT NULL DEFAULT '' COMMENT '背景图S3资源key',
  `width` int(11) NOT NULL DEFAULT 1200 COMMENT '模板宽度(px)',
  `height` int(11) NOT NULL DEFAULT 850 COMMENT '模板高度(px)',
  `placeholders` text COMMENT '占位符配置JSON',
  `qr_config` text COMMENT '二维码配置JSON',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态[1:启用,0:禁用]',
  `admin_id` int(11) NOT NULL DEFAULT 0 COMMENT '创建人ID',
  `created_at` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='证书模板表';

-- 证书记录表
CREATE TABLE IF NOT EXISTS `certificate_records` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `cert_no` varchar(32) NOT NULL DEFAULT '' COMMENT '证书编号(唯一)',
  `template_id` int(11) unsigned NOT NULL DEFAULT 0 COMMENT '模板ID',
  `user_id` int(11) NOT NULL DEFAULT 0 COMMENT '学员ID',
  `user_name` varchar(64) NOT NULL DEFAULT '' COMMENT '学员姓名(冗余)',
  `course_id` int(11) NOT NULL DEFAULT 0 COMMENT '关联课程ID',
  `course_name` varchar(200) NOT NULL DEFAULT '' COMMENT '课程名称(冗余)',
  `cert_image` varchar(500) NOT NULL DEFAULT '' COMMENT '证书合成图S3路径',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态[1:有效,0:已撤销]',
  `issue_type` varchar(20) NOT NULL DEFAULT 'manual' COMMENT '颁发方式[manual:手动,auto:自动]',
  `rule_id` int(11) DEFAULT NULL COMMENT '触发的规则ID(自动发放时)',
  `admin_id` int(11) NOT NULL DEFAULT 0 COMMENT '操作人ID',
  `issued_at` timestamp NULL DEFAULT NULL COMMENT '颁发时间',
  `revoked_at` timestamp NULL DEFAULT NULL COMMENT '撤销时间',
  `created_at` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cert_no` (`cert_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_template_id` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='证书记录表';

-- 证书发放规则表
CREATE TABLE IF NOT EXISTS `certificate_rules` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '规则名称',
  `template_id` int(11) unsigned NOT NULL DEFAULT 0 COMMENT '关联模板ID',
  `trigger_type` varchar(20) NOT NULL DEFAULT 'course_complete' COMMENT '触发类型[course_complete:课程完成,exam_pass:考试通过]',
  `course_ids` text COMMENT '适用课程ID列表JSON',
  `min_progress` int(11) NOT NULL DEFAULT 100 COMMENT '课程完成最小进度(%)',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态[1:启用,0:禁用]',
  `admin_id` int(11) NOT NULL DEFAULT 0 COMMENT '创建人ID',
  `created_at` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_template_id` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='证书发放规则表';
