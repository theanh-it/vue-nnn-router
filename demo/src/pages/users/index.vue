<script setup lang="ts">
defineOptions({ name: "UsersListRoute" });
</script>

<template>
  <section class="panel">
    <h2 class="heading">/users</h2>
    <p>
      Trang chủ segment
      <code>/users</code>
      —
      <code>pages/users/index.vue</code>
      (trong
      <code>users/_layout.vue</code>
      ).
    </p>
    <p class="extra">
      <RouterLink to="/users/add">/users/add</RouterLink>
      ·
      <RouterLink to="/users/demo-123">/users/demo-123</RouterLink>
    </p>
  </section>
</template>

<style scoped>
.panel {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid #e5e5e5;
}

.heading {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  color: #171717;
}

.extra {
  margin: 0.75rem 0 0;
  font-size: 0.925rem;
}

.extra :deep(a) {
  color: #2563eb;
}
</style>
