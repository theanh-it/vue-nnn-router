<script setup lang="ts">
defineOptions({ name: "SettingsProfileRoute" });
</script>

<template>
  <section class="panel">
    <h2 class="heading">Hồ sơ</h2>
    <p>
      Path
      <code>/settings/profile</code>
      —
      <code>pages/settings/profile.vue</code>
      .
    </p>
    <p class="note">
      Vào
      <RouterLink to="/settings">/settings</RouterLink>
      (không có
      <code>index.vue</code>
      ) sẽ redirect tới đây nhờ
      <code>pages/settings/_redirect.ts</code>
      (
      <code>export default "profile"</code>
      ).
    </p>
  </section>
</template>

<style scoped>
.panel {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.heading {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  color: #14532d;
}

.note {
  margin: 0.75rem 0 0;
  font-size: 0.925rem;
  color: #166534;
}

.note :deep(a) {
  color: #047857;
  font-weight: 600;
}
</style>
