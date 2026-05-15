# 用 Git 自动部署到阿里云（GitHub Actions）

日常只需在本机：

```bash
git add -A
git commit -m "你的说明"
git push origin main
```

推送后打开 GitHub 仓库 → **Actions**，看 **Deploy to Aliyun** 是否绿色成功。

## 一次性配置（约 10 分钟）

### 1. 在服务器上允许 GitHub 用密钥登录

用阿里云 **远程连接** 登录后执行（在服务器上）：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

在 **你 Windows 本机** PowerShell 生成密钥（若还没有）：

```powershell
ssh-keygen -t ed25519 -C "github-deploy" -f "$env:USERPROFILE\.ssh\idea-factory-deploy" -N '""'
Get-Content "$env:USERPROFILE\.ssh\idea-factory-deploy.pub"
```

把输出的 **一整行** `ssh-ed25519 AAAA...` 粘贴进服务器 `authorized_keys` 保存。

```bash
chmod 600 ~/.ssh/authorized_keys
```

### 2. 在 GitHub 仓库添加 Secrets

仓库 **Settings → Secrets and variables → Actions → New repository secret**：

| Name | Value |
|------|--------|
| `SERVER_HOST` | `47.82.230.224` |
| `SERVER_USER` | `admin` |
| `SSH_PRIVATE_KEY` | 本机 `idea-factory-deploy` **私钥** 全文（`-----BEGIN...` 到 `-----END...`） |

### 3. 服务器上的环境变量（只做一次）

```bash
nano ~/idea-factory/.env.production
# DEEPSEEK_API_KEY=sk-...
```

密钥不要提交到 Git。

## 说明

- **不会**把 `.next` 放进 Git 仓库；构建在 GitHub 机器上完成，再传到服务器。
- 服务器 **不要** 再跑 `npm run build`（1G 内存易卡死）。
- 若 Actions 失败，点进该次运行查看红色步骤日志。
