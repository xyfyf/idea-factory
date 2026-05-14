import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 关闭 Next 开发模式左下角「Route / Static / Bundler…」指示器。
   * 该面板为框架内置且仅有英文，无法随项目 i18n；生产构建不会出现。
   */
  devIndicators: false,
  /** 独立输出目录，便于 Docker 镜像瘦身与阿里云等环境部署 */
  output: "standalone",
};

export default nextConfig;
