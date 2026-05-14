<script setup lang="ts">
defineOptions({ name: "UsersLayout" });
</script>

<template>
  <div class="users-shell">
    <p class="banner">
      Layout
      <code>pages/users/_layout.vue</code>
      — bọc
      <code>/users</code>
      và các route con dưới thư mục
      <code>users/</code>
      .
    </p>
    <RouterView />
  </div>
</template>

<style scoped>
.users-shell {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.banner {
  margin: 0;
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  background: #f3f4f6;
  border: 1px dashed #9ca3af;
  font-size: 0.875rem;
  color: #374151;
}

code {
  font-size: 0.92em;
  padding: 0.06em 0.28em;
  border-radius: 4px;
  background: #e5e7eb;
}
</style>
