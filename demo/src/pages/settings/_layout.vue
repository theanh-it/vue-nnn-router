<script setup lang="ts">
defineOptions({ name: "SettingsLayout" });
</script>

<template>
  <div class="settings-shell">
    <p class="banner">
      Layout
      <code>pages/settings/_layout.vue</code>
      — thư mục
      <strong>không có</strong>
      <code>index.vue</code>
      ; dùng
      <code>_redirect.ts</code>
      →
      <code>/settings/profile</code>
      .
    </p>
    <nav class="subnav">
      <RouterLink to="/settings/profile">/settings/profile</RouterLink>
      <RouterLink to="/settings/notifications">/settings/notifications</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.settings-shell {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.banner {
  margin: 0;
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  background: #ecfdf5;
  border: 1px dashed #6ee7b7;
  font-size: 0.875rem;
  color: #065f46;
}

code {
  font-size: 0.92em;
  padding: 0.06em 0.28em;
  border-radius: 4px;
  background: #d1fae5;
}

.subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.925rem;
}

.subnav a {
  color: #047857;
}

.subnav a.router-link-active {
  font-weight: 600;
  text-decoration: underline;
}
</style>
