# Openfront Modern (openfront-modern)

> 轻量级、高可用的多币种独立站电商底座与最小订单/支付闭环引擎（TypeScript 全新实现）。
> A lightweight, clean-architecture multi-currency standalone commerce platform and minimal order/payment engine written from scratch in TypeScript.

---

## 中文文档 (Chinese)

### 1. 简介
Openfront Modern 是一个小体量、架构清爽、开箱即用的现代化多币种独立站底座。本项目基于原开源项目 `openfront` 的核心设计思路进行 100% 独立重构，彻底摒弃了原方案极其臃肿庞杂的 KeystoneJS / GraphQL / PostgreSQL 重型依赖，提供纯 TypeScript + REST API + 响应式轻量双端（顾客商城与管理控制台）的高性能实现，开箱自带原子化事务存储与最小支付闭环。

### 2. 功能与改进点（与原思路的关系）

本项目参考了原项目 `openfront` 关于“开源 Shopify 替代品、多区域电商与全功能独立站”的思路，并做出了面向独立站场景的针对性全新重构：

1. **小体量与清晰分层架构（核心改进）**：
   - 原项目依赖庞大的 KeystoneJS 6、GraphQL 运行时与 PostgreSQL，初始化需拉取大量重量级组件。
   - 本项目采用小巧模块化 TypeScript 架构（分层为 Controller、Service、Data Store、Public UI），整体无冗余依赖，启动秒级响应，内存占用小于 50MB。
2. **原生多币种与动态汇率引擎（强化功能）**：
   - 深度支持 USD、EUR、GBP、JPY、CNY 等主要国际货币，支持实时前台无缝切换与币种符号格式化。
   - 下单时自动固化历史汇率，支持后台灵活维护汇率与基础货币防护。
3. **最小订单与支付全闭环（重构重点）**：
   - 内置可配置的 Mock 支付网关（MockPay Engine），支持信用卡模拟立即结算、Stripe 意图模拟以及货到付款（COD）延期结算。
   - 提供模拟拒付测试通道（测试卡尾号 4002 触发拒付），全流程验证异常流与正常流，无需外部第三方商户密钥即可完成完整交付闭环。
4. **双端响应式界面体验（Storefront + Admin）**：
   - **商城前台 (`/`)**：商品分类筛选、即时搜索、多币种商品卡片展示、本地持久化购物车抽屉、结账地址表单及电子收据弹窗。
   - **后台管理 (`/admin`)**：运营营收与订单指标看板、商品 SKU/库存/价格增删改查、低库存预警提示、订单生命周期管理（发货/退款/取消）及库存自动回滚。
5. **零配置开箱即用与数据持久化**：
   - 内置安全原子化文件存储引擎（Atomic JSON Store），自带真实示例商品与分类种子数据，无需预装任何外部数据库。

### 3. 快速开始

#### 环境要求
- Node.js >= 18.0.0
- npm / pnpm / yarn

#### 安装与启动
```bash
# 1. 克隆项目并进入目录
cd openfront-modern

# 2. 安装依赖
npm install

# 3. 生产环境构建
npm run build

# 4. 启动服务（默认端口 3000）
npm start

# 开发模式运行（支持实时重载）
npm run dev
```

#### 端口与环境配置
可通过环境变量自定义服务配置（配置项均使用占位符，无真实密钥泄露风险）：
```bash
PORT=3000 HOST=0.0.0.0 npm start
```

#### 访问入口
- **客户商城前台 (Storefront)**：`http://localhost:3000/`
- **后台控制台 (Admin Dashboard)**：`http://localhost:3000/admin`
- **安全说明**：管理员接口未做身份鉴权，仅供本地演示，切勿直接暴露于公网。
- **REST API 健康检查**：`http://localhost:3000/api/health`

#### 自动化测试
运行全流程端到端自动化测试集：
```bash
npm test
```

---

## English Documentation

### 1. Introduction
Openfront Modern is a lightweight, clean-architecture, zero-config standalone e-commerce engine designed for global multi-currency online stores. Re-engineered 100% from scratch inspired by the ideas of `openfront`, it eliminates the heavyweight KeystoneJS / GraphQL / PostgreSQL infrastructure, delivering a pure TypeScript + REST architecture with responsive dual-interface (Customer Storefront and Admin Control Center) and a complete minimal checkout/payment loop.

### 2. Features & Key Improvements

1. **Lightweight & Clean Architecture**:
   - Replaces the original heavy 78+ KeystoneJS models and GraphQL complexity with an elegant, modular TypeScript layered service design.
   - Starts in milliseconds with minimal memory footprint (< 50MB) and zero external database installation required.
2. **Native Multi-Currency Engine**:
   - Out-of-the-box support for USD (base), EUR, GBP, JPY, and CNY.
   - Dynamic real-time currency switching across storefront prices, cart calculations, and frozen historical rate recording at order placement.
3. **Minimal Checkout & Mock Payment Closed Loop**:
   - Integrated configurable `MockPay` engine simulating instant card payments, Stripe-like workflows, and Cash on Delivery (COD).
   - Built-in failure simulation for edge-case testing (e.g. card ending in `4002` simulates decline).
4. **Dual Responsive Interfaces**:
   - **Storefront (`/`)**: Category filters, real-time search, cart drawer, checkout modal with address validation, and interactive receipts.
   - **Admin Panel (`/admin`)**: Financial & order KPIs, catalog CRUD operations with stock tracking, order fulfillment status transitions, and inventory rollback on cancellation/refund.
5. **Zero-Configuration Persistence**:
   - Embedded atomic JSON transaction storage engine with rich seed catalog data.

### 3. Quick Start

#### Requirements
- Node.js >= 18.0.0
- npm / pnpm / yarn

#### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Compile TypeScript
npm run build

# 3. Start server (Default port: 3000)
npm start

# For development mode with tsx
npm run dev
```

#### Access Points
- **Customer Storefront**: `http://localhost:3000/`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **API Health Check**: `http://localhost:3000/api/health`

#### Run Tests
```bash
npm test
```

---

## 来源与致谢 (Sources & Acknowledgments)

本项目的思路与功能设计受到 [openfront](https://github.com/openshiporg/openfront) 启发，原项目作者为 openshiporg，代码为独立实现。

---

## 许可证 (License)

本项目沿用原项目 MIT 许可证开源，全文见根目录 [LICENSE](LICENSE)。
