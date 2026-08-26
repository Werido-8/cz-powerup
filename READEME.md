# 更新部署说明

不用重新配置 Nginx。只要没改端口或 Nginx 配置，更新流程就是：上传新的构建产物 → 替换旧 `.output` → 重启 Node 服务。

## 1. 本地确认构建产物

先在本地确认新构建产物完整：

```powershell
Test-Path .output\server\index.mjs
```

必须返回 `True`。

## 2. 上传到服务器

用文件传输工具把本地 `.output` 上传到服务器项目目录。先命名成 `.output-new`，不要覆盖线上正在使用的 `.output`：

```text
/usr/local/project/Ai-powerup-demo/.output-new
```

## 3. 服务器校验

上传完成后，在服务器执行：

```bash
cd /usr/local/project/Ai-powerup-demo

test -f .output-new/server/index.mjs
```

确认没有报错后再继续。

## 4. 切换版本并重启

```bash
mv .output .output-backup-20260723
mv .output-new .output

systemctl restart ai-powerup-demo
systemctl status ai-powerup-demo --no-pager
```

## 5. 验证服务

验证本机服务和 Nginx 入口：

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8078
```

两条都返回 `200`、`301` 或 `302` 就说明更新完成。

浏览器再访问：

```text
http://172.16.0.135:8078/
```

## 回滚

确认网页正常后，旧版本 `.output-backup-20260723` 可以先保留几天，用于快速回滚。Nginx 无需重启。
