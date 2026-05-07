import "virtual:uno.css";
import "./assets/styles/global.scss";

import { createApp } from "vue";
import { createPinia } from "pinia";
import naive from "naive-ui";
import router from "./router";
import App from "./App.vue";
import { useTokenStore } from "./stores/tokenStore";

// 创建应用实例
const app = createApp(App);
const pinia = createPinia();

// 使用插件
app.use(pinia);
app.use(router);
app.use(naive);

// 初始化 tokenStore（从 Supabase 加载 tokens）
const tokenStore = useTokenStore();
tokenStore.initTokenStore().then(() => {
  app.mount("#app");
}).catch((err) => {
  console.error("初始化 tokenStore 失败:", err);
  app.mount("#app");
});
