<template>
  <div class="flex h-screen bg-gray-100 overflow-hidden">
    <!-- Sidebar - 桌面端 -->
    <aside
      class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-gray-900"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 h-16 border-b border-gray-800">
        <img
          src="/icons/xiaoyugan.png"
          alt="XYZW"
          class="w-9 h-9 rounded-lg"
        />
        <span class="text-white text-lg font-bold tracking-tight">
          XY 控制台
        </span>
      </div>

      <!-- Nav Items -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          v-show="!item.hidden"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
          :class="
            isActive(item.path)
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          "
        >
          <n-icon :size="20">
            <component :is="item.icon" />
          </n-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Sidebar Footer -->
      <div class="px-4 py-3 border-t border-gray-800">
        <div class="flex items-center gap-3 px-2">
          <n-avatar
            :src="selectedToken?.avatar || '/icons/xiaoyugan.png'"
            size="small"
            fallback-src="/icons/xiaoyugan.png"
            round
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-300 truncate">
              {{ selectedToken?.name || "未选择Token" }}
            </p>
            <p class="text-xs text-gray-500 truncate">在线</p>
          </div>
          <n-dropdown
            :options="userMenuOptions"
            @select="handleUserAction"
            trigger="click"
          >
            <button
              class="text-gray-500 hover:text-white transition-colors p-1 rounded"
            >
              <n-icon :size="16">
                <EllipsisVertical />
              </n-icon>
            </button>
          </n-dropdown>
        </div>
      </div>
    </aside>

    <!-- Mobile Sidebar Drawer -->
    <n-drawer
      v-model:show="isMobileMenuOpen"
      placement="left"
      :width="256"
      :trap-focus="true"
      :block-scroll="true"
    >
      <n-drawer-content
        :body-content-style="{ padding: 0, background: '#111827' }"
        :header-style="{ display: 'none' }"
        :native-scrollbar="false"
        content-class="sidebar-drawer-content"
      >
        <!-- Logo -->
        <div class="flex items-center gap-3 px-6 h-16 border-b border-gray-800">
          <img
            src="/icons/xiaoyugan.png"
            alt="XYZW"
            class="w-9 h-9 rounded-lg"
          />
          <span class="text-white text-lg font-bold tracking-tight">
            XY 控制台
          </span>
        </div>

        <!-- Nav Items -->
        <nav class="px-3 py-4 space-y-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            v-show="!item.hidden"
            @click="isMobileMenuOpen = false"
            class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
            :class="
              isActive(item.path)
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            "
          >
            <n-icon :size="20">
              <component :is="item.icon" />
            </n-icon>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>

        <!-- Footer -->
        <div class="mt-auto px-4 py-3 border-t border-gray-800">
          <div class="flex items-center gap-3 px-2">
            <n-avatar
              :src="selectedToken?.avatar || '/icons/xiaoyugan.png'"
              size="small"
              fallback-src="/icons/xiaoyugan.png"
              round
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-300 truncate">
                {{ selectedToken?.name || "未选择Token" }}
              </p>
            </div>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <!-- Main Area -->
    <div class="flex-1 lg:pl-64 flex flex-col min-w-0">
      <!-- Header -->
      <header
        class="sticky top-0 z-30 bg-white border-b-2 border-indigo-600 h-16 flex items-center justify-between px-4 lg:px-6 shrink-0"
      >
        <div class="flex items-center gap-3">
          <!-- Mobile hamburger -->
          <button
            class="lg:hidden text-gray-600 hover:text-gray-900 p-1 -ml-1 rounded-md hover:bg-gray-100"
            @click="isMobileMenuOpen = true"
          >
            <n-icon :size="24">
              <Menu />
            </n-icon>
          </button>
          <!-- Page title -->
          <h1 class="text-lg font-semibold text-gray-900">
            {{ currentPageTitle }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <!-- Mobile avatar -->
          <div class="lg:hidden flex items-center gap-2">
            <n-dropdown
              :options="userMenuOptions"
              @select="handleUserAction"
              trigger="click"
            >
              <div class="flex items-center gap-1.5 cursor-pointer p-1 rounded-md hover:bg-gray-100">
                <n-avatar
                  :src="selectedToken?.avatar || '/icons/xiaoyugan.png'"
                  size="small"
                  fallback-src="/icons/xiaoyugan.png"
                  round
                />
              </div>
            </n-dropdown>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import {
  useTokenStore,
  selectedToken,
  selectedTokenId,
} from "@/stores/tokenStore";
import {
  Home,
  PersonCircle,
  Cube,
  Layers,
  ChatbubbleEllipsesSharp,
  LockOpen,
  Menu,
  EllipsisVertical,
} from "@vicons/ionicons5";
import { useRouter, useRoute } from "vue-router";
import { useMessage } from "naive-ui";
import { ref, computed, markRaw, h } from "vue";
import { NIcon } from "naive-ui";
import { isNowInLegionWarTime } from "@/utils/clubBattleUtils";

const tokenStore = useTokenStore();
const router = useRouter();
const route = useRoute();
const message = useMessage();

const isMobileMenuOpen = ref(false);

// Navigation items
const navItems = computed(() => [
  {
    label: "首页",
    path: "/admin/dashboard",
    icon: markRaw(Home),
  },
  {
    label: "批量日常",
    path: "/admin/batch-daily-tasks",
    icon: markRaw(Layers),
  },
  {
    label: "游戏功能",
    path: "/admin/game-features",
    icon: markRaw(Cube),
  },
  {
    label: "消息测试",
    path: "/admin/message-test",
    icon: markRaw(ChatbubbleEllipsesSharp),
  },
  {
    label: "Token管理",
    path: "/tokens",
    icon: markRaw(PersonCircle),
  },
  {
    label: "实时盐场",
    path: "/admin/legion-war",
    icon: markRaw(LockOpen),
    hidden: !isNowInLegionWarTime(),
  },
]);

// Page title from route
const currentPageTitle = computed(() => {
  const item = navItems.value.find(
    (item) => item.path === route.path || route.path.startsWith(item.path + "/"),
  );
  return item?.label || "XY 控制台";
});

// Check active nav item
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + "/");
};

const userMenuOptions = [
  {
    label: "清除所有Token并退出",
    key: "logout",
  },
];

const handleUserAction = async (key) => {
  switch (key) {
    case "logout":
      await tokenStore.clearAllTokens();
      message.success("已清除所有Token");
      router.push("/tokens");
      break;
  }
};
</script>

<style scoped>
/* Override drawer content background */
:deep(.sidebar-drawer-content .n-drawer-body) {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #111827;
  padding: 0;
}
</style>
