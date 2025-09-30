# Database Migrations

This directory contains database migration scripts for the movie generation platform.

## Running Migrations

### Manual Execution

```bash
# Run a specific migration
npm run tsx src/database/migrations/001-fix-relationships.ts

# Rollback a migration (if supported)
npm run tsx src/database/migrations/001-fix-relationships.ts rollback
```

### Using Payload CLI

```bash
# Generate migration
npx payload migrate:create

# Run pending migrations
npx payload migrate

# Rollback last migration
npx payload migrate:down
```

## Migration List

### 001-fix-relationships.ts
**Status**: Ready to run
**Purpose**: Convert Media and Sessions project fields from text strings to ObjectId relationships

**Changes**:
- Updates Media.project from string to ObjectId
- Updates Sessions.project from string to ObjectId
- Validates all project references exist
- Provides rollback capability

**Estimated Duration**: 2-5 minutes (depends on data size)

**Risk Level**: Low (non-destructive, reversible)

## Best Practices

1. **Backup First**: Always backup production database before running migrations
2. **Test in Staging**: Run migrations in staging environment first
3. **During Low Traffic**: Schedule migrations during low-traffic periods
4. **Monitor**: Watch database performance during and after migration
5. **Verify**: Run verification queries after migration completes

## Migration Template

```typescript
/**
 * Migration: [Description]
 *
 * [Detailed explanation of what this migration does]
 *
 * @date YYYY-MM-DD
 * @author [Author Name]
 */

import { getPayload } from '@/utils/getPayload'

export async function migrate() {
  const payload = await getPayload()

  // Migration logic here

  console.log('Migration completed')
}

export async function rollback() {
  const payload = await getPayload()

  // Rollback logic here

  console.log('Rollback completed')
}

if (require.main === module) {
  const command = process.argv[2]

  if (command === 'rollback') {
    rollback().then(() => process.exit(0))
  } else {
    migrate().then(() => process.exit(0))
  }
}
```

## Troubleshooting

### Migration Fails Partway Through
1. Check error logs for specific document IDs
2. Fix data issues manually
3. Re-run migration (should skip already migrated documents)

### Performance Issues During Migration
1. Reduce batch size
2. Add delays between batches
3. Run during off-peak hours

### Rollback Needed
1. Run rollback command immediately
2. Investigate root cause
3. Fix migration script
4. Test in staging before re-running

## Support

For migration issues, contact the database team or create an issue in the repository.