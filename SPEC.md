# 功能规格说明书 (SPEC.md) - openfront-modern

## 1. 项目定位与背景
- **项目名**：`openfront-modern`
- **开发路线**：Route B（按思路重写，100% 独立全新实现）
- **定位**：轻量级、零配置、模块化的高性能多币种独立站电商底座（TypeScript + Express + REST + 响应式双端界面），彻底摒弃原项目庞重复杂的 KeystoneJS/GraphQL/PostgreSQL 依赖，保留并强化独立站核心电商闭环。

---

## 2. 借鉴功能清单（源自 openfront 思路）
1. **商品目录系统 (Catalog & Categories)**
   - 商品多维度展示（标题、描述、价格、分类、库存状态、图片链接、SKU）。
   - 分类筛选（如 Electronics, Apparel, Accessories, Home 等）与关键词检索。
2. **多币种与区域汇率 (Multi-Currency Support)**
   - 支持多币种动态切换（USD, EUR, GBP, JPY, CNY）。
   - 基础币种（Base Currency）统一核算与动态汇率转换。
   - 货币符号与格式化展示。
3. **购物车系统 (Shopping Cart Engine)**
   - 客户端持久化与服务端校验。
   - 商品数量加减、删除、小计与总额动态重算。
4. **订单与结算闭环 (Order & Checkout Lifecycle)**
   - 包含客户姓名、邮箱、配送地址、币种选择的结账流程。
   - 运费与税费计算规则支持。
   - 订单状态全生命周期管理（`pending` 待付款、`paid` 已支付、`processing` 处理中、`shipped` 已发货、`cancelled` 已取消、`refunded` 已退款）。
5. **支付闭环 (Payment Provider Loop)**
   - 占位网关设计（Mock Gateway），模拟真实支付网关交互。
   - 支持即时扣款成功、模拟失败与待确认等可配置场景，无需对接真实第三方密钥即可跑通全闭环。
6. **后台运营控制台 (Admin Dashboard)**
   - 运营指标看板（销售总额、订单量、商品数、低库存预警）。
   - 商品增删改查与库存维护。
   - 订单列表与状态推进（标记支付、标记发货、取消退款）。
   - 汇率配置与支付网关设置。

---

## 3. 架构重构与差异化要点（对比原 openfront）

| 维度 | 原项目 openfront | openfront-modern（本项目全新实现） |
| :--- | :--- | :--- |
| **技术栈** | KeystoneJS 6 + GraphQL + Prisma + PostgreSQL | 轻量级 TypeScript + 模块化 REST API + 嵌入式现代 UI |
| **依赖体量** | 极其庞大（78+ 复杂数据模型，数十万行生成代码） | 小巧精炼（< 2MB 源码），分层清晰，零冗余 |
| **部署与运行** | 必须安装并配置 PostgreSQL 数据库与复杂环境变量 | 零外部依赖，自带原子化 JSON 事务持久化与初始种子数据，开箱即跑 |
| **多币种引擎** | 依赖复杂区域配置表 | 内置多币种计算引擎，支持实时汇率换算、历史汇率订单锁定 |
| **支付闭环** | 仅有占位接口框架与强依赖 Stripe 密钥 | 内置可配置的 Mock 支付网关（MockPay），完整支持模拟支付、生成收据与状态流转 |
| **测试与自动化** | 难以在纯无服务外部环境下启动测试 | 包含端到端闭环自测脚本与测试用例，一键验证全部流程 |

---

## 4. 系统分层与目录结构设计
```
openfront-modern/
├── package.json               # 项目配置与脚本
├── tsconfig.json              # TypeScript 编译配置
├── .gitignore                 # 忽略构建产物与临时数据库
├── LICENSE                    # 原项目 MIT 许可证保留
├── PROVENANCE.md              # 来源追溯记录
├── TASK.md                    # 任务规格书
├── SPEC.md                    # 功能规格与自测记录
├── README.md                  # 中英双语说明文档
├── src/
│   ├── types/                 # 核心数据模型类型定义
│   ├── data/                  # 存储层（原子化 JSON 存储与种子数据）
│   ├── services/              # 核心业务逻辑（商品、汇率、购物车、订单、支付）
│   ├── controllers/           # REST API 控制器
│   ├── routes/                # 路由定义
│   ├── app.ts                 # 应用装配
│   └── server.ts              # 应用入口
├── public/                    # 前端静态资源与双端界面（Storefront & Admin）
│   ├── css/                   # 现代化响应式样式
│   ├── js/                    # 客户端交互脚本（商城端与后台端）
│   ├── index.html             # 客户商城首页（商品浏览、多币种切换、购物车、结算）
│   └── admin.html             # 管理员后台（仪表盘、商品管理、订单管理、汇率）
└── tests/                     # 自动化自测试验脚本
    └── core-flow.test.ts      # 核心流程端到端自动化测试
```

---

## 5. 核心 API 规范

> 安全说明：管理员接口（/api/admin/*）未做身份鉴权，仅供本地演示，切勿直接暴露于公网。
- `GET /api/products` - 获取商品列表（支持分类与搜索）
- `GET /api/products/:id` - 获取单个商品详情
- `POST /api/products` - 创建商品（管理员）
- `PUT /api/products/:id` - 更新商品（管理员）
- `DELETE /api/products/:id` - 删除商品（管理员）
- `GET /api/categories` - 获取所有商品分类
- `GET /api/currencies` - 获取支持的货币及实时汇率
- `PUT /api/currencies` - 更新汇率（管理员）
- `POST /api/checkout` - 创建订单并执行 Mock 支付网关扣款
- `GET /api/orders/:id` - 根据订单号查询订单状态与支付收据
- `GET /api/admin/orders` - 获取所有订单列表（管理员）
- `PUT /api/admin/orders/:id/status` - 更新订单状态（管理员）
- `GET /api/admin/stats` - 统计看板数据（营收、订单数、商品数等）

---

## 6. 自测记录（留痕于第3步）

### 6.1 单元与集成测试（`npm test`）
- **执行命令**：`npm test`
- **执行环境**：Linux x86_64 / Node.js v24.22.1
- **测试结果**：11 项测试用例全部通过（11 passed, 0 failed, 耗时 55ms）
- **涵盖用例**：
  1. 商品与分类检索：验证默认 8 款商品与 4 类分类加载、分类过滤与关键词检索。
  2. 多币种换算引擎：验证 USD 到 EUR/GBP/JPY 汇率计算精度、货币符号格式化、动态汇率更新与基础币保护。
  3. 结算与占位支付闭环：验证 `mock_card` 立即扣款并扣减库存、多币种结账历史汇率固化、尾号 4002 模拟拒付且不扣库存、货到付款（COD）生成待处理订单。
  4. 订单生命周期与后台管理：验证订单发货状态流转、取消退款时库存自动回滚补偿、运营营收看板与低库存预警计算。

### 6.2 生产构建测试（`npm run build`）
- **执行命令**：`npm run build`
- **结果**：TypeScript 编译零错误，产物正常输出至 `dist/`。

### 6.3 HTTP 服务与端到端核心流程实测（`curl` 实测证据）
- **启动命令**：`PORT=3456 node dist/src/server.js`
- **健康检查**：
  ```bash
  $ curl -s http://localhost:3456/api/health
  {"status":"ok","service":"openfront-modern","version":"1.0.0","timestamp":"2026-11-17T08:11:35.933Z"}
  ```
- **双端页面可用性**：
  ```bash
  $ curl -s -o /dev/null -w "Storefront HTTP %{http_code}\n" http://localhost:3456/
  Storefront HTTP 200
  $ curl -s -o /dev/null -w "Admin HTTP %{http_code}\n" http://localhost:3456/admin
  Admin HTTP 200
  ```
- **商品浏览 API**：
  ```bash
  $ curl -s http://localhost:3456/api/products | jq '.success, (.data | length), .data[0].title'
  true
  8
  "Acoustic Wireless Headphones Pro"
  ```
- **多币种查询 API**：
  ```bash
  $ curl -s http://localhost:3456/api/currencies | jq '.success, [.data[] | {code: .code, rate: .rate}]'
  true
  [{"code":"USD","rate":1},{"code":"EUR","rate":0.92},{"code":"GBP","rate":0.79},{"code":"JPY","rate":154.5},{"code":"CNY","rate":7.24}]
  ```
- **下单结账与支付闭环 API**（多币种 EUR 结账）：
  ```bash
  $ curl -s -X POST http://localhost:3456/api/checkout \
    -H "Content-Type: application/json" \
    -d '{
      "items": [{"productId": "prod-101", "quantity": 1}, {"productId": "prod-102", "quantity": 1}],
      "currency": "EUR",
      "shippingAddress": {
        "fullName": "Alice Smith",
        "email": "alice@example.com",
        "street": "10 Rue de la Paix",
        "city": "Paris",
        "postalCode": "75002",
        "country": "France"
      },
      "paymentMethod": "mock_card",
      "cardNumber": "4242 4242 4242 4000"
    }'
  # 响应：success: true, orderNumber: "OF-20261117-7148", total: 330.65 EUR, status: "paid", payment.status: "captured", payment.transactionId: "txn_mock_1794903107540_4477"
  ```
- **订单查询与后台状态推进 API**：
  ```bash
  $ curl -s http://localhost:3456/api/orders/OF-20261117-7148 | jq '.data.orderNumber, .data.status, .data.total'
  "OF-20261117-7148"
  "paid"
  330.65

  $ curl -s -X PUT http://localhost:3456/api/admin/orders/OF-20261117-7148/status \
    -H "Content-Type: application/json" \
    -d '{"status": "shipped"}' | jq '.data.status'
  "shipped"
  ```
- **自测结论**：安装、编译、启动、前台商城浏览、多币种结账、Mock支付扣款与后台订单状态管理核心流程全部通过（购物车加购环节随下单流程一并实测，非自动化用例覆盖）。
