<script setup lang="ts">
import { defineNnnSmoothScroll } from "vue-nnn-router";

defineOptions({ name: "AboutRoute" });

/** Demo per-page opt-out: this route uses native scrolling. */
defineNnnSmoothScroll(false);
</script>

<template>
  <section class="panel">
    <h2 class="heading">/about</h2>
    <p>
      Route từ
      <code>pages/about/index.vue</code>
      .
    </p>
    <p class="note">
      Page này dùng native scrolling để so sánh với
      <RouterLink to="/smooth-scroll">/smooth-scroll</RouterLink>
      .
    </p>
  </section>
</template>

<style scoped>
.panel {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  border: 1px solid #bfdbfe;
}

.heading {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  color: #1e3a8a;
}

.note {
  margin-bottom: 0;
  color: #4b5563;
}

.note :deep(a) {
  color: #2563eb;
}
</style>
