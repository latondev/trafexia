# Trafexia - 移动设备网络流量拦截与分析工具

一款功能强大的桌面端应用程序，用于拦截、分析和修改来自移动设备的 HTTP/HTTPS 流量。基于 Electron、Vue 3 和 TypeScript 构建。

Trafexia 为移动应用安全测试、逆向工程和 API 调试提供了全面的工具，支持 SSL 固定绕过（SSL Pinning Bypass）、响应模拟（Mocking）、流量映射（Map Rules）等高级功能。

---

## ✨ 核心功能

### 🔐 绕过 SSL/TLS 安全性
- **内置绕过脚本** - 支持 OkHttp3、Conscrypt、WebView、Flutter、React Native 等。
- **APK 打包/修补** - 直接将绕过脚本注入到 APK 中，无需 root 设备。
- **Frida Gadget 集成** - 使用 Frida 进行动态代码注入和运行时挂钩。

### 📊 实时流量分析
- **实时请求捕获** - 实时拦截并展示 HTTP/HTTPS 请求。
- **时间线可视化** - 直观查看请求的分布与频率。
- **高级过滤** - 支持按 HTTP 方法、状态码、Host、URL 路径等进行过滤。
- **请求对比 (Diff)** - 提供左右分栏的差异对比界面，轻松比较原始与修改后的请求。

### 🎯 请求修改与操纵
- **请求重定向 (Map Rules)** - 使用正则表达式将请求重定向到其他目标 URL。
- **模拟响应 (Mock Responses)** - 创建带有自定义状态码、响应头（Headers）和响应体（Body）的模拟响应。
- **请求构建器 (Composer)** - 手动创建并发送自定义的 HTTP 请求。
- **网速限制 (Throttling)** - 模拟弱网环境以测试应用性能。

---

## 🚀 快速入门

### 前提条件
- **Node.js** 18 或更高版本
- **Android SDK**（用于 APK 修补功能）
- **macOS / Windows / Linux**

### 安装与运行 (开发模式)
```bash
# 克隆仓库
git clone https://github.com/danieldev23/trafexia.git
cd trafexia

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 打包构建 (生产环境)
```bash
# 构建当前平台版本
npm run build

# 构建 macOS (Intel)
npm run build:mac

# 构建 macOS (Apple Silicon M1/M2/M3)
npm run build:mac-arm

# 构建 Windows
npm run build:win
```
生成的安装包将存放在 `dist-electron/` 文件夹中。

---

## 📖 移动设备配置指南

### Android 配置指南

#### 步骤 1：配置代理
1. 打开 **设置** → **Wi-Fi**。
2. 长按已连接的网络，选择 **修改网络**。
3. 展开 **高级选项**。
4. 将 **代理** 设置为 **手动**。
5. 输入 Trafexia 中显示的 **代理 IP 地址** 和 **端口**。
6. 点击 **保存**。

#### 步骤 2：安装 CA 证书
1. 从 Trafexia 客户端下载 CA 证书（通过扫描二维码或直接链接）。
2. 打开 **设置** → **安全** → **加密与凭据**。
3. 点击 **从存储设备安装**。
4. 选择下载的证书文件并确认安装。

---

### iOS 配置指南

#### 步骤 1：配置代理
1. 打开 **设置** → **无线局域网**。
2. 点击已连接 Wi-Fi 旁边的 **(i)** 图标。
3. 滚动到最下方，点击 **配置代理** 并选择 **手动**。
4. 输入 Trafexia 显示的 **服务器/IP** 和 **端口**。
5. 点击 **存储**。

#### 步骤 2：安装并信任 CA 证书
1. 使用 iOS 设备通过扫码或链接下载 CA 证书描述文件。
2. 打开 **设置** → **已下载描述文件**，点击 **安装**。
3. 接着打开 **设置** → **通用** → **关于本机** → **证书信任设置**。
4. 为 Trafexia CA 证书开启 **完全信任** 开关。

---

## 🔒 安全与隐私
- **此工具仅用于您自己拥有的设备和授权的应用程序开发与测试。**
- **测试结束后，请务必移除设备上安装的 CA 证书。**
- 请勿将此工具用于任何非法或未经授权的黑客活动。

## 📄 开源许可证
本项目采用 **Trafexia Source-Available License** 许可证。详情请参阅 [LICENSE](LICENSE) 文件。
