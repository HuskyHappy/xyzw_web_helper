import "@arco-design/web-vue/dist/arco.css";
import "virtual:uno.css";
import "./assets/styles/global.scss";

import { createApp } from "vue";
import { createPinia } from "pinia";
import naive from "naive-ui";
import router from "./router";
import App from "./App.vue";
import { useTokenStore } from "./stores/tokenStore";
// import { i18n } from './locales';

// 创建应用实例
const app = createApp(App);
const pinia = createPinia();

// 使用插件
app.use(pinia);
app.use(router);
app.use(naive);
// app.use(i18n)

// 全局主题应用：从 localStorage 读取并设置 data-theme 属性
const applyTheme = () => {
  const saved = localStorage.getItem("theme") || "auto";
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else if (saved === "light") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark)
      document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");

    // 跟随系统变更
    if (window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          const t = localStorage.getItem("theme") || "auto";
          if (t === "auto") {
            if (e.matches)
              document.documentElement.setAttribute("data-theme", "dark");
            else document.documentElement.removeAttribute("data-theme");
          }
        });
    }
  }
};

applyTheme();

// 初始化 tokenStore（从 Supabase 加载 tokens）
const tokenStore = useTokenStore();
tokenStore.initTokenStore().then(() => {
  // 挂载应用
  app.mount("#app");
}).catch((err) => {
  console.error('初始化 tokenStore 失败:', err);
  // 即使失败也要挂载应用
  app.mount("#app");
});
