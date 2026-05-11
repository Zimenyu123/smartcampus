import { defineStore } from 'pinia';

export const useReportStore = defineStore('report', {
  state: () => ({
    // 上报表单参数
    reportParams: {
      applicant: '',
      phone: '',
      description: '',
      locationType: '', // 'dormitory' 或 'building'
      locationDetail: '' // 具体位置
    },
    // 上报结果
    reportResult: [
      {
        id: '10001',
        applicant: '张三',
        phone: '13800138000',
        description: '东17栋226宿舍卫生间漏水',
        locationType: 'dormitory',
        locationDetail: 'east17',
        submitTime: '2023-11-10 14:30:00',
        status: '处理中'
      },
      {
        id: '10002',
        applicant: '李四',
        phone: '13900139000',
        description: '田家炳师范大楼5楼走廊灯不亮',
        locationType: 'building',
        locationDetail: 'tianti',
        submitTime: '2023-11-09 09:15:00',
        status: '已解决'
      },
      {
        id: '10003',
        applicant: '王五',
        phone: '13700137000',
        description: '南5栋楼下垃圾桶未及时清理',
        locationType: 'dormitory',
        locationDetail: 'south5',
        submitTime: '2023-11-08 16:45:00',
        status: '待处理'
      }
    ],
    // 分页信息
    currentPage: 1,
    pageSize: 10,
    total: 3
  }),
  actions: {
    // 更新上报参数
    updateReportParams(params) {
      this.reportParams = { ...this.reportParams, ...params };
    },
    // 重置上报参数
    resetReportParams() {
      this.reportParams = {
        applicant: '',
        phone: '',
        description: '',
        locationType: '',
        locationDetail: ''
      };
    },
    // 更新上报结果
    updateReportResult(data, total) {
      this.reportResult = data;
      this.total = total;
    },
    // 更新分页信息
    updatePagination(currentPage, pageSize) {
      this.currentPage = currentPage;
      this.pageSize = pageSize;
    },
    // 提交上报
    submitReport(reportData) {
      // 模拟提交上报，添加到结果列表
      const newReport = {
        id: Date.now().toString(),
        ...reportData,
        submitTime: new Date().toLocaleString(),
        status: '待处理'
      };
      this.reportResult.unshift(newReport);
      this.total = this.reportResult.length;
      // 重置表单
      this.resetReportParams();
    }
  }
});