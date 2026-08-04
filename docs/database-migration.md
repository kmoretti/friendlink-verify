# 数据库迁移与备份

本项目的数据库 provider 由 `DATABASE_PROVIDER` 选择：`mongodb`、`sqlite` 或 `mysql`。MongoDB 中的 `Submission` 与 `Config` 可以单向迁移到 SQLite/MySQL；GitHub `links.yml` 不参与迁移，因为它仍然是已通过友链的唯一事实来源。

## Schema migration

SQLite/MySQL 使用版本化 Drizzle migration：

```bash
npm run db:migrate
```

- `DATABASE_PROVIDER=sqlite`：读取 `SQLITE_PATH`，默认 `/data/friendlink.db`。
- `DATABASE_PROVIDER=mysql`：读取 `MYSQL_URL`。
- `DATABASE_PROVIDER=mongodb`：Mongoose 不使用 Drizzle SQL migration，命令安全跳过。

Compose 的 `migrate` service 会在 app 启动前执行该命令。不要在多个 Web 副本中并发手动执行 migration。

## Mongo → SQLite/MySQL 数据迁移

迁移源固定为 `MONGODB_URI`，目标由 `DATABASE_PROVIDER` 和对应 SQL 变量决定。迁移只处理：

- `Submission`
- `Config`

Mongo ObjectId 会转为字符串，目标 SQL 数据库保留 API 兼容字段 `_id`。迁移不会删除目标库中额外的数据，也不会迁移 GitHub YAML。

先执行只读预览：

```bash
DATABASE_PROVIDER=sqlite SQLITE_PATH=./data/friendlink.db \
  MONGODB_URI='mongodb://user:password@host/friendlink' \
  npm run db:migrate-data -- --dry-run
```

确认源记录数量、状态分布、目标记录数量和冲突后，再执行：

```bash
DATABASE_PROVIDER=sqlite SQLITE_PATH=./data/friendlink.db \
  MONGODB_URI='mongodb://user:password@host/friendlink' \
  npm run db:migrate-data -- --apply
```

MySQL 将 `DATABASE_PROVIDER` 改为 `mysql` 并设置 `MYSQL_URL`。`--apply` 使用幂等 upsert，重复执行不会按同一个 `_id` 创建重复记录；迁移完成后会校验源记录和 Config key 是否存在于目标库。

PowerShell 示例：

```powershell
$env:DATABASE_PROVIDER = "sqlite"
$env:SQLITE_PATH = "./data/friendlink.db"
$env:MONGODB_URI = "mongodb://user:password@host/friendlink"
npm run db:migrate-data -- --dry-run
npm run db:migrate-data -- --apply
```

## 备份命令

迁移工具不会自动备份。生产操作前请自行验证备份可恢复，并在维护窗口内暂停写入。

### MongoDB

```bash
mongodump --uri="$MONGODB_URI" --out=./backup/mongodb-$(date +%Y%m%d-%H%M%S)
```

Windows PowerShell 可使用：

```powershell
mongodump --uri=$env:MONGODB_URI --out=".\backup\mongodb-$(Get-Date -Format yyyyMMdd-HHmmss)"
```

### MySQL

```bash
mysqldump --single-transaction --routines --triggers "$MYSQL_URL" > backup/friendlink-$(date +%Y%m%d-%H%M%S).sql
```

### SQLite

停止 app 或先执行 checkpoint 后复制数据库文件；如果使用 WAL，必须同时考虑 `.db-wal` 和 `.db-shm` 文件：

```bash
sqlite3 "$SQLITE_PATH" 'PRAGMA wal_checkpoint(TRUNCATE);'
cp "$SQLITE_PATH" "backup/friendlink-$(date +%Y%m%d-%H%M%S).db"
```

SQLite 只支持单机单实例，不要把同一个文件挂载给多个应用副本或多个主机。
