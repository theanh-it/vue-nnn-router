<script setup lang="ts">
import { useRoute } from "vue-router";

defineOptions({ name: "UserDetailRoute" });

const route = useRoute();
const id = () => route.params.id as string;
</script>

<template>
  <section class="panel">
    <h2 class="heading">Chi tiết user</h2>
    <p>
      Path:
      <code>/users/{{ id() }}</code>
    </p>
    <p>
      Rút gọn:
      <code>pages/users/[id].vue</code>
      (tương đương thư mục
      <code>[id]/index.vue</code>
      ) →
      <code>:id</code>
      trong Vue Router.
    </p>
    <p><RouterLink to="/users">← /users</RouterLink></p>
  </section>
</template>

<style scoped>
.panel {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  border: 1px solid #fde047;
}

.heading {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  color: #713f12;
}

a {
  color: #a16207;
}
</style>
