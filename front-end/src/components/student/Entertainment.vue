<template>
  <div class="entertainment-container">
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>运动场地预约</span>
        </div>
      </template>

      <div class="search-form">
        <div class="form-row">
          <!-- 资源ID -->
          <div class="form-item">
            <el-input v-model="formData.resourceId" placeholder="请输入资源ID" type="number" class="w-full"></el-input>
          </div>

          <!-- 资源类型 -->
          <div class="form-item">
            <el-select v-model="formData.resourceType" placeholder="请选择资源类型" class="w-full">
              <el-option label="体育设施" value="sports_facility"></el-option>
            </el-select>
          </div>

          <!-- 使用日期 -->
          <div class="form-item">
            <el-date-picker
              v-model="formData.useDate"
              type="date"
              placeholder="选择使用日期"
              class="w-full"
            ></el-date-picker>
          </div>
        </div>

        <div class="form-row">
          <!-- 开始节次 -->
          <div class="form-item">
            <el-select v-model="formData.startPeriod" placeholder="选择开始节次" class="w-full">
              <el-option v-for="i in 11" :key="i" :label="i + '节'" :value="i"></el-option>
            </el-select>
          </div>

          <!-- 结束节次 -->
          <div class="form-item">
            <el-select v-model="formData.endPeriod" placeholder="选择结束节次" class="w-full">
              <el-option v-for="i in 11" :key="i" :label="i + '节'" :value="i"></el-option>
            </el-select>
          </div>

          <!-- 使用目的 -->
          <div class="form-item">
            <el-select v-model="formData.purpose" placeholder="选择使用目的" class="w-full">
                <el-option label="运动" value="sports"></el-option>
                <el-option label="活动" value="activity"></el-option>
                <el-option label="考试" value="exam"></el-option>
                <el-option label="上课" value="class"></el-option>
              </el-select>
          </div>
        </div>

        <div class="form-row">
          <!-- 参与人数 -->
          <div class="form-item">
            <el-input v-model="formData.attendeeCount" placeholder="请输入参与人数" type="number" class="w-full"></el-input>
          </div>
        </div>

        <div class="button-group">
          <el-button type="primary" @click="submitReservation">提交预约</el-button>
          <el-button @click="resetForm">重置</el-button>
        </div>
      </div>
    </el-card>
    <!-- 预约成功信息 -->
    <el-card class="result-card" v-if="reservationSuccess">
      <template #header>
        <div class="card-header">
          <span>预约申请成功</span>
          <el-button type="primary" size="small" @click="resetReservationSuccess">关闭</el-button>
        </div>
      </template>

      <div class="success-info">
        <p>预约ID: {{ reservationResult.id }}</p>
        <p>资源ID: {{ reservationResult.resourceId }}</p>
        <p>资源类型: {{ reservationResult.resourceType === 'room' ? '教室' : '体育设施' }}</p>
        <p>使用日期: {{ reservationResult.useDate }}</p>
        <p>使用时段: {{ reservationResult.startPeriod }}-{{ reservationResult.endPeriod }}节</p>
        <p>使用用途: {{ formatPurpose(reservationResult.purpose) }}</p>
        <p>参与人数: {{ reservationResult.attendeeCount }}</p>
        <p>状态: {{ formatStatus(reservationResult.status) }}</p>
        <p>提交时间: {{ formatDateTime(reservationResult.createdAt) }}</p>
      </div>
    </el-card>

    <!-- 我的预约记录卡片 -->
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>我的预约记录</span>
          <el-button type="primary" size="small" @click="fetchReservations">刷新列表</el-button>
        </div>
      </template>

      <div class="reservation-list">
        <el-table v-loading="loadingList" :data="reservationsData.items" style="width: 100%">
          <el-table-column prop="id" label="预约ID" width="80"></el-table-column>
          <el-table-column prop="resourceId" label="资源ID" width="80"></el-table-column>
          <el-table-column prop="resourceType" label="资源类型" width="100">
            <template #default="scope">
              {{ scope.row.resourceType === 'room' ? '教室' : '体育设施' }}
            </template>
          </el-table-column>
          <el-table-column prop="userId" label="用户ID" width="80"></el-table-column>
          <el-table-column prop="userName" label="用户名" width="120"></el-table-column>
          <el-table-column prop="userType" label="用户类型" width="100"></el-table-column>
          <el-table-column prop="useDate" label="使用日期" width="120"></el-table-column>
          <el-table-column prop="startPeriod" label="开始节次" width="80"></el-table-column>
          <el-table-column prop="endPeriod" label="结束节次" width="80"></el-table-column>
          <el-table-column prop="purpose" label="使用用途" width="100">
            <template #default="scope">
              {{ formatPurpose(scope.row.purpose) }}
            </template>
          </el-table-column>
          <el-table-column prop="attendeeCount" label="参与人数" width="80"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              {{ formatStatus(scope.row.status) }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="提交时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination" v-if="reservationsData.total > 0">
          <el-pagination
            v-model:current-page="reservationsData.page"
            v-model:page-size="reservationsData.limit"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="reservationsData.total"
            @size-change="handleSizeChangeRes"
            @current-change="handleCurrentChangeRes"
          ></el-pagination>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth';
// 预约成功标志
const reservationSuccess = ref(false);
// 预约结果
const reservationResult = ref({});
// 加载状态
const loading = ref(false);
// 加载状态
const loadingList = ref(false);
// 预约列表数据
const reservationsData = ref({
  total: 0,
  page: 1,
  limit: 10,
  items: []
});

// 表单数据
const formData = ref({
  resourceId: '',
  resourceType: 'sports_facility',
  useDate: '',
  startPeriod: 1,
  endPeriod: 2,
  purpose: 'sports',
  attendeeCount: ''
});

// 获取预约列表
const fetchReservations = async () => {
  loadingList.value = true;

  try {
    // 调用API获取预约列表
    const response = await fetch(`${API_BASE}/reservations`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });

    if (!response.ok) {
      throw new Error('获取预约列表失败');
    }

    const result = await response.json();
    if (result.code === 200 && result.data) {
      // 筛选只保留资源类型为体育设施的记录
      const filteredItems = result.data.items.filter(item => item.resourceType === 'sports_facility');
      reservationsData.value = {
        ...result.data,
        items: filteredItems,
        total: filteredItems.length
      };
    } else {
      ElMessage({ message: '获取预约列表失败', type: 'error' });
    }
  } catch (error) {
    console.error('获取预约列表错误:', error);
    ElMessage({ message: `获取错误: ${error.message || '未知错误'}` });
  } finally {
    loadingList.value = false;
  }
};

// 处理分页大小变化
const handleSizeChangeRes = (size) => {
  reservationsData.value.limit = size;
  fetchReservations();
};

// 处理当前页变化
const handleCurrentChangeRes = (current) => {
  reservationsData.value.page = current;
  fetchReservations();
};

// 格式化状态显示
const formatStatus = computed(() => (status) => {
  const statusMap = {
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已拒绝',
    'cancelled': '已取消',
    'completed': '已完成'
  };
  return statusMap[status] || status;
});

// 格式化用途显示
const formatPurpose = computed(() => (purpose) => {
  const purposeMap = {
    'activity': '活动',
    'class': '上课',
    'exam': '考试',
    'sports': '运动',
    'competition': '比赛',
    'other': '其他'
  };
  return purposeMap[purpose] || purpose;
});

// 格式化日期时间
const formatDateTime = computed(() => (datetime) => {
  if (!datetime) return '';
  const date = new Date(datetime);
  return date.toLocaleString();
});

// 组件挂载时获取预约列表
onMounted(() => {
  fetchReservations();
});

// API基础URL
const API_BASE = 'http://localhost:7001/api';

// 使用Pinia store
const authStore = useAuthStore();

// 提交预约
const submitReservation = async () => {
  // 验证表单
  if (!formData.value.resourceId || !formData.value.useDate || !formData.value.attendeeCount) {
    ElMessage({ message: '请填写必填字段', type: 'warning' });
    return;
  }

  if (formData.value.startPeriod > formData.value.endPeriod) {
    ElMessage({ message: '开始节次不能大于结束节次', type: 'warning' });
    return;
  }

  loading.value = true;

  try {
    // 调用API提交预约
    const response = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(formData.value)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '预约提交失败');
    }

    const data = await response.json();
    reservationResult.value = data.data;
    reservationSuccess.value = true;
    ElMessage({ message: '预约申请已提交，等待审核', type: 'success' });
    fetchReservations(); // 刷新预约列表
  } catch (error) {
    console.error('预约失败:', error);
    ElMessage({ message: `预约失败: ${error.message}`, type: 'error' });
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  formData.value = {
    resourceId: '',
    resourceType: 'sports_facility',
    useDate: '',
    startPeriod: 1,
    endPeriod: 2,
    purpose: 'sports',
    attendeeCount: ''
  };
};

// 重置预约成功状态
const resetReservationSuccess = () => {
  reservationSuccess.value = false;
  reservationResult.value = {};
};
</script>

<style scoped>
.entertainment-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  padding: 10px 0;
}

.form-row {
  display: flex;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.form-item {
  margin-right: 20px;
  margin-bottom: 10px;
  min-width: 200px;
}

.form-item.full-width {
  width: 100%;
  margin-right: 0;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.result-card {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.no-result {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.booking-form {
  padding: 10px 0;
}

.booking-form h4 {
  margin-bottom: 15px;
  color: #303133;
}

.booking-form p {
  margin-bottom: 10px;
  color: #606266;
}

.success-info {
  padding: 20px;
  line-height: 1.6;
}

.success-info p {
  margin-bottom: 10px;
}

.success-info p:last-child {
  margin-bottom: 0;
}

.list-card {
  margin-top: 20px;
}

.reservation-list {
  padding: 10px 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>