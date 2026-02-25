# 司契权限系统管理后台

司契权限系统管理后台是一个基于 Vue 3 和 Element Plus 开发的现代化 Web 管理界面。它作为司契权限系统（C++ bRPC 后端）的可视化控制中心，为系统管理员和运维人员提供直观、高效的应用管理、权限配置、角色分配以及审计日志查询功能。

## 核心特性

- **现代化技术栈**：基于 Vue 3 Composition API 和 TypeScript，提供卓越的开发体验和类型安全。
- **极速构建**：采用 Vite 作为构建工具，实现毫秒级冷启动和极速热更新。
- **优雅的 UI 设计**：深度集成 Element Plus 组件库，提供统一、专业的企业级后台界面。
- **无缝后端对接**：通过 Axios 封装，完美适配 bRPC 的 HTTP/JSON 接口，支持 Token 自动注入与 401 自动拦截跳转。
- **细粒度权限管理**：支持应用、权限、角色的全生命周期管理，提供直观的穿梭框进行角色与权限、用户与角色的双向绑定。
- **全链路审计**：内置审计日志视图，支持多条件组合查询，操作记录一目了然。

## 技术栈

- **核心框架**: [Vue 3](https://vuejs.org/) (Composition API)
- **开发语言**: [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 组件库**: [Element Plus](https://element-plus.org/)
- **路由管理**: [Vue Router 4](https://router.vuejs.org/)
- **网络请求**: [Axios](https://axios-http.com/)

## 项目结构

```text
siqi_admin_web/
├── public/                 # 静态资源目录
├── src/                    # 源代码目录
│   ├── layout/             # 页面整体布局组件
│   │   └── MainLayout.vue  # 包含侧边栏、顶栏和主内容区的核心布局
│   ├── router/             # 路由配置目录
│   │   └── index.ts        # 路由定义与全局前置守卫（登录拦截）
│   ├── store/              # 全局状态管理目录（使用 Pinia）
│   │   └── counter.ts      # Pinia 状态管理示例文件（脚手架默认生成）
│   ├── utils/              # 工具函数目录
│   │   └── request.ts      # Axios 实例封装（统一处理 Token 和错误拦截）
│   ├── views/              # 页面级视图组件
│   │   ├── AppManageView.vue   # 应用管理：应用的增删改查
│   │   ├── AuditLogView.vue    # 审计日志：系统操作记录查询
│   │   └── LoginView.vue       # 登录页面
│   │   ├── PermManageView.vue  # 权限管理：权限的定义与维护
│   │   ├── RoleManageView.vue  # 角色与授权：角色定义、权限分配、用户绑定
│   │   ├── UserManageView.vue  # 用户列表：以用户为视角的角色分配与概览
│   ├── App.vue             # 根组件
│   └── main.ts             # 项目入口文件，注册插件与挂载应用
├── index.html              # HTML 模板
├── package.json            # 项目依赖与脚本配置
├── tsconfig.json           # TypeScript 编译配置
└── vite.config.ts          # Vite 构建与开发服务器配置（包含跨域代理）
```

## 核心功能模块

### 1. 身份认证与安全
- **登录机制**：通过 `/AdminService/Login` 接口获取 JWT Token。
- **状态保持**：Token 存储于 `localStorage`，Axios 拦截器自动在请求头附加 `Authorization: Bearer <Token>`。
- **失效处理**：全局监听 401 Unauthorized 状态码，自动清理本地状态并重定向至登录页。

### 2. 应用管理 (`/app-manage`)
- 管理接入权限系统的各个业务应用（如 QQ 机器人、内部管理系统等）。
- 支持应用的创建、信息修改、状态启停（禁用/启用）。
- 所有权限和角色数据均隔离在具体的应用之下。

### 3. 权限管理 (`/perm-manage`)
- 定义系统中的最小操作单元（如 `user:create`, `article:delete`）。
- 支持按应用筛选、新增权限定义、删除废弃权限。

### 4. 角色与授权 (`/role-manage`)
- **角色定义**：创建角色并设置是否为默认角色。
- **权限分配**：通过直观的穿梭框（Transfer）组件，为角色勾选或取消绑定的权限。
- **用户绑定**：在角色维度下，添加或移除拥有该角色的用户（如 QQ 号、员工 ID）。

### 5. 用户列表 (`/user-manage`)
- 提供以**用户为中心**的全局视角。
- 列表展示所有被授权的用户及其拥有的角色标签。
- 支持通过抽屉组件和穿梭框，快速为一个用户分配或撤销多个角色。

### 6. 审计日志 (`/audit-log`)
- 记录所有管理员的敏感操作（如创建应用、分配角色、删除权限等）。
- 支持按应用、操作类型、操作人、目标对象进行多条件组合检索。
- 自动将后端的英文操作动作（如 `USER_GRANT_ROLE`）映射为易读的中文标签（如 `授权用户`）。

## 开发与部署指南

### 环境准备

1. **Node.js**: 确保你的本地环境已安装 [Node.js](https://nodejs.org/) (推荐 v20)。
```bash
# 1. 下载并运行 Node.js 20 的安装脚本
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 2. 安装 Node.js (这会自动包含 npm)
sudo apt-get install -y nodejs

# 3. 验证安装是否成功
node -v  # 应该输出 v20.x.x
npm -v   # 应该输出 10.x.x
```
2. **后端服务**: 确保 C++ bRPC 后端服务 (`auth_server`) 已启动并监听在 `8888` 端口。
```bash
# 在 auth_server 的机器上执行
./build/auth_server --flagfile=conf/server.conf
```
> **注意**: 开启后端服务的机器必须确保连接的是主数据库(Master)，因为从数据库(Slave)是只读的并且主从是为了同步数据的，如果连接了从数据库，虽然前端界面可以正常访问，但所有的增删改操作都会失败。
3. **网络打通 (如果后端在远程服务器)**:
如果你的后端服务部署在远程服务器上，而你在本地开发，可以通过 SSH 隧道将远程的 `8888` 端口映射到本地，以便前端的代理能够正常工作：
```bash
# 将远程服务器的 8888 端口映射到本地的 8888 端口
ssh -N -f -L 8888:127.0.0.1:8888 ubuntu@<远程服务器_IP>
# 如果主数据库所在的机器暂时开不了 auth_server，也可以将远程服务器的SQL主数据库的 3306 端口映射到本地的 13306 端口，然后在配置文件 server.conf 中将数据库端口改为 13306 并启动 auth_server
ssh -N -f -L 13306:127.0.0.1:3306 ubuntu@<远程服务器_IP>
```

### 1. 安装依赖

```sh
npm install
```

### 2. 本地开发运行

```sh
npm run dev
```
*默认情况下，Vite 会在 `http://localhost:5173` 启动开发服务器。*
*注意：`vite.config.ts` 中已配置代理，会将 `/AdminService` 开头的请求自动转发到后端的 `http://127.0.0.1:8888`，解决本地开发跨域问题。*

### 3. 生产环境构建

```sh
# 执行 TypeScript 类型检查并打包压缩
npm run build
```
*构建完成后，静态文件将生成在 `dist/` 目录下。*

### 4. 生产环境部署建议

将 `dist/` 目录下的文件部署到 Nginx 或其他静态 Web 服务器。
同时，需要在 Nginx 中配置反向代理，将 API 请求转发到 C++ bRPC 后端服务。

#### Nginx 部署详细步骤 (Ubuntu/Debian)

**1. 安装 Nginx**
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

**2. 创建 Nginx 配置文件**
在 `/etc/nginx/sites-available/` 目录下创建一个名为 `siqi_admin_web` 的文件：
```bash
sudo nano /etc/nginx/sites-available/siqi_admin_web
```
将以下内容粘贴进去（注意修改 `root` 路径为你实际的 `dist` 文件夹路径，以及 `server_name` 为你的域名或 IP）：
```nginx
server {
    listen 80;
    server_name localhost; # 如果有域名，替换为你的域名

    # 静态文件服务
    location / {
        # 【重要】这里必须指向你打包生成的 dist 文件夹的绝对路径
        root /home/justin/siqi_admin_web/dist;
        index index.html;
        try_files $uri $uri/ /index.html; # 支持 Vue Router 的 History 模式
    }

    # API 反向代理，解决跨域问题
    location /AdminService/ {
        proxy_pass http://127.0.0.1:8888/AdminService/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**3. 启用配置并清理默认配置**
```bash
# 创建软链接启用配置
sudo ln -s /etc/nginx/sites-available/siqi_admin_web /etc/nginx/sites-enabled/

# 删除 Nginx 默认配置，防止 80 端口冲突
sudo rm /etc/nginx/sites-enabled/default
```

**4. 解决权限问题 (如果 dist 文件夹在用户目录下)**
如果你的 `dist` 文件夹在 `/home/用户名/` 目录下，Nginx 默认的 `www-data` 用户可能没有权限读取，会导致访问时出现 `500 Internal Server Error` 或 `403 Forbidden`。
需要修改 Nginx 的运行用户：
```bash
# 打开 Nginx 主配置文件
sudo nano /etc/nginx/nginx.conf

# 找到第一行的 `user www-data;`，将其修改为你的当前用户名，例如：
# user justin;
```

**5. 测试并重启 Nginx**
```bash
# 测试配置文件语法是否正确
sudo nginx -t

# 重启 Nginx 使配置生效
sudo systemctl restart nginx
```

完成以上步骤后，直接在浏览器访问 `http://你的服务器IP` 即可看到部署好的管理后台。
