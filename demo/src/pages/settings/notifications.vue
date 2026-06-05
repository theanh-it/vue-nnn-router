<script setup lang="ts">
defineOptions({ name: "SettingsNotificationsRoute" });
</script>

<template>
  <section class="panel">
    <h2 class="heading">Thông báo</h2>
    <p>
      Path
      <code>/settings/notifications</code>
      —
      <code>pages/settings/notifications.vue</code>
      .
    </p>
    <p class="note">
      <RouterLink to="/settings">← /settings</RouterLink>
      (redirect về profile)
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
}

.note :deep(a) {
  color: #047857;
}
</style>
