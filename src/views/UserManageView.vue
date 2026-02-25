<template>
  <div class="user-manage">
    <el-card class="box-card">
      <!-- 顶部操作栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="label">所属应用：</span>
          <el-select 
            v-model="currentAppCode" 
            placeholder="请选择应用" 
            style="width: 240px"
            @change="handleAppChange"
          >
            <el-option
              v-for="app in appList"
              :key="app.app_code"
              :label="`${app.app_name} (${app.app_code})`"
              :value="app.app_code"
            />
          </el-select>
          
          <el-input
            v-model="searchUserId"
            placeholder="搜索用户ID"
            style="width: 200px; margin-left: 15px"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
        <div class="toolbar-right">
          <el-button @click="fetchData" :disabled="!currentAppCode">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border style="width: 100%; margin-top: 20px">
        <el-table-column prop="user_id" label="用户ID" width="200" />
        <el-table-column label="拥有的角色">
          <template #default="scope">
            <div v-if="scope.row.role_keys && scope.row.role_keys.length > 0" class="role-tags">
              <el-tag 
                v-for="roleKey in scope.row.role_keys" 
                :key="roleKey"
                size="small"
                class="role-tag"
              >
                {{ getRoleName(roleKey) }} ({{ roleKey }})
              </el-tag>
            </div>
            <span v-else style="color: #909399; font-size: 13px;">暂无角色</span>
          </template>
        </el-table-column>
        <el-table-column label="拥有的权限">
          <template #default="scope">
            <div v-if="scope.row.perm_keys && scope.row.perm_keys.length > 0" class="role-tags">
              <el-tag 
                v-for="permKey in scope.row.perm_keys" 
                :key="permKey"
                size="small"
                type="success"
                class="role-tag"
              >
                {{ getPermName(permKey) }} ({{ permKey }})
              </el-tag>
            </div>
            <span v-else style="color: #909399; font-size: 13px;">暂无权限</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" plain @click="handleEditRoles(scope.row)">编辑角色</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :disabled="!currentAppCode"
        />
      </div>
    </el-card>

    <!-- 编辑角色抽屉 -->
    <el-drawer
      v-model="roleDrawerVisible"
      :title="`编辑用户角色 - ${currentUser?.user_id}`"
      size="800px"
    >
      <div v-loading="roleLoading" class="role-drawer-content">
        <el-transfer
          v-model="selectedRoles"
          :data="allRoles"
          :titles="['未分配角色', '已分配角色']"
          :props="{ key: 'role_key', label: 'role_name' }"
          filterable
          filter-placeholder="搜索角色"
          @change="handleRoleChange"
        >
          <template #default="{ option }">
            <span>{{ option.role_name }} ({{ option.role_key }})</span>
          </template>
        </el-transfer>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

// --- 基础数据 ---
const appList = ref<any[]>([])
const currentAppCode = ref('')
const searchUserId = ref('')

// --- 表格数据 ---
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// --- 编辑角色数据 ---
const roleDrawerVisible = ref(false)
const roleLoading = ref(false)
const currentUser = ref<any>(null)
const allRoles = ref<any[]>([]) // 当前应用下的所有角色
const allPerms = ref<any[]>([]) // 当前应用下的所有权限
const selectedRoles = ref<string[]>([]) // 穿梭框右侧已选数据 (role_key 数组)

// ==========================================
// 基础方法
// ==========================================

// 获取应用列表
const fetchAppList = async () => {
  try {
    const res: any = await request.post('/AdminService/ListApps', { page: 1, page_size: 1000 })
    appList.value = res.apps || []
    
    const savedAppCode = localStorage.getItem('userManageAppCode')
    if (savedAppCode && appList.value.some(app => app.app_code === savedAppCode)) {
      currentAppCode.value = savedAppCode
      await fetchAllRoles()
      await fetchAllPerms()
      fetchData()
    } else if (appList.value.length > 0) {
      currentAppCode.value = appList.value[0].app_code
      await fetchAllRoles()
      await fetchAllPerms()
      fetchData()
    }
  } catch (error) {
    console.error(error)
  }
}

const handleAppChange = async () => {
  localStorage.setItem('userManageAppCode', currentAppCode.value)
  currentPage.value = 1
  searchUserId.value = ''
  await fetchAllRoles()
  await fetchAllPerms()
  fetchData()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

// 获取当前应用的所有角色，用于映射角色名称
const fetchAllRoles = async () => {
  if (!currentAppCode.value) return
  try {
    const res: any = await request.post('/AdminService/ListRoles', {
      app_code: currentAppCode.value, page: 1, page_size: 1000
    })
    allRoles.value = res.roles || []
  } catch (error) {
    console.error(error)
  }
}

const getRoleName = (roleKey: string) => {
  const role = allRoles.value.find(r => r.role_key === roleKey)
  return role ? role.role_name : '未知角色'
}

// 获取当前应用的所有权限，用于映射权限名称
const fetchAllPerms = async () => {
  if (!currentAppCode.value) return
  try {
    const res: any = await request.post('/AdminService/ListPermissions', {
      app_code: currentAppCode.value, page: 1, page_size: 1000
    })
    allPerms.value = res.permissions || []
  } catch (error) {
    console.error(error)
  }
}

const getPermName = (permKey: string) => {
  const perm = allPerms.value.find(p => p.perm_key === permKey)
  return perm ? perm.perm_name : '未知权限'
}

// 获取用户角色列表
const fetchData = async () => {
  if (!currentAppCode.value) return
  loading.value = true
  try {
    const payload: any = {
      app_code: currentAppCode.value,
      page: currentPage.value,
      page_size: pageSize.value
    }
    if (searchUserId.value) {
      payload.user_id = searchUserId.value
    }
    
    const res: any = await request.post('/AdminService/ListUserRoles', payload)
    tableData.value = res.users || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val: number) => { pageSize.value = val; fetchData() }
const handleCurrentChange = (val: number) => { currentPage.value = val; fetchData() }

// ==========================================
// 编辑角色 (穿梭框逻辑)
// ==========================================

const handleEditRoles = async (row: any) => {
  currentUser.value = row
  roleDrawerVisible.value = true
  roleLoading.value = true
  
  try {
    // 1. 确保已获取该应用下的所有角色 (作为穿梭框左侧数据源)
    if (allRoles.value.length === 0) {
      await fetchAllRoles()
    }

    // 2. 设置该用户已有的角色 (作为穿梭框右侧选中项)
    selectedRoles.value = row.role_keys ? [...row.role_keys] : []
  } catch (error) {
    console.error(error)
  } finally {
    roleLoading.value = false
  }
}

// 穿梭框数据变化时触发 (添加或移除角色)
const handleRoleChange = async (
  value: string[], 
  direction: 'left' | 'right', 
  movedKeys: string[]
) => {
  roleLoading.value = true
  try {
    const isAdd = direction === 'right'
    const url = isAdd ? '/AdminService/GrantRoleToUser' : '/AdminService/RevokeRoleFromUser'
    
    // 遍历移动的 key，逐个调用接口
    for (const roleKey of movedKeys) {
      await request.post(url, {
        app_code: currentAppCode.value,
        user_id: currentUser.value.user_id,
        role_key: roleKey
      })
    }
    ElMessage.success(isAdd ? '授权成功' : '撤销成功')
    
    // 刷新外层表格数据以更新显示的标签
    fetchData()
  } catch (error) {
    console.error(error)
    // 如果失败，重新拉取数据恢复穿梭框状态
    handleEditRoles(currentUser.value)
  } finally {
    roleLoading.value = false
  }
}

onMounted(() => {
  fetchAppList()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-left .label {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-drawer-content {
  display: flex;
  justify-content: center;
  padding: 20px;
}

/* 修复穿梭框上下排列的问题 */
:deep(.el-transfer) {
  display: flex;
  align-items: center;
}

/* 调整穿梭框高度 */
:deep(.el-transfer-panel) {
  height: 500px;
  width: 250px;
}
:deep(.el-transfer-panel__list.is-filterable) {
  height: 400px;
}
</style>
