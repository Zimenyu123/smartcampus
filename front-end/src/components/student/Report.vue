<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useReportStore } from '@/store/reportStore'
import { useAuthStore } from '@/store/auth'

// API基础URL
const API_BASE = 'http://127.0.0.1:7001/api/maintenance'

const reportStore = useReportStore()
const authStore = useAuthStore()
const formRef = ref(null)
const form = ref({
  applicant: '',
  phone: '',
  description: '',
  locationType: 'building',
  buildingId: '',
  roomId: '',
  facilityId: '',
  locationDetail: ''
  })

// 状态映射
const statusMap = {
  'pending': '待处理',
  'processing': '处理中',
  'completed': '已完成'
}

const handleSubmit = async () => {
  try {
    // 使用Promise封装validate
    const isValid = await new Promise((resolve) => {
      formRef.value.validate((valid) => resolve(valid));
    });

    if (!isValid) {
      return;
    }

    if (!authStore.isLoggedIn) {
      ElMessage({ message: '请先登录', type: 'warning' });
      return;
    }

    const requestBody = {
      applicant: form.value.applicant,
      phone: form.value.phone,
      description: form.value.description,
      locationType: form.value.locationType,
      buildingId: form.value.buildingId ? parseInt(form.value.buildingId) : null,
      roomId: form.value.roomId ? parseInt(form.value.roomId) : null,
      facilityId: form.value.facilityId ? parseInt(form.value.facilityId) : null,
      locationDetail: form.value.locationDetail
    };

    console.log('Submitting report with token:', authStore.token);
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(requestBody)
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      throw new Error('响应格式错误');
    }

    if (!response.ok) {
      throw new Error(responseData.message || '报修提交失败');
    }

    ElMessage({ message: '报修申请已提交', type: 'success' });
    formRef.value.resetFields();
    // 提交成功后刷新列表
    fetchReportList();
  } catch (error) {
    console.error('报修失败:', error);
    ElMessage({ message: `报修失败: ${error.message}`, type: 'error' });
  }
}

const handleReset = () => {
  formRef.value.resetFields()
  reportStore.resetReportParams()
}

// 获取报修列表
const fetchReportList = async () => {
  if (!authStore.isLoggedIn) {
    return;
  }

  try {
    // 构建查询参数
    const params = new URLSearchParams();
    params.append('page', reportStore.currentPage);
    params.append('pageSize', reportStore.pageSize);

    const response = await fetch(`${API_BASE}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });

    if (!response.ok) {
      throw new Error('获取报修列表失败');
    }

    const result = await response.json();
    // 格式化数据以匹配前端期望的结构
    const formattedResult = result.data?.items.map(item => ({
      ...item,
      // 转换状态显示
      status: statusMap[item.status] || item.status,
      // 格式化日期
      submitTime: new Date(item.submitTime).toLocaleString(),
      createdAt: new Date(item.createdAt).toLocaleString(),
      updatedAt: new Date(item.updatedAt).toLocaleString()
    })) || [];

    reportStore.reportResult = formattedResult;
    reportStore.total = result.data?.total || 0;
  } catch (error) {
    console.error('获取报修列表失败:', error);
    ElMessage({ message: `获取报修列表失败: ${error.message}`, type: 'error' });
  }
}

// 分页处理
const handleSizeChange = (val) => {
  reportStore.pageSize = val;
  fetchReportList();
}

const handleCurrentChange = (val) => {
  reportStore.currentPage = val;
  fetchReportList();
}

// 初始化时获取报修列表
onMounted(() => {
  fetchReportList();
})
</script>

<template>
  <div class="report-container">
    <el-card class="form-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>问题上报</span>
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
        <el-form-item label="上报内容" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请描述问题内容"
          />
        </el-form-item>
        <el-form-item label="位置类型" prop="locationType" style="display: none;">
          <el-input v-model="form.locationType" readonly></el-input>
        </el-form-item>
        <el-form-item label="建筑物ID" prop="buildingId">
          <el-input v-model="form.buildingId" placeholder="请输入建筑物ID" type="number"></el-input>
        </el-form-item>
        <el-form-item label="房间ID" prop="roomId">
          <el-input v-model="form.roomId" placeholder="请输入房间ID" type="number"></el-input>
        </el-form-item>
        <el-form-item label="设施ID" prop="facilityId">
          <el-input v-model="form.facilityId" placeholder="请输入设施ID" type="number"></el-input>
        </el-form-item>
        <el-form-item label="位置详情" prop="locationDetail">
          <el-input v-model="form.locationDetail" placeholder="请输入详细位置"></el-input>
        </el-form-item>
        <el-form-item class="button-group">
          <el-button type="primary" @click="handleSubmit" size="default" style="padding: 10px 20px; height: 40px; font-size: 14px;">提交上报</el-button>
          <br/>
          <el-button @click="handleReset" size="default" style="padding: 10px 20px; height: 40px; font-size: 14px;">重置表单</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="result-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>上报记录</span>
        </div>
      </template>
      <el-table :data="reportStore.reportResult" style="width: 100%">
        <el-table-column prop="applicant" label="申请人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="description" label="上报内容" />
        <el-table-column prop="buildingId" label="建筑物ID" width="100" />
        <el-table-column prop="roomId" label="房间ID" width="100" />
        <el-table-column prop="facilityId" label="设施ID" width="100" />
        <el-table-column prop="locationDetail" label="位置详情" width="150" />
        <el-table-column prop="submitTime" label="提交时间" width="180" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
      </el-table>
      <el-pagination
        v-model:current-page="reportStore.currentPage"
        v-model:page-size="reportStore.pageSize"
        :total="reportStore.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<style scoped>
.report-container {
  padding: 0;
  max-width: 1200px;
  margin: 0;
}

.form-card, .result-card {
  margin: 0 0 20px 0;
  border-radius: 8px;
  padding-left: 0;
  border-left: none;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  padding-left: 0;
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
  margin: 10px 0 0 0;
  padding-left: 0;
  justify-content: flex-start;
}
</style>