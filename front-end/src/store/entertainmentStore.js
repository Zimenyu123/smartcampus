import { defineStore } from 'pinia';

// 创建运动场地查询的store
export const useEntertainmentStore = defineStore('entertainment', {
  state: () => ({
    searchParams: {
      sportType: 'all', // 运动类型
      venue: 'all',     // 运动场地
      date: ''          // 日期
    },
    searchResult: [],  // 搜索结果
    currentPage: 1,    // 当前页码
    pageSize: 15,      // 每页条数
    total: 0           // 总条数
  }),
  actions: {
    // 更新搜索参数
    updateSearchParams(params) {
      this.searchParams = { ...this.searchParams, ...params };
    },
    // 重置搜索参数
    resetSearchParams() {
      this.searchParams = {
        sportType: 'all',
        venue: 'all',
        date: ''
      };
      this.currentPage = 1;
      this.pageSize = 15;
    },
    // 更新搜索结果
    updateSearchResult(result, total) {
      this.searchResult = result;
      this.total = total;
    },
    // 更新分页信息
    updatePagination(currentPage, pageSize) {
      this.currentPage = currentPage;
      this.pageSize = pageSize;
    }
  }
});