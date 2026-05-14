/** Option khi sinh RouteRecordRaw từ import.meta.glob (hoặc map tương đương). */
export interface CreateNnnRoutesOptions {
  /** Tiền tố path URL (chuẩn hoá không có slash đầu/cuối), ví dụ `app` → `/app/...`. */
  prefix?: string;

  /**
   * Bỏ tiền tố trong key glob (sau `simplifyGlobKey`).
   * Phải khớp đúng phần đầu của key Vite trả về, ví dụ `src/pages`, hoặc `../pages` khi glob `../pages/**` từ file trong `router/`.
   */
  routesRoot?: string;

  /** Xử lý khi hai file cùng một URL path. */
  onDuplicate?: "first-wins" | "last-wins" | ((path: string, files: string[]) => void);

  /** In bảng path ↔ file sau khi build. */
  verbose?: boolean;
  silent?: boolean;
  logger?: (...args: unknown[]) => void;
}

export type NnnRouteMeta = {
  /** Đường dẫn file route (key trong glob) — tiện debug. */
  nnnFile?: string;
};
