# CCNLTHD_Nestjs

**NestJS** là một framework backend mã nguồn mở mạnh mẽ được xây dựng trên nền tảng **Node.js**, sử dụng **TypeScript** làm ngôn ngữ chính (vẫn hỗ trợ thuần JavaScript). NestJS cung cấp kiến trúc phát triển theo hướng module lấy cảm hứng từ Angular, giúp tổ chức mã nguồn rõ ràng, dễ bảo trì và mở rộng đối với các dự án từ nhỏ đến quy mô lớn (Enterprise level).

---

## 📌 Tổng quan về NestJS

NestJS kết hợp các nguyên lý của **OOP** (Object Oriented Programming), **FP** (Functional Programming), và **FRP** (Functional Reactive Programming). Phía dưới NestJS mặc định sử dụng **Express.js**, nhưng cũng có thể dễ dàng chuyển đổi sang **Fastify** để tối ưu hiệu năng.

### Các đặc trưng chính:
- **TypeScript First**: Cung cấp khả năng kiểm tra kiểu tĩnh (Static Typing) giúp giảm thiểu lỗi trong quá trình phát triển.
- **Dependency Injection (DI)**: Quản lý các phụ thuộc giữa các thành phần linh hoạt, hỗ trợ viết Unit Test dễ dàng.
- **Modular Architecture**: Phân chia ứng dụng thành các module độc lập, giúp cấu trúc code ngăn nắp.
- **Hệ sinh thái phong phú**: Tích hợp sẵn với TypeORM, Prisma, Mongoose, GraphQL, WebSockets, Microservices, Swagger/OpenAPI, Passport JWT, v.v.

---

## 🏗️ Các thành phần cốt lõi (Core Building Blocks)

NestJS xây dựng ứng dụng dựa trên các khái niệm chính sau:

| Thành phần | Decorator | Chức năng chính |
| :--- | :--- | :--- |
| **Module** | `@Module()` | Đóng gói và gom nhóm các Controller, Provider có liên quan lại với nhau. |
| **Controller** | `@Controller()` | Tiếp nhận HTTP Request từ Client, gọi Service xử lý và trả về HTTP Response. |
| **Provider / Service** | `@Injectable()` | Xử lý logic nghiệp vụ (Business Logic), truy xuất CSDL và được tiêm (inject) qua DI Container. |
| **DTO (Data Transfer Object)** | N/A | Định nghĩa cấu trúc dữ liệu gửi/nhận qua API, kết hợp `class-validator` để kiểm tra tính hợp lệ của dữ liệu. |
| **Middleware** | `@Injectable()` | Can thiệp vào chuỗi xử lý Request/Response trước khi đến Route Handler (ví dụ: Logging, CORS, Body Parser). |
| **Guard** | `@Injectable()` | Xác thực (Authentication) và Phân quyền (Authorization/RBAC) quyết định Request có được truy cập route hay không. |
| **Interceptor** | `@Injectable()` | Can thiệp trước/sau khi Route Handler thực thi (biến đổi dữ liệu trả về, xử lý Caching, đo thời gian phản hồi). |
| **Pipe** | `@Injectable()` | Transform (chuyển đổi dữ liệu) và Validate (kiểm tra tính đúng đắn của dữ liệu đầu vào). |
| **Exception Filter** | `@Catch()` | Bắt và xử lý tập trung các ngoại lệ (errors/exceptions) chưa được xử lý trong ứng dụng. |

---

## ⚙️ Luồng xử lý một Request (Request Lifecycle)

Khi một Client gửi HTTP Request đến NestJS, luồng dữ liệu sẽ đi qua các thành phần theo thứ tự:

```text
Incoming Request
       │
       ▼
   Middleware
       │
       ▼
     Guard
       │
       ▼
  Interceptor (Pre-controller)
       │
       ▼
     Pipes
       │
       ▼
  Controller (Route Handler) ──► Service / Repository (DB)
       │
       ▼
  Interceptor (Post-controller)
       │
       ▼
Exception Filter (Nếu có lỗi xảy ra)
       │
       ▼
Outgoing Response
```

---

## 🚀 Hướng dẫn bắt đầu & Các lệnh Nest CLI thường dùng

### 1. Cài đặt Nest CLI
```bash
npm install -g @nestjs/cli
```

### 2. Các lệnh khởi chạy dự án
```bash
# Cài đặt dependencies
npm install

# Khởi chạy ứng dụng ở chế độ Development (Watch mode - tự reload khi sửa code)
npm run start:dev

# Build dự án ra thư mục dist
npm run build

# Khởi chạy bản Build sản phẩm (Production)
npm run start:prod
```

### 3. Khởi chạy Database đi kèm (Docker)
Dự án có sẵn cấu hình PostgreSQL trong file `docker-compose.yml`:
```bash
# Khởi chạy PostgreSQL container
docker compose up -d
```

### 4. Lệnh tạo thành phần nhanh với Nest CLI (`nest g`)
- Tạo Module: `nest g module <tên_module>`
- Tạo Controller: `nest g controller <tên_module>`
- Tạo Service: `nest g service <tên_module>`
- Tạo bộ tài nguyên CRUD hoàn chỉnh (Module + Controller + Service + DTO + Entity):
  ```bash
  nest g resource <tên_tài_nguyên>
  ```

---

## 📂 Cấu trúc thư mục chuẩn của một dự án NestJS

```text
src/
├── app.controller.ts    # Controller gốc với route ví dụ
├── app.module.ts        # Module gốc (Root Module) kết nối các module khác
├── app.service.ts       # Service gốc xử lý logic đơn giản
└── main.ts              # Entry point của ứng dụng (Khởi tạo NestFactory và lắng nghe port)
```

---

## 💡 Ưu điểm khi sử dụng NestJS

1. **Dễ bảo trì và làm việc nhóm**: Kiến trúc chuẩn hóa giúp lập trình viên mới gia nhập dự án nhanh chóng nắm bắt luồng code.
2. **Khả năng mở rộng tốt (Scalability)**: Thích hợp cho cả ứng dụng monolithic lẫn hệ thống microservices.
3. **Tích hợp sẵn bộ gỡ lỗi và Unit Test**: Đi kèm cấu hình Jest giúp viết Unit Test và E2E Test dễ dàng.
4. **Cộng đồng phát triển mạnh mẽ**: Hệ sinh thái nhiều thư viện hỗ trợ chính thức và tài liệu tham khảo phong phú.

