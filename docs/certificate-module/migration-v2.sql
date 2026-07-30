-- 证书模块 v2 升级脚本
-- 为 certificate_templates 表增加新字段

ALTER TABLE `certificate_templates`
  ADD COLUMN `type` varchar(32) NOT NULL DEFAULT 'completion' COMMENT '证书类型[completion:结业,training:培训,honor:荣誉,other:其他]' AFTER `name`,
  ADD COLUMN `issuing_authority` varchar(200) NOT NULL DEFAULT '' COMMENT '发证单位' AFTER `type`,
  ADD COLUMN `numbering_rule` varchar(100) NOT NULL DEFAULT 'CERT{yyyyMMdd}{nnnn}' COMMENT '编号规则' AFTER `issuing_authority`,
  ADD COLUMN `sample_image` varchar(500) NOT NULL DEFAULT '' COMMENT '证书样例图S3路径' AFTER `background_image`,
  ADD COLUMN `is_valid` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否有效[1:有效,0:无效]' AFTER `status`,
  ADD COLUMN `expiry_years` int(11) NOT NULL DEFAULT 0 COMMENT '有效期(年)，0表示永久有效' AFTER `is_valid`,
  ADD COLUMN `description` text COMMENT '证书描述(富文本)' AFTER `expiry_years`;
