import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateFileTable1699123456789 implements MigrationInterface {
  name = 'CreateFileTable1699123456789'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`sys_file\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`filename\` varchar(255) NOT NULL COMMENT '文件名称',
        \`size\` int NOT NULL COMMENT '文件大小（字节）',
        \`mimetype\` varchar(255) NOT NULL COMMENT '文件MIME类型',
        \`url\` varchar(255) NOT NULL COMMENT '文件访问URL',
        \`path\` varchar(255) NOT NULL COMMENT '存储路径',
        \`fileType\` enum('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'ARCHIVE', 'OTHER') NOT NULL DEFAULT 'OTHER' COMMENT '文件类型',
        \`hash\` varchar(255) NULL COMMENT '文件MD5哈希',
        \`userId\` int NOT NULL COMMENT '上传者用户ID',
        \`isDeleted\` tinyint NOT NULL DEFAULT 0 COMMENT '是否已删除',
        \`deletedAt\` datetime NULL COMMENT '删除时间',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `)

    await queryRunner.query(`
      ALTER TABLE \`sys_file\` ADD CONSTRAINT \`FK_sys_file_userId\` 
      FOREIGN KEY (\`userId\`) REFERENCES \`sys_user\`(\`id\`) ON DELETE CASCADE
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`sys_file\` DROP FOREIGN KEY \`FK_sys_file_userId\``)
    await queryRunner.query(`DROP TABLE \`sys_file\``)
  }
}
