# 多语言文案表 · 校准模块（draft-23 / 24 / 24b）

> 范围：仅界面 UI 文案；商品相关（商品名 / SKU / 分组 / 标签）不翻译。
> key 命名：`模块.页面.元素`，含 `{n}` 的为参数化文案（数字/单位运行时填入）。
> 状态：🟦 待评审

## 23 · 校准主页（23-calibration.html）

| key | 位置 | 中文 | English | 备注 |
|---|---|---|---|---|
| common.back_home | 顶部栏按钮 | ← 返回首页 | ← Back to Home | 通用 |
| cal.page_title | 顶部栏标题 | 校准 | Calibration | |
| cal.section_items | 区块标题 | 校准项目 | Calibration Items | |
| cal.item_grind | Hero 卡 | 研磨粉校准 | Grounds Calibration | |
| cal.last_calibrated | 卡片小字 | 上次校准：{time} | Last calibrated: {time} | 参数化时间 |
| cal.item_water | 网格卡 | 水量校准 | Water Volume Calibration | |
| cal.item_powder | 网格卡 | 粉盒 {n} 校准 | Powder Canister {n} Calibration | 参数化，n=1–5 |
| cal.item_generic | 网格卡 | 校准项目 {n} | Calibration Item {n} | 参数化，n=8–10 |
| cal.value_empty | 占位值 | -- | -- | 无需翻译 |

## 24 · 研磨量校准（24-calibration-grind.html）

| key | 位置 | 中文 | English | 备注 |
|---|---|---|---|---|
| cal.back_cal | 顶部栏按钮 | ← 返回校准 | ← Back to Calibration | |
| cal.grind_title | 顶部栏标题 | 研磨量校准 | Grind Dose Calibration | |
| cal.warn_title | 警告卡前缀 | 校验警告 | Warning | |
| cal.warn_text | 警告卡正文 | 请先确认渣盒已清空。 | Please make sure the waste bin is empty. | |
| cal.start | 开关标签 | 启动 | Start | |
| cal.weight_title | 区块标题 | 研磨粉的重量 (g) | Ground Coffee Weight (g) | |
| cal.run_n | 称重卡标签 | 第一次 / 第二次 / 第三次 | Run 1 / Run 2 / Run 3 | 3 条独立 key |
| cal.enter_weight | 按钮 | 输入重量 | Enter Weight | |
| cal.method_title | 步骤标题 | 校验方法 | Calibration Procedure | |
| cal.method_1 | 步骤 1 | 测空渣盒。 | Weigh the empty waste bin. | |
| cal.method_2 | 步骤 2 | 点击「启动」磨豆机工作。 | Tap "Start" to run the grinder. | |
| cal.method_3 | 步骤 3 | 称量并依次输入三次研磨粉重量。 | Weigh and enter the grounds weight for each of the 3 runs. | |
| cal.method_4 | 步骤 4 | 系统提示完成后，点击「保存」。 | When prompted, tap "Save". | |
| common.cancel | 底部按钮 | 取消 | Cancel | 通用 |
| common.save | 底部按钮 | 保存 | Save | 通用 |

## 24b · 水料校准 / 水量校准（24b-calibration-water.html）

| key | 位置 | 中文 | English | 备注 |
|---|---|---|---|---|
| cal.wp_title | 头部标题 | 水料校准 | Water & Powder Calibration | |
| cal.back_ops | 头部右侧 | 返回运维界面 ← | Back to Operations ← | |
| cal.tab_water | Tab | 水量校准 | Water Volume | |
| cal.tab_powder_1 | Tab | 粉盒校准（一） | Powder Canister 1 | |
| cal.tab_powder_2 | Tab | 粉盒校准（二） | Powder Canister 2 | |
| cal.tab_grinder | Tab | 磨豆校准 | Grinder | |
| cal.kicker | 小标 | CALIBRATION / 01 | CALIBRATION / 01 | 不翻译 |
| cal.water_title | 大标题 | 水量校准 | Water Volume Calibration | |
| cal.water_count | 右上计数 | 共 5 个水量基准 | 5 volume references | 数字参数化：共 {n} 个水量基准 → {n} volume references |
| cal.water_card_title | 卡片标题 | 校准 {n} mL | Calibrate {n} mL | 参数化，n=60/70/90/120/150 |
| cal.target_output | 输入标签 | 目标出水量 | Target Output | |
| cal.water_note | 卡内提示 | 请以实际出水量 {n} mL 为准 | Use the actual dispensed volume ({n} mL) as reference. | 参数化 |
| cal.test | 按钮 | 测试 | Test | |
