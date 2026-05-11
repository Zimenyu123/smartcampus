# 用户认证模块

这是一个简化的用户认证模块，支持网页端登录注册功能。

## 功能特性

- 用户注册（学生端/管理端）
- 用户登录
- JWT Token 认证
- 密码加密存储
- 用户信息获取

## 用户类型

- `student`: 学生端用户
- `admin`: 管理端用户

## API 接口

### 1. 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "student001",
  "password": "123456",
  "type": "student"
}
```

响应示例：
```json
{
  "id": 1,
  "username": "student001",
  "type": "student",
  "createdAt": "2025-05-26T10:00:00.000Z",
  "updatedAt": "2025-05-26T10:00:00.000Z"
}
```

### 2. 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "student001",
  "password": "123456"
}
```

响应示例：
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "student001",
    "type": "student"
  }
}
```

### 3. 获取用户信息

```http
GET /api/auth/profile
Authorization: Bearer <accessToken>
```

响应示例：
```json
{
  "id": 1,
  "username": "student001",
  "type": "student",
  "createdAt": "2025-05-26T10:00:00.000Z",
  "updatedAt": "2025-05-26T10:00:00.000Z"
}
```

## 环境配置

在 `.env` 文件中添加以下配置：

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
```

## 数据库迁移

运行以下命令创建用户表：

```bash
npm run migration:run
```

## 使用示例

1. 注册新用户：
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student001",
    "password": "123456",
    "type": "student"
  }'
```

2. 用户登录：
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student001",
    "password": "123456"
  }'
```

3. 获取用户信息：
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <your-access-token>"
```

## 安全特性

- 密码使用 bcrypt 加密存储
- JWT Token 用于身份验证
- 用户名唯一性验证
- 密码长度和复杂度验证

## 错误处理

- 用户名已存在：409 Conflict
- 用户名或密码错误：401 Unauthorized
- 未授权访问：401 Unauthorized
- 参数验证失败：400 Bad Request
