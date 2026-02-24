# 司契权限系统管理后台
## 一、 项目概述

*   **项目名称**: 司契权限系统管理后台 (Siqi Auth Admin Web)
*   **项目定位**: 为司契权限系统（C++ bRPC 后端）提供可视化的 Web 管理界面，替代现有的 CLI 工具（`admin_tool`）。
*   **目标用户**: 系统管理员、运维人员。

## 二、 技术选型

*   **核心框架**: Vue 3 (Composition API)
*   **开发语言**: TypeScript (提供类型安全，减少运行时错误)
*   **构建工具**: Vite (极速的本地开发服务器和打包工具)
*   **UI 组件库**: Element Plus (提供表格、表单、弹窗等现成组件)
*   **路由管理**: Vue Router 4 (处理页面跳转，如 `/login` 到 `/dashboard`)
*   **状态管理**: Pinia (存储全局状态，如当前登录用户的 Token 和信息)
*   **网络请求**: Axios (封装 HTTP 请求，处理与 bRPC 后端的通信)

## 三、 架构设计

### 1. 目录结构规划

```text
siqi_auth_admin_web/
├── public/                 # 静态资源（如 favicon.ico）
├── src/                    # 源代码目录
│   ├── api/                # 集中管理所有后端接口请求
│   │   ├── admin.ts        # 登录、审计日志等接口
│   │   ├── app.ts          # 应用管理接口
│   │   ├── permission.ts   # 权限管理接口
│   │   └── role.ts         # 角色管理接口
│   ├── assets/             # 图片、全局 CSS 样式
│   ├── components/         # 公共组件（如自定义的页面头部、侧边栏）
│   ├── layout/             # 页面整体布局（左侧菜单 + 右侧内容区）
│   ├── router/             # 路由配置（定义 URL 对应哪个页面）
│   ├── store/              # Pinia 状态管理（存 Token、用户信息）
│   ├── utils/              # 工具函数
│   │   └── request.ts      # Axios 实例封装（统一处理 Token 和错误拦截）
│   ├── views/              # 页面级组件
│   │   ├── login/          # 登录页
│   │   ├── dashboard/      # 首页/仪表盘
│   │   ├── app-manage/     # 应用管理页
│   │   ├── perm-manage/    # 权限管理页
│   │   ├── role-manage/    # 角色管理页
│   │   └── audit-log/      # 审计日志页
│   ├── App.vue             # 根组件
│   └── main.ts             # 项目入口文件
├── .env.development        # 开发环境变量（配置后端 API 地址）
├── .env.production         # 生产环境变量
├── package.json            # 项目依赖配置
├── tsconfig.json           # TypeScript 配置
└── vite.config.ts          # Vite 配置（配置跨域代理）
```

### 2. 前后端通信规范 (基于 bRPC HTTP)

*   **协议**: HTTP POST (bRPC 默认将 Protobuf 方法映射为 POST 请求)。
*   **数据格式**: `application/json`。前端发送 JSON，后端返回 JSON。
*   **字段命名**: 前端请求体中的字段名必须与 auth.proto 中的定义完全一致（通常是 `snake_case`，如下划线命名）。
*   **鉴权机制**:
    1.  前端调用 `/AdminService/Login` 获取 Token。
    2.  前端将 Token 存入 `localStorage` 或 Pinia。
    3.  后续所有请求，前端通过 Axios 拦截器自动在 HTTP Header 中添加 `Authorization: Bearer <Token>`。
*   **跨域处理 (CORS)**:
    *   **开发环境**: 在 `vite.config.ts` 中配置 Proxy，将前端的请求代理到后端的 `8888` 端口。
    *   **生产环境**: 使用 Nginx 部署前端静态文件，并配置反向代理转发 API 请求到后端。

## 四、 核心页面与功能规划

### 1. 登录页 (`/login`)
*   **UI**: 居中的登录表单（用户名、密码）。
*   **接口**: `POST /AdminService/Login`
*   **逻辑**: 登录成功后，保存 Token，跳转到首页。

### 2. 基础布局 (Layout)
*   **左侧**: 垂直导航菜单（应用管理、权限管理、角色管理、审计日志）。
*   **顶部**: 面包屑导航、当前登录用户显示、退出登录按钮。
*   **主体**: 路由视图（`<router-view>`），用于展示具体页面内容。

### 3. 应用管理 (`/app-manage`)
*   **UI**: 顶部搜索栏（按应用名称/状态搜索）+ 数据表格 + 分页器。
*   **操作**:
    *   **新增应用**: 弹窗表单（应用名称、代号、描述）。调用 `CreateApp`。
    *   **编辑应用**: 弹窗表单。调用 `UpdateApp`。
    *   **禁用/启用**: 表格行内的 Switch 开关。调用 `UpdateApp` (修改 status)。
*   **接口**: `ListApps`, `CreateApp`, `UpdateApp`。

### 4. 权限管理 (`/perm-manage`)
*   **UI**: 顶部选择“所属应用”（下拉框）+ 数据表格。
*   **操作**:
    *   **新增权限**: 弹窗表单（权限名称、标识如 `member:kick`、描述）。调用 `CreatePermission`。
    *   **删除权限**: 表格行内按钮，二次确认弹窗。调用 `DeletePermission`。
*   **接口**: `ListPermissions`, `CreatePermission`, `DeletePermission`。

### 5. 角色管理与授权 (`/role-manage`)
*   **UI**: 左右分栏布局或主从表结构。
    *   **左侧/主表**: 角色列表（新增、编辑、删除角色）。
    *   **右侧/抽屉**: 选中某个角色后，展示该角色的详细信息。
*   **核心操作 1：分配权限 (给角色绑定权限)**
    *   在角色详情中，展示一个**穿梭框 (Transfer)** 或 **树形控件 (Tree)**，列出所有可选权限。
    *   勾选/取消勾选后，调用 `AddPermissionToRole` 或 `RemovePermissionFromRole`。
*   **核心操作 2：用户授权 (给用户绑定角色)**
    *   提供一个“添加用户”按钮，弹窗输入用户 ID（如 QQ 号）。
    *   调用 `GrantRoleToUser`。
*   **接口**: `ListRoles`, `CreateRole`, `GetRolePermissions`, `AddPermissionToRole`, `RemovePermissionFromRole`, `GrantRoleToUser`, `GetRoleUsers`。

### 6. 审计日志 (`/audit-log`)
*   **UI**: 顶部复杂搜索栏（按操作人、应用、操作类型、时间范围筛选）+ 数据表格 + 分页器。
*   **特点**: 纯展示页面，无修改操作。
*   **接口**: `ListAuditLogs`。

## 五、 实施路径建议

1.  **阶段一：基础设施搭建 (1天)**
    *   初始化 Vue 3 + Vite 项目。
    *   安装 Element Plus、Axios、Vue Router、Pinia。
    *   配置 Vite 代理打通前后端联调环境。
    *   封装 Axios 请求（处理 Token 和全局错误提示）。
2.  **阶段二：核心流程跑通 (1-2天)**
    *   开发登录页面，实现 Token 获取与存储。
    *   搭建 Layout 布局（侧边栏菜单）。
    *   开发“应用管理”页面（完成增删改查闭环）。
3.  **阶段三：权限与角色模块 (2-3天)**
    *   开发“权限管理”页面。
    *   开发“角色管理”页面（重点攻克角色分配权限、用户绑定角色的交互逻辑）。
4.  **阶段四：完善与部署 (1天)**
    *   开发“审计日志”页面。
    *   编写 Nginx 部署配置文件。
    *   前后端联合测试。

---

# siqi_admin_web

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
