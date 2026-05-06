<template>
  <div>
    <n-card title="Test">
      <template #header-extra>
        <n-button>Button</n-button>
      </template>
      <n-modal v-model:show="show">Content</n-modal>
    </n-card>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const show = ref(false)
</script>