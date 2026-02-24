<template>
  <div class="audit-log">
    <el-card class="box-card">
      <!-- 顶部搜索栏 -->
      <div class="toolbar">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="所属应用">
            <el-select 
              v-model="searchForm.app_code" 
              placeholder="请选择应用" 
              style="width: 200px"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="app in appList"
                :key="app.app_code"
                :label="`${app.app_name} (${app.app_code})`"
                :value="app.app_code"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="操作类型">
            <el-select v-model="searchForm.action" placeholder="全部" clearable style="width: 150px">
              <el-option label="创建应用" value="CREATE_APP" />
              <el-option label="更新应用" value="UPDATE_APP" />
              <el-option label="删除应用" value="DELETE_APP" />
              <el-option label="创建角色" value="CREATE_ROLE" />
              <el-option label="更新角色" value="UPDATE_ROLE" />
              <el-option label="删除角色" value="DELETE_ROLE" />
              <el-option label="创建权限" value="CREATE_PERM" />
              <el-option label="更新权限" value="UPDATE_PERM" />
              <el-option label="删除权限" value="DELETE_PERM" />
              <el-option label="分配权限" value="ROLE_ADD_PERM" />
              <el-option label="移除权限" value="ROLE_REMOVE_PERM" />
              <el-option label="授权用户" value="USER_GRANT_ROLE" />
              <el-option label="撤销授权" value="USER_REVOKE_ROLE" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作人ID">
            <el-input v-model="searchForm.operator_id" placeholder="请输入操作人ID" clearable />
          </el-form-item>
          <el-form-item label="目标对象ID">
            <el-input v-model="searchForm.target_id" placeholder="请输入目标对象ID" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon> 搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="created_at" label="操作时间" width="180" />
        <el-table-column prop="app_code" label="应用代号" width="150" />
        <el-table-column label="操作人" width="150">
          <template #default="scope">
            {{ scope.row.operator_name }} ({{ scope.row.operator_id }})
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作类型" width="150">
          <template #default="scope">
            <el-tag :type="getActionTagType(scope.row.action)">
              {{ getActionLabel(scope.row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标对象" min-width="200">
          <template #default="scope">
            <div v-if="scope.row.target_type">
              <el-tag size="small" type="info">{{ scope.row.target_type }}</el-tag>
              <span style="margin-left: 8px">{{ scope.row.target_id }}</span>
              <span v-if="scope.row.target_name" style="color: #909399; margin-left: 8px">({{ scope.row.target_name }})</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="关联对象" min-width="200">
          <template #default="scope">
            <div v-if="scope.row.object_type">
              <el-tag size="small" type="warning">{{ scope.row.object_type }}</el-tag>
              <span style="margin-left: 8px">{{ scope.row.object_id }}</span>
              <span v-if="scope.row.object_name" style="color: #909399; margin-left: 8px">({{ scope.row.object_name }})</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import request from '@/utils/request'

// --- 基础数据 ---
const appList = ref<any[]>([])

// --- 搜索表单 ---
const searchForm = reactive({
  app_code: '',
  action: '',
  operator_id: '',
  target_id: ''
})

// --- 表格数据 ---
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// ==========================================
// 基础方法
// ==========================================

// 获取应用列表 (用于下拉框)
const fetchAppList = async () => {
  try {
    const res: any = await request.post('/AdminService/ListApps', { page: 1, page_size: 1000 })
    appList.value = res.apps || []
  } catch (error) {
    console.error(error)
  }
}

// 获取日志列表
const fetchData = async () => {
  loading.value = true
  try {
    const payload: any = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    
    if (searchForm.app_code) payload.app_code = searchForm.app_code
    if (searchForm.action) payload.action = searchForm.action
    if (searchForm.operator_id) payload.operator_id = searchForm.operator_id
    if (searchForm.target_id) payload.target_id = searchForm.target_id

    const res: any = await request.post('/AdminService/ListAuditLogs', payload)
    tableData.value = res.logs || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const resetSearch = () => {
  searchForm.app_code = ''
  searchForm.action = ''
  searchForm.operator_id = ''
  searchForm.target_id = ''
  handleSearch()
}

const handleSizeChange = (val: number) => { pageSize.value = val; fetchData() }
const handleCurrentChange = (val: number) => { currentPage.value = val; fetchData() }

// ==========================================
// 格式化方法
// ==========================================

const getActionLabel = (action: string) => {
  const map: Record<string, string> = {
    'CREATE_APP': '创建应用',
    'UPDATE_APP': '更新应用',
    'DELETE_APP': '删除应用',
    'CREATE_ROLE': '创建角色',
    'UPDATE_ROLE': '更新角色',
    'DELETE_ROLE': '删除角色',
    'CREATE_PERM': '创建权限',
    'UPDATE_PERM': '更新权限',
    'DELETE_PERM': '删除权限',
    'ASSIGN_PERM': '分配权限',
    'REMOVE_PERM': '移除权限',
    'GRANT_ROLE': '授权用户',
    'REVOKE_ROLE': '撤销授权',
    // 兼容后端实际写入的日志类型
    'ROLE_ADD_PERM': '分配权限',
    'ROLE_REMOVE_PERM': '移除权限',
    'USER_GRANT_ROLE': '授权用户',
    'USER_REVOKE_ROLE': '撤销授权'
  }
  return map[action] || action
}

const getActionTagType = (action: string) => {
  if (action.startsWith('CREATE') || action === 'ASSIGN_PERM' || action === 'GRANT_ROLE' || action === 'ROLE_ADD_PERM' || action === 'USER_GRANT_ROLE') return 'success'
  if (action.startsWith('DELETE') || action === 'REMOVE_PERM' || action === 'REVOKE_ROLE' || action === 'ROLE_REMOVE_PERM' || action === 'USER_REVOKE_ROLE') return 'danger'
  if (action.startsWith('UPDATE')) return 'warning'
  return 'info'
}

onMounted(() => {
  fetchAppList()
  fetchData()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
