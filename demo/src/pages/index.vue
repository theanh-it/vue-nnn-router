<script setup lang="ts">
defineOptions({ name: "HomeRoute" });
</script>

<template>
  <section class="panel">
    <h2 class="heading">/</h2>
    <p>File:&nbsp;<code>pages/index.vue</code></p>
    <p class="hint">
      Middleware gốc in log khi vào SPA (xem Console).
    </p>
  </section>
</template>

<style scoped>
.panel {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #bbf7d0;
}

.heading {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  color: #14532d;
}

.hint {
  margin: 0.75rem 0 0;
  color: #166534;
  font-size: 0.875rem;
}
</style>
