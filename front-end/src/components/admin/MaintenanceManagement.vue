<template>
  <div class="maintenance-management">
    <div v-if="type === 'list'">
      <el-card class="maintenance-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>报修列表</span>
          </div>
        </template>
        <el-table :data="maintenanceList" style="width: 100%">
          <el-table-column prop="id" label="报修ID" width="80" />
          <el-table-column prop="applicant" label="申请人" width="120" />
          <el-table-column prop="phone" label="联系电话" width="150" />
          <el-table-column prop="description" label="问题描述" />
          <el-table-column prop="buildingId" label="建筑物ID" width="100" />
          <el-table-column prop="roomId" label="房间ID" width="100" />
          <el-table-column prop="facilityId" label="设施ID" width="100" />
          <el-table-column prop="locationDetail" label="位置详情" width="150" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="submitTime" label="提交时间" width="180" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button @click="handleView(scope.row)" type="primary" size="small" :disabled="loading">查看</el-button>
              <el-button @click="handleProcess(scope.row)" type="success" size="small" :disabled="loading || scope.row.status !== 'pending'">处理</el-button>
              <el-button @click="handleDelete(scope.row)" type="danger" size="small" :disabled="loading">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination"
        />
      </el-card>
    </div>

    <div v-else-if="type === 'create'">
      <el-card class="maintenance-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>创建报修</span>
          </div>
        </template>
        <el-form
          ref="formRef"
          :model="form"
          label-width="120px"
          class="demo-form"
          status-icon
        >
          <el-form-item label="申请人" prop="applicant">
            <el-input v-model="form.applicant" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入电话" />
          </el-form-item>
          <el-form-item label="问题描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="请描述问题内容"
            />
          </el-form-item>
          <el-form-item label="建筑物ID" prop="buildingId">
            <el-input v-model="form.buildingId" placeholder="请输入建筑物ID" type="number" />
          </el-form-item>
          <el-form-item label="房间ID" prop="roomId">
            <el-input v-model="form.roomId" placeholder="请输入房间ID" type="number" />
          </el-form-item>
          <el-form-item label="设施ID" prop="facilityId">
            <el-input v-model="form.facilityId" placeholder="请输入设施ID" type="number" />
          </el-form-item>
          <el-form-item label="位置详情" prop="locationDetail">
            <el-input v-model="form.locationDetail" placeholder="请输入详细位置" />
          </el-form-item>
          <el-form-item class="button-group">
            <el-button type="primary" @click="handleSubmit" :loading="loading" size="default">提交报修</el-button>
            <el-button @click="handleReset" size="default">重置表单</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'

// 定义props
const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['list', 'create'].includes(value)
  }
})

// 定义emits
const emit = defineEmits(['refreshList'])

const authStore = useAuthStore()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const maintenanceList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表单数据
const form = ref({
  applicant: '',
  phone: '',
  description: '',
  buildingId: '',
  roomId: '',
  facilityId: '',
  locationDetail: ''
})

// 获取报修列表
const fetchMaintenanceList = async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  loading.value = true
  try {
    // 构建查询参数
    const params = new URLSearchParams()
    params.append('page', currentPage.value)
    params.append('pageSize', pageSize.value)

    const response = await fetch(`http://127.0.0.1:7001/api/maintenance?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取报修列表失败')
    }

    const result = await response.json()
    // 格式化数据以匹配前端期望的结构
    const formattedResult = result.data?.items.map(item => ({
      ...item,
      // 格式化日期
      submitTime: new Date(item.submitTime).toLocaleString()
    })) || []

    maintenanceList.value = formattedResult
    total.value = result.data?.total || 0
  } catch (error) {
    console.error('获取报修列表失败:', error)
    ElMessage({ message: `获取报修列表失败: ${error.message}`, type: 'error' })
  } finally {
    loading.value = false
  }
}

// 提交报修
const handleSubmit = async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    // 使用Promise封装validate
    const isValid = await new Promise((resolve) => {
      formRef.value.validate((valid) => resolve(valid))
    })

    if (!isValid) {
      return
    }

    loading.value = true

    const requestBody = {
      applicant: form.value.applicant,
      phone: form.value.phone,
      description: form.value.description,
      buildingId: form.value.buildingId ? parseInt(form.value.buildingId) : null,
      roomId: form.value.roomId ? parseInt(form.value.roomId) : null,
      facilityId: form.value.facilityId ? parseInt(form.value.facilityId) : null,
      locationDetail: form.value.locationDetail
    }

    const response = await fetch('http://127.0.0.1:7001/api/maintenance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error('提交报修失败')
    }

    ElMessage({ message: '报修创建成功', type: 'success' })
    formRef.value.resetFields()
    // 触发父组件刷新列表
    emit('refreshList')
  } catch (error) {
    console.error('提交报修失败:', error)
    ElMessage({ message: `提交报修失败: ${error.message}`, type: 'error' })
  } finally {
    loading.value = false
  }
}

// 处理报修
const handleProcess = async (row) => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    console.log('处理报修请求参数:', row.id);
    console.log('认证Token存在:', !!authStore.token);
    console.log('Token长度:', authStore.token ? authStore.token.length : 0);
    loading.value = true

    const requestBody = {
      status: "processing",
      handleResult: "已修复空调故障"
    }

    const response = await fetch(`http://127.0.0.1:7001/api/maintenance/${row.id}/handle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('处理报修失败响应:', errorText);
      throw new Error(`处理报修失败: ${response.status} ${response.statusText}. 详情: ${errorText}`);
    }

    ElMessage({ message: '报修已处理', type: 'success' })
    // 刷新列表
    fetchMaintenanceList()
  } catch (error) {
    console.error('处理报修失败:', error)
    ElMessage({ message: `处理报修失败: ${error.message}`, type: 'error' })
  } finally {
    loading.value = false
  }
}

// 删除报修
const handleDelete = async (row) => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    // 确认删除
    const confirmation = await ElMessageBox.confirm(
      '确定要删除这条报修记录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (confirmation !== 'confirm') {
      return
    }

    loading.value = true

    const response = await fetch(`http://127.0.0.1:7001/api/maintenance/${row.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error('删除报修失败')
    }

    ElMessage({ message: '报修记录已删除', type: 'success' })
    // 刷新列表
    fetchMaintenanceList()
  } catch (error) {
    console.error('删除报修失败:', error)
    // 如果是用户取消操作，不显示错误信息
    if (error.name !== 'Error' || error.message !== '取消操作') {
      ElMessage({ message: `删除报修失败: ${error.message}`, type: 'error' })
    }
  } finally {
    loading.value = false
  }
}

// 查看报修详情
const handleView = (row) => {
  // 这里可以实现查看详情的逻辑，比如打开弹窗或跳转到详情页
  ElMessage({ message: `查看报修ID: ${row.id} 的详情`, type: 'info' })
}

// 重置表单
const handleReset = () => {
  formRef.value.resetFields()
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchMaintenanceList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchMaintenanceList()
}

// 组件挂载时获取列表
onMounted(() => {
  if (props.type === 'list') {
    fetchMaintenanceList()
  }
})
</script>

<style scoped>
.maintenance-management {
  padding: 10px;
}

.maintenance-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.demo-form {
  padding: 20px;
  text-align: left;
}

.el-table {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  justify-content: flex-start;
}
</style>