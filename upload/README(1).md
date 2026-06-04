# CoinRich AI · MVP

> AI 驱动的加密货币新闻聚合站 · 飘叔视角 · MCP 入口

## 一键启动

```bash
# 1. 克隆
git clone <repo> coinrichai && cd coinrichai

# 2. 复制环境变量
cp .env.example .env
# 编辑 .env 填入 ANTHROPIC_API_KEY（可选）

# 3. 启动
docker-compose up -d

# 4. 访问
# - Web:        http://localhost:3000
# - API:        http://localhost:8000
# - API 文档:   http://localhost:8000/docs
# - MCP:        http://localhost:8000/api/mcp/manifest
```

## 项目结构

```
coinrichai/
├── apps/
│   ├── api/                  # FastAPI 后端
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── api/          # REST + MCP 路由
│   │   │   ├── services/     # 业务逻辑
│   │   │   └── core/         # 配置、日志
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── web/                  # Next.js 15 前端
│       ├── app/
│       │   ├── page.tsx
│       │   └── layout.tsx
│       ├── components/
│       ├── Dockerfile
│       └── package.json
├── docs/
│   └── TECHNICAL_SPEC.md     # 完整技术方案（团队执行手册）
├── docker-compose.yml        # 一键起
└── README.md
```

## 核心能力

- **实时新闻流** — 4 数据源（CoinDesk / The Block / Hacker News / ArXiv）
- **AI 摘要** — Claude API + 飘叔人设 Prompt
- **情绪分类** — 关键词规则（Phase 2 升级到 AI 模型）
- **行情面板** — CoinGecko 免费 API
- **MCP Server** — 让其他 AI 调用本服务数据
- **用户订阅 / 推送** — Phase 2 接入

## 开发

```bash
# 后端开发
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端开发
cd apps/web
npm install
npm run dev

# 健康检查
curl http://localhost:8000/health
```

## 团队参考

- **完整技术方案**：[docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)
- **4 周 MVP 任务清单**：见 TECHNICAL_SPEC.md 第 11 节
- **飘叔人设 Prompt**：见 `../daily-digest/commentary.py`

## License

MIT
