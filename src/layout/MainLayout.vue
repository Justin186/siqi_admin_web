<template>
  <el-container class="layout-container">
    <!-- 左侧侧边栏 -->
    <el-aside width="200px" class="aside">
      <div class="logo">
        <h2>司契权限系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/app-manage">
          <el-icon><Menu /></el-icon>
          <span>应用管理</span>
        </el-menu-item>
        <el-menu-item index="/perm-manage">
          <el-icon><Key /></el-icon>
          <span>权限管理</span>
        </el-menu-item>
        <el-menu-item index="/role-manage">
          <el-icon><UserFilled /></el-icon>
          <span>角色与授权</span>
        </el-menu-item>
        <el-menu-item index="/user-manage">
          <el-icon><List /></el-icon>
          <span>用户列表</span>
        </el-menu-item>
        <el-menu-item index="/audit-log">
          <el-icon><Document /></el-icon>
          <span>审计日志</span>
        </el-menu-item>
        <el-menu-item index="/test-auth">
          <el-icon><Monitor /></el-icon>
          <span>权限测试</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-left">
          <!-- 这里可以放面包屑等 -->
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link user-info">
              管理员 <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主体内容区 (路由视图) -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu, Key, UserFilled, List, Document, ArrowDown, Monitor } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 根据当前路由路径高亮左侧菜单
const activeMenu = computed(() => route.path)

const handleCommand = (command: string) => {
  if (command === 'logout') {
    localStorage.removeItem('admin_token')
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
}

.aside {
  background-color: #304156;
  color: white;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3643;
  color: #fff;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
}

.el-menu-vertical {
  border-right: none;
  flex: 1;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}

/* 页面切换动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
