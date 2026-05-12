# 智慧校园三维管理平台

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.x-brightgreen" alt="Vue 3"/>
  <img src="https://img.shields.io/badge/Vite-6.x-%23646CFF" alt="Vite"/>
  <img src="https://img.shields.io/badge/Cesium-1.x-blue" alt="Cesium"/>
  <img src="https://img.shields.io/badge/NestJS-10.x-red" alt="NestJS"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/MySQL-8.x-orange" alt="MySQL"/>
  <br>
  <sub>🔨 Built with ❤️ for Smart Campus Management</sub>
</p>

基于 Vue3 + Cesium + NestJS 开发的智慧校园三维管理平台原型。

## 项目简介

针对传统二维校园管理平台空间表现力不足的问题，开发了智慧校园三维管理平台原型。基于 Vue3 工程化架构与 Cesium 三维引擎，完成校园三维场景的基础构建与前端交互开发。

## 技术栈

### 前端

- **框架**: Vue 3 + Vite
- **状态管理**: Pinia
- **UI 组件**: Element Plus
- **三维引擎**: Cesium
- **路由**: Vue Router

### 后端

- **框架**: NestJS + TypeScript
- **数据库**: MySQL + TypeORM
- **缓存**: Redis
- **认证**: JWT + Passport

## 功能模块

### 用户端

- 首页展示
- 用户登录
- 学生仪表板（学习、生活、娱乐、安防等）
- 虚拟校园三维场景

### 管理端

- 管理员仪表板
- 设施管理（学习设施、体育设施、场馆）
- 安全管理（消防分析、淹没分析）
- 维护管理

### 核心功能

- 三维场景加载与交互
- 图层控制
- 空间分析（量测、淹没分析等）
- GeoJSON 数据显示
- 校园设施信息查询

## 项目结构

```
smartcampus/
├── front-end/          # 前端项目
│   ├── src/
│   │   ├── views/      # 页面组件
│   │   ├── components/ # 公共组件
│   │   │   ├── CesiumMap.vue      # Cesium 三维地图组件
│   │   │   ├── FloodAnalysis.vue  # 淹没分析组件
│   │   │   └── student/           # 学生端模块组件
│   │   ├── store/      # Pinia 状态管理
│   │   └── router/     # 路由配置
│   └── public/          # 静态资源
│
└── back-end/           # 后端项目 (NestJS)
    └── src/
        ├── modules/     # 功能模块
        ├── config/      # 配置文件
        └── common/      # 公共模块
```

## 快速开始

### 前端

```bash
cd front-end
npm install
npm run dev
```

访问 `http://localhost:5173` 查看前端项目。

### 后端

```bash
cd back-end
pnpm install
pnpm dev
```

后端服务将运行在 `http://localhost:7001`。

### API 文档

启动后端后，访问 `http://localhost:7001/api-docs/` 查看 Swagger API 文档。

## 环境要求

- **Node.js**: 16.20.2+
- **pnpm**: 8+ (后端)
- **MySQL**: 8.x
- **Redis**: 6.x+

## 注意事项

1. 本项目为原型系统，部分三维数据和敏感信息已脱敏处理
2. Cesium Ion Token 为公开测试 Token，如需生产使用请替换为自有 Token
3. 虚拟校园模块需要配合独立的 3D 资源文件使用

## 演示账号

| 角色   | 账号    | 密码    |
| ------ | ------- | ------- |
| 管理员 | admin   | a123456 |
| 学生   | student | a123456 |

## License

MIT
