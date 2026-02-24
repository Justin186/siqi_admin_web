<template>
  <div class="perm-manage">
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
            <el-icon><Plus /></el-icon> 新增权限
          </el-button>
          <el-button @click="fetchData" :disabled="!currentAppCode">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="perm_name" label="权限名称" width="180" />
        <el-table-column prop="perm_key" label="权限标识" width="220">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.perm_key }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑权限' : '新增权限'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="权限名称" prop="perm_name">
          <el-input v-model="form.perm_name" placeholder="例如：踢人" />
        </el-form-item>
        <el-form-item label="权限标识" prop="perm_key">
          <el-input v-model="form.perm_key" placeholder="例如：member:kick" :disabled="isEdit" />
          <div class="form-tip" v-if="!isEdit">标识创建后不可修改，建议使用 模块:动作 格式</div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="请输入权限描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'

// 应用列表数据
const appList = ref<any[]>([])
const currentAppCode = ref('')

// 表格数据
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 弹窗表单
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  perm_name: '',
  perm_key: '',
  description: ''
})

const rules = reactive<FormRules>({
  perm_name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  perm_key: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_:]+$/, message: '标识只能包含字母、数字、下划线和冒号', trigger: 'blur' }
  ]
})

// 获取应用列表 (用于下拉框)
const fetchAppList = async () => {
  try {
    // 获取所有应用，不分页（假设应用数量不会特别巨大，或者可以设置一个较大的 page_size）
    const res: any = await request.post('/AdminService/ListApps', {
      page: 1,
      page_size: 1000
    })
    appList.value = res.apps || []
    
    // 如果有应用，默认选中第一个，并加载其权限
    if (appList.value.length > 0) {
      currentAppCode.value = appList.value[0].app_code
      fetchData()
    }
  } catch (error) {
    console.error('获取应用列表失败:', error)
  }
}

// 切换应用时触发
const handleAppChange = () => {
  currentPage.value = 1
  fetchData()
}

// 获取权限列表数据
const fetchData = async () => {
  if (!currentAppCode.value) return
  
  loading.value = true
  try {
    const res: any = await request.post('/AdminService/ListPermissions', {
      app_code: currentAppCode.value,
      page: currentPage.value,
      page_size: pageSize.value
    })
    tableData.value = res.permissions || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 分页事件
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchData()
}
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchData()
}

// 打开新增弹窗
const handleAdd = () => {
  isEdit.value = false
  form.perm_name = ''
  form.perm_key = ''
  form.description = ''
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 0)
}

// 打开编辑弹窗
const handleEdit = (row: any) => {
  isEdit.value = true
  form.perm_name = row.perm_name
  form.perm_key = row.perm_key
  form.description = row.description
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const url = isEdit.value ? '/AdminService/UpdatePermission' : '/AdminService/CreatePermission'
        const payload = {
          app_code: currentAppCode.value,
          ...form
        }
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

// 删除权限
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 [${row.perm_name}] 吗？此操作不可恢复！`,
      '危险操作',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error',
      }
    )
    
    const res: any = await request.post('/AdminService/DeletePermission', {
      app_code: currentAppCode.value,
      perm_key: row.perm_key
    })
    
    if (res.success) {
      ElMessage.success('删除成功')
      if (tableData.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      fetchData()
    }
  } catch (error) {
    // 用户取消操作
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.2;
}
</style>
