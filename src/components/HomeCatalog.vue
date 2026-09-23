<script setup lang="ts">
defineProps<{ hasRecentProject: boolean }>()

const emit = defineEmits<{
  racing: []
  continue: []
  import: []
}>()
</script>

<template>
  <section class="home-screen">
    <header class="home-header">
      <div class="home-brand">
        <span class="brand-mark large">C</span>
        <div>
          <strong>CreatiBox</strong>
          <span>Choose what you want to create and play.</span>
        </div>
      </div>
    </header>

    <main class="home-content">
      <div class="home-copy">
        <span class="home-eyebrow">CREATOR CATALOG</span>
        <h1>今天想创造什么？</h1>
        <p>先选一个世界。我们会给你准备好能玩的基础结构，你只需要做选择和修改。</p>
      </div>

      <div class="catalog-grid">
        <button class="catalog-card racing-card" @click="emit('racing')">
          <div class="catalog-art">
            <div class="road-preview" />
            <div class="car-preview red" />
            <div class="car-preview blue second" />
          </div>
          <div class="catalog-copy">
            <span class="catalog-status">AVAILABLE</span>
            <strong>赛车游戏</strong>
            <p>选一辆车、一个车手、一条赛道，然后直接开赛。</p>
            <span class="catalog-cta">开始创建 →</span>
          </div>
        </button>

        <div class="catalog-card disabled-card">
          <div class="coming-placeholder">＋</div>
          <div class="catalog-copy">
            <span class="catalog-status muted">LATER</span>
            <strong>更多世界</strong>
            <p>Story、Animals、Architecture 等会从这里继续扩展。</p>
          </div>
        </div>
      </div>

      <div class="home-secondary-actions">
        <button v-if="hasRecentProject" @click="emit('continue')">继续上次项目</button>
        <button @click="emit('import')">导入 .creatibox</button>
      </div>
    </main>
  </section>
</template>
