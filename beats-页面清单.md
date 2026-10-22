# Beats 业务页面清单（待整理）

> 扫描时间：2026-10-22 23:0x ｜ 仓库：`/Users/qian2/Downloads/ui-prototype` ｜ 远端 main `a8e32a1`
> 扫描方式：全量 HTML 解析（`href` / `data-href` / `data-close-go`）+ 从 `beats/01` 的 BFS 可达性分析
> **目标：拆成 beats / 咖啡 两套独立 UI，本表供 beats 侧逐页核对**

---

## 一、总览

| 目录 | 页数 | 状态 |
|---|---|---|
| `beats/` | 21 | ✅ 全部从首页可达，**0 死链**（唯一干净的一套） |
| `coffee/` | 7 | ⚠️ 内部链接全部指向已删除的 `../demo/` `../draft/`，**9 条死链** |
| `backups/` | 31 | 🗄 归档（浮层已并入父页 / 退役 / 孤立），不在本次整理范围 |

**关键结论**：`beats/` 这 21 页就是当前 beats 业务的全部在用页面，可以直接作为 beats 独立 UI 的基线。

---

## 二、Beats 全部页面链接表（21 页）

| # | 页面链接 | 页面标题 | 功能模块 | 入口来源 | 备注 |
|---|---|---|---|---|---|
| 1 | `beats/01-beats-home.html` | Beats项目售卖机 · 首页 | 首页 | 被 10 页返回引用 | **全站统一首页** |
| 2 | `beats/02-settings-device.html` | 设置 / 本机设置 | 设置 | 首页·更多功能 | ⚠️ 与咖啡**共用** |
| 3 | `beats/03-settings-users.html` | 设置 / 用户和权限 | 设置 | 首页·更多功能 | ⚠️ 与咖啡**共用** |
| 4 | `beats/09-device-info.html` | 设备信息 | 设置 | 02 / 03 互跳 | ⚠️ 与咖啡**共用** |
| 5 | `beats/04-login.html` | 运维模式登录 / 账号 | 登录 | 首页·用户菜单 | ⚠️ 与咖啡**共用** |
| 6 | `beats/05-login-passcode.html` | 运维模式登录 / 口令 | 登录 | 04 切换 | ⚠️ 与咖啡**共用** |
| 7 | `beats/13-vm-ops-overview.html` | 售卖机补货 / 运营总览 | 补货 | 首页·快捷操作 | Beats 独有 |
| 8 | `beats/31-eng-settings.html` | 高级IoT设置 | 工程模式 | 首页·快捷操作 | ⚠️ 与咖啡**共用** |
| 9 | `beats/34-eng-sensors.html` | 传感器状态 | 工程模式 | 31 首项 | Beats 独有 |
| 10 | `beats/35-eng-params.html` | 参数调节 | 工程模式 | 31 次项 | Beats 独有 |
| 11 | `beats/32b-eng-unit-test-lanes.html` | 测试出货 / 货道 | 工程模式 | `backups/32` | Beats 独有 |
| 12 | `beats/36-products.html` | 商品管理 | 商品 | 首页·快捷操作 | Beats 独有（中枢） |
| 13 | `beats/42-products-price-1.html` | 价格管理 | 商品 | 首页 / 36 | Beats 独有 |
| 14 | `beats/45-products-sort-1.html` | 商品排序 | 商品 | 首页 / 36 | Beats 独有 |
| 15 | `beats/49-products-sort-5.html` | SKU 排序 | 商品 | 45 | ⚠️ 页面主标题仍写「分类管理」，**需改** |
| 16 | `beats/53-stats.html` | 统计 | 统计 | 首页·更多功能 | Beats 独有 |
| 17 | `beats/53a-stats-cups.html` | 出杯量 | 统计 | 53 | Beats 独有 |
| 18 | `beats/53b-stats-sales.html` | 销售额 | 统计 | 53 | Beats 独有 |
| 19 | `beats/53c-stats-maintenance.html` | 维护 | 统计 | 53 | Beats 独有 |
| 20 | `beats/53d-stats-log.html` | 操作记录 Log | 统计 | 53 | Beats 独有 |
| 21 | `beats/54-alerts.html` | 告警 | 告警 | 首页·更多功能 + 告警区 | Beats 独有 |

**本地访问前缀**：`http://127.0.0.1:8910/`

---

## 三、按功能模块分组（便于逐块整理）

### 3.1 首页（1 页）
| 链接 | 说明 |
|---|---|
| `beats/01-beats-home.html` | 快捷操作 4 项 + 更多功能 5 项 + 右侧告警区 |

### 3.2 设置（3 页）— 与咖啡共用
| 链接 | 说明 |
|---|---|
| `beats/02-settings-device.html` | 本机设置；含语言切换行（中文/English） |
| `beats/03-settings-users.html` | 用户和权限；修改口令已并入本页浮层 |
| `beats/09-device-info.html` | 设备信息；网络测试/检查更新已并入本页浮层 |

### 3.3 登录（2 页）— 与咖啡共用
| 链接 | 说明 |
|---|---|
| `beats/04-login.html` | 账号密码，屏上键盘 |
| `beats/05-login-passcode.html` | 6 位掩码口令键盘 |

### 3.4 补货（1 页在用）
| 链接 | 说明 |
|---|---|
| `beats/13-vm-ops-overview.html` | 补货浮层栈全部内嵌（15–22 已并入） |

### 3.5 工程模式（4 页在用 + 2 页在 backups）
| 链接 | 位置 | 说明 |
|---|---|---|
| `beats/31-eng-settings.html` | 在用 | 高级IoT设置 hub |
| `beats/34-eng-sensors.html` | 在用 | 传感器状态 |
| `beats/35-eng-params.html` | 在用 | 参数调节 |
| `beats/32b-eng-unit-test-lanes.html` | 在用 | 测试出货·货道 |
| `backups/32-eng-unit-test.html` | **仍在用** | 测试出货 hub（按商品/按货道 Tab） |
| `backups/33-eng-unit-test-running.html` | **仍在用** | 单动测试·运行中 |

### 3.6 商品（4 页在用 + 9 页已退役在 backups）
| 链接 | 位置 | 说明 |
|---|---|---|
| `beats/36-products.html` | 在用 | 商品管理中枢 |
| `beats/42-products-price-1.html` | 在用 | 价格管理 |
| `beats/45-products-sort-1.html` | 在用 | 商品排序（无分类） |
| `beats/49-products-sort-5.html` | 在用 | SKU 排序 |
| `backups/43/44` | 退役 | 改价/键盘（已并入 42 浮层） |
| `backups/46/47/48/50/51` | 退役 | 分类管理 / 标签管理（首页与 36 入口已移除） |

### 3.7 统计（5 页）
| 链接 | 说明 |
|---|---|
| `beats/53-stats.html` | 统计主页（今日/本周/本月/自定义） |
| `beats/53a-stats-cups.html` | 出杯量（折线） |
| `beats/53b-stats-sales.html` | 销售额 |
| `beats/53c-stats-maintenance.html` | 维护记录 |
| `beats/53d-stats-log.html` | 操作记录 Log（筛选+分页） |

### 3.8 告警（1 页）
| 链接 | 说明 |
|---|---|
| `beats/54-alerts.html` | 三 tab（全部/设备类/运营类），支持 `?tab=device` / `?tab=ops` 深链预选 |

---

## 四、两套 UI 的共享页判定（拆分的核心）

| 页面 | beats 需 | 咖啡需 | 建议 |
|---|---|---|---|
| 02 本机设置 | ✅ | ✅ | **两套各留一份**（或抽公共模板） |
| 03 用户和权限 | ✅ | ✅ | 同上 |
| 09 设备信息 | ✅ | ✅ | 同上 |
| 04 登录·账号 | ✅ | ✅ | 同上 |
| 05 登录·口令 | ✅ | ✅ | 同上 |
| 31 高级IoT设置 | ✅ | ✅ | 同上 |
| 13 补货总览 | ✅ | ❌ | Beats 独有 |
| 34/35/32b | ✅ | ❌ | Beats 独有 |
| 36/42/45/49 | ✅ | ❌ | Beats 独有 |
| 53/53a–d、54 | ✅ | ❌ | Beats 独有 |
| 16–21 清洗（6 页） | ❌ | ✅ | 咖啡独有（`coffee/`） |

> **咖啡侧当前状态**：`coffee/01-home.html` 的 9 条出向链接全部指向已删除的 `../demo/` 与 `../draft/`（首页 5 条 + 清洗页 1 条 + 进度页 1 条）——咖啡这套**目前是断的**，拆分时要一并修复指向 `../beats/` 或各自目录。

---

## 五、已发现的待修问题（供整理时逐条勾掉）

| # | 页面 | 问题 | 严重度 |
|---|---|---|---|
| 1 | `beats/49-products-sort-5.html` | `<title>` 是「SKU 排序」但页面主标题仍写「分类管理」 | 中 |
| 2 | `coffee/01-home.html` | 9 条链接指向已删除的 `../demo/` `../draft/` | **高** |
| 3 | `coffee/16/21` | 返回键指向 `../draft/01-beats-home.html`（已删） | **高** |
| 4 | `backups/15–22` | 补货浮层源页，链接指向同目录 `13-vm-ops-overview.html`（该页在 beats/，解析失败） | 中 |
| 5 | `backups/11/12/12b/14` | 咖啡机补货旧版，链接指向同目录 `01-beats-home.html`（已移走） | 中 |
| 6 | `backups/23/24/24b` | 校准页，链接同上 | 中 |
| 7 | `backups/43/44/46/47/48/50/51` | 退役页，链接指向同目录已移走的页面 | 低 |
| 8 | `backups/02b/06/07/08/10` | 链接指向 `../draft/` | 低 |

> 4–8 均为**归档快照**的内部死链，不影响 beats 在线流程；如整轮整理要彻底清零，可一并修。

---

## 六、整理建议（3 个方向待你选）

**方案 A · 目录分离（最轻）**
保持现有 `beats/` `coffee/` 目录，只把咖啡侧的断链修好指向 `../beats/`。改动最小，但两个 UI 仍共享同一批页面文件，谈不上"两套独立"。

**方案 B · 物理复制（最独立）**
`beats/` 保留原样，另建 `coffee2/`（或改名）把 6 个共用页（02/03/09/04/05/31）复制一份给咖啡用，两套彻底独立、可各自演进。代价是共用页后续改动要同步两份。

**方案 C · 抽公共层（最干净）**
共用页抽到 `shared-pages/`，两套各用软链或薄壳页引用；各自再长出自己的独有页。改动量最大，但后续维护成本最低。

---

_本表由全量 HTML 静态解析生成（`href` / `data-href` / `data-close-go` 三种跳转形式全抓），非人工估计。_
