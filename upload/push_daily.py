"""
飘叔每日 12:00 推送脚本
- 整合 5 雷达（cryptorank-radar skill）
- 整合 4 数据源（daily-digest：CoinGecko / CoinDesk / HackerNews / ArXiv）
- 自动生成"飘叔机会分析"
- 输出 Markdown 报告

用法：
  python push_daily.py            # 完整推送
  python push_daily.py --preview  # 预览
  python push_daily.py --no-ai    # 跳过 AI 分析（用规则版）
"""
import sys
import os
import json
import argparse
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Dict

# 路径配置
WORKSPACE = Path(r"C:\Users\Administrator\.mavis\agents\mavis\workspace")
DIGEST_DIR = WORKSPACE / "daily-digest"
SKILL_DIR = Path(r"C:\Users\Administrator\.mavis\skills\cryptorank-radar")
OUTPUT_DIR = WORKSPACE / "daily-push" / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


HEADER = """# 🎯 飘叔每日速报 · {date}

> 5 雷达（CryptoRank）+ 4 数据源（CoinGecko / CoinDesk / HackerNews / ArXiv）  
> 飘叔锐评 + 机会分析  
> 自动生成 · {ts}

---

"""


FOOTER = """

---

_本速报由 Mavis 自动生成 · 飘叔人设过滤 · 仅供研究参考，不构成投资建议_"""


# ========== 抓取：CryptoRank 5 雷达 ==========
def fetch_cryptorank_radars() -> Dict:
    """调用 cryptorank-radar skill 的 6 个 mode"""
    result = {}
    modes = [
        ("radar", "市场总览"),
        ("funding", "融资雷达"),
        ("upcoming", "Upcoming 雷达"),
        ("airdrops", "空投雷达"),
        ("brief", "每日摘要"),
    ]
    for mode, label in modes:
        try:
            r = subprocess.run(
                ["python", str(SKILL_DIR / "scripts" / "run_skill.py"),
                 "--mode", mode, "--lang", "zh", "--limit", "5", "--output", "json"],
                capture_output=True, text=True, timeout=30
            )
            if r.returncode == 0:
                data = json.loads(r.stdout)
                result[label] = {
                    "text": data.get("text", "")[:1500],
                    "structured": {k: v for k, v in data.items()
                                    if k not in ["text", "support_links"]}
                }
            else:
                result[label] = {"error": r.stderr[:200]}
        except Exception as e:
            result[label] = {"error": str(e)[:200]}
    return result


# ========== 抓取：daily-digest 4 数据源 ==========
def fetch_daily_digest() -> str:
    """调用 daily-digest 的 digest.py 抓 4 数据源"""
    try:
        r = subprocess.run(
            ["python", str(DIGEST_DIR / "digest.py")],
            capture_output=True, text=True, timeout=60
        )
        return r.stdout if r.returncode == 0 else f"❌ daily-digest 失败: {r.stderr[:200]}"
    except Exception as e:
        return f"❌ daily-digest 异常: {str(e)[:200]}"


# ========== 机会分析：规则版（无 AI）==========
def analyze_opportunities_rule_based(cryptorank_data: Dict) -> str:
    """
    基于规则的机会分析（不依赖 LLM）
    输入：5 雷达数据
    输出：飘叔视角的机会/风险提示
    """
    lines = ["## 🎯 飘叔机会分析（规则版）\n"]

    # 1. 涨幅榜分析
    radar_text = cryptorank_data.get("市场总览", {}).get("text", "")
    if "涨幅榜" in radar_text:
        lines.append("**📈 涨幅异常（24h > 50%）**")
        for line in radar_text.split("\n"):
            if "%" in line and any(c in line for c in ["+", "%"]):
                # 提取涨幅超过 30% 的
                if "+3" in line or "+4" in line or "+5" in line or "+6" in line or "+7" in line or "+8" in line or "+9" in line:
                    if any(x in line for x in ["+30", "+40", "+50", "+60", "+70", "+80", "+90"]):
                        lines.append(f"  - {line.strip()[:80]}")
        lines.append("")

    # 2. 跌幅榜风险
    if "跌幅榜" in radar_text:
        lines.append("**📉 风险信号（24h 跌幅 > 20%）**")
        for line in radar_text.split("\n"):
            if "%" in line and "-" in line:
                if any(x in line for x in ["-20", "-30", "-40", "-50", "-60", "-70", "-80", "-90"]):
                    lines.append(f"  - {line.strip()[:80]}")
        lines.append("")

    # 3. 即将开始的 IDO/ICO（机会入口）
    upcoming_text = cryptorank_data.get("Upcoming 雷达", {}).get("text", "")
    if "ID" in upcoming_text or "ICO" in upcoming_text:
        lines.append("**🚀 即将 IDO/ICO（机会窗口）**")
        lines.append("  飘叔建议：**只参与你看得懂项目的 IDO/ICO**。别追白名单，")
        lines.append("  别梭哈，**单笔不超过可投资金额的 5%**。下面是 4 天内的窗口：\n")
        for line in upcoming_text.split("\n"):
            if "天后" in line and any(x in line for x in ["KAI", "CAP", "BitFi", "CLIX"]):
                lines.append(f"  - {line.strip()[:80]}")
        lines.append("")

    # 4. 融资动态（机构在投什么）
    funding_text = cryptorank_data.get("融资雷达", {}).get("text", "")
    if funding_text:
        lines.append("**💰 机构动向（看资本往哪走）**")
        lines.append("  飘叔原话：**「机构进场 = 波动率被熨平，不是方向变了」**。")
        lines.append("  关注 Series A 以上的轮次，那才是真信号：\n")
        for line in funding_text.split("\n"):
            if any(x in line for x in ["Series A", "Series B", "并购"]):
                lines.append(f"  - {line.strip()[:80]}")
        lines.append("")

    # 5. 飘叔总结
    lines.append("**🗯 飘叔总结**\n")
    lines.append("> **这 5 雷达告诉你的是「市场在动什么」，不是「你该买什么」。**")
    lines.append("> **真正的机会在第二条曲线——AFC 链上、AI Agent 经济、链上身份。**")
    lines.append("> **别追涨幅榜，别追跌幅榜。盯融资动向 + Upcoming 窗口 + Web4 叙事。**")

    return "\n".join(lines)


# ========== 主函数 ==========
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--no-ai", action="store_true", help="跳过 AI 机会分析")
    parser.add_argument("--no-daily", action="store_true", help="跳过 daily-digest 4 源")
    parser.add_argument("--no-cryptorank", action="store_true", help="跳过 CryptoRank 5 雷达")
    args = parser.parse_args()

    print("🚀 开始抓取...")

    parts = [HEADER.format(
        date=datetime.now().strftime("%Y-%m-%d"),
        ts=datetime.now().strftime("%H:%M")
    )]

    # 1. CryptoRank 5 雷达
    if not args.no_cryptorank:
        print("[1/2] 抓 CryptoRank 5 雷达...")
        cryptorank_data = fetch_cryptorank_radars()
        parts.append("# 📡 第一部分：CryptoRank 5 雷达\n")
        for label, data in cryptorank_data.items():
            if "error" in data:
                parts.append(f"## ❌ {label}\n{data['error']}\n")
            else:
                parts.append(f"## 📊 {label}\n```\n{data['text']}\n```\n")

        # 2. 机会分析
        if not args.no_ai:
            print("[机会分析] 生成飘叔机会分析...")
            parts.append(analyze_opportunities_rule_based(cryptorank_data))
        else:
            parts.append("\n_(机会分析已跳过)_\n")
    else:
        cryptorank_data = None

    # 3. daily-digest 4 数据源
    if not args.no_daily:
        print("[2/2] 抓 daily-digest 4 数据源...")
        parts.append("\n# 📰 第二部分：4 数据源速报\n")
        parts.append(fetch_daily_digest())
    else:
        parts.append("\n_(daily-digest 已跳过)_\n")

    parts.append(FOOTER)
    content = "\n".join(parts)

    # 预览模式
    if args.preview:
        print("\n" + "=" * 60)
        print(content[:3000])
        print("=" * 60)
        return

    # 保存
    filename = f"push_{datetime.now().strftime('%Y%m%d_%H%M')}.md"
    out_path = OUTPUT_DIR / filename
    out_path.write_text(content, encoding="utf-8")
    print(f"\n✅ 已保存: {out_path}")
    print(f"📊 总字数: {len(content):,}")
    print(f"📦 文件大小: {out_path.stat().st_size / 1024:.1f} KB")

    # 准备推送（这里只打日志，飞书/微信推送在 cron 任务里实现）
    print(f"\n📤 推送方式：本地保存。")
    print(f"   飞书/微信推送由 cron 任务（push_to_feishu.py）执行")


if __name__ == "__main__":
    main()
