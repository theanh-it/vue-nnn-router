<script setup lang="ts">
import { ROUTER_NAME } from "./router/router-name";

const pathLinks = [
  { to: "/", label: "/" },
  { to: "/about", label: "/about" },
  { to: "/users", label: "/users" },
  { to: "/users/add", label: "/users/add" },
  { to: "/users/demo-123", label: "/users/demo-123" },
  { to: "/settings", label: "/settings → profile" },
  { to: "/settings/notifications", label: "/settings/notifications" },
  { to: "/admin", label: "/admin → dashboard" },
] as const;

const nameLinks = [
  { name: ROUTER_NAME.adminDashboard, label: "ROUTER_NAME.adminDashboard" },
] as const;
</script>

<template>
  <div class="app">
    <header class="header">
      <h1 class="title">vue-nnn-router demo</h1>
      <p class="muted">
        File-based pages (
        <code>index.vue</code>
        ,
        <code>_layout.vue</code>
        ,
        <code>_redirect.ts</code>
        ).
        Demo dùng
        <strong>lazy</strong>
        pages +
        <code>createNnnModules</code>
        .
        —
        <kbd>npm run dev</kbd>
        trong
        <code>demo/</code>
      </p>
      <nav class="nav">
        <RouterLink
          v-for="l in pathLinks"
          :key="l.label"
          :to="l.to"
          class="nav-link"
          active-class="nav-link--active"
        >
          {{ l.label }}
        </RouterLink>
        <RouterLink
          v-for="l in nameLinks"
          :key="l.label"
          :to="{ name: l.name }"
          class="nav-link"
          active-class="nav-link--active"
        >
          {{ l.label }}
        </RouterLink>
      </nav>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 42rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
  font-family:
    ui-sans-serif,
    system-ui,
    sans-serif;
  line-height: 1.5;
}

.header {
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1.25rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.35rem;
  color: #111827;
}

.muted {
  margin: 0 0 1rem;
  color: #6b7280;
  font-size: 0.9rem;
}

code,
kbd {
  font-size: 0.82em;
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: #f3f4f6;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
}

.nav-link {
  color: #2563eb;
  text-decoration: none;
  padding: 0.25rem 0.35rem;
  border-radius: 4px;
}

.nav-link:hover {
  background: #eff6ff;
}

.nav-link--active {
  font-weight: 600;
  text-decoration: underline;
}

.main {
  min-height: 8rem;
}
</style>
