<template>
  <div class="dashboard-page">
    <!-- 系统状态卡片 -->
    <n-grid :cols="4" :x-gap="20" :y-gap="20" class="status-grid">
      <n-gi>
        <n-card class="status-card" :bordered="false">
          <div class="status-item">
            <div :class="['status-icon-wrapper', backendOnline ? 'success' : 'error']">
              <n-icon :color="backendOnline ? '#10b981' : '#ef4444'" size="24">
                <CheckmarkCircle v-if="backendOnline" />
                <CloseCircle v-else />
              </n-icon>
            </div>
            <span class="status-label">Render 后端</span>
            <div class="status-value" :style="{ color: backendOnline ? '#10b981' : '#ef4444' }">
              {{ backendOnline ? '已连接' : '离线' }}
            </div>
            <div class="status-meta" v-if="healthData">{{ healthData.activeCrons || 0 }} 个活跃 Cron</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="status-card" :bordered="false">
          <div class="status-item">
            <div :class="['status-icon-wrapper', supabaseOnline ? 'success' : 'error']">
              <n-icon :color="supabaseOnline ? '#10b981' : '#ef4444'" size="24">
                <CheckmarkCircle v-if="supabaseOnline" />
                <CloseCircle v-else />
              </n-icon>
            </div>
            <span class="status-label">Supabase 数据库</span>
            <div class="status-value" :style="{ color: supabaseOnline ? '#10b981' : '#ef4444' }">
              {{ supabaseOnline ? '已连接' : '离线' }}
            </div>
            <div class="status-meta">{{ totalTokens }} 个 Token</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="status-card" :bordered="false">
          <div class="status-item">
            <div class="status-icon-wrapper warning">
            <n-icon color="#f59e0b" size="24">
              <AlertCircleOutline />
            </n-icon>
          </div>
          <span class="status-label">定时任务</span>
            <div class="status-value">{{ tasks.filter(t => t.enabled).length }}<span style="font-size:16px;color:#94a3b8"> / {{ tasks.length }}</span></div>
            <div class="status-meta">启用 / 总计</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="status-card" :bordered="false">
          <div class="status-item">
            <div class="status-icon-wrapper info">
            <n-icon color="#3b82f6" size="24">
              <Cube />
            </n-icon>
          </div>
          <span class="status-label">执行日志</span>
            <div class="status-value">{{ logs.length }}</div>
            <div class="status-meta">
              <span style="color:#10b981">{{ logs.filter(l => l.status === 'success').length }}</span>
              <span style="color:#94a3b8"> / </span>
              <span style="color:#ef4444">{{ logs.filter(l => l.status === 'error').length }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
    <div class="status-footer">
      <n-space size="small" align="center">
        <span class="status-footer-text">上次刷新: {{ lastCheckTime }}</span>
        <n-button size="tiny" quaternary @click="refreshAll" :loading="refreshing">刷新</n-button>
        <n-switch v-model:value="autoRefresh" size="small">
          <template #checked>自动刷新 30s</template>
          <template #unchecked>自动刷新</template>
        </n-switch>
      </n-space>
    </div>

    <!-- 定时任务列表 -->
    <n-card title="定时任务列表" class="section-card">
      <template #header-extra>
        <n-space>
          <n-button @click="openTemplateManagerModal" class="dashboard-action-btn">任务模板</n-button>
          <n-button @click="openBatchSettings" :icon="() => h(NIcon, null, { default: () => h(Settings) })" class="dashboard-action-btn">任务设置</n-button>
          <n-button @click="openTaskModal" class="dashboard-action-btn">新增定时任务</n-button>
        </n-space>
      </template>
      <n-data-table
        :columns="taskColumns"
        :data="tasks"
        :loading="tasksLoading"
        :bordered="false"
        size="small"
        :pagination="{ pageSize: 10 }"
      />
    </n-card>

    <!-- 执行日志 -->
    <n-card title="执行日志" class="section-card tech-card">
      <template #header-extra>
        <n-space>
          <n-button-group size="small">
            <n-button :type="logViewTab === 'summary' ? 'primary' : 'default'" @click="logViewTab = 'summary'">聚合视图</n-button>
            <n-button :type="logViewTab === 'detail' ? 'primary' : 'default'" @click="logViewTab = 'detail'">详细日志</n-button>
          </n-button-group>
          <n-button size="small" @click="fetchLogs">刷新</n-button>
          <n-button size="small" type="warning" @click="clearLogs">清除日志</n-button>
        </n-space>
      </template>

      <!-- 聚合视图 -->
      <div v-if="logViewTab === 'summary'">
        <div v-if="!logSummary.length && !logsLoading" style="text-align:center;padding:40px 0;color:#888">
          暂无执行日志
        </div>
        <n-collapse v-else>
          <n-collapse-item
            v-for="item in logSummary"
            :key="item.taskId"
            :title="`${item.taskName}（${item.tokenCount} 个账号 · ${formatBeijingTime(item.lastRun)}）`"
          >
            <template #header-extra>
              <n-space align="center" :size="8">
                <n-tag type="success" size="small">{{ item.totalSuccess }} 成功</n-tag>
                <n-tag v-if="item.totalFail > 0" type="error" size="small">{{ item.totalFail }} 失败</n-tag>
                <n-tag v-else type="success" size="small">全部成功</n-tag>
              </n-space>
            </template>

            <div style="padding:4px 0 8px">
              <!-- 任务维度统计 -->
              <div v-for="(task, idx) in item.tasks" :key="idx" style="margin-bottom:12px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                  <span style="font-weight:600;font-size:13px">{{ idx + 1 }}. {{ task.taskName }}</span>
                  <n-tag type="success" size="tiny">{{ task.success }} 成功</n-tag>
                  <n-tag v-if="task.fail > 0" type="error" size="tiny">{{ task.fail }} 失败</n-tag>
                </div>

                <!-- 失败账号详情 -->
                <div v-if="task.fail > 0" style="margin-left:20px;font-size:12px;color:#d03050">
                  <div v-for="(f, fi) in task.failures" :key="fi" style="margin-bottom:4px">
                    <span style="color:#e08030;font-weight:500">{{ f.tokenName }}</span>
                    <span v-for="(part, pi) in parseFailureReasons(f.reason)" :key="pi" style="margin-left:6px;display:inline">
                      <n-tag size="tiny" :bordered="false" type="warning" style="font-size:11px;opacity:0.7">{{ part.cmd }}</n-tag>
                      <span style="color:#d03050">{{ part.reason }}</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- 失败原因统计 -->
              <div v-if="item.failReasons.length > 0" style="margin-top:12px;padding-top:12px;border-top:1px solid #efeff5">
                <div style="font-weight:600;font-size:12px;color:#666;margin-bottom:6px">失败原因统计</div>
                <div v-for="(fr, fri) in item.failReasons" :key="fri" style="margin-bottom:4px;font-size:12px">
                  <n-tag type="error" size="tiny" style="margin-right:8px">{{ fr.count }}次</n-tag>
                  <span>{{ fr.reason }}</span>
                  <span style="color:#999;margin-left:8px">({{ fr.tokens.join(', ') }})</span>
                </div>
              </div>
            </div>
          </n-collapse-item>
        </n-collapse>
      </div>

      <!-- 详细日志 -->
      <n-data-table
        v-if="logViewTab === 'detail'"
        :columns="logColumns"
        :data="logs"
        :loading="logsLoading"
        :bordered="false"
        size="small"
        :max-height="400"
      />
    </n-card>

    <!-- ==================== 新增定时任务弹窗 ==================== -->
    <n-modal
      v-model:show="showTaskModal"
      preset="card"
      :title="editingTaskId ? '编辑定时任务' : '新增定时任务'"
      style="width: 90%; max-width: 960px"
    >
      <div class="settings-content" style="display:flex;gap:24px;align-items:flex-start">
        <!-- 左侧：基本信息和选择任务 -->
        <div style="flex:1;min-width:0">
          <!-- 基本信息 -->
          <div class="settings-group">
            <div class="group-title">基本信息</div>
            <div class="setting-item">
              <label class="setting-label">任务名称</label>
              <n-input v-model:value="taskForm.name" placeholder="请输入任务名称" style="flex:1" />
            </div>
            <div class="setting-item" style="display:flex;flex-direction:column;align-items:stretch">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <label class="setting-label">运行类型</label>
                <n-radio-group v-model:value="taskForm.runType" @update:value="resetRunType">
                  <n-radio value="daily">每天固定时间</n-radio>
                  <n-radio value="cron">Cron表达式</n-radio>
                </n-radio-group>
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:8px">
                <n-time-picker v-if="taskForm.runType === 'daily'" v-model:value="taskForm.runTime" format="HH:mm" />
                <n-input v-if="taskForm.runType === 'cron'" v-model:value="taskForm.cronExpression" placeholder="分 时 日 月 周（例：30 2 * * *）" style="max-width:300px" @input="parseCronExpression" />
              </div>
              <div class="cron-parser" v-if="taskForm.runType === 'cron' && taskForm.cronExpression" style="margin-top:12px">
                <div v-if="cronValidation.valid" class="cron-validation success">
                  <n-text type="success">✓ {{ cronValidation.message }}</n-text>
                </div>
                <div v-else class="cron-validation error">
                  <n-text type="error">✗ {{ cronValidation.message }}</n-text>
                </div>
                <div v-if="cronValidation.valid && cronNextRuns.length > 0" class="cron-next-runs">
                  <h4>未来5次执行时间：</h4>
                  <ul>
                    <li v-for="(run, index) in cronNextRuns" :key="index">{{ run }}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="setting-item">
              <label class="setting-label">任务模板</label>
              <n-select
                v-model:value="taskForm.templateId"
                :options="taskTemplateOptions"
                placeholder="选择任务模板（可选）"
                clearable
                style="flex:1"
              />
            </div>
            <div class="setting-item-tip">模板包含阵容、开关等配置，执行时将应用模板设置</div>
          </div>

          <!-- 选择任务 -->
          <div class="settings-group settings-group--bordered">
            <div class="group-title">
              <span>选择任务</span>
              <n-space size="small">
                <n-button size="small" @click="selectAllTasks">全选</n-button>
                <n-button size="small" @click="deselectAllTasks">全不选</n-button>
              </n-space>
            </div>
            <n-checkbox-group v-model:value="taskForm.selectedTasks">
              <n-tabs type="line" animated size="small" pane-style="padding-top:12px" default-value="daily">
                <n-tab-pane
                  v-for="group in taskGroupDefinitions"
                  :key="group.name"
                  :name="group.name"
                  :tab="group.label"
                >
                  <n-grid :cols="2" :x-gap="12" :y-gap="8">
                    <n-grid-item v-for="task in groupedAvailableTasks[group.name]" :key="task.value">
                      <n-checkbox :value="task.value">{{ task.label }}</n-checkbox>
                    </n-grid-item>
                  </n-grid>
                </n-tab-pane>
                <n-tab-pane
                  v-if="groupedAvailableTasks['other'] && groupedAvailableTasks['other'].length > 0"
                  name="other"
                  tab="其他"
                >
                  <n-grid :cols="2" :x-gap="12" :y-gap="8">
                    <n-grid-item v-for="task in groupedAvailableTasks['other']" :key="task.value">
                      <n-checkbox :value="task.value">{{ task.label }}</n-checkbox>
                    </n-grid-item>
                  </n-grid>
                </n-tab-pane>
              </n-tabs>
            </n-checkbox-group>
          </div>
        </div>

        <!-- 右侧：选择账号 -->
        <div style="flex:1;min-width:0">
          <div class="settings-group settings-group--bordered" style="height:100%;max-height:500px;display:flex;flex-direction:column">
            <div class="group-title">
              <span>选择账号</span>
              <n-space size="small">
                <n-button size="small" @click="selectAllTokens">全选</n-button>
                <n-button size="small" @click="deselectAllTokens">全不选</n-button>
              </n-space>
            </div>
            <div style="flex:1;overflow-y:auto">
              <n-checkbox-group v-model:value="taskForm.selectedTokens">
                <div :style="`column-count:${batchSettings.tokenListColumns};column-gap:8px;`">
                  <div v-for="token in sortedTokens" :key="token.id" style="break-inside:avoid;margin-bottom:8px;">
                    <n-checkbox :value="token.id">{{ token.name }}</n-checkbox>
                  </div>
                </div>
              </n-checkbox-group>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-actions" style="margin-top:20px;text-align:right">
        <n-button @click="showTaskModal = false">取消</n-button>
        <n-button type="primary" @click="saveTask" style="margin-left:12px">保存</n-button>
      </div>
    </n-modal>

    <!-- ==================== 删除确认弹窗 ==================== -->
    <n-modal
      v-model:show="showDeleteModal"
      preset="dialog"
      type="warning"
      title="确认删除"
      :content="taskToDelete ? `确定删除任务「${taskToDelete.name}」吗？` : ''"
      positive-text="确定"
      negative-text="取消"
      @positive-click="doDelete"
      @negative-click="showDeleteModal = false"
    />

    <!-- ==================== 任务模板编辑弹窗 ==================== -->
    <n-modal
      v-model:show="showTaskTemplateModal"
      preset="card"
      :title="currentTemplateId ? '编辑任务模板' : '新增任务模板'"
      style="width: 90%; max-width: 400px"
    >
      <div class="settings-content">
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">模板名称</label>
            <n-input v-model:value="currentTemplateName" placeholder="请输入模板名称" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">竞技场阵容</label>
            <n-select v-model:value="currentTemplate.arenaFormation" :options="formationOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">爬塔阵容</label>
            <n-select v-model:value="currentTemplate.towerFormation" :options="formationOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">BOSS阵容</label>
            <n-select v-model:value="currentTemplate.bossFormation" :options="formationOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">BOSS次数</label>
            <n-select v-model:value="currentTemplate.bossTimes" :options="bossTimesOptions" size="small" />
          </div>
          <div class="setting-switches">
            <div class="switch-row">
              <span class="switch-label">领罐子</span><n-switch v-model:value="currentTemplate.claimBottle" />
            </div>
            <div class="switch-row">
              <span class="switch-label">领挂机</span><n-switch v-model:value="currentTemplate.claimHangUp" />
            </div>
            <div class="switch-row">
              <span class="switch-label">竞技场</span><n-switch v-model:value="currentTemplate.arenaEnable" />
            </div>
            <div class="switch-row">
              <span class="switch-label">开宝箱</span><n-switch v-model:value="currentTemplate.openBox" />
            </div>
            <div class="switch-row">
              <span class="switch-label">领取邮件奖励</span><n-switch v-model:value="currentTemplate.claimEmail" />
            </div>
            <div class="switch-row">
              <span class="switch-label">黑市购买物品</span><n-switch v-model:value="currentTemplate.blackMarketPurchase" />
            </div>
            <div class="switch-row">
              <span class="switch-label">付费招募</span><n-switch v-model:value="currentTemplate.payRecruit" />
            </div>
          </div>
        </div>
        <div class="modal-actions" style="margin-top:20px;text-align:right">
          <n-button @click="showTaskTemplateModal = false" style="margin-right:12px">取消</n-button>
          <n-button type="primary" @click="saveTaskTemplate">保存模板</n-button>
        </div>
      </div>
    </n-modal>

    <!-- ==================== 应用模板弹窗 ==================== -->
    <n-modal
      v-model:show="showApplyTemplateModal"
      preset="card"
      title="应用任务模板"
      style="width: 90%; max-width: 600px"
    >
      <div class="settings-content">
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">选择模板</label>
            <n-select
              v-model:value="selectedTemplateId"
              :options="taskTemplates"
              label-field="name"
              value-field="id"
              placeholder="请选择要应用的模板"
              size="small"
              style="width: 100%"
            />
          </div>
          <div class="setting-item" style="display:flex;flex-direction:column;align-items:stretch">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <label class="setting-label" style="margin-bottom:0">选择账号</label>
              <n-space size="small">
                <n-button size="small" @click="handleSelectAllForApply(true)">全选</n-button>
                <n-button size="small" @click="handleSelectAllForApply(false)">全不选</n-button>
              </n-space>
            </div>
            <n-checkbox-group v-model:value="selectedTokensForApply">
              <n-grid :cols="batchSettings.tokenListColumns" :x-gap="12" :y-gap="8">
                <n-grid-item v-for="token in sortedTokens" :key="token.id">
                  <n-checkbox :value="token.id">{{ token.name }}</n-checkbox>
                </n-grid-item>
              </n-grid>
            </n-checkbox-group>
          </div>
        </div>
        <div class="modal-actions" style="margin-top:20px;text-align:right">
          <n-button @click="showApplyTemplateModal = false">取消</n-button>
          <n-button type="success" @click="applyTemplate" :disabled="!selectedTemplateId || selectedTokensForApply.length === 0">应用模板</n-button>
        </div>
      </div>
    </n-modal>

    <!-- ==================== 模板管理弹窗 ==================== -->
    <n-modal
      v-model:show="showTemplateManagerModal"
      preset="card"
      title="任务模板管理"
      style="width: 90%; max-width: 800px"
    >
      <div class="settings-content">
        <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
          <n-space>
            <n-button type="primary" @click="openNewTemplateModal">新增模板</n-button>
            <n-button type="success" @click="openApplyTemplateModal">应用模板</n-button>
            <n-button type="info" @click="openAccountTemplateModal">查看账号模板引用</n-button>
          </n-space>
        </div>
        <div style="max-height:400px;overflow-y:auto;margin-bottom:16px">
          <n-card v-for="template in taskTemplates" :key="template.id" size="small" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <h4 style="margin:0;margin-bottom:8px">
                  {{ template.name }}
                  <n-tag v-if="template.isDefault" type="warning" size="small" style="margin-left:8px">默认</n-tag>
                </h4>
                <div style="font-size:12px;color:#86909c">
                  创建时间: {{ new Date(template.createdAt).toLocaleString() }}
                  <span v-if="template.updatedAt">, 更新时间: {{ new Date(template.updatedAt).toLocaleString() }}</span>
                </div>
              </div>
              <div style="display:flex;gap:8px">
                <n-button size="small" @click="openEditTemplateModal(template)">编辑</n-button>
                <n-button v-if="!template.isDefault" size="small" type="error" @click="deleteTaskTemplate(template.id)">删除</n-button>
              </div>
            </div>
          </n-card>
          <div v-if="taskTemplates.length === 0" style="text-align:center;padding:24px;color:#86909c">
            暂无模板，点击"新增模板"创建
          </div>
        </div>
        <div class="modal-actions" style="margin-top:20px;text-align:right">
          <n-button @click="showTemplateManagerModal = false">关闭</n-button>
        </div>
      </div>
    </n-modal>

    <!-- ==================== 账号模板引用弹窗 ==================== -->
    <n-modal
      v-model:show="showAccountTemplateModal"
      preset="card"
      title="账号模板引用查看"
      style="width: 90%; max-width: 800px"
    >
      <div class="settings-content">
        <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <span>共 {{ filteredAccountTemplates.length }} 个账号</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <label style="font-size:12px;color:#86909c">按模板筛选:</label>
            <n-select
              v-model:value="selectedTemplateForFilter"
              :options="taskTemplates"
              label-field="name"
              value-field="id"
              placeholder="全部模板"
              size="small"
              @update:value="filterAccountTemplates"
              style="width:180px"
            />
          </div>
        </div>
        <div style="max-height:400px;overflow-y:auto;margin-bottom:16px">
          <n-card v-for="item in filteredAccountTemplates" :key="item.tokenId" size="small" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <h4 style="margin:0;margin-bottom:4px">{{ item.tokenName }}</h4>
              </div>
              <div>
                <n-tag :type="item.templateId ? 'success' : 'default'" size="small">
                  {{ item.templateName }}
                </n-tag>
              </div>
            </div>
          </n-card>
          <div v-if="filteredAccountTemplates.length === 0" style="text-align:center;padding:24px;color:#86909c">
            暂无账号数据
          </div>
        </div>
        <div class="modal-actions" style="margin-top:20px;text-align:right">
          <n-button @click="showAccountTemplateModal = false">关闭</n-button>
        </div>
      </div>
    </n-modal>

    <!-- ==================== 批量设置弹窗 ==================== -->
    <n-modal
      v-model:show="showBatchSettingsModal"
      preset="card"
      title="任务设置"
      style="width: 90%; max-width: 760px"
    >
      <div class="settings-content">
        <n-grid :cols="2" :x-gap="24">
          <!-- 左列：批量操作设置 -->
          <n-grid-item>
            <n-divider title-placement="left" style="margin:1px 0 8px 0">批量操作设置</n-divider>
            <div class="settings-grid">
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">开箱数量(10倍)</label>
                <n-input-number v-model:value="batchSettings.boxCount" :min="10" :max="10000" :step="10" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">钓鱼数量(10倍)</label>
                <n-input-number v-model:value="batchSettings.fishCount" :min="10" :max="10000" :step="10" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">招募数量(10倍)</label>
                <n-input-number v-model:value="batchSettings.recruitCount" :min="10" :max="10000" :step="10" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">默认宝箱类型</label>
                <n-select v-model:value="batchSettings.defaultBoxType" :options="boxTypeOptions" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">默认鱼竿类型</label>
                <n-select v-model:value="batchSettings.defaultFishType" :options="fishTypeOptions" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">按积分开箱目标</label>
                <n-input-number v-model:value="batchSettings.targetBoxPoints" :min="1" :max="1000000" :step="100" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">梦境商品购买配置</label>
                <n-button size="small" @click="openDreamBuyModal">点击配置</n-button>
              </div>
            </div>
            <n-divider title-placement="left" style="margin:12px 0 8px 0">智能发车条件设置(0为不限制)</n-divider>
            <div class="settings-grid">
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">保底车辆颜色</label>
                <n-select
                  v-model:value="batchSettings.carMinColor"
                  :options="[
                    { label: '绿·普通', value: 1 },
                    { label: '蓝·稀有', value: 2 },
                    { label: '紫·史诗', value: 3 },
                    { label: '橙·传说', value: 4 },
                    { label: '红·神话', value: 5 },
                    { label: '金·传奇', value: 6 }
                  ]"
                  size="small"
                  style="width:100px"
                />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">车辆强制刷新保底</label>
                <n-switch v-model:value="batchSettings.useGoldRefreshFallback" />
              </div>
            </div>
            <div class="settings-grid" v-if="batchSettings.useGoldRefreshFallback" style="margin-top:12px">
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">需同时满足所有条件</label>
                <n-switch v-model:value="batchSettings.smartDepartureMatchAll" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">金砖 >=</label>
                <n-input-number v-model:value="batchSettings.smartDepartureGoldThreshold" :min="0" :step="100" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">招募令 >=</label>
                <n-input-number v-model:value="batchSettings.smartDepartureRecruitThreshold" :min="0" :step="10" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">白玉 >=</label>
                <n-input-number v-model:value="batchSettings.smartDepartureJadeThreshold" :min="0" :step="100" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">刷新卷 >=</label>
                <n-input-number v-model:value="batchSettings.smartDepartureTicketThreshold" :min="0" :step="1" size="small" style="width:100px" />
              </div>
            </div>
            <n-divider title-placement="left" style="margin:12px 0 8px 0">功法赠送设置</n-divider>
            <div class="settings-grid">
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">接收者ID</label>
                <n-input-number v-model:value="batchSettings.receiverId" placeholder="ID" size="small" style="width:100px" :show-button="false" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">密码</label>
                <n-input v-model:value="batchSettings.password" type="password" placeholder="密码" size="small" style="width:100px" />
              </div>
            </div>
          </n-grid-item>
          <!-- 右列：延迟与连接设置 -->
          <n-grid-item>
            <n-divider title-placement="left" style="margin:1px 0 8px 0">延迟设置(ms)</n-divider>
            <div class="settings-grid">
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">命令延迟</label>
                <n-input-number v-model:value="batchSettings.commandDelay" :min="100" :max="2000" :step="100" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">任务间延迟</label>
                <n-input-number v-model:value="batchSettings.taskDelay" :min="100" :max="2000" :step="100" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">操作延迟</label>
                <n-input-number v-model:value="batchSettings.actionDelay" :min="100" :max="2000" :step="100" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">战斗延迟</label>
                <n-input-number v-model:value="batchSettings.battleDelay" :min="100" :max="2000" :step="100" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">刷新延迟</label>
                <n-input-number v-model:value="batchSettings.refreshDelay" :min="500" :max="3000" :step="100" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">长延迟</label>
                <n-input-number v-model:value="batchSettings.longDelay" :min="1000" :max="10000" :step="500" size="small" style="width:100px" />
              </div>
            </div>
            <n-divider title-placement="left" style="margin:12px 0 8px 0">连接设置</n-divider>
            <div class="settings-grid">
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">最大并发数</label>
                <n-input-number v-model:value="batchSettings.maxActive" :min="1" :max="20" :step="1" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">连接超时(ms)</label>
                <n-input-number v-model:value="batchSettings.connectionTimeout" :min="1000" :max="30000" :step="1000" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">重连等待(ms)</label>
                <n-input-number v-model:value="batchSettings.reconnectDelay" :min="100" :max="5000" :step="100" size="small" style="width:100px" />
              </div>
            </div>
            <n-divider title-placement="left" style="margin:12px 0 8px 0">系统设置</n-divider>
            <div class="settings-grid">
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">列表每行数量</label>
                <n-input-number v-model:value="batchSettings.tokenListColumns" :min="1" :max="10" :step="1" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">最大日志条目</label>
                <n-input-number v-model:value="batchSettings.maxLogEntries" :min="100" :max="5000" :step="100" size="small" style="width:100px" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center">
                <label class="setting-label">定时刷新页面</label>
                <n-switch v-model:value="batchSettings.enableRefresh" />
              </div>
              <div class="setting-item" style="flex-direction:row;justify-content:space-between;align-items:center" v-if="batchSettings.enableRefresh">
                <label class="setting-label">刷新间隔(分钟)</label>
                <n-input-number v-model:value="batchSettings.refreshInterval" :min="10" :max="1440" :step="30" size="small" style="width:100px" />
              </div>
            </div>
          </n-grid-item>
        </n-grid>
      </div>
      <div class="modal-actions" style="margin-top:20px;text-align:right">
        <n-button @click="showBatchSettingsModal = false" style="margin-right:12px">取消</n-button>
        <n-button type="primary" @click="saveBatchSettings">保存设置</n-button>
      </div>
    </n-modal>

        <!-- ==================== 梦境商人购买配置弹窗 ==================== -->
        <n-modal
          v-model:show="showDreamBuyModal"
          preset="card"
          title="梦境商品购买配置"
          style="width: 90%; max-width: 600px"
        >
          <div class="settings-content">
            <div class="settings-grid">
              <n-alert type="info" show-icon style="margin-bottom: 12px">
                请勾选需要购买的商品。只会购买列表中存在的商品。
              </n-alert>
              <div style="display: flex; gap: 12px; margin-bottom: 12px">
                <n-button size="small" type="warning" @click="selectGoldItems">一键勾选金币商品</n-button>
                <n-button size="small" @click="selectAllItems">全选所有</n-button>
                <n-button size="small" @click="clearAllItems">清空选择</n-button>
              </div>
              <div v-for="(merchant, id) in merchantConfig" :key="id" style="margin-bottom: 16px">
                <div style="font-weight: bold; margin-bottom: 8px">{{ merchant.name }}</div>
                <n-grid :cols="3" :x-gap="12" :y-gap="8">
                  <n-grid-item v-for="(item, index) in merchant.items" :key="index">
                    <n-checkbox
                      :value="`${id}-${index}`"
                      :checked="dreamBuyList.includes(`${id}-${index}`)"
                      @update:checked="(checked) => toggleDreamItem(`${id}-${index}`, checked)"
                    >
                      {{ item }}
                    </n-checkbox>
                  </n-grid-item>
                </n-grid>
              </div>
            </div>
            <div class="modal-actions" style="margin-top: 20px; text-align: right">
              <n-button @click="showDreamBuyModal = false" style="margin-right: 12px">取消</n-button>
              <n-button type="primary" @click="saveDreamBuyConfig">保存配置</n-button>
            </div>
          </div>
        </n-modal>
      </div>
    </template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, h, watch } from 'vue'
import { NButton, NTag, useMessage } from 'naive-ui'
import { healthApi, taskApi, logApi, templateApi, settingsApi, tokenApi } from '@/utils/api'
import api from '@/utils/api'
import { useTokenStore } from '@/stores/tokenStore'
import { availableTasks, formationOptions, bossTimesOptions, boxTypeOptions, fishTypeOptions } from '@/utils/batch'
import { merchantConfig, goldItemsConfig } from '@/utils/dreamConstants'
import { validateCronExpression, calculateNextRuns, calculateNextExecutionTime } from '@/utils/batch/cronUtils'
import { CheckmarkCircle, CloseCircle, Settings, AlertCircleOutline, Cube } from '@vicons/ionicons5'
import moment from 'moment'

const message = useMessage()
const tokenStore = useTokenStore()

// ==================== 状态 ====================
const backendOnline = ref(false)
const supabaseOnline = ref(false)
const healthData = ref(null)
const tasks = ref([])
const logs = ref([])
const logSummary = ref([])
const logViewTab = ref('summary')
const tasksLoading = ref(false)
const logsLoading = ref(false)
const showTaskModal = ref(false)
const showDeleteModal = ref(false)
const taskToDelete = ref(null)
const editingTaskId = ref(null)
const refreshing = ref(false)
const autoRefresh = ref(false)
const lastCheckTime = ref('--')
const totalTokens = ref(0)
let autoRefreshTimer = null

// ==================== 任务模板状态 ====================
const showTaskTemplateModal = ref(false)
const showApplyTemplateModal = ref(false)
const showTemplateManagerModal = ref(false)
const showAccountTemplateModal = ref(false)
const taskTemplates = ref([])
const accountTemplateReferences = ref([])
const filteredAccountTemplates = ref([])
const selectedTemplateForFilter = ref(null)
const selectedTemplateId = ref(null)
const selectedTokensForApply = ref([])
const currentTemplateName = ref('')
const currentTemplateId = ref(null)
const currentTemplate = reactive({
  arenaFormation: 1,
  towerFormation: 1,
  bossFormation: 1,
  bossTimes: 2,
  claimBottle: true,
  payRecruit: true,
  openBox: true,
  arenaEnable: true,
  claimHangUp: true,
  claimEmail: true,
  blackMarketPurchase: true
})

// 模板选项（用于新增定时任务弹窗的下拉框）
const taskTemplateOptions = computed(() => {
  return taskTemplates.value.map(t => ({ label: t.name, value: t.id }))
})

// 应用模板的全选
const isAllSelectedForApply = computed(() => {
  return selectedTokensForApply.value.length === sortedTokens.value.length && sortedTokens.value.length > 0
})
const isIndeterminateForApply = computed(() => {
  return selectedTokensForApply.value.length > 0 && selectedTokensForApply.value.length < sortedTokens.value.length
})
const handleSelectAllForApply = (checked) => {
  if (checked) {
    selectedTokensForApply.value = sortedTokens.value.map(t => t.id)
  } else {
    selectedTokensForApply.value = []
  }
}

// ==================== Cron 验证状态 ====================
const cronValidation = ref({ valid: false, message: '' })
const cronNextRuns = ref([])

const parseCronExpression = (expression) => {
  const validation = validateCronExpression(expression)
  cronValidation.value = validation
  if (!validation.valid) {
    cronNextRuns.value = []
    return
  }
  const cronParts = expression.split(' ').filter(Boolean)
  const [minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField] = cronParts
  const nextRuns = calculateNextRuns(minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField, 5)
  cronNextRuns.value = nextRuns
}

// ==================== 批量设置状态 ====================
const showBatchSettingsModal = ref(false)

// 梦境商人购买列表默认配置
const defaultDreamPurchaseList = []
for (const merchantId in goldItemsConfig) {
  goldItemsConfig[merchantId].forEach((index) => {
    defaultDreamPurchaseList.push(`${merchantId}-${index}`)
  })
}

const batchSettings = reactive({
  dreamPurchaseList: [...defaultDreamPurchaseList],
  boxCount: 100,
  fishCount: 100,
  recruitCount: 100,
  defaultBoxType: 2001,
  defaultFishType: 1,
  targetBoxPoints: 1000,
  receiverId: '',
  password: '',
  useGoldRefreshFallback: false,
  tokenListColumns: 2,
  maxLogEntries: 1000,
  enableRefresh: false,
  refreshInterval: 60,
  commandDelay: 500,
  taskDelay: 500,
  actionDelay: 300,
  battleDelay: 500,
  refreshDelay: 1000,
  longDelay: 3000,
  maxActive: 2,
  carMinColor: 4,
  connectionTimeout: 10000,
  reconnectDelay: 1000,
  smartDepartureGoldThreshold: 0,
  smartDepartureRecruitThreshold: 0,
  smartDepartureJadeThreshold: 0,
  smartDepartureTicketThreshold: 0,
  smartDepartureMatchAll: false
})

// ==================== 梦境商人购买状态 ====================
const showDreamBuyModal = ref(false)
const dreamBuyList = ref([...batchSettings.dreamPurchaseList])

const openDreamBuyModal = () => {
  dreamBuyList.value = [...batchSettings.dreamPurchaseList]
  showDreamBuyModal.value = true
}

const toggleDreamItem = (itemKey, checked) => {
  if (checked) {
    if (!dreamBuyList.value.includes(itemKey)) {
      dreamBuyList.value.push(itemKey)
    }
  } else {
    dreamBuyList.value = dreamBuyList.value.filter((k) => k !== itemKey)
  }
}

const selectGoldItems = () => {
  for (const merchantId in goldItemsConfig) {
    const items = goldItemsConfig[merchantId]
    items.forEach((index) => {
      if (!dreamBuyList.value.includes(`${merchantId}-${index}`)) {
        dreamBuyList.value.push(`${merchantId}-${index}`)
      }
    })
  }
}

const selectAllItems = () => {
  const newSelection = new Set(dreamBuyList.value)
  for (const merchantId in merchantConfig) {
    const items = merchantConfig[merchantId].items
    items.forEach((_, index) => {
      newSelection.add(`${merchantId}-${index}`)
    })
  }
  dreamBuyList.value = Array.from(newSelection)
}

const clearAllItems = () => {
  dreamBuyList.value = []
}

const saveDreamBuyConfig = () => {
  batchSettings.dreamPurchaseList = [...dreamBuyList.value]
  showDreamBuyModal.value = false
}

// ==================== Token / 任务列表 ====================
const sortedTokens = computed(() => tokenStore.gameTokens || [])

// 账号选择分页
const tokenPage = ref(1)
const tokenPageSize = computed(() => batchSettings.tokenListColumns || 2)
const paginatedTokens = computed(() => sortedTokens.value)

// 账号选择表格列（首列全选，其余单列显示名称+连接状态）
const tokenSelectColumns = [
  {
    title: () => h('n-checkbox', {
      checked: taskForm.selectedTokens.length === sortedTokens.value.length && sortedTokens.value.length > 0,
      indeterminate: taskForm.selectedTokens.length > 0 && taskForm.selectedTokens.length < sortedTokens.value.length,
      'onUpdate:checked': (v) => { if (v) taskForm.selectedTokens = sortedTokens.value.map(t => t.id); else taskForm.selectedTokens = [] }
    }),
    key: 'select',
    width: 40,
    render: (row) => h('n-checkbox', {
      checked: taskForm.selectedTokens.includes(row.id),
      'onUpdate:checked': (v) => {
        if (v) { if (!taskForm.selectedTokens.includes(row.id)) taskForm.selectedTokens.push(row.id) }
        else { taskForm.selectedTokens = taskForm.selectedTokens.filter(id => id !== row.id) }
      }
    })
  },
  {
    title: '序号',
    key: 'index',
    width: 60,
    render: (row, idx) => sortedTokens.value.indexOf(row) + 1
  },
  {
    title: '角色名称',
    key: 'name',
    ellipsis: { tooltip: true },
    render: (row) => {
      const status = tokenStore.getWebSocketStatus(row.id)
      const statusColor = { connected: '#18a058', connecting: '#d03050', disconnected: '#d03050' }[status] || '#d03050'
      const statusText = { connected: '已连接', connecting: '连接中', disconnected: '已断开' }[status] || '未连接'
      return [h('span', { style: 'font-weight:bold' }, row.name), ' ', h('span', { style: `font-size:11px;color:${statusColor}` }, `(${statusText})`)]
    }
  }
]

const taskGroupDefinitions = [
  { name: 'daily', label: '日常', tasks: ['startBatch', 'claimHangUpRewards', 'batchAddHangUpTime', 'resetBottles', 'batchlingguanzi', 'batchclubsign', 'batchStudy', 'batcharenafight', 'batchSmartSendCar', 'batchClaimCars', 'store_purchase', 'collection_claimfreereward', 'batchGenieSweep'] },
  { name: 'dungeon', label: '副本', tasks: ['climbTower', 'batchmengjing', 'skinChallenge', 'batchClaimPeachTasks', 'batchBuyDreamItems'] },
  { name: 'baoku', label: '宝库', tasks: ['batchbaoku13', 'batchbaoku45'] },
  { name: 'weirdTower', label: '怪异塔', tasks: ['climbWeirdTower', 'batchUseItems', 'batchMergeItems', 'batchClaimFreeEnergy'] },
  { name: 'resource', label: '资源', tasks: ['batchOpenBox', 'batchOpenBoxByPoints', 'batchClaimBoxPointReward', 'batchFish', 'batchRecruit', 'legion_storebuygoods'] },
  { name: 'legacy', label: '功法', tasks: ['batchLegacyClaim', 'batchLegacyGiftSendEnhanced'] },
  { name: 'monthly', label: '月度', tasks: ['batchTopUpFish', 'batchTopUpArena'] }
]

const groupedAvailableTasks = computed(() => {
  const groups = {}
  taskGroupDefinitions.forEach((group) => {
    groups[group.name] = availableTasks.filter((task) => group.tasks.includes(task.value))
  })
  const groupedTaskValues = taskGroupDefinitions.flatMap((g) => g.tasks)
  const otherTasks = availableTasks.filter((task) => !groupedTaskValues.includes(task.value))
  if (otherTasks.length > 0) {
    groups['other'] = otherTasks
  }
  return groups
})

// ==================== 任务表单 ====================
const taskForm = reactive({
  name: '',
  runType: 'daily',
  runTime: null,
  cronExpression: '',
  selectedTokens: [],
  selectedTasks: [],
  templateId: null,
  enabled: true
})

const resetRunType = () => {
  if (taskForm.runType === 'daily') {
    taskForm.cronExpression = ''
  } else {
    taskForm.runTime = null
  }
}

const selectAllTokens = () => {
  taskForm.selectedTokens = sortedTokens.value.map((t) => t.id)
}
const deselectAllTokens = () => {
  taskForm.selectedTokens = []
}
const selectAllTasks = () => {
  taskForm.selectedTasks = availableTasks.map((t) => t.value)
}
const deselectAllTasks = () => {
  taskForm.selectedTasks = []
}

const openTaskModal = async () => {
  editingTaskId.value = null
  Object.assign(taskForm, {
    name: '',
    runType: 'daily',
    runTime: null,
    cronExpression: '',
    selectedTokens: [],
    selectedTasks: [],
    templateId: null,
    enabled: true
  })
  await loadTaskTemplates()
  // 默认选中"默认"模板
  const defaultTpl = taskTemplates.value.find(t => t.isDefault)
  if (defaultTpl) taskForm.templateId = defaultTpl.id
  showTaskModal.value = true
}

const openEditModal = (row) => {
  editingTaskId.value = row.id
  const cronExpr = row.cron_expr || ''
  let runType = 'daily'
  let runTime = null
  let cronExpression = ''
  if (cronExpr) {
    const parts = cronExpr.trim().split(/\s+/)
    if (parts.length === 5) {
      const [mm, HH, dd, mo, dw] = parts
      const hr = parseInt(HH)
      const min = parseInt(mm)
      if (!isNaN(hr) && !isNaN(min) && dd === '*' && dw === '*') {
        runType = 'daily'
        runTime = new Date()
        runTime.setHours(hr, min, 0, 0)
        runTime = runTime.getTime()
      } else {
        runType = 'cron'
        cronExpression = cronExpr
      }
    } else {
      runType = 'cron'
      cronExpression = cronExpr
    }
  }
  // 解析 settings 中的 templateId
  const settings = row.settings || {}
  Object.assign(taskForm, {
    name: row.name || '',
    runType,
    runTime,
    cronExpression,
    selectedTokens: [...(row.selected_tokens || [])],
    selectedTasks: [...(row.selected_tasks || [])],
    templateId: settings.templateId || null,
    enabled: row.enabled !== false
  })
  loadTaskTemplates()
  showTaskModal.value = true
}

// ==================== 保存任务 ====================
const saveTask = async () => {
  if (!taskForm.name) { message.warning('请输入任务名称'); return }
  if (taskForm.runType === 'daily' && !taskForm.runTime) { message.warning('请选择运行时间'); return }
  if (taskForm.runType === 'cron' && !taskForm.cronExpression) { message.warning('请输入Cron表达式'); return }
  if (taskForm.selectedTokens.length === 0) { message.warning('请选择至少一个账号'); return }
  if (taskForm.selectedTasks.length === 0) { message.warning('请选择至少一个任务'); return }

  let formattedRunTime = null
  if (taskForm.runType === 'daily' && taskForm.runTime) {
    const time = new Date(taskForm.runTime)
    formattedRunTime = time.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
  }

  let cronExpr = ''
  if (taskForm.runType === 'daily' && formattedRunTime) {
    const [hr, min] = formattedRunTime.split(':')
    cronExpr = `${min} ${hr} * * *`
  } else if (taskForm.runType === 'cron') {
    cronExpr = taskForm.cronExpression
  }

  // 构造 settings，包含 templateId 和当前 batchSettings
  const settings = {
    templateId: taskForm.templateId || null,
    // 如果选了模板，把模板的设置也塞进去
    ...(taskForm.templateId ? getTemplateSettings(taskForm.templateId) : {}),
    // 把 batchSettings 中的执行参数也存入
    batchSettings: { ...batchSettings }
  }

  const taskData = {
    name: taskForm.name,
    run_type: taskForm.runType,
    cron_expr: cronExpr,
    selected_tokens: [...taskForm.selectedTokens],
    selected_tasks: [...taskForm.selectedTasks],
    enabled: taskForm.enabled,
    settings
  }

  try {
    if (editingTaskId.value) {
      await taskApi.update(editingTaskId.value, taskData)
    } else {
      await taskApi.create(taskData)
    }
  } catch (e) {
    console.error('保存到后端失败:', e)
    message.error('保存失败')
    return
  }

  showTaskModal.value = false
  editingTaskId.value = null
  message.success('定时任务已保存')
  fetchTasks()
}

// 获取指定模板的 settings
function getTemplateSettings(templateId) {
  const tmpl = taskTemplates.value.find(t => t.id === templateId)
  return tmpl ? { ...tmpl.settings } : {}
}

// ==================== 任务模板功能 ====================
const loadTaskTemplates = async () => {
  try {
    const data = await templateApi.list()
    taskTemplates.value = Array.isArray(data) ? data : []
    return taskTemplates.value
  } catch (e) {
    console.error('加载模板失败:', e)
    taskTemplates.value = []
    return []
  }
}

const resetTemplateForm = () => {
  currentTemplateId.value = null
  currentTemplateName.value = ''
  Object.assign(currentTemplate, {
    arenaFormation: 1,
    towerFormation: 1,
    bossFormation: 1,
    bossTimes: 2,
    claimBottle: true,
    payRecruit: true,
    openBox: true,
    arenaEnable: true,
    claimHangUp: true,
    claimEmail: true,
    blackMarketPurchase: true
  })
}

const openTemplateManagerModal = async () => {
  await loadTaskTemplates()
  showTemplateManagerModal.value = true
}

const openNewTemplateModal = () => {
  resetTemplateForm()
  showTaskTemplateModal.value = true
}

const openEditTemplateModal = (template) => {
  currentTemplateId.value = template.id
  currentTemplateName.value = template.name
  Object.assign(currentTemplate, template.settings)
  showTaskTemplateModal.value = true
}

const saveTaskTemplate = async () => {
  if (!currentTemplateName.value.trim()) {
    message.error('请输入模板名称')
    return
  }
  try {
    const payload = {
      name: currentTemplateName.value.trim(),
      settings: { ...currentTemplate }
    }
    if (currentTemplateId.value) {
      payload.id = currentTemplateId.value
      await templateApi.update(currentTemplateId.value, payload)
      message.success(`已更新模板 "${payload.name}"`)
    } else {
      payload.id = Date.now().toString()
      await templateApi.create(payload)
      message.success(`已保存模板 "${payload.name}"`)
    }
    await loadTaskTemplates()
    showTaskTemplateModal.value = false
    resetTemplateForm()
  } catch (e) {
    console.error('保存模板失败:', e)
    message.error('保存模板失败')
  }
}

const deleteTaskTemplate = async (templateId) => {
  try {
    await templateApi.delete(templateId)
    taskTemplates.value = taskTemplates.value.filter(t => t.id !== templateId)
    message.success('模板已删除')
  } catch (e) {
    console.error('删除模板失败:', e)
    message.error('删除模板失败')
  }
}

const openApplyTemplateModal = async () => {
  await loadTaskTemplates()
  selectedTemplateId.value = null
  selectedTokensForApply.value = []
  showApplyTemplateModal.value = true
}

const applyTemplate = async () => {
  if (!selectedTemplateId.value || selectedTokensForApply.value.length === 0) {
    message.error('请选择模板和要应用的账号')
    return
  }
  const template = taskTemplates.value.find(t => t.id === selectedTemplateId.value)
  if (!template) { message.error('模板不存在'); return }

  const accountSettings = {
    ...template.settings,
    templateId: template.id
  }

  // 同步写 localStorage + Supabase token 记录
  await Promise.all(selectedTokensForApply.value.map(async (tokenId) => {
    localStorage.setItem(`daily-settings:${tokenId}`, JSON.stringify(accountSettings))
    try {
      await tokenApi.update(tokenId, { settings: accountSettings })
    } catch (e) {
      // token 可能还没有 settings 字段，只写 localStorage
    }
  }))

  message.success(`已成功应用模板到 ${selectedTokensForApply.value.length} 个账号`)
  showApplyTemplateModal.value = false
}

// ==================== 账号模板引用 ====================
const openAccountTemplateModal = async () => {
  await loadTaskTemplates()
  selectedTemplateForFilter.value = null
  await loadAccountTemplateReferences()
  showAccountTemplateModal.value = true
}

const loadAccountTemplateReferences = async () => {
  await tokenStore.initTokenStore()
  const references = []
  const allTokens = sortedTokens.value || []
  for (const token of allTokens) {
    const tokenId = token.id
    const storedSettings = (() => {
      try { return JSON.parse(localStorage.getItem(`daily-settings:${tokenId}`) || 'null') } catch { return null }
    })()
    const templateId = token.templateId || token.settings?.templateId || (storedSettings ? storedSettings.templateId : null) || null
    const template = templateId ? taskTemplates.value.find(t => t.id === templateId) : null
    references.push({
      tokenId: tokenId,
      tokenName: token.label || token.role_name || token.name || `Token ${tokenId}`,
      templateId: templateId,
      templateName: template ? template.name : '未引用模板'
    })
  }
  accountTemplateReferences.value = references
  filteredAccountTemplates.value = references
}

const filterAccountTemplates = () => {
  if (!selectedTemplateForFilter.value) {
    filteredAccountTemplates.value = accountTemplateReferences.value
  } else {
    filteredAccountTemplates.value = accountTemplateReferences.value.filter(
      item => item.templateId === selectedTemplateForFilter.value
    )
  }
}

// ==================== 批量设置功能 ====================
const loadBatchSettings = async () => {
  try {
    const data = await settingsApi.get('batch_settings')
    if (data?.value) {
      Object.assign(batchSettings, data.value)
    }
  } catch (e) {
    console.error('加载批量设置失败:', e)
  }
}

const saveBatchSettings = async () => {
  try {
    await settingsApi.save('batch_settings', { ...batchSettings })
    message.success('任务执行设置已保存')
    showBatchSettingsModal.value = false
  } catch (e) {
    console.error('保存批量设置失败:', e)
    message.error('保存设置失败')
  }
}

const openBatchSettings = async () => {
  await loadBatchSettings()
  showBatchSettingsModal.value = true
}

// 页面加载时从 Supabase 读取设置和模板
loadBatchSettings()
loadTaskTemplates()

// ==================== 任务表格列 ====================
const taskColumns = [
  { title: '任务名称', key: 'name', width: 160 },
  {
    title: '引用模板',
    key: 'templateName',
    width: 120,
    render: (row) => {
      const settings = row.settings || {}
      const tid = settings.templateId
      if (!tid) return h('span', { style: 'color:#86909c' }, '-')
      const tmpl = taskTemplates.value.find(t => t.id === tid)
      return h(NTag, { type: 'info', size: 'small' }, { default: () => tmpl ? tmpl.name : tid })
    }
  },
  {
    title: '任务详情',
    key: 'taskDetail',
    width: 200,
    ellipsis: { tooltip: true },
    render: (row) => {
      const taskIds = row.selected_tasks || []
      const taskNames = taskIds.map(id => {
        const t = availableTasks.find(a => a.value === id)
        return t ? t.label : id
      })
      return h('span', {}, taskNames.join('、') || '-')
    }
  },
  {
    title: '调度方式',
    key: 'run_type',
    width: 100,
    render: (row) => h(NTag, { size: 'small', type: row.run_type === 'daily' ? 'info' : 'default' }, { default: () => row.run_type === 'daily' ? '每天固定' : 'Cron' })
  },
  { title: '时间/Cron', key: 'cron_expr', width: 120 },
  {
    title: '关联账号',
    key: 'selected_tokens',
    width: 100,
    render: (row) => `${(row.selected_tokens || []).length} 个`
  },
  {
    title: '下次执行',
    key: 'nextRun',
    width: 140,
    render: (row) => {
      const cronExpr = row.cron_expr || ''
      if (!cronExpr) return '-'
      try {
        const parts = cronExpr.trim().split(/\s+/)
        if (parts.length < 5) return '-'
        const next = calculateNextExecutionTime({
          runType: 'cron',
          cronExpression: cronExpr
        })
        if (!next) return '-'
        return h('span', { style: 'font-size:12px' }, moment(next).format('MM/DD HH:mm'))
      } catch {
        return '-'
      }
    }
  },
  {
    title: '状态',
    key: 'enabled',
    width: 80,
    render: (row) => h(NTag, { type: row.enabled ? 'success' : 'default', size: 'small' }, { default: () => row.enabled ? '启用' : '禁用' })
  },
  {
    title: '操作',
    key: 'actions',
    width: 260,
    render: (row) => h('div', { style: 'display:flex;gap:4px;flex-wrap:wrap' }, [
      h(NButton, { size: 'tiny', type: row.enabled ? 'warning' : 'success', onClick: () => toggleTask(row) }, { default: () => row.enabled ? '暂停' : '启动' }),
      h(NButton, { size: 'tiny', onClick: () => runTask(row) }, { default: () => '执行' }),
      h(NButton, { size: 'tiny', onClick: () => openEditModal(row) }, { default: () => '编辑' }),
      h(NButton, { size: 'tiny', type: 'error', onClick: () => confirmDelete(row) }, { default: () => '删除' })
    ])
  }
]

// ==================== 日志表格列 ====================
const commandLabelMap = {
  bottlehelper_stop: '停止罐子',
  bottlehelper_start: '启动罐子',
  bottlehelper_claim: '领取罐子',
  system_claimhangupreward: '领取挂机奖励',
  system_mysharecallback: '加钟',
  bottle_claimall: '领取所有罐子',
  signIn: '签到',
  claimHangup: '领取挂机',
  claimDaily: '领取日常',
  claimDailyPoint: '领取每日积分',
  climbTower: '爬塔',
  climbWeirdTower: '爬怪异塔',
  arenaFight: '竞技场',
  claimMail: '领取邮件',
  claimCar: '领取车辆',
  refreshCar: '刷新车辆',
  legacyHangup: '挂机遗产',
  heroRecruit: '招募英雄',
  studyGame: '学习功法',
  genieSweep: '精华扫荡',
  bossTower: 'Boss塔',
  dailyBundle: '每日礼包',
  mergeBox: '合并盒子',
  openBox: '开箱',
  legionSignIn: '公会签到'
}

function translateMessage(msg) {
  if (!msg) return msg
  let result = msg
  for (const [cmd, label] of Object.entries(commandLabelMap)) {
    if (result.includes(cmd)) result = result.replace(cmd, `[${label}]`)
  }
  return result
}

function formatBeijingTime(utcStr) {
  if (!utcStr) return '-'
  const d = new Date(utcStr)
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const hh = String((d.getUTCHours() + 8) % 24).padStart(2, '0')
  const mi = String(d.getUTCMinutes()).padStart(2, '0')
  const ss = String(d.getUTCSeconds()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${mi}:${ss}`
}

// 解析合并后的失败原因：格式 "cmd1 - reason1 | cmd2 - reason2" → [{cmd, reason}]
function parseFailureReasons(reasonStr) {
  if (!reasonStr) return []
  return reasonStr.split(' | ').map(part => {
    const idx = part.indexOf(' - ')
    if (idx === -1) return { cmd: '', reason: part }
    return { cmd: part.substring(0, idx).trim(), reason: part.substring(idx + 3).trim() }
  })
}

const logColumns = [
  { title: '时间', key: 'created_at', width: 160, render: (row) => formatBeijingTime(row.created_at || row.ts) },
  { title: '角色', key: 'token_name', width: 80 },
  { title: '状态', key: 'status', width: 60, render: (row) => h(NTag, { type: row.status === 'success' ? 'success' : row.status === 'error' ? 'error' : 'default', size: 'small' }, { default: () => row.status === 'success' ? '成功' : row.status === 'error' ? '失败' : (row.status || row.level || '-') }) },
  { title: '任务/命令', key: 'task_type', width: 100, render: (row) => translateMessage(row.task_type || row.category || '') },
  { title: '消息', key: 'message', ellipsis: { tooltip: true }, render: (row) => row.message || translateMessage(row.message_raw || '') || '-' }
]

// ==================== API 调用 ====================
async function checkHealth() {
  try {
    const health = await healthApi.check()
    backendOnline.value = true
    healthData.value = health || null
    if (health && health.supabase !== undefined) {
      supabaseOnline.value = health.supabase
    } else {
      try {
        await logApi.listFromDb(1)
        supabaseOnline.value = true
      } catch {
        supabaseOnline.value = false
      }
    }
  } catch {
    backendOnline.value = false
    supabaseOnline.value = false
  }
}

async function loadTotalTokens() {
  try {
    const tokens = await tokenApi.getAll()
    totalTokens.value = Array.isArray(tokens) ? tokens.length : 0
  } catch {
    totalTokens.value = 0
  }
}

const refreshAll = async () => {
  refreshing.value = true
  lastCheckTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  await Promise.all([checkHealth(), fetchTasks(), fetchLogs(), loadTotalTokens()])
  refreshing.value = false
}

async function fetchTasks() {
  tasksLoading.value = true
  try {
    const res = await taskApi.list()
    tasks.value = res || []
  } catch (e) {
    console.error('获取任务失败:', e)
  } finally {
    tasksLoading.value = false
  }
}

async function fetchLogs() {
  logsLoading.value = true
  try {
    // 并行加载聚合摘要和详细日志
    const [summaryResult, detailLogs] = await Promise.all([
      logApi.summary(500).catch(() => []),
      // 加载详细日志（聚合视图和详细视图共享 loading 状态）
      logApi.listFromDb(200).catch(() => {
        return logApi.list(100).then(res => (res || []).filter(l => l.category !== 'cron')).catch(() => [])
      })
    ])
    logSummary.value = summaryResult || []
    logs.value = detailLogs || []
  } catch (e) {
    console.error('获取日志失败:', e)
  } finally {
    logsLoading.value = false
  }
}

async function clearLogs() {
  try {
    // 调用 API 清除 Supabase 日志
    await api.delete('/api/logs')
    logs.value = []
    logSummary.value = []
    message.success('日志已清除')
  } catch (e) {
    console.error('清除日志失败:', e)
    message.error('清除日志失败')
  }
}

async function runTask(row) {
  try {
    if (row.id) await taskApi.run(row.id)
    message.success('已触发执行')
    setTimeout(fetchLogs, 2000)
  } catch (e) {
    message.error('执行失败')
  }
}

async function toggleTask(row) {
  try {
    await taskApi.update(row.id, { enabled: !row.enabled })
    message.success(row.enabled ? '任务已暂停' : '任务已启动')
    fetchTasks()
  } catch (e) {
    message.error('操作失败')
  }
}

function confirmDelete(row) {
  taskToDelete.value = row
  showDeleteModal.value = true
}

async function doDelete() {
  if (!taskToDelete.value) return
  try {
    await taskApi.delete(taskToDelete.value.id)
    message.success('已删除')
    showDeleteModal.value = false
    taskToDelete.value = null
    fetchTasks()
  } catch (e) {
    message.error('删除失败')
  }
}

// 自动刷新逻辑
watch(autoRefresh, (val) => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  if (val) {
    autoRefreshTimer = setInterval(() => {
      refreshAll()
    }, 30000)
  }
})

onMounted(() => {
  refreshAll()
})

onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})
</script>

<style scoped>
.dashboard-page {
  /* No background/padding - layout provides bg-gray-100 and p-6 */
}

.status-grid {
  margin-bottom: 20px;
}

.status-footer {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
  padding: 0 4px;
}

.status-footer-text {
  font-size: 13px;
  color: #6B7280;
}

.status-meta {
  font-size: 13px;
  color: #9CA3AF;
  margin-top: 4px;
}

.section-card {
  margin-bottom: 24px;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #E5E7EB;
}

.dashboard-action-btn {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  background-color: #4F46E5;
  border-color: #4F46E5;
  color: #fff;
  border-radius: 0.375rem;
  transition: all 0.15s ease;
}

.dashboard-action-btn:hover {
  background-color: #4338CA;
  border-color: #4338CA;
  box-shadow: 0 1px 3px rgba(79, 70, 229, 0.3);
}

/* 状态卡片 - Tailwind Dashboard KPI 风格 */
.status-card {
  background: #FFFFFF;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.status-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
}

.status-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon-wrapper.success {
  background-color: #ECFDF5;
}

.status-icon-wrapper.error {
  background-color: #FEF2F2;
}

.status-icon-wrapper.warning {
  background-color: #FFFBEB;
}

.status-icon-wrapper.info {
  background-color: #EEF2FF;
}

.status-label {
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

/* 设置弹窗样式 */
.settings-content .setting-label {
  display: inline-block;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 0;
  min-width: 120px;
  vertical-align: middle;
}
.settings-content .setting-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.setting-item {
  margin-bottom: 16px;
}
.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #111827;
}
.settings-grid {
  display: flex;
  flex-direction: column;
}
.settings-group {
  margin-bottom: 20px;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
}
.settings-group--bordered {
  background: #EEF2FF;
  border: 1px solid #C7D2FE;
}
.settings-group .group-title {
  font-size: 14px;
  font-weight: 600;
  color: #4F46E5;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.settings-group .setting-item {
  margin-bottom: 10px;
}
.settings-group .setting-item:last-child {
  margin-bottom: 0;
}
.setting-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.setting-item-row .n-time-picker,
.setting-item-row .n-input {
  flex: 1;
  min-width: 120px;
}
.setting-item-tip {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: -6px;
  margin-bottom: 4px;
  padding-left: 120px;
}
.setting-switches {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.switch-label {
  font-size: 14px;
  color: #374151;
}

/* Cron表达式解析样式 */
.cron-parser {
  margin-top: 8px;
  padding: 8px 12px;
  background: #EEF2FF;
  border-radius: 6px;
  border: 1px solid #C7D2FE;
}
.cron-validation {
  font-size: 13px;
  margin-bottom: 4px;
}
.cron-validation.success { color: #059669; }
.cron-validation.error { color: #DC2626; }
.cron-next-runs h4 {
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  margin: 4px 0 2px;
}
.cron-next-runs ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: #4B5563;
}
.cron-next-runs ul li {
  line-height: 1.6;
}

/* 日志卡片 */
.tech-card {
  border: 1px solid #D1FAE5 !important;
  transition: all 0.2s ease;
}

.tech-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

/* Responsive */
@media (max-width: 768px) {
  .status-grid :deep(.n-grid) {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .setting-switches {
    grid-template-columns: 1fr;
  }
}
</style>
