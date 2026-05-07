<template>
  <div class="game-features-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">游戏功能</h1>
            <p class="page-subtitle">
              {{ tokenStore.selectedToken?.name || "未选择Token" }}
            </p>
          </div>

          <div class="header-actions">
            <div class="connection-status" :class="connectionStatus">
              <n-icon>
                <CloudDone />
              </n-icon>
              <span>{{ connectionStatusText }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 反馈提示区域 -->
    <div v-if="showFeedback" class="feedback-section" />

    <!-- 功能模块网格 -->
    <div class="features-grid-section">
      <div class="container">
        <GameStatus />
      </div>
    </div>

    <!-- WebSocket 连接状态 -->
    <div class="ws-status-section">
      <div class="container">
        <div class="ws-status-card">
          <div class="status-header">
            <h3>连接状态</h3>
            <n-button text @click="toggleConnection">
              {{ isConnected ? "断开连接" : "重新连接" }}
            </n-button>
          </div>
          <div class="status-content">
            <div class="status-item">
              <span>WebSocket状态:</span>
              <span :class="connectionClass">{{ connectionStatusText }}</span>
            </div>
            <div v-if="tokenStore.selectedToken" class="status-item">
              <span>当前Token:</span>
              <span>{{ tokenStore.selectedToken.name }}</span>
            </div>
            <div v-if="lastActivity" class="status-item">
              <span>最后活动:</span>
              <span>{{ lastActivity }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import { CloudDone } from "@vicons/ionicons5";

const router = useRouter();
const message = useMessage();
const tokenStore = useTokenStore();

// 响应式数据
const showFeedback = ref(true);
const lastActivity = ref(null);

// 计算属性
const connectionStatus = computed(() => {
  if (!tokenStore.selectedToken) return "disconnected";
  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
  return status === "connected" ? "connected" : "disconnected";
});

const connectionStatusText = computed(() => {
  if (!tokenStore.selectedToken) return "未选择Token";
  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
  return status === "connected" ? "已连接" : "未连接";
});

const connectionClass = computed(() => {
  return connectionStatus.value === "connected"
    ? "status-connected"
    : "status-disconnected";
});

const isConnected = computed(() => {
  return connectionStatus.value === "connected";
});

const pickArenaTargetId = (targets) => {
  const candidate =
    targets?.rankList?.[0] ||
    targets?.roleList?.[0] ||
    targets?.targets?.[0] ||
    targets?.targetList?.[0] ||
    targets?.list?.[0];

  if (candidate?.roleId) return candidate.roleId;
  if (candidate?.id) return candidate.id;
  return targets?.roleId || targets?.id;
};

// 方法
const handleFeatureAction = async (featureType) => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    router.push("/tokens");
    return;
  }

  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
  if (status !== "connected") {
    message.warning("WebSocket未连接，请先建立连接");
    return;
  }

  const tokenId = tokenStore.selectedToken.id;

  const actions = {
    "team-challenge": async () => {
      message.info("开始执行队伍挑战...");
      let targets;
      try {
        targets = await tokenStore.sendMessageWithPromise(
          tokenId,
          "arena_getareatarget",
          {},
          8000,
        );
      } catch (err) {
        message.error(`获取竞技场目标失败：${err.message}`);
        return;
      }
      const targetId = pickArenaTargetId(targets);
      if (!targetId) {
        message.warning("未找到可挑战的竞技场目标");
        return;
      }
      try {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "fight_startareaarena",
          { targetId },
          15000,
        );
        message.success("竞技场战斗已发起");
      } catch (err) {
        message.error(`竞技场战斗失败：${err.message}`);
      }
    },
    "daily-tasks": () => {
      message.info("启动每日任务服务...");
      tokenStore.sendMessage(tokenId, "task_claimdailyreward");
    },
    "salt-robot": () => {
      message.info("领取盐罐机器人奖励...");
      tokenStore.sendMessage(tokenId, "bottlehelper_claim");
    },
    "idle-time": () => {
      message.info("领取挂机时间奖励...");
      tokenStore.sendMessage(tokenId, "system_claimhangupreward");
    },
    "power-switch": () => {
      message.info("执行威震大开关...");
      tokenStore.sendMessage(tokenId, "role_getroleinfo");
    },
    "club-ranking": () => {
      message.info("报名俱乐部排位...");
      tokenStore.sendMessage(tokenId, "legionmatch_rolesignup");
    },
    "club-checkin": () => {
      message.info("执行俱乐部签到...");
      tokenStore.sendMessage(tokenId, "legion_signin");
    },
    "tower-challenge": () => {
      message.info("开始爬塔挑战...");
      // 关键业务：只提示 UI，不打印冗余日志
      // 实际请求体: {"ack":0,"body":{},"cmd":"fight_starttower","seq":XX,"time":TIMESTAMP}
      tokenStore.sendMessage(tokenId, "fight_starttower");
    },
  };

  const action = actions[featureType];
  if (action) {
    await action();
  } else {
    message.warning("功能暂未实现");
  }
};

// 已移除 sendWebSocketMessage，使用 tokenStore.sendMessage 代替

const connectWebSocket = () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择一个Token");
    router.push("/tokens");
    return;
  }

  try {
    const tokenId = tokenStore.selectedToken.id;
    const token = tokenStore.selectedToken.token;

    // 使用 tokenStore 的 WebSocket 连接管理
    tokenStore.createWebSocketConnection(tokenId, token);
    message.info("正在建立 WebSocket 连接...");

    // 等待连接建立
    setTimeout(async () => {
      const status = tokenStore.getWebSocketStatus(tokenId);
      if (status === "connected") {
        message.success("WebSocket 连接成功");
        // 连接成功后自动初始化游戏数据
        await initializeGameData();
      }
    }, 2000);
  } catch (error) {
    console.error("WebSocket连接失败:", error);
    message.error("WebSocket连接失败");
  }
};

const disconnectWebSocket = () => {
  if (tokenStore.selectedToken) {
    const tokenId = tokenStore.selectedToken.id;
    tokenStore.closeWebSocketConnection(tokenId);
    message.info("WebSocket连接已断开");
  }
};

const toggleConnection = () => {
  if (connectionStatus.value === "connected") {
    disconnectWebSocket();
  } else {
    connectWebSocket();
  }
};

// handleWebSocketMessage 已移除，消息处理由 tokenStore 负责

// 生命周期
onMounted(() => {
  // 检查是否需要连接 WebSocket
  if (tokenStore.selectedToken) {
    const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
    if (status !== "connected") {
      connectWebSocket();
    } else {
      // 如果已连接，立即获取初始数据
      initializeGameData();
    }
  }
});

// 监听当前选中 Token 的连接错误（如 token 过期）并给出明确提示
watch(
  () => {
    if (!tokenStore.selectedToken)
      return { status: "disconnected", lastError: null };
    const conn = tokenStore.wsConnections[tokenStore.selectedToken.id];
    return { status: conn?.status, lastError: conn?.lastError };
  },
  (cur) => {
    if (!cur) return;
    if (cur.status === "error" && cur.lastError) {
      const err = String(cur.lastError.error || "").toLowerCase();
      if (err.includes("token") && err.includes("expired")) {
        const importMethod = tokenStore.selectedToken?.importMethod;
        if (
          importMethod === "url" ||
          importMethod === "bin" ||
          importMethod === "wxQrcode"
        ) {
          message.warning("Token已过期，正在尝试自动刷新...");
          return;
        }
        message.error("当前 Token 已过期，请重新导入后再试");
        router.push("/tokens");
      }
    }
  },
  { deep: true },
);

// 初始化游戏数据
const initializeGameData = async () => {
  if (!tokenStore.selectedToken) return;

  try {
    const tokenId = tokenStore.selectedToken.id;
    // 获取初始化数据（静默）
    tokenStore.sendMessage(tokenId, "role_getroleinfo");
    tokenStore.sendMessage(tokenId, "tower_getinfo");
    tokenStore.sendMessage(tokenId, "evotower_getinfo");
    tokenStore.sendMessage(tokenId, "presetteam_getinfo");
    const res = await tokenStore.sendMessageWithPromise(
      tokenId,
      "fight_startlevel",
    );
    tokenStore.setBattleVersion(res?.battleData?.version);
  } catch (error) {
    // 静默处理初始化异常
  }
};

onUnmounted(() => {
  // WebSocket 连接由 tokenStore 管理，不需要手动清理
});
</script>

<style scoped lang="scss">
.game-features-page {
  /* No background/padding - layout provides bg-gray-100 and p-6 */
}

// 页面头部
.page-header {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  padding: 20px 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.page-subtitle {
  color: #6B7280;
  font-size: 14px;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;

  &.connected {
    background: rgba(5, 150, 105, 0.1);
    color: #059669;
  }

  &.disconnected {
    background: rgba(220, 38, 38, 0.1);
    color: #DC2626;
  }
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

// 功能模块网格
.features-grid-section {
  margin-top: 24px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-card {
  background: #FFFFFF;
  border-radius: 0.5rem;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  border-left: 4px solid #4F46E5;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &.team-challenge {
    border-left-color: #3B82F6;
  }

  &.daily-tasks {
    border-left-color: #F59E0B;
  }

  &.salt-robot {
    border-left-color: #10B981;
  }

  &.idle-time {
    border-left-color: #EF4444;
  }

  &.power-switch {
    border-left-color: #8B5CF6;
  }

  &.club-ranking {
    border-left-color: #F59E0B;
  }

  &.club-checkin {
    border-left-color: #059669;
  }

  &.tower-challenge {
    border-left-color: #6366F1;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #EEF2FF;
  color: #4F46E5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  :deep(svg) {
    width: 22px;
    height: 22px;
  }
}

.feature-title {
  flex: 1;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 2px 0;
  }
}

.feature-subtitle {
  color: #6B7280;
  font-size: 13px;
}

.feature-badge,
.feature-status {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.feature-status {
  &.in-progress {
    background: rgba(245, 158, 11, 0.1);
    color: #D97706;
  }

  &.completed {
    background: rgba(5, 150, 105, 0.1);
    color: #059669;
  }

  &.waiting {
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;
  }
}

.card-content {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .stage-text {
    font-weight: 500;
    color: #111827;
  }

  .progress-text {
    font-weight: 500;
    color: #6B7280;
  }
}

.time-display {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 8px;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace;
}

.task-description {
  color: #6B7280;
  font-size: 13px;
  line-height: 1.5;
}

.card-actions {
  margin-top: 16px;
}

// WebSocket状态区域
.ws-status-section {
  margin-top: 24px;
}

.ws-status-card {
  background-color: #FFFFFF;
  border-radius: 0.5rem;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #E5E7EB;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F3F4F6;

  &:last-child {
    border-bottom: none;
  }

  span:first-child {
    color: #6B7280;
    font-size: 13px;
  }

  span:last-child {
    font-weight: 500;
    font-size: 13px;
  }
}

.status-connected {
  color: #059669;
}

.status-disconnected {
  color: #DC2626;
}

// 响应式
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style>
