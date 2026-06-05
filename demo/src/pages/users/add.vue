<script lang="ts">
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

/** Chỉ route này; chạy sau `pages/_middleware` và `users/_middleware` (DEV: xem Console). */
export function middleware(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (import.meta.env.DEV) {
    console.log("[demo pages/users/add.vue — middleware]", to.fullPath);
  }

  next();
}
</script>

<script setup lang="ts">
import { onMounted } from "vue";

defineOptions({ name: "UsersAddRoute" });

onMounted(() => {
  console.log("users/add.vue mounted");
});
</script>

<template>
  <section class="panel">
    <h2 class="heading">Thêm user</h2>
    <p>
      Path
      <code>/users/add</code>
      — file
      <code>pages/users/add.vue</code>
      có
      <code>export function middleware</code>
      (xem Console khi vào trang này, sau log
      <code>_middleware</code>
      ).
    </p>
    <p><RouterLink to="/users">← /users</RouterLink></p>
  </section>
</template>

<style scoped>
.panel {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
  border: 1px solid #f9a8d4;
}

.heading {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  color: #9d174d;
}

code {
  font-size: 0.92em;
  padding: 0.06em 0.28em;
  border-radius: 4px;
  background: #fbcfe8;
}

a {
  color: #be185d;
}
</style>
