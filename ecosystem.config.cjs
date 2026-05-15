/**
 * PM2 配置：固定 cwd 为项目根，避免 `npm run start` 在错误目录下执行导致 `next: not found`。
 * 用法：在项目根目录执行 `pm2 start ecosystem.config.cjs`
 */
module.exports = {
  apps: [
    {
      name: "idea-factory",
      cwd: __dirname,
      script: "npm",
      args: "run start -- -H 0.0.0.0 -p 3000",
      autorestart: true,
      watch: false,
    },
  ],
};
