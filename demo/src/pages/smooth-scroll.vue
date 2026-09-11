<script setup lang="ts">
import { defineNnnSmoothScroll } from "vue-nnn-router";

defineOptions({ name: "SmoothScrollRoute" });

defineNnnSmoothScroll({
  enabled: true,
  disableOnMobile: true,
});

const sections = [
  {
    number: "01",
    title: "Wheel smoothing",
    description:
      "Cuộn bằng mouse wheel hoặc trackpad để cảm nhận chuyển động được nội suy qua từng frame.",
    tone: "violet",
  },
  {
    number: "02",
    title: "Router-aware lifecycle",
    description:
      "Lenis chỉ tồn tại khi route hiện tại bật smooth scrolling và được cleanup khi rời route.",
    tone: "blue",
  },
  {
    number: "03",
    title: "Responsive fallback",
    description:
      "Thu viewport xuống 767px hoặc nhỏ hơn: controller hủy Lenis và trả lại native scrolling.",
    tone: "green",
  },
  {
    number: "04",
    title: "Per-page control",
    description:
      "Chuyển sang /about để so sánh. Page đó dùng defineNnnSmoothScroll(false).",
    tone: "orange",
  },
] as const;
</script>

<template>
  <article class="smooth-demo">
    <header class="hero">
      <p class="eyebrow">Lenis integration demo</p>
      <h2 class="title">Smooth scrolling liên tục</h2>
      <p class="lead">
        Page này chủ động bật Lenis trên desktop và dùng native scrolling trên
        mobile. Hãy cuộn chậm, cuộn nhanh và đổi chiều để kiểm tra độ mượt.
      </p>

      <div class="config" aria-label="Cấu hình demo">
        <code>enabled: true</code>
        <code>disableOnMobile: true</code>
        <code>mobileBreakpoint: 767px</code>
      </div>

      <p class="compare">
        So sánh với
        <RouterLink to="/about">/about — native scroll</RouterLink>
      </p>
    </header>

    <section
      v-for="section in sections"
      :key="section.number"
      class="stage"
      :class="`stage--${section.tone}`"
    >
      <p class="stage-number">{{ section.number }}</p>
      <div>
        <h3>{{ section.title }}</h3>
        <p>{{ section.description }}</p>
      </div>
    </section>

    <section class="nested-demo">
      <div>
        <p class="eyebrow">Nested native area</p>
        <h3>Vùng cuộn riêng</h3>
        <p>
          Đặt con trỏ trong khung bên cạnh rồi cuộn. Thuộc tính
          <code>data-lenis-prevent</code>
          giữ vùng này ở chế độ native.
        </p>
      </div>

      <div class="native-box" data-lenis-prevent>
        <p v-for="item in 8" :key="item">
          Native scroll item {{ item }}
        </p>
      </div>
    </section>

    <footer class="finish">
      <p>Đã tới cuối trang.</p>
      <RouterLink to="/about">Mở page native để so sánh →</RouterLink>
    </footer>
  </article>
</template>

<style scoped>
.smooth-demo {
  display: grid;
  gap: 2rem;
}

.hero,
.stage,
.nested-demo,
.finish {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: clamp(1.5rem, 5vw, 3.5rem);
}

.hero {
  min-height: 70vh;
  display: grid;
  align-content: center;
  background:
    radial-gradient(circle at top right, #ddd6fe 0, transparent 40%),
    linear-gradient(145deg, #faf5ff, #ffffff 65%);
}

.eyebrow,
.stage-number {
  margin: 0 0 0.75rem;
  color: #7c3aed;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.title {
  max-width: 12ch;
  margin: 0;
  color: #111827;
  font-size: clamp(2.25rem, 8vw, 4.75rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.lead {
  max-width: 38rem;
  margin: 1.5rem 0 0;
  color: #4b5563;
  font-size: 1.05rem;
}

.config {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.config code {
  border: 1px solid #ddd6fe;
  background: #f5f3ff;
  color: #5b21b6;
}

.compare {
  margin: 1.5rem 0 0;
  color: #6b7280;
}

.compare a,
.finish a {
  color: #6d28d9;
  font-weight: 600;
}

.stage {
  min-height: 72vh;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: clamp(1rem, 5vw, 3rem);
}

.stage-number {
  align-self: start;
  font-size: 1rem;
}

.stage h3,
.nested-demo h3 {
  margin: 0;
  color: #111827;
  font-size: clamp(1.75rem, 5vw, 3.25rem);
  line-height: 1.05;
}

.stage p:not(.stage-number),
.nested-demo p {
  max-width: 32rem;
  margin: 1rem 0 0;
  color: #4b5563;
}

.stage--violet {
  background: linear-gradient(145deg, #f5f3ff, #ede9fe);
}

.stage--blue {
  background: linear-gradient(145deg, #eff6ff, #dbeafe);
}

.stage--green {
  background: linear-gradient(145deg, #ecfdf5, #d1fae5);
}

.stage--orange {
  background: linear-gradient(145deg, #fff7ed, #ffedd5);
}

.nested-demo {
  min-height: 65vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(13rem, 0.75fr);
  align-items: center;
  gap: 2rem;
  background: #f9fafb;
}

.native-box {
  max-height: 14rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 0.5rem 1rem;
  background: #ffffff;
}

.native-box p {
  margin: 0;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.native-box p:last-child {
  border-bottom: 0;
}

.finish {
  min-height: 45vh;
  display: grid;
  place-content: center;
  justify-items: center;
  background: #111827;
  color: #ffffff;
  text-align: center;
}

.finish p {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.finish a {
  color: #c4b5fd;
}

@media (max-width: 767px) {
  .hero,
  .stage,
  .nested-demo,
  .finish {
    min-height: auto;
    padding: 1.5rem;
  }

  .hero {
    padding-block: 3.5rem;
  }

  .stage {
    min-height: 55vh;
    grid-template-columns: 1fr;
    align-content: center;
  }

  .nested-demo {
    grid-template-columns: 1fr;
    padding-block: 3rem;
  }

  .finish {
    min-height: 40vh;
  }
}
</style>
