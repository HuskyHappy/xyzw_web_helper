/**
 * 商店类任务
 * 包含: legion_storebuygoods, legionStoreBuySkinCoins, store_purchase, collection_claimfreereward, weeklyFreeGift, blackMarket_purchase
 */

import { getActivityWeek, isBlackMarketWeek } from "@/utils/DateTimeUtils.js";
import { blackMarketGoods } from "@/utils/dreamConstants";

/**
 * 创建商店类任务执行器
 * @param {Object} deps - 依赖项
 * @returns {Object} 任务函数集合
 */
export function createTasksStore(deps) {
  const {
    selectedTokens,
    tokens,
    tokenStatus,
    isRunning,
    shouldStop,
    ensureConnection,
    releaseConnectionSlot,
    connectionQueue,
    batchSettings,
    tokenStore,
    addLog,
    message,
    currentRunningTokenId,
    delayConfig,
    loadSettings,
  } = deps;

  /**
   * 一键购买四圣碎片
   */
  const legion_storebuygoods = async () => {
    if (selectedTokens.value.length === 0) return;

    isRunning.value = true;
    shouldStop.value = false;

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";

      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始购买四圣碎片: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 发送购买请求...`,
          type: "info",
        });
        const result = await tokenStore.sendMessageWithPromise(
          tokenId,
          "legion_storebuygoods",
          { id: 6 },
          5000,
        );

        await new Promise((r) => setTimeout(r, delayConfig.action));

        if (result.error) {
          if (result.error.includes("俱乐部商品购买数量超出上限")) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 本周已购买过四圣碎片，跳过`,
              type: "info",
            });
          } else if (result.error.includes("物品不存在")) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 盐锭不足或未加入军团，购买失败`,
              type: "error",
            });
            tokenStatus.value[tokenId] = "failed";
          } else {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 购买失败: ${result.error}`,
              type: "error",
            });
            tokenStatus.value[tokenId] = "failed";
          }
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 购买成功，获得四圣碎片`,
            type: "success",
          });
          tokenStatus.value[tokenId] = "completed";
        }
      } catch (error) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 购买过程出错: ${error.message}`,
          type: "error",
        });
        tokenStatus.value[tokenId] = "failed";
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 连接已关闭  (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);

    currentRunningTokenId.value = null;
    isRunning.value = false;
    shouldStop.value = false;
  };

  /**
   * 一键购买俱乐部5皮肤币
   */
  const legionStoreBuySkinCoins = async () => {
    if (selectedTokens.value.length === 0) return;

    isRunning.value = true;
    shouldStop.value = false;

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";

      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始购买俱乐部5皮肤币: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 发送购买请求...`,
          type: "info",
        });

        let result = null;
        for (let i = 0; i < 5; i++) {
          if (shouldStop.value) break;
          result = await tokenStore.sendMessageWithPromise(
            tokenId,
            "legion_storebuygoods",
            { id: 1 },
            5000,
          );

          await new Promise((r) => setTimeout(r, delayConfig.action));
        }

        if (result && result.error) {
          if (result.error.includes("俱乐部商品购买数量超出上限")) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 本周已购买过皮肤币，跳过`,
              type: "info",
            });
          } else if (result.error.includes("物品不存在")) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 盐锭不足或未加入军团，购买失败`,
              type: "error",
            });
            tokenStatus.value[tokenId] = "failed";
          } else {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 购买失败: ${result.error}`,
              type: "error",
            });
            tokenStatus.value[tokenId] = "failed";
          }
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 购买成功，获得皮肤币`,
            type: "success",
          });
          tokenStatus.value[tokenId] = "completed";
        }
      } catch (error) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 购买过程出错: ${error.message}`,
          type: "error",
        });
        tokenStatus.value[tokenId] = "failed";
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 连接已关闭  (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);

    currentRunningTokenId.value = null;
    isRunning.value = false;
    shouldStop.value = false;
  };

  /**
   * 免费领取珍宝阁每日奖励
   */
  const collection_claimfreereward = async () => {
    if (selectedTokens.value.length === 0) return;
    isRunning.value = true;
    shouldStop.value = false;
    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";

      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始免费领取珍宝阁: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 发送珍宝阁免费领取请求...`,
          type: "info",
        });
        const result = await tokenStore.sendMessageWithPromise(
          tokenId,
          "collection_claimfreereward",
          {},
          5000,
        );

        await new Promise((r) => setTimeout(r, delayConfig.action));

        if (result.error) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 珍宝阁领取失败: ${result.error}`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 珍宝阁领取成功`,
            type: "success",
          });
          tokenStatus.value[tokenId] = "completed";
        }
      } catch (error) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 珍宝阁领取过程出错: ${error.message}`,
          type: "error",
        });
        tokenStatus.value[tokenId] = "failed";
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 连接已关闭  (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);

    currentRunningTokenId.value = null;
    isRunning.value = false;
    shouldStop.value = false;
  };

  /**
   * 黑市一键采购
   */
  const store_purchase = async () => {
    if (selectedTokens.value.length === 0) return;

    isRunning.value = true;
    shouldStop.value = false;

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";

      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始黑市一键采购: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 发送黑市采购请求...`,
          type: "info",
        });
        const result = await tokenStore.sendMessageWithPromise(
          tokenId,
          "store_purchase",
          {},
          5000,
        );

        await new Promise((r) => setTimeout(r, delayConfig.action));

        if (result.error) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 黑市采购失败: ${result.error}`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 黑市采购成功`,
            type: "success",
          });
          tokenStatus.value[tokenId] = "completed";
        }
      } catch (error) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 黑市采购过程出错: ${error.message}`,
          type: "error",
        });
        tokenStatus.value[tokenId] = "failed";
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 连接已关闭  (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);

    currentRunningTokenId.value = null;
    isRunning.value = false;
    shouldStop.value = false;
  };

  /**
   * 周常免费礼包 - 根据当前活动周类型领取对应礼包
   */
  const weeklyFreeGift = async () => {
    if (selectedTokens.value.length === 0) return;

    const weekType = getActivityWeek();
    if (!weekType) {
      message.warning("无法获取当前活动周类型");
      return;
    }

    // 活动周 → activityId 映射
    const weekActivityMap = { "招募周": 6, "黑市周": 5, "宝箱周": 7 };
    const activityId = weekActivityMap[weekType];
    if (!activityId) {
      message.warning(`未知活动周类型: ${weekType}`);
      return;
    }

    isRunning.value = true;
    shouldStop.value = false;

    addLog({
      time: new Date().toLocaleTimeString(),
      message: `当前活动周: ${weekType} (activityId: ${activityId})`,
      type: "info",
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";
      currentRunningTokenId.value = tokenId;

      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        await ensureConnection(tokenId);
        const result = await tokenStore.sendMessageWithPromise(
          tokenId,
          "activity_buystoregoods",
          { activityId, goodsIndex: 0, buyNum: 1 },
          5000
        );

        if (result && !result.error) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} ${weekType}免费礼包领取成功`,
            type: "success",
          });
        } else {
          const errMsg = result?.error || result?.msg || "未知错误";
          if (errMsg.includes("已经") || errMsg.includes("已领取") || errMsg.includes("购买上限")) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} ${weekType}免费礼包已领取过`,
              type: "warning",
            });
          } else {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} ${weekType}免费礼包领取失败: ${errMsg}`,
              type: "error",
            });
          }
        }
      } catch (err) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} ${weekType}免费礼包异常: ${err.message || err}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("周常免费礼包结束");
  };

  /**
   * 一键江湖黑市采购 - 按配置列表逐个购买黑市商品
   */
  const blackMarket_purchase = async () => {
    if (selectedTokens.value.length === 0) return;

    if (!isBlackMarketWeek()) {
      message.warning("当前不是黑市周，无法采购");
      return;
    }

    isRunning.value = true;
    shouldStop.value = false;

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";
      currentRunningTokenId.value = tokenId;

      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        await ensureConnection(tokenId);

        // 获取购买列表（优先账号独立设置，回退全局设置）
        let buyList = [];
        try {
          const settings = loadSettings(tokenId);
          buyList = settings.blackMarketPurchaseList || batchSettings.blackMarketPurchaseList || [];
        } catch {
          buyList = batchSettings.blackMarketPurchaseList || [];
        }

        if (buyList.length === 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 未配置江湖黑市采购列表，跳过`,
            type: "warning",
          });
          return;
        }

        for (const goodsIndex of buyList) {
          if (shouldStop.value) break;

          const goods = blackMarketGoods.find((g) => g.goodsIndex === goodsIndex);
          const goodsName = goods ? `${goods.name}(${goods.desc})` : `商品${goodsIndex}`;

          try {
            const result = await tokenStore.sendMessageWithPromise(
              tokenId,
              "activity_buystoregoods",
              { activityId: 9, goodsIndex, buyNum: 1 },
              5000
            );

            if (result && !result.error) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 购买${goodsName}成功`,
                type: "success",
              });
            } else {
              const errMsg = result?.error || result?.msg || "未知错误";
              if (errMsg.includes("已经") || errMsg.includes("已购买") || errMsg.includes("上限") || errMsg.includes("售罄")) {
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} ${goodsName}已购买/售罄`,
                  type: "warning",
                });
              } else {
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} 购买${goodsName}失败: ${errMsg}`,
                  type: "error",
                });
              }
            }
          } catch (err) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 购买${goodsName}异常: ${err.message || err}`,
              type: "error",
            });
          }

          await new Promise((r) => setTimeout(r, delayConfig.commandDelay));
        }
      } catch (err) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 江湖黑市采购异常: ${err.message || err}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("江湖黑市采购结束");
  };

  return {
    legion_storebuygoods,
    legionStoreBuySkinCoins,
    store_purchase,
    collection_claimfreereward,
    weeklyFreeGift,
    blackMarket_purchase,
  };
}
