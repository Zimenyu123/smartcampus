<template>
  <div class="facility-sports">
    <el-card shadow="hover" class="card-container">
      <template #header>
        <div class="card-header">
          <el-icon><Football /></el-icon>
          <span>体育设施预约管理</span>
        </div>
      </template>

      <div class="filter-container">
        <el-select v-model="sportType" placeholder="请选择体育类型" class="filter-select">
          <el-option label="全部" value="all" />
          <el-option label="球类" value="ball" />
          <el-option label="田径" value="track" />
          <el-option label="健身" value="fitness" />
        </el-select>
        <el-button type="primary" @click="handleFilter">筛选</el-button>
      </div>

      <el-table :data="sportsData" style="width: 100%">
        <el-table-column prop="id" label="设施编号" width="100" />
        <el-table-column prop="name" label="设施名称" width="180" />
        <el-table-column prop="type" label="体育类型" width="120" />
        <el-table-column prop="location" label="位置" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="openTime" label="开放时间" width="180" />
        <el-table-column prop="operation" label="操作" width="150">
          <template #default>
            <el-button size="small" type="primary">详情</el-button>
            <el-button size="small" type="warning">预订</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Football } from '@element-plus/icons-vue'

// 模拟数据
const sportsData = ref([
  { id: 'TY001', name: '足球场', type: '球类', location: '宪梓运动大楼', status: '正常', openTime: '08:00-22:00' },
  { id: 'TY002', name: '篮球场', type: '球类', location: '东区操场', status: '正常', openTime: '08:00-22:00' },
  { id: 'TY003', name: '羽毛球场', type: '球类', location: '田家炳师范大楼', status: '维护中', openTime: '09:00-21:00' },
  { id: 'TY004', name: '跑道', type: '田径', location: '西区操场', status: '正常', openTime: '06:00-22:00' },
  { id: 'TY005', name: '健身房', type: '健身', location: '宪梓运动大楼', status: '正常', openTime: '14:00-22:00' }
])

// 筛选数据
const sportType = ref('all')

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(18)

const handleFilter = () => {
  // 筛选逻辑
  console.log('筛选类型:', sportType.value)
}

const handleSizeChange = (size) => {
  pageSize.value = size
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}
</script>

<style scoped>
.facility-sports {
  padding: 20px;
}

.card-container {
  border-radius: 8px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.card-header .el-icon {
  margin-right: 8px;
}

.filter-container {
  display: flex;
  margin-bottom: 20px;
}

.filter-select {
  width: 200px;
  margin-right: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>