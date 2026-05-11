import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateCampusTables1700000000001 implements MigrationInterface {
  name = 'CreateCampusTables1700000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建建筑楼表
    await queryRunner.query(`
      CREATE TABLE \`buildings\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`building_name\` varchar(100) NOT NULL COMMENT '建筑名称',
        \`building_type\` enum('dormitory','administrative') NOT NULL COMMENT '建筑类型',
        \`address\` varchar(200) NULL COMMENT '建筑地址',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 创建场地表
    await queryRunner.query(`
      CREATE TABLE \`rooms\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`room_name\` varchar(100) NOT NULL COMMENT '场地名称',
        \`building_id\` int NOT NULL COMMENT '所属建筑ID',
        \`room_type\` enum('classroom','meeting','laboratory','dormitory') NOT NULL COMMENT '场地类型',
        \`floor_no\` int NOT NULL COMMENT '楼层号',
        \`capacity\` int NOT NULL COMMENT '座位数/床位数量',
        \`exam_capacity\` int NULL COMMENT '考试座位数',
        \`is_public\` boolean NOT NULL DEFAULT false COMMENT '是否可对外使用',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_rooms_building_id\` FOREIGN KEY (\`building_id\`) REFERENCES \`buildings\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 创建体育设施表
    await queryRunner.query(`
      CREATE TABLE \`sports_facilities\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`facility_name\` varchar(100) NOT NULL COMMENT '设施名称',
        \`sport_type\` enum('basketball','football','swimming','gym','tennis','volleyball') NOT NULL COMMENT '运动类型',
        \`location\` varchar(200) NULL COMMENT '地理位置',
        \`capacity\` int NULL COMMENT '容纳人数',
        \`opening_hours\` varchar(100) NULL COMMENT '开放时间',
        \`is_public\` boolean NOT NULL DEFAULT false COMMENT '是否可对外使用',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 创建预约表
    await queryRunner.query(`
      CREATE TABLE \`reservations\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`resource_id\` int NOT NULL COMMENT '资源ID (场地ID或体育设施ID)',
        \`resource_type\` enum('room','sports_facility') NOT NULL COMMENT '资源类型',
        \`user_id\` int NOT NULL COMMENT '预约用户ID',
        \`user_name\` varchar(50) NOT NULL COMMENT '预约人姓名',
        \`user_type\` enum('student','teacher','admin') NOT NULL COMMENT '用户类型',
        \`use_date\` date NOT NULL COMMENT '使用日期',
        \`start_period\` int NOT NULL COMMENT '开始第几节课',
        \`end_period\` int NOT NULL COMMENT '结束第几节课',
        \`purpose\` enum('exam','activity','class','sports') NOT NULL COMMENT '使用目的',
        \`attendee_count\` int NULL COMMENT '参与人数',
        \`status\` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending' COMMENT '预约状态',
        \`audit_user_id\` int NULL COMMENT '审核人ID',
        \`audit_time\` datetime NULL COMMENT '审核时间',
        \`reject_reason\` text NULL COMMENT '拒绝原因',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_reservations_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`sys_user\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_reservations_audit_user_id\` FOREIGN KEY (\`audit_user_id\`) REFERENCES \`sys_user\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 创建保修表
    await queryRunner.query(`
      CREATE TABLE \`maintenance_reports\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`applicant\` varchar(50) NOT NULL COMMENT '申请人',
        \`phone\` varchar(20) NOT NULL COMMENT '联系电话',
        \`description\` text NOT NULL COMMENT '上报内容',
        \`location_type\` enum('building','room','sports_facility') NOT NULL COMMENT '位置类型',
        \`building_id\` int NULL COMMENT '建筑ID',
        \`room_id\` int NULL COMMENT '房间ID',
        \`facility_id\` int NULL COMMENT '设施ID',
        \`location_detail\` varchar(200) NOT NULL COMMENT '具体位置描述',
        \`submit_time\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
        \`status\` enum('pending','processing','completed','rejected') NOT NULL DEFAULT 'pending' COMMENT '状态',
        \`handler_id\` int NULL COMMENT '处理人ID',
        \`handle_time\` datetime NULL COMMENT '处理时间',
        \`handle_result\` text NULL COMMENT '处理结果',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_maintenance_reports_building_id\` FOREIGN KEY (\`building_id\`) REFERENCES \`buildings\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_maintenance_reports_room_id\` FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_maintenance_reports_facility_id\` FOREIGN KEY (\`facility_id\`) REFERENCES \`sports_facilities\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_maintenance_reports_handler_id\` FOREIGN KEY (\`handler_id\`) REFERENCES \`sys_user\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`maintenance_reports\``)
    await queryRunner.query(`DROP TABLE \`reservations\``)
    await queryRunner.query(`DROP TABLE \`sports_facilities\``)
    await queryRunner.query(`DROP TABLE \`rooms\``)
    await queryRunner.query(`DROP TABLE \`buildings\``)
  }
}
