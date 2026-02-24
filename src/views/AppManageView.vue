<template>
  <div class="app-manage">
    <el-card class="box-card">
      <!-- 顶部操作栏 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增应用
        </el-button>
        <el-button @click="fetchData">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="app_name" label="应用名称" width="180" />
        <el-table-column prop="app_code" label="应用代号" width="180" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'danger' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
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
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑应用' : '新增应用'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="应用名称" prop="app_name">
          <el-input v-model="form.app_name" placeholder="例如：课程群Bot" />
        </el-form-item>
        <el-form-item label="应用代号" prop="app_code">
          <el-input v-model="form.app_code" placeholder="例如：course_bot" :disabled="isEdit" />
          <div class="form-tip" v-if="!isEdit">代号创建后不可修改，用于API调用</div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="请输入应用描述" />
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
  app_name: '',
  app_code: '',
  description: ''
})

const rules = reactive<FormRules>({
  app_name: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  app_code: [
    { required: true, message: '请输入应用代号', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '代号只能包含字母、数字和下划线', trigger: 'blur' }
  ]
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await request.post('/AdminService/ListApps', {
      page: currentPage.value,
      page_size: pageSize.value
    })
    tableData.value = res.apps || []
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
  form.app_name = ''
  form.app_code = ''
  form.description = ''
  dialogVisible.value = true
  // 清除之前的校验状态
  setTimeout(() => formRef.value?.clearValidate(), 0)
}

// 打开编辑弹窗
const handleEdit = (row: any) => {
  isEdit.value = true
  form.app_name = row.app_name
  form.app_code = row.app_code
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
        const url = isEdit.value ? '/AdminService/UpdateApp' : '/AdminService/CreateApp'
        const res: any = await request.post(url, form)
        
        if (res.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
          dialogVisible.value = false
          fetchData() // 刷新列表
        }
      } catch (error) {
        console.error(error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 切换状态 (禁用/启用)
const handleToggleStatus = async (row: any) => {
  const actionText = row.status === 1 ? '禁用' : '启用'
  const newStatus = row.status === 1 ? 0 : 1
  
  try {
    await ElMessageBox.confirm(`确定要${actionText}应用 [${row.app_name}] 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    const res: any = await request.post('/AdminService/UpdateApp', {
      app_code: row.app_code,
      status: newStatus
    })
    
    if (res.success) {
      ElMessage.success(`${actionText}成功`)
      fetchData()
    }
  } catch (error) {
    // 用户取消操作
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
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
