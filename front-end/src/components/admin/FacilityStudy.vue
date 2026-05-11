<template>
  <div class="facility-study">
    <el-card shadow="hover" class="card-container">
      <template #header>
        <div class="card-header">
          <el-icon><Check /></el-icon>
          <span>学习设施预约管理</span>
          <div class="header-buttons">
            <el-button type="primary" icon="Refresh" @click="fetchReservations">刷新</el-button>
          </div>
        </div>
      </template>

      
      <el-table :data="studyData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="预约ID" width="80" />
        <el-table-column prop="resourceId" label="资源ID" width="80" />
        <el-table-column prop="resourceType" label="资源类型" width="100" />
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column prop="userName" label="用户名" width="120" />
        <el-table-column prop="userType" label="用户类型" width="100" />
        <el-table-column prop="useDate" label="使用日期" width="120" />
        <el-table-column prop="startPeriod" label="开始时段" width="100" />
        <el-table-column prop="endPeriod" label="结束时段" width="100" />
        <el-table-column prop="purpose" label="使用目的" width="120" />
        <el-table-column prop="attendeeCount" label="参与人数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'pending' ? 'warning' : scope.row.status === 'approved' ? 'success' : 'danger'">{{ scope.row.status === 'pending' ? '待审核' : scope.row.status === 'approved' ? '已通过' : '已拒绝' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operation" label="操作" width="200">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleAudit(scope.row.id, 'approved')" :disabled="scope.row.status !== 'pending'">通过</el-button>
            <el-button size="small" type="warning" @click="handleAudit(scope.row.id, 'rejected')" :disabled="scope.row.status !== 'pending'">拒绝</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
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
import { ref, onMounted } from 'vue'
import { Check, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

// 预约数据
const studyData = ref([])
const loading = ref(false)


// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取预约列表
const fetchReservations = async () => {
  try {
    loading.value = true
    // 构建请求URL，包含分页参数
    const url = `http://127.0.0.1:7001/api/reservations?page=${currentPage.value}&limit=${pageSize.value}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取预约列表失败')
    }

    const result = await response.json()
    studyData.value = result.data.items
    total.value = result.data.total
  } catch (error) {
    console.error('获取预约列表失败:', error)
    ElMessage({ message: `获取预约列表失败: ${error.message}`, type: 'error' })
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchReservations()
})


const handleSizeChange = (size) => {
  pageSize.value = size
  fetchReservations() // 分页大小变化时重新获取数据
}

const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchReservations() // 页码变化时重新获取数据
}

// 审核预约
const handleAudit = async (id, status) => {
  try {
    let rejectReason = ''
    if (status === 'rejected') {
      const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝预约', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValidator: (value) => {
          if (!value) {
            return '请输入拒绝原因'
          }
          return true
        }
      })
      rejectReason = value
    }

    loading.value = true
    const response = await fetch(`http://127.0.0.1:7001/api/reservations/${id}/audit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        status,
        rejectReason
      })
    })

    if (!response.ok) {
      throw new Error('审核预约失败')
    }

    ElMessage({ message: `预约已${status === 'approved' ? '通过' : '拒绝'}`, type: 'success' })
    // 重新获取列表
    fetchReservations()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核预约失败:', error)
      ElMessage({ message: `审核预约失败: ${error.message}`, type: 'error' })
    }
  } finally {
    loading.value = false
  }
}

// 删除预约
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条预约记录吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    loading.value = true
    const response = await fetch(`http://127.0.0.1:7001/api/reservations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error('删除预约失败')
    }

    ElMessage({ message: '预约已删除', type: 'success' })
    // 重新获取列表
    fetchReservations()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除预约失败:', error)
      ElMessage({ message: `删除预约失败: ${error.message}`, type: 'error' })
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.facility-study {
  padding: 20px;
}

.card-container {
  border-radius: 8px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: bold;
}

.header-buttons {
  display: flex;
  gap: 10px;
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