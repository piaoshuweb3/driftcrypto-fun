# coinrichai 类 AI 新闻聚合站 · 技术方案与执行手册

> 版本：v1.0 · 2026-06-04
> 目标：4 周可上线的 MVP，技术栈全球最先进

---

## 0. 项目目标

**做一个 AI 驱动的加密货币/AI 新闻聚合站，对标 CryptoPanic，差异化在"飘叔人格化锐评"和"MCP 入口"**。

### 核心能力清单（MVP 必须）

- [ ] 实时新闻流（10+ 源聚合，去重、按时间线）
- [ ] AI 摘要 + 情绪标签（每条新闻 3 句摘要 + 看多/看空/中性）
- [ ] 行情面板（BTC/ETH/主流币 + AI 代币板块）
- [ ] 恐惧贪婪指数（每日聚合）
- [ ] 用户系统（邮箱 + OAuth）
- [ ] 个性化订阅（关注币种/话题/KOL）
- [ ] 飞书/微信/Telegram 推送
- [ ] MCP Server 入口（让其他 AI 能调我们的数据）

### 非 MVP（Phase 2+）

- 付费墙、API 出口、Webhook、链上身份集成、移动端 App

---

## 1. 技术栈总览

| 层 | 选型 | 理由 |
|----|------|------|
| **前端框架** | Next.js 15 + React 19 | SSR/ISR 完美适配新闻 SEO，App Router 现代化 |
| **UI** | shadcn/ui + TailwindCSS 4 + Framer Motion | 可复制源码 + 现代化 |
| **后端 API** | FastAPI (Python 3.12) | 异步原生 + AI 库无缝集成 |
| **爬虫引擎** | Scrapling + Crawlee + Playwright | 静态/反爬/动态全覆盖 |
| **任务队列** | Celery + Redis | 成熟稳定 |
| **关系型 DB** | PostgreSQL 16 | 用户、订阅、配置 |
| **缓存** | Redis 7 | 实时价格、热点新闻 |
| **向量库** | Qdrant | 新闻嵌入 + RAG |
| **AI 编排** | LangGraph | Agent 图编排 |
| **LLM** | Claude Sonnet 4（摘要/锐评） + 本地模型（情绪分类） | 飘叔锐评必须用大模型 |
| **认证** | Auth.js (NextAuth) + JWT | 邮箱 + OAuth |
| **部署** | Cloudflare Pages + Workers + R2 | 全球边缘、零运维 |
| **监控** | Sentry + Grafana + Prometheus | 错误追踪 + 性能监控 |
| **CI/CD** | GitHub Actions | 免费、稳定 |

---

## 2. 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                       用户层                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Web (Next.js) │  │ 移动端 (PWA)    │  │ 飞书 / 微信  │  │
│  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘  │
└───────────┼──────────────────┼──────────────────┼──────────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Edge (Cloudflare)                          │
│  · CDN  · WAF  · DDoS  · Rate Limit                          │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway (FastAPI + Hono Edge)               │
│  · REST  · WebSocket  · MCP Server  · Auth                   │
└──────────┬─────────────┬─────────────┬─────────────┬────────┘
           │             │             │             │
           ▼             ▼             ▼             ▼
    ┌──────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  抓取引擎  │   │ AI 引擎  │  │  推送引擎  │  │  任务队列  │
    │ Scrapling │   │ LangGraph │  │   Celery  │  │  Redis    │
    │  +RSS    │   │ +Claude  │  │           │  │           │
    └─────┬────┘   └────┬─────┘  └─────┬────┘  └─────┬────┘
          │              │              │              │
          └──────────────┴──────────────┴──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       数据层                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Postgres │  │  Redis   │  │  Qdrant  │  │  S3/R2   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 目录结构

```
coinrichai/
├── apps/
│   ├── web/                      # Next.js 15 前端
│   │   ├── app/                  # App Router
│   │   ├── components/
│   │   ├── lib/
│   │   └── public/
│   └── api/                      # FastAPI 后端
│       ├── app/
│       │   ├── api/
│       │   │   ├── news/         # 新闻接口
│       │   │   ├── prices/       # 行情接口
│       │   │   ├── ai/           # AI 摘要接口
│       │   │   └── mcp/          # MCP Server
│       │   ├── core/             # 配置、日志、依赖
│       │   ├── db/               # 数据库连接
│       │   ├── models/           # ORM 模型
│       │   ├── schemas/          # Pydantic schemas
│       │   ├── services/         # 业务逻辑
│       │   └── main.py
│       └── tests/
├── packages/
│   ├── shared/                   # 前后端共享类型
│   └── prompts/                  # AI Prompt 模板
├── scrapers/                     # 抓取引擎
│   ├── sources/                  # 各数据源抓取器
│   ├── pipelines/                # 清洗、向量化
│   └── scheduler/                # APScheduler 调度
├── infra/
│   ├── docker/                   # Dockerfile
│   ├── compose/                  # docker-compose
│   └── terraform/                # IaC
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── API.md
└── README.md
```

---

## 4. 数据库 Schema (核心表)

```sql
-- 用户
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT,
    oauth_provider VARCHAR(20),
    oauth_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 新闻
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(50) NOT NULL,         -- 'coindesk' / 'theblock' / etc.
    external_id VARCHAR(255) NOT NULL,      -- 原站 ID
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,                            -- 原文摘要
    ai_summary TEXT,                         -- AI 生成
    sentiment VARCHAR(20),                   -- bullish/bearish/neutral
    language VARCHAR(10) DEFAULT 'en',
    published_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB,                          -- 标签、图片等
    content_hash VARCHAR(64) UNIQUE,         -- 去重
    embedding VECTOR(1024)                   -- Qdrant 同步
);
CREATE INDEX idx_news_published ON news(published_at DESC);
CREATE INDEX idx_news_source ON news(source_id);
CREATE INDEX idx_news_sentiment ON news(sentiment);

-- 行情快照
CREATE TABLE prices (
    coin_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    usd_price DECIMAL(20, 8) NOT NULL,
    change_24h DECIMAL(10, 4),
    volume_24h DECIMAL(30, 2),
    market_cap DECIMAL(30, 2),
    recorded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_prices_coin_time ON prices(coin_id, recorded_at DESC);

-- 用户订阅
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    coin_ids TEXT[],                         -- 关注的币
    keywords TEXT[],                         -- 关键词
    sources TEXT[],                          -- 关注的源
    sentiment_filter VARCHAR(20),            -- bullish/bearish/all
    push_channels JSONB,                     -- {feishu: bool, wechat: bool, ...}
    push_schedule VARCHAR(50),               -- 'daily_12:00' / 'realtime'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 推送日志
CREATE TABLE push_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    channel VARCHAR(20),
    content_hash VARCHAR(64),
    sent_at TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(20),
    error_message TEXT
);
```

---

## 5. 核心 API 设计

### REST API（OpenAPI 3.0）

```
GET  /api/news
  ?source=coindesk
  &sentiment=bullish
  &q=AI agent
  &from=2026-06-01
  &to=2026-06-04
  &page=1
  &size=20
  → { items: [...], total: 1234, has_more: true }

GET  /api/news/{id}
  → { id, title, ai_summary, sentiment, ... }

GET  /api/prices
  ?coins=bitcoin,ethereum,solana
  → { bitcoin: {usd, change_24h, ...}, ... }

GET  /api/sentiment/fear-greed
  → { value: 28, label: "Fear", updated_at: "..." }

POST /api/subscribe
  body: { coin_ids, keywords, push_channels, ... }
  → { subscription_id }

POST /api/auth/login
POST /api/auth/callback/{provider}
```

### WebSocket

```
WS /ws/prices
  → server push: { coin: "bitcoin", usd: 64000, ts: 1234567890 }

WS /ws/news
  → server push: { id, title, summary, source, ts }
```

### MCP Server

```python
@mcp.tool()
def search_news(query: str, max_items: int = 20) -> str:
    """搜索新闻"""
    ...

@mcp.tool()
def get_coin_price(coin: str) -> str:
    """获取币种当前价格"""
    ...

@mcp.tool()
def get_fear_greed_index() -> str:
    """获取恐惧贪婪指数"""
    ...
```

---

## 6. 抓取策略

### 数据源优先级

| 优先级 | 源 | 抓取方式 | 频率 |
|--------|------|----------|------|
| P0 | CoinDesk RSS | feedparser | 5min |
| P0 | The Block RSS | feedparser | 5min |
| P0 | Decrypt RSS | feedparser | 5min |
| P0 | CoinGecko API | REST | 1min |
| P0 | CryptoPanic API | REST | 1min |
| P1 | Cointelegraph | Scrapling | 15min |
| P1 | 36氪 AI 板块 | Scrapling | 15min |
| P1 | Hacker News（AI/Web3 话题） | HN API | 5min |
| P1 | ArXiv cs.AI/cs.CR | ArXiv API | 1h |
| P2 | Twitter/X 大V | Apify / 本地浏览器 | 30min |
| P2 | 微博热搜 | Scrapling | 10min |
| P2 | Reddit r/CryptoCurrency | Pushshift | 10min |

### 反爬策略

```python
# 配置示例 (scrapers/sources/coindesk.py)
SCRAPER_CONFIG = {
    "fetcher": "scrapling",
    "adaptive": True,           # 自适应选择器
    "auto_save": True,          # 保存元素指纹
    "rate_limit": "1s",         # 每次请求间隔
    "user_agent_rotation": True,
    "proxy_pool": "webshare",   # 代理池
    "retry": 3,
    "timeout": 15,
}
```

---

## 7. AI 处理流程

### 摘要流程

```
新闻原文 (500-2000 字)
  ↓
[清洗] 去 HTML / 标准化空白
  ↓
[分块] 按段落切分（如果太长）
  ↓
[Prompt] 飘叔锐评 Prompt（你已写在 commentary.py）
  ↓
Claude API
  ↓
[后处理] 验证长度 / 提取情绪标签
  ↓
[存储] ai_summary 字段
```

### 情绪分析（双轨）

```python
# 方案 A：本地模型（零成本，适合量大）
from transformers import pipeline
sentiment = pipeline("sentiment-analysis", 
                     model="cardiffnlp/twitter-roberta-base-sentiment-latest")

# 方案 B：Claude API（适合需要上下文的）
# 在 Prompt 里加一行："请同时输出情绪标签（bullish/bearish/neutral）"
```

### 锐评 Prompt 模板

```python
PPIAOSHU_COMMENTARY = """
你是飘叔（Piaoshu），10 年全栈，AFC 公链核心设计者，PoRC 共识发明者。
风格：短句、断言、禁用"赋能/闭环/抓手/痛点"等 AI 腔。
价值观：去中心化优先、极致务实、代码即人格。

任务：基于以下新闻内容，输出一段 100-200 字的锐评。

新闻标题：{title}
新闻内容：{content}

要求：
1. 开门见山，先给判断
2. 至少一处质疑主流叙事
3. 至少一处对 Web4/AFC 项目的启示
4. 结尾给一个明确的"飘叔会怎么做"

不要用：
"赋能/闭环/抓手/痛点/生态化反/对齐/颗粒度"
"正能量/大局为重/我觉得可能"
"此外/与此同时"
"""
```

---

## 8. 推送流程

### 调度

```python
# scrapers/scheduler/jobs.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler()

# 每天 12:00 推送
@scheduler.scheduled_job(CronTrigger(hour=12, minute=0))
async def daily_push():
    digest = await build_digest()
    users = await get_subscribed_users(schedule="daily_12:00")
    for user in users:
        await push_to_user(user, digest)

# 异动推送（价格 > 5%）
@scheduler.scheduled_job(CronTrigger(minute="*/5"))
async def price_alert():
    alerts = await check_price_changes(threshold=5.0)
    for alert in alerts:
        await push_to_subscribers(alert)
```

### 推送通道

| 通道 | 难度 | 实现 |
|------|------|------|
| 飞书 | ⭐⭐ | lark-im MCP（已有） |
| 微信 | ⭐⭐⭐ | 公众号模板消息 / 服务号 |
| Telegram | ⭐ | Bot API |
| Email | ⭐ | Resend / SendGrid |
| Webhook | ⭐ | 自定义 HTTP POST |

---

## 9. 部署架构

### 开发环境（一键起）

```bash
docker-compose up -d
```

包含：
- PostgreSQL 16
- Redis 7
- Qdrant
- API (FastAPI)
- Scraper Worker
- Frontend (Next.js dev)

### 生产环境

```
Cloudflare Pages  ── 托管 Next.js 静态构建
Cloudflare Workers ── 边缘 API 路由
Cloudflare R2      ── 静态资源
Hetzner VPS        ── Postgres + Redis + Qdrant + API
GitHub Actions     ── CI/CD
```

---

## 10. 安全 & 合规

### 必须做的

- [ ] HTTPS 强制（Cloudflare 自动）
- [ ] Rate Limiting（每 IP 每分钟 60 次）
- [ ] CORS 白名单
- [ ] 密钥管理（`.env` + GitHub Secrets）
- [ ] 用户数据加密（敏感字段 bcrypt）
- [ ] robots.txt 遵守（爬虫礼节）
- [ ] 免责声明：网站内容仅供参考，不构成投资建议

### 不要做的

- [ ] 不要爬取登录后内容
- [ ] 不要绕过 robots.txt
- [ ] 不要存储用户密码明文
- [ ] 不要把数据卖给第三方

---

## 11. 4 周 MVP 任务清单

### Week 1：抓取引擎 + 数据底座

**目标**：能跑通 `GET /api/news` 返回结构化数据

- [ ] Day 1-2: 部署 Postgres + Redis + Qdrant（docker-compose）
- [ ] Day 2-3: 接入 5 个核心源（CoinDesk / The Block / Decrypt / CoinGecko / CryptoPanic）
- [ ] Day 3-4: 抓取 → 清洗 → 入库完整管道
- [ ] Day 4-5: 写 `GET /api/news` REST 接口
- [ ] Day 5:    OpenAPI 文档（FastAPI 自动生成）

**交付**：能 ping 接口拿到 100+ 条新闻

### Week 2：AI 摘要 + 情绪分析

**目标**：每条新闻自动有 AI 摘要 + 情绪标签

- [ ] Day 1-2: 接入 Claude API + Prompt 模板
- [ ] Day 2-3: 飘叔锐评生成（用你的 commentary.py）
- [ ] Day 3-4: 情绪分类（本地模型 + Claude 双轨）
- [ ] Day 4-5: 恐惧贪婪指数计算
- [ ] Day 5:    批量回填历史新闻

**交付**：每条新闻都有 ai_summary + sentiment 字段

### Week 3：前端 + 用户系统

**目标**：可访问的 Web 站点

- [ ] Day 1-2: Next.js 15 + shadcn/ui 骨架
- [ ] Day 2-3: 首页：实时新闻流 + 行情面板 + AI 锐评
- [ ] Day 3-4: 详情页：单条新闻 + 情绪可视化
- [ ] Day 4-5: 用户系统（邮箱 + OAuth）
- [ ] Day 5:    关注 / 收藏功能

**交付**：能登录、浏览、关注的 Web 站

### Week 4：推送 + 部署

**目标**：上线 + 飞书定时推送

- [ ] Day 1-2: 飞书/Telegram 推送
- [ ] Day 2-3: 调度系统（APScheduler）
- [ ] Day 3-4: Cloudflare 部署
- [ ] Day 4:    SEO 优化（sitemap / metadata）
- [ ] Day 5:    上线 + 监控

**交付**：生产环境可访问 + 12:00 准时推送

---

## 12. 团队分工建议（3-4 人）

| 角色 | 人数 | 职责 |
|------|------|------|
| **全栈 / Tech Lead** | 1 | 架构、API、爬虫、AI 集成 |
| **前端** | 1 | Next.js 15、shadcn/ui、PWA |
| **后端 / DevOps** | 1 | FastAPI、Postgres、Redis、Qdrant、CI/CD |
| **产品 / 内容** | 1（可兼职）| 数据源策略、Prompt 调优、用户运营 |

如果只有 1-2 人：全栈主导，AI 集成和前端并行；数据源慢慢加，别一开始就铺 50 个。

---

## 13. 关键风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 反爬升级 | 数据源断流 | 自适应选择器 + 代理池 + 多源备份 |
| LLM 成本失控 | 月成本超支 | 缓存（24h 内不重复摘要）+ 限流（每用户每天 50 条） |
| Postgres 性能瓶颈 | 查询慢 | 索引 + 物化视图 + 读写分离 |
| Qdrant 内存爆炸 | 宕机 | 按月分片 + 自动清理 |
| Cloudflare 限流 | 边缘 429 | 加 Workers Paid Plan（$5/月起） |

---

## 14. 成本估算

### MVP 阶段（月成本）

| 项 | 成本 |
|----|------|
| Hetzner VPS（4C8G） | $40 |
| Cloudflare（Free → Paid） | $5-50 |
| Anthropic API | $50-200 |
| Qdrant Cloud | $25 |
| 代理池（Webshare） | $5 |
| 域名 | $12/年 |
| **总计** | **$130-330/月** |

### 用户增长到 1 万 DAU 时

| 项 | 成本 |
|----|------|
| Hetzner → 8C16G + 2 副本 | $150 |
| Cloudflare Workers Paid | $50 |
| Anthropic API | $200-500 |
| Qdrant | $50 |
| 代理池 | $50 |
| **总计** | **$500-1000/月** |

---

## 15. 关键决策点（**飘叔建议直接定**）

### 决策 1：用户系统要不要做？

- **做（推荐）**：邮箱 + GitHub OAuth
- 不做：纯信息站

飘叔建议：**做**。否则没法做订阅、推送、MCP 鉴权。

### 决策 2：移动端做不做？

- **PWA（推荐）**：零成本，覆盖 80% 场景
- RN/Flutter：成本翻倍

飘叔建议：**PWA**。MVP 阶段别碰原生。

### 决策 3：付费墙做不做？

- **不做（推荐）**：MVP 阶段只做免费版
- 做：Pro 会员、高级数据、API 出口

飘叔建议：**不做**。先把 DAU 拉起来，再谈变现。

### 决策 4：是否上链？

- **不上（推荐）**：先用 Web2 跑通
- 上：AFC 链上身份、链上订阅

飘叔建议：**MVP 不上链**。等 DAU 验证后再做链上身份集成，否则只是给 Web3 加个币价表。

---

## 16. 验收标准

MVP 算"完成"的硬指标：

- [ ] 30+ 数据源持续抓取，断流 < 5%
- [ ] API P95 < 200ms
- [ ] 100% 新闻有 AI 摘要（10s 内）
- [ ] 飞书推送 12:00 准时率 100%
- [ ] Cloudflare 全球 P95 < 500ms
- [ ] 月成本 < $300

---

**飘叔最后一句**：

> **能跑就行。崩了就修。修不动就重构。**
> **但首先，你得开始。**
> **这个文档就是你的"开始"。**
> **剩下的，交给你的团队。**
