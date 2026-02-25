<template>
  <div class="test-auth-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>权限测试工具</span>
        </div>
      </template>
      
      <el-form :model="form" label-width="120px" class="test-form">
        <el-form-item label="应用代码 (App)">
          <el-input v-model="form.app_code" placeholder="例如: qq_bot" />
        </el-form-item>
        <el-form-item label="用户ID (User)">
          <el-input v-model="form.user_id" placeholder="例如: 123456" />
        </el-form-item>
        <el-form-item label="权限代码 (Perm)">
          <el-input v-model="form.perm_key" placeholder="例如: member:kick" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleTest" :loading="loading">测试权限</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>

      <el-divider v-if="result !== null" />

      <div v-if="result !== null" class="result-area">
        <h3>测试结果</h3>
        <el-alert
          v-if="result.allowed"
          title="鉴权通过 (Allowed: true)"
          type="success"
          :closable="false"
          show-icon
        />
        <el-alert
          v-else
          title="鉴权拒绝 (Allowed: false)"
          type="error"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="error-details">
              <p><strong>拒绝原因:</strong> {{ result.reason || '无' }}</p>
              <p v-if="result.current_roles !== undefined"><strong>当前角色:</strong> {{ result.current_roles }}</p>
              <p v-if="result.suggest_roles"><strong>建议角色:</strong> {{ result.suggest_roles }}</p>
            </div>
          </template>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const form = reactive({
  app_code: '',
  user_id: '',
  perm_key: ''
})

// 从 localStorage 恢复数据
onMounted(() => {
  const savedForm = localStorage.getItem('testAuthForm')
  if (savedForm) {
    try {
      const parsed = JSON.parse(savedForm)
      form.app_code = parsed.app_code || ''
      form.user_id = parsed.user_id || ''
      form.perm_key = parsed.perm_key || ''
    } catch (e) {
      console.error('Failed to parse saved form data', e)
    }
  }
})

// 监听 form 变化并保存到 localStorage
watch(form, (newVal) => {
  localStorage.setItem('testAuthForm', JSON.stringify(newVal))
}, { deep: true })

const loading = ref(false)
const result = ref<any>(null)

const handleTest = async () => {
  if (!form.app_code || !form.user_id || !form.perm_key) {
    ElMessage.warning('请填写完整的测试参数')
    return
  }

  loading.value = true
  result.value = null

  try {
    // 调用 AuthService 的 Check 接口
    const res = await request.post('/AuthService/Check', {
      app_code: form.app_code,
      user_id: form.user_id,
      perm_key: form.perm_key
    })
    
    result.value = res
    ElMessage.success('测试完成')
  } catch (error: any) {
    ElMessage.error('测试请求失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.app_code = ''
  form.user_id = ''
  form.perm_key = ''
  result.value = null
}
</script>

<style scoped>
.test-auth-container {
  padding: 20px;
}

.box-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.test-form {
  margin-top: 20px;
}

.result-area {
  margin-top: 20px;
}

.error-details {
  margin-top: 10px;
  font-size: 14px;
}

.error-details p {
  margin: 5px 0;
}
</style>
