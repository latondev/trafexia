# Trafexia - Công cụ Chặn và Phân tích Lưu lượng Mạng Di động

Một ứng dụng máy tính mạnh mẽ để chặn, phân tích và sửa đổi lưu lượng HTTP/HTTPS từ các thiết bị di động. Được xây dựng trên nền tảng Electron, Vue 3 và TypeScript.

Trafexia cung cấp đầy đủ công cụ phục vụ kiểm thử bảo mật ứng dụng di động, kỹ thuật ngược (reverse engineering) và gỡ lỗi API với các tính năng nâng cao như vượt qua SSL pinning, giả lập phản hồi (mocking), ánh xạ lưu lượng (traffic mapping), và nhiều tính năng khác.

---

## ✨ Các Tính năng Chính

### 🔐 Vượt qua Bảo mật SSL/TLS (SSL Bypass)
- **Kịch bản vượt qua tích hợp sẵn** - Hỗ trợ OkHttp3, Conscrypt, WebView, Flutter, React Native và nhiều hơn nữa.
- **Vá APK (APK Patching)** - Nhúng kịch bản vượt qua trực tiếp vào file APK mà không yêu cầu thiết bị root.
- **Tích hợp Frida Gadget** - Nhúng code động sử dụng Frida để thực hiện runtime hooking.

### 📊 Phân tích Lưu lượng Thời gian thực
- **Bắt yêu cầu trực tiếp** - Chặn và hiển thị các yêu cầu HTTP/HTTPS trong thời gian thực.
- **Biểu đồ thời gian (Timeline)** - Trực quan hóa phân phối và tần suất yêu cầu.
- **Bộ lọc nâng cao** - Lọc theo phương thức HTTP, mã phản hồi, host, đường dẫn URL, v.v.
- **So sánh yêu cầu (Diff)** - Giao diện so sánh song song giữa yêu cầu gốc và yêu cầu đã sửa đổi.

### 🎯 Sửa đổi Yêu cầu (Manipulation)
- **Ánh xạ yêu cầu (Map Rules)** - Chuyển hướng yêu cầu đến các URL khác bằng biểu thức chính quy (Regex).
- **Phản hồi giả lập (Mock Responses)** - Tạo các phản hồi giả lập với mã trạng thái, tiêu đề (headers) và nội dung (body) tùy chỉnh.
- **Bộ soạn thảo yêu cầu (Composer)** - Tạo và gửi các yêu cầu HTTP tùy chỉnh để kiểm thử.
- **Giới hạn băng thông (Throttling)** - Mô phỏng các điều kiện mạng yếu để kiểm tra hiệu năng.

---

## 🚀 Hướng dẫn Bắt đầu

### Yêu cầu hệ thống
- **Node.js** phiên bản 18 trở lên
- **Android SDK** (cho tính năng vá APK)
- **macOS / Windows / Linux**

### Cài đặt và Chạy thử (Development)
```bash
# Clone source code
git clone https://github.com/danieldev23/trafexia.git
cd trafexia

# Cài đặt thư viện
npm install

# Khởi chạy chế độ phát triển
npm run dev
```

### Đóng gói Ứng dụng (Build Production)
```bash
# Build cho nền tảng hiện tại
npm run build

# Build cho macOS (Intel)
npm run build:mac

# Build cho macOS (Apple Silicon - M1/M2/M3)
npm run build:mac-arm

# Build cho Windows
npm run build:win
```
File thực thi sau khi đóng gói sẽ nằm trong thư mục `dist-electron/`.

---

## 📖 Hướng dẫn Thiết lập Thiết bị Di động

### Hướng dẫn thiết lập trên Android

#### Bước 1: Cấu hình Proxy
1. Truy cập **Cài đặt (Settings)** → **Wi-Fi**.
2. Nhấn giữ mạng Wi-Fi đang kết nối và chọn **Sửa đổi mạng (Modify network)**.
3. Chọn **Tùy chọn nâng cao (Advanced options)**.
4. Chuyển mục **Proxy** sang **Thủ công (Manual)**.
5. Nhập **Địa chỉ IP Proxy** và **Cổng (Port)** được hiển thị trên Trafexia.
6. Nhấn **Lưu (Save)**.

#### Bước 2: Cài đặt Chứng chỉ CA (CA Certificate)
1. Tải chứng chỉ CA từ ứng dụng Trafexia (thông qua mã QR hoặc đường dẫn).
2. Vào **Cài đặt (Settings)** → **Bảo mật (Security)** → **Cài đặt chứng chỉ**.
3. Chọn chứng chỉ đã tải về để tiến hành cài đặt vào máy.

---

### Hướng dẫn thiết lập trên iOS

#### Bước 1: Cấu hình Proxy
1. Vào **Cài đặt (Settings)** → **Wi-Fi**.
2. Nhấn vào biểu tượng **(i)** cạnh mạng Wi-Fi đang kết nối.
3. Cuộn xuống và chọn **Định cấu hình Proxy (Configure Proxy)**.
4. Chọn **Thủ công (Manual)**.
5. Nhập **Máy chủ (Server/IP)** và **Cổng (Port)** tương ứng hiển thị trên Trafexia.
6. Nhấn **Lưu (Save)**.

#### Bước 2: Cài đặt và Tin tưởng Chứng chỉ CA
1. Sử dụng thiết bị iOS để tải xuống chứng chỉ CA thông qua URL hoặc mã QR trên Trafexia.
2. Vào **Cài đặt (Settings)** → **Đã tải về hồ sơ (Profile Downloaded)** và chọn cài đặt.
3. Truy cập **Cài đặt (Settings)** → **Cài đặt chung (General)** → **Giới thiệu (About)** → **Cài đặt tin cậy chứng chỉ (Certificate Trust Settings)**.
4. Bật chế độ tin cậy hoàn toàn (Full trust) cho chứng chỉ Trafexia CA.

## 🔌 Tích hợp Model Context Protocol (MCP)

Trafexia cung cấp một máy chủ MCP dựa trên SSE (Server-Sent Events) hoạt động tại cổng `8890` khi ứng dụng đang chạy. Tính năng này cho phép các trợ lý AI (Claude Desktop, Cursor, Antigravity) đọc và phân tích trực tiếp lưu lượng mạng đã bắt được.

#### Endpoint kết nối:
- **SSE URL**: `http://localhost:8890/sse`
- **Client Endpoint**: `http://localhost:8890/message`

#### Các công cụ MCP hỗ trợ:

| Công cụ | Mô tả | Tham số |
|---------|-------|---------|
| `list_requests` | Liệt kê danh sách request đã bắt, sắp xếp theo thời gian | `limit`, `search`, `method` |
| `get_request_details` | Lấy chi tiết header và body của một request theo ID | `id` (bắt buộc) |
| `clear_requests` | Xóa toàn bộ lịch sử request | — |

#### Cấu hình trên Claude Desktop

Mở hoặc tạo file cấu hình:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "trafexia": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "http://localhost:8890/sse"
      ]
    }
  }
}
```

Khởi động lại Claude Desktop. Biểu tượng MCP sẽ sáng lên — hỏi: *"Liệt kê các API request mới nhất mà Trafexia bắt được."*

#### Cấu hình trên Cursor IDE

1. Mở **Cursor Settings** > **Features** > cuộn xuống phần **MCP**.
2. Click **"+ Add New MCP Server"**.
3. Điền thông tin:
   - **Name**: `Trafexia`
   - **Type**: `SSE`
   - **URL**: `http://localhost:8890/sse`
4. Click **Save**. Dùng `@Trafexia` trong Cursor Chat để phân tích API traffic.

#### Cấu hình trên Antigravity

1. Mở **Antigravity Settings** > **MCP Servers**.
2. Click **"Add Server"**.
3. Điền thông tin:
   - **Name**: `Trafexia`
   - **Transport**: `SSE`
   - **URL**: `http://localhost:8890/sse`
4. Click **Connect**. Dùng `@Trafexia` trong chat để đọc dữ liệu traffic.

---

## 🔒 An toàn & Bảo mật
- **Chỉ sử dụng công cụ này cho mục đích phát triển và thử nghiệm trên thiết bị của chính bạn**.
- **Hãy gỡ bỏ chứng chỉ CA sau khi hoàn tất kiểm thử**.
- Không sử dụng ứng dụng cho các hành vi bất hợp pháp hoặc không được phép.

## 📄 Bản quyền
Dự án được cấp phép theo **Trafexia Source-Available License**. Xem thêm chi tiết tại file [LICENSE](LICENSE).
