# AWS RDS Setup Guide

## Prerequisites
- AWS Account with appropriate permissions
- AWS CLI installed and configured (optional)
- Access to AWS Management Console

## Step 1: Create RDS Instance

1. Log in to AWS Management Console
2. Navigate to RDS Dashboard
3. Click "Create database"
4. Choose settings:
   - Select MySQL as the engine
   - Choose the appropriate version (e.g., MySQL 8.0)
   - Select "Production" or "Dev/Test" template
   - Configure instance specifications:
     - DB instance class (e.g., db.t3.micro for development)
     - Multi-AZ deployment (Yes for production, No for development)
   - Configure storage:
     - Allocated storage (e.g., 20GB)
     - Enable storage autoscaling if needed

## Step 2: Configure Network & Security

1. Network settings:
   - Choose VPC
   - Select subnet group
   - Choose "Publicly accessible" based on your needs
2. Security group settings:
   - Create new security group or select existing
   - Add inbound rules for MySQL (Port 3306)
   - Restrict IP addresses that can access the database

## Step 3: Configure Database Authentication

1. Set master username and password
2. Create initial database name
3. Configure backup retention and maintenance window

## Step 4: Update Application Configuration

Update the database configuration in your application:

1. Create a new file `config/dbConfig.js`:
```javascript
module.exports = {
  development: {
    host: 'your-rds-endpoint.region.rds.amazonaws.com',
    user: 'your_master_username',
    password: 'your_master_password',
    database: 'your_database_name',
    port: 3306,
    ssl: true
  },
  production: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: true
  }
};
```

2. Update environment variables:
```env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=your_master_username
DB_PASSWORD=your_master_password
DB_NAME=your_database_name
DB_PORT=3306
```

## Step 5: Database Migration

1. Export your local database schema and data
2. Import the database dump to RDS instance
3. Verify data migration

## Step 6: Test Connection

1. Test database connection from your application
2. Monitor RDS metrics in AWS Console
3. Set up CloudWatch alarms for monitoring

## Security Best Practices

1. Use SSL/TLS for database connections
2. Implement proper IAM roles and policies
3. Regular security group audits
4. Enable automated backups
5. Use secrets management for database credentials

## Monitoring and Maintenance

1. Set up CloudWatch monitoring
2. Configure backup retention periods
3. Plan maintenance windows
4. Monitor performance metrics:
   - CPU Utilization
   - Storage space
   - Connection count
   - Read/Write IOPS

## Cost Optimization

1. Choose appropriate instance size
2. Use reserved instances for production
3. Monitor and optimize storage usage
4. Enable storage auto-scaling with proper thresholds

## Troubleshooting

1. Common connection issues:
   - Security group configuration
   - Network ACL settings
   - Credential issues
2. Performance issues:
   - Connection pooling
   - Query optimization
   - Resource constraints

## Next Steps

1. Implement connection pooling
2. Set up read replicas if needed
3. Configure automated backups
4. Implement monitoring and alerting
5. Document backup and restore procedures