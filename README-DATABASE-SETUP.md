# Database Setup for Advanced Features

This document contains the SQL scripts needed to set up the database tables for the new advanced features.

## Prerequisites

- Access to Supabase dashboard
- Database admin privileges
- Existing Creative AI Studio database

## Features Covered

1. **Developer API Keys** - For API access management
2. **Team Collaboration** - Projects, members, comments
3. **Batch Processing** - Batch jobs and items tracking

## Installation Instructions

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the SQL from `migrations/006_add_advanced_features.sql`
5. Click **Run** to execute

### Option 2: API Endpoint

1. Make a POST request to `/api/migrations/advanced-features`
2. Check the response for migration status
3. Use GET request to `/api/migrations/advanced-features` to verify

## Tables Created

### Developer API Keys (`developer_api_keys`)
- Stores API keys for developer access
- Links to user profiles
- Tracks usage and rate limits

### Team Projects (`team_projects`)  
- Project containers for team collaboration
- Owned by users with visibility settings
- Tracks image counts and status

### Team Members (`team_members`)
- Links users to projects with roles
- Supports owner, admin, editor, viewer roles
- Tracks membership status and invitations

### Project Comments (`project_comments`)
- Comments on projects and specific images
- Can be resolved/unresolved
- Links to both project and image

### Batch Jobs (`batch_jobs`)
- Tracks batch processing jobs
- Stores settings and progress
- Links to user and optional project

### Batch Job Items (`batch_job_items`)
- Individual items within batch jobs
- Stores prompts, results, and timing
- Tracks status per item

## Security

All tables include Row Level Security (RLS) policies:

- Users can only access their own API keys
- Team members can only access projects they belong to
- Project owners have full control over their projects
- Comments are visible to all project members

## Verification

After running the migration, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'developer_api_keys',
    'team_projects', 
    'team_members',
    'project_comments',
    'batch_jobs',
    'batch_job_items'
);
```

## Troubleshooting

If you encounter errors:

1. **Permission Issues**: Ensure you have database admin access
2. **Existing Tables**: Drop conflicting tables first if needed
3. **RLS Policies**: Check if similar policies already exist
4. **Functions**: Verify the `update_updated_at_column()` function exists

## Next Steps

After database setup:

1. Test API endpoints for each feature
2. Verify RLS policies work correctly
3. Test team collaboration features
4. Verify batch processing functionality

## Support

For issues with database setup:

1. Check Supabase logs in dashboard
2. Verify environment variables are set
3. Test with a simple query first
4. Contact support with specific error messages