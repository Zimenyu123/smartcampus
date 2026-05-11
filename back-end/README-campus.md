# 校园模块

校园模块提供了空教室预约、体育设施预约和保修管理功能。

## 功能特性

### 1. 校园结构管理
- 建筑物管理（行政楼、教学楼、宿舍楼等）
- 房间管理（教室、办公室等）
- 体育设施管理
- 按楼层分类显示建筑物和房间

### 2. 预约管理
- 空教室预约
- 体育设施预约
- 预约审核流程
- 预约冲突检测
- 预约状态管理

### 3. 保修管理
- 保修申请提交
- 保修处理流程
- 保修状态跟踪
- 处理结果记录

## API 接口

### 校园结构接口

#### 获取校园结构
```
GET /campus/structure
```
返回按楼层分类的建筑物和房间信息。

#### 获取可用教室
```
GET /campus/available-rooms
```
返回当前可用的教室列表。

#### 获取可用体育设施
```
GET /campus/available-facilities
```
返回当前可用的体育设施列表。

### 预约管理接口

#### 创建预约
```
POST /reservations
```
创建新的预约申请。

**请求体：**
```json
{
  "resourceId": 1,
  "resourceType": "room",
  "useDate": "2025-05-26",
  "startPeriod": 1,
  "endPeriod": 2,
  "purpose": "exam",
  "attendeeCount": 30
}
```

#### 获取预约列表
```
GET /reservations
```
获取预约列表，支持分页和筛选。

#### 获取预约详情
```
GET /reservations/:id
```
获取指定预约的详细信息。

#### 取消预约
```
DELETE /reservations/:id
```
取消指定的预约（仅限自己的预约）。

#### 审核预约（管理员）
```
PUT /reservations/:id/audit
```
审核预约申请。

**请求体：**
```json
{
  "status": "approved"
}
```
或
```json
{
  "status": "rejected",
  "rejectReason": "时间冲突"
}
```

#### 获取待审核预约列表（管理员）
```
GET /reservations/pending/list
```
获取所有待审核的预约列表。

### 保修管理接口

#### 创建保修申请
```
POST /maintenance
```
创建新的保修申请。

**请求体：**
```json
{
  "applicant": "张三",
  "phone": "13800138000",
  "description": "教室灯管坏了",
  "locationType": "room",
  "roomId": 1,
  "locationDetail": "教学楼A101教室"
}
```

#### 获取保修列表
```
GET /maintenance
```
获取保修申请列表，支持分页和筛选。

#### 获取保修详情
```
GET /maintenance/:id
```
获取指定保修申请的详细信息。

#### 处理保修申请（管理员）
```
PUT /maintenance/:id/handle
```
处理保修申请。

**请求体：**
```json
{
  "status": "processing",
  "handleResult": "已安排维修人员"
}
```

#### 获取待处理保修列表（管理员）
```
GET /maintenance/pending/list
```
获取所有待处理的保修申请。

#### 获取处理中保修列表（管理员）
```
GET /maintenance/processing/list
```
获取所有处理中的保修申请。

## 数据模型

### 建筑物 (Building)
- id: 建筑物ID
- buildingName: 建筑物名称
- buildingType: 建筑物类型（行政楼、教学楼、宿舍楼等）
- address: 地址
- floors: 楼层数
- status: 状态（正常、维护中等）

### 房间 (Room)
- id: 房间ID
- roomName: 房间名称
- buildingId: 所属建筑物ID
- roomType: 房间类型（教室、办公室等）
- floorNo: 楼层号
- roomNumber: 房间号
- capacity: 容量
- examCapacity: 考试容量
- status: 状态（可用、维护中、已预约等）

### 体育设施 (SportsFacility)
- id: 设施ID
- facilityName: 设施名称
- sportType: 运动类型
- location: 位置
- capacity: 容量
- openingHours: 开放时间
- status: 状态
- bookingInfo: 预约信息

### 预约 (Reservation)
- id: 预约ID
- resourceId: 资源ID
- resourceType: 资源类型（房间或体育设施）
- userId: 预约用户ID
- userName: 预约人姓名
- userType: 用户类型（学生、教师、管理员）
- useDate: 使用日期
- startPeriod: 开始第几节课
- endPeriod: 结束第几节课
- purpose: 使用目的（考试、活动、上课等）
- attendeeCount: 参与人数
- status: 预约状态（待审核、已通过、已拒绝、已取消）
- auditUserId: 审核人ID
- auditTime: 审核时间
- rejectReason: 拒绝原因

### 保修申请 (MaintenanceReport)
- id: 保修ID
- applicant: 申请人
- phone: 联系电话
- description: 上报内容
- locationType: 位置类型（建筑、房间、设施）
- buildingId: 建筑ID
- roomId: 房间ID
- facilityId: 设施ID
- locationDetail: 具体位置描述
- submitTime: 提交时间
- status: 状态（待处理、处理中、已完成）
- handlerId: 处理人ID
- handleTime: 处理时间
- handleResult: 处理结果

## 权限控制

### 学生权限
- 查看可用教室和体育设施
- 创建预约申请
- 查看自己的预约列表
- 取消自己的预约
- 提交保修申请
- 查看保修申请状态

### 管理员权限
- 查看所有预约列表
- 审核预约申请
- 查看所有保修申请
- 处理保修申请
- 管理建筑物和房间信息

## 使用示例

### 1. 学生预约教室
```bash
# 登录获取 token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "student", "password": "123456"}'

# 创建预约
curl -X POST http://localhost:3000/reservations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": 1,
    "resourceType": "room",
    "useDate": "2025-05-26",
    "startPeriod": 1,
    "endPeriod": 2,
    "purpose": "exam",
    "attendeeCount": 30
  }'
```

### 2. 管理员审核预约
```bash
# 审核预约
curl -X PUT http://localhost:3000/reservations/1/audit \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

### 3. 提交保修申请
```bash
# 提交保修申请
curl -X POST http://localhost:3000/maintenance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicant": "张三",
    "phone": "13800138000",
    "description": "教室灯管坏了",
    "locationType": "room",
    "roomId": 1,
    "locationDetail": "教学楼A101教室"
  }'
```

## 注意事项

1. 预约时需要检查时间段冲突
2. 只有管理员可以审核预约和处理保修申请
3. 学生只能查看和操作自己的预约
4. 保修申请需要指定具体的位置信息
5. 所有时间字段都使用 ISO 格式
