<template>
  <n-config-provider :theme="null" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-loading-bar-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <div id="app">
              <router-view />
            </div>
          </n-dialog-provider>
        </n-notification-provider>
      </n-loading-bar-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { reactive } from "vue";

// Naive UI 主题覆盖 - 统一为 Tailwind Dashboard 风格
const themeOverrides = reactive({
  common: {
    primaryColor: "#4F46E5",
    primaryColorHover: "#4338CA",
    primaryColorPressed: "#3730A3",
    primaryColorSuppl: "#4F46E5",
    borderRadius: "0.5rem",
    borderRadiusSmall: "0.375rem",
    fontFamily:
      '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: "14px",
    fontSizeMedium: "14px",
    fontSizeLarge: "16px",
    heightMedium: "40px",
    heightLarge: "44px",
  },
  Card: {
    borderRadius: "0.5rem",
    paddingMedium: "20px",
    titleFontSizeMedium: "16px",
    titleFontWeight: "600",
    borderColor: "#E5E7EB",
  },
  Button: {
    borderRadiusMedium: "0.375rem",
    borderRadiusSmall: "0.25rem",
    borderRadiusLarge: "0.5rem",
    heightMedium: "38px",
    fontSizeMedium: "14px",
    fontWeight: "500",
  },
  DataTable: {
    borderColor: "#E5E7EB",
    thColor: "#F9FAFB",
    thTextColor: "#374151",
    tdTextColor: "#4B5563",
    thFontWeight: "600",
    borderRadius: "0.5rem",
    fontSizeMedium: "14px",
  },
  Modal: {
    borderRadius: "0.75rem",
    titleFontSize: "18px",
    titleFontWeight: "600",
  },
  Input: {
    borderRadius: "0.375rem",
    heightMedium: "38px",
    borderFocus: "1px solid #4F46E5",
    borderHover: "1px solid #A5B4FC",
    boxShadowFocus: "0 0 0 2px rgba(79, 70, 229, 0.15)",
  },
  Select: {
    borderRadius: "0.375rem",
    heightMedium: "38px",
    peers: {
      InternalSelection: {
        borderRadius: "0.375rem",
        heightMedium: "38px",
      },
    },
  },
  Tag: {
    borderRadius: "9999px",
  },
  Tabs: {
    tabTextColorLine: "#6B7280",
    tabTextColorActiveLine: "#4F46E5",
    tabTextColorHoverLine: "#374151",
    barColor: "#4F46E5",
  },
  Menu: {
    itemTextColor: "#D1D5DB",
    itemTextColorActive: "#FFFFFF",
    itemTextColorHover: "#F9FAFB",
    itemTextColorChildActive: "#FFFFFF",
    itemColorActive: "#4F46E5",
    itemColorHover: "rgba(255, 255, 255, 0.08)",
    arrowColor: "#9CA3AF",
    arrowColorHover: "#FFFFFF",
    arrowColorActive: "#FFFFFF",
    arrowColorChildActive: "#FFFFFF",
    borderRadius: "0.5rem",
  },
  Drawer: {
    borderRadius: "0",
  },
});
</script>

<style>
/* 主题变量 */
:root {
  --app-background: #F3F4F6;
  --text-color: #111827;
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;
  --bg-color: #ffffff;
  --border-color: #E5E7EB;
  --sidebar-bg: #111827;
  --sidebar-width: 256px;
  --sidebar-item-active: #4F46E5;
  --header-height: 64px;
  --header-bg: #FFFFFF;
  --primary-color: #4F46E5;
  --primary-color-light: #EEF2FF;
}

#app {
  min-height: 100vh;
  background: var(--app-background);
  color: var(--text-color);
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  font-family:
    "SF Pro Display",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    "Helvetica Neue",
    Helvetica,
    Arial,
    sans-serif;
  color: var(--text-color);
  background-color: var(--app-background);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #F3F4F6;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}
</style>
