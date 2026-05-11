import { defineStore } from 'pinia'

// 创建场地查询条件的store
export const useSearchStore = defineStore('search', {
  state: () => ({
    // 存储查询条件
    searchParams: {
      userId: '', // 用户ID
      buildingNo: 'all',
      roomType: 'all',
      roomName: ''
    },
    // 存储查询结果
    searchResult: [],
    currentPage: 1,
    pageSize: 15,
    total: 0
  }),
  actions: {
    // 更新查询条件
    updateSearchParams(params) {
      this.searchParams = { ...this.searchParams, ...params }
    },
    // 重置查询条件
    resetSearchParams() {
      this.searchParams = {
        userId: '',
        buildingNo: 'all',
        roomType: 'all',
        roomName: ''
      }
    },
    // 更新查询结果
    updateSearchResult(result, total) {
      this.searchResult = result
      this.total = total
    },
    // 更新分页信息
    updatePagination(currentPage, pageSize, total) {
      this.currentPage = currentPage
      this.pageSize = pageSize
      if (total !== undefined) {
        this.total = total
      }
    }
  }
})