<template>
  <div class="role-manage">
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
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="handleAdd" :disabled="!currentAppCode">
            <el-icon><Plus /></el-icon> 新增角色
          </el-button>
          <el-button @click="fetchData" :disabled="!currentAppCode">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="role_name" label="角色名称" width="180" />
        <el-table-column prop="role_key" label="角色标识" width="180">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.role_key }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="is_default" label="默认角色" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.is_default ? 'success' : 'info'">
              {{ scope.row.is_default ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" plain @click="handleAssignPerms(scope.row)">分配权限</el-button>
            <el-button size="small" type="success" plain @click="handleGrantUser(scope.row)">授权用户</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="角色名称" prop="role_name">
          <el-input v-model="form.role_name" placeholder="例如：管理员" />
        </el-form-item>
        <el-form-item label="角色标识" prop="role_key">
          <el-input v-model="form.role_key" placeholder="例如：admin" :disabled="isEdit" />
          <div class="form-tip" v-if="!isEdit">标识创建后不可修改，只能包含字母、数字和下划线</div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="默认角色" prop="is_default">
          <el-switch v-model="form.is_default" />
          <div class="form-tip" style="margin-left: 10px;">新用户注册时是否自动赋予该角色</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分配权限抽屉 -->
    <el-drawer
      v-model="permDrawerVisible"
      :title="`分配权限 - ${currentRole?.role_name}`"
      size="800px"
    >
      <div v-loading="permLoading" class="perm-drawer-content">
        <el-transfer
          v-model="selectedPerms"
          :data="allPerms"
          :titles="['未分配权限', '已分配权限']"
          :props="{ key: 'perm_key', label: 'perm_name' }"
          filterable
          filter-placeholder="搜索权限"
          @change="handlePermChange"
        >
          <template #default="{ option }">
            <span>{{ option.perm_name }} ({{ option.perm_key }})</span>
          </template>
        </el-transfer>
      </div>
    </el-drawer>

    <!-- 授权用户弹窗 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="`授权用户 - ${currentRole?.role_name}`"
      width="800px"
    >
      <div class="user-grant-container">
        <div class="grant-action">
          <el-input 
            v-model="newUserId" 
            placeholder="请输入业务系统用户ID (如QQ号)" 
            style="width: 300px; margin-right: 10px;"
          />
          <el-button type="primary" @click="grantUser" :loading="grantLoading">添加授权</el-button>
        </div>
        
        <el-divider content-position="left">已授权用户列表</el-divider>
        
        <el-table :data="roleUsers" v-loading="usersLoading" border height="300">
          <el-table-column prop="user_id" label="用户ID" />
          <el-table-column prop="created_at" label="授权时间" width="180" />
          <el-table-column label="操作" width="100" align="center">
            <template #default="scope">
              <el-button size="small" type="danger" link @click="revokeUser(scope.row.user_id)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container" style="margin-top: 10px;">
          <el-pagination
            v-model:current-page="userPage"
            v-model:page-size="userPageSize"
            layout="total, prev, pager, next"
            :total="userTotal"
            @current-change="fetchRoleUsers"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'

// --- 基础数据 ---
const appList = ref<any[]>([])
const currentAppCode = ref('')

// --- 角色列表数据 ---
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// --- 角色表单数据 ---
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  role_name: '',
  role_key: '',
  description: '',
  is_default: false
})

const rules = reactive<FormRules>({
  role_name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  role_key: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '标识只能包含字母、数字和下划线', trigger: 'blur' }
  ]
})

// --- 分配权限数据 ---
const permDrawerVisible = ref(false)
const permLoading = ref(false)
const currentRole = ref<any>(null)
const allPerms = ref<any[]>([]) // 穿梭框左侧数据源
const selectedPerms = ref<string[]>([]) // 穿梭框右侧已选数据 (perm_key 数组)

// --- 授权用户数据 ---
const userDialogVisible = ref(false)
const usersLoading = ref(false)
const grantLoading = ref(false)
const newUserId = ref('')
const roleUsers = ref<any[]>([])
const userPage = ref(1)
const userPageSize = ref(10)
const userTotal = ref(0)

// ==========================================
// 基础方法
// ==========================================

// 获取应用列表
const fetchAppList = async () => {
  try {
    const res: any = await request.post('/AdminService/ListApps', { page: 1, page_size: 1000 })
    appList.value = res.apps || []
    if (appList.value.length > 0) {
      currentAppCode.value = appList.value[0].app_code
      fetchData()
    }
  } catch (error) {
    console.error(error)
  }
}

const handleAppChange = () => {
  currentPage.value = 1
  fetchData()
}

// 获取角色列表
const fetchData = async () => {
  if (!currentAppCode.value) return
  loading.value = true
  try {
    const res: any = await request.post('/AdminService/ListRoles', {
      app_code: currentAppCode.value,
      page: currentPage.value,
      page_size: pageSize.value
    })
    tableData.value = res.roles || []
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
// 角色 CRUD
// ==========================================

const handleAdd = () => {
  isEdit.value = false
  form.role_name = ''
  form.role_key = ''
  form.description = ''
  form.is_default = false
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 0)
}

const handleEdit = (row: any) => {
  isEdit.value = true
  form.role_name = row.role_name
  form.role_key = row.role_key
  form.description = row.description
  form.is_default = row.is_default
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const url = isEdit.value ? '/AdminService/UpdateRole' : '/AdminService/CreateRole'
        const payload = { app_code: currentAppCode.value, ...form }
        const res: any = await request.post(url, payload)
        if (res.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
          dialogVisible.value = false
          fetchData()
        }
      } catch (error) {
        console.error(error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色 [${row.role_name}] 吗？此操作不可恢复！`, '危险操作', {
      confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'error',
    })
    const res: any = await request.post('/AdminService/DeleteRole', {
      app_code: currentAppCode.value, role_key: row.role_key
    })
    if (res.success) {
      ElMessage.success('删除成功')
      if (tableData.value.length === 1 && currentPage.value > 1) currentPage.value--
      fetchData()
    }
  } catch (error) {}
}

// ==========================================
// 分配权限 (穿梭框逻辑)
// ==========================================

const handleAssignPerms = async (row: any) => {
  currentRole.value = row
  permDrawerVisible.value = true
  permLoading.value = true
  
  try {
    // 1. 获取该应用下的所有权限 (作为穿梭框左侧数据源)
    const allRes: any = await request.post('/AdminService/ListPermissions', {
      app_code: currentAppCode.value, page: 1, page_size: 1000
    })
    allPerms.value = allRes.permissions || []

    // 2. 获取该角色已有的权限 (作为穿梭框右侧选中项)
    const roleRes: any = await request.post('/AdminService/GetRolePermissions', {
      app_code: currentAppCode.value, role_key: row.role_key
    })
    selectedPerms.value = roleRes.perm_keys || []
  } catch (error) {
    console.error(error)
  } finally {
    permLoading.value = false
  }
}

// 穿梭框数据变化时触发 (添加或移除权限)
const handlePermChange = async (
  value: string[], 
  direction: 'left' | 'right', 
  movedKeys: string[]
) => {
  permLoading.value = true
  try {
    const isAdd = direction === 'right'
    const url = isAdd ? '/AdminService/AddPermissionToRole' : '/AdminService/RemovePermissionFromRole'
    
    // 遍历移动的 key，逐个调用接口 (因为后端接口一次只能操作一个)
    for (const permKey of movedKeys) {
      await request.post(url, {
        app_code: currentAppCode.value,
        role_key: currentRole.value.role_key,
        perm_key: permKey
      })
    }
    ElMessage.success(isAdd ? '添加权限成功' : '移除权限成功')
  } catch (error) {
    console.error(error)
    // 如果失败，重新拉取数据恢复穿梭框状态
    handleAssignPerms(currentRole.value)
  } finally {
    permLoading.value = false
  }
}

// ==========================================
// 授权用户
// ==========================================

const handleGrantUser = (row: any) => {
  currentRole.value = row
  userDialogVisible.value = true
  newUserId.value = ''
  userPage.value = 1
  fetchRoleUsers()
}

const fetchRoleUsers = async () => {
  usersLoading.value = true
  try {
    const res: any = await request.post('/AdminService/GetRoleUsers', {
      app_code: currentAppCode.value,
      role_key: currentRole.value.role_key,
      page: userPage.value,
      page_size: userPageSize.value
    })
    roleUsers.value = res.users || []
    userTotal.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    usersLoading.value = false
  }
}

const grantUser = async () => {
  if (!newUserId.value.trim()) {
    ElMessage.warning('请输入用户ID')
    return
  }
  grantLoading.value = true
  try {
    const res: any = await request.post('/AdminService/GrantRoleToUser', {
      app_code: currentAppCode.value,
      role_key: currentRole.value.role_key,
      user_id: newUserId.value.trim()
    })
    if (res.success) {
      ElMessage.success('授权成功')
      newUserId.value = ''
      fetchRoleUsers() // 刷新列表
    }
  } catch (error) {
    console.error(error)
  } finally {
    grantLoading.value = false
  }
}

const revokeUser = async (userId: string) => {
  try {
    await ElMessageBox.confirm(`确定要移除用户 [${userId}] 的该角色吗？`, '提示', { type: 'warning' })
    const res: any = await request.post('/AdminService/RevokeRoleFromUser', {
      app_code: currentAppCode.value,
      role_key: currentRole.value.role_key,
      user_id: userId
    })
    if (res.success) {
      ElMessage.success('移除成功')
      if (roleUsers.value.length === 1 && userPage.value > 1) userPage.value--
      fetchRoleUsers()
    }
  } catch (error) {}
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.2;
}

.perm-drawer-content {
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

.grant-action {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}
</style>
