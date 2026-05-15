/**
 * PM2：用 node 直接跑 next，避免 `npm run start` 在 PM2 下出现 `next: not found`。
 * 前置：在项目根执行过 `npm run build`（存在 .next/BUILD_ID）。
 */
const path = require("path");

module.exports = {
  apps: [
    {
      name: "idea-factory",
      cwd: __dirname,
      script: path.join(__dirname, "node_modules/next/dist/bin/next"),
      args: "start -H 0.0.0.0 -p 3000",
      interpreter: "node",
      env: { NODE_ENV: "production" },
      autorestart: true,
      watch: false,
    },
  ],
};
