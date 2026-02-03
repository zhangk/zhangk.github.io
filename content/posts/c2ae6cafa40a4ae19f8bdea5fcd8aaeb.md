---
title: Android 9.0 电量低于15%自动开启省电模式修改方案
slug: c2ae6cafa40a4ae19f8bdea5fcd8aaeb
tags:
  - aosp
  - android
date: 2025-07-02T08:26:35.249Z
---

## 修改目的

设置系统在电池电量降至15%时自动触发低电量模式（省电模式）

## 修改文件

1. `packages/SettingsProvider/res/values/defaults.xml`
2. `packages/SettingsProvider/src/com/android/providers/settings/DatabaseHelper.java`

## 修改内容详解

### 1. 定义默认阈值 (defaults.xml)

```diff
@@ -228,4 +228,5 @@
     <integer name="swipe_up_to_switch_apps_enabled">0</integer>
        <!-- Default to show battery percaent on statusbar -->
        <integer name="def_show_battery_percent">1</integer>
+       <integer name="low_power_trigger_level">15</integer>
 </resources>
```

**作用**：

- 创建名为 `low_power_trigger_level` 的整型资源

- 设置默认阈值为 `15` (表示15%电量)

### 2. 加载阈值设置 (DatabaseHelper.java)

```diff
@@ -2637,6 +2637,7 @@ class DatabaseHelper extends SQLiteOpenHelper {
 
              
             loadIntegerSetting(stmt, Global.HEADS_UP_NOTIFICATIONS_ENABLED,
                     R.integer.def_heads_up_enabled);


+            loadIntegerSetting(stmt, Settings.Global.LOW_POWER_MODE_TRIGGER_LEVEL, R.integer.low_power_trigger_level);
 
              
             loadSetting(stmt, Settings.Global.DEVICE_NAME, getDefaultDeviceName());
```

**关键参数**：

- `Settings.Global.LOW_POWER_MODE_TRIGGER_LEVEL`：系统全局的低电量模式触发阈值键值

- `R.integer.low_power_trigger_level`：关联到 defaults.xml 中定义的阈值

**功能说明**：\
在系统设置数据库初始化时，将默认阈值加载到全局设置中

## 实现效果

1. 当设备电量降至15%时：

   - 系统自动进入低功耗模式

   - CPU频率限制生效

   - 后台活动受限

   - 视觉效果简化（如动画减少）
2. 设置验证路径：

   ```text
   设置 → 电池 → 电池优化 → 低电量模式触发阈值
   ```

## 注意事项

1. **阈值范围**：有效值为 0-100，建议设置在 5-20 之间

2. **系统兼容性**：

   - 仅适用于 Android 5.0+ (API 21+)

   - 需确认设备硬件支持省电模式

3. **用户覆盖**：

   - 用户仍可在设置中手动修改阈值

   - 用户设置的优先级高于此默认值

4. **充电行为**：

   - 设备充电至15%以上时自动退出省电模式

   - 充电至设定阈值+5%（默认20%）时完全恢复性能

5. **电源管理**：需配合以下系统服务协同工作：

   java

   ```
   PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
   powerManager.setPowerSaveModeEnabled(true);
   ```

## 验证方法

1. 通过ADB命令检查设置值：

   ```bash
   adb shell settings get global low_power_mode_trigger_level
   ```

   预期返回值：`15`

2. 模拟电量变化测试：

   ```bash
   adb shell dumpsys battery unplug  # 断开充电
   adb shell dumpsys battery set level 14  # 设置电量14%
   ```

   观察系统日志中是否出现：

   ```text
   PowerManagerService: Low power mode enabled...
   ```

## 补充说明

若需要完全禁用用户修改，需额外修改：

```java
// 在SettingsProvider中重写isKeyModifiable()方法
@Override
protected boolean isKeyModifiable(String key) {
    if (Settings.Global.LOW_POWER_MODE_TRIGGER_LEVEL.equals(key)) {
        return false; // 禁止用户修改
    }
    return super.isKeyModifiable(key);
}
```
