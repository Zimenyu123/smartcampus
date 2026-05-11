<template>
  <div class="facility-delivery">
    <el-card shadow="hover" class="card-container">
      <template #header>
        <div class="card-header">
          <el-icon>
            <Box />
          </el-icon>
          <span>快递驿站管理</span>
        </div>
      </template>

      <el-table :data="deliveryData" style="width: 100%">
        <el-table-column prop="id" label="驿站编号" width="100" />
        <el-table-column prop="name" label="驿站名称" width="180" />
        <el-table-column prop="location" label="位置" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="packageCount" label="包裹数量" width="120" />
        <el-table-column prop="operation" label="操作" width="150">
          <template #default>
            <el-button size="small" type="primary">详情</el-button>
            <el-button size="small" type="success">补货</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Box } from '@element-plus/icons-vue'

// 模拟数据
const deliveryData = ref([
  { id: 'KD001', name: '顺丰快递', location: '东校区门口', status: '正常', packageCount: 128 },
  { id: 'KD002', name: '京东物流', location: '西校区菜鸟驿站', status: '正常', packageCount: 95 },
  { id: 'KD003', name: '中通快递', location: '南校区超市旁', status: '维护中', packageCount: 42 },
  { id: 'KD004', name: '圆通快递', location: '北校区体育馆后', status: '正常', packageCount: 76 },
  { id: 'KD005', name: '韵达快递', location: '中心校区图书馆侧', status: '正常', packageCount: 63 }
])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(20)

const handleSizeChange = (size) => {
  pageSize.value = size
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}
</script>

<style scoped>
.facility-delivery {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>