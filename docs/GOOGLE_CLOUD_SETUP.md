# Google Cloud SQL Setup Guide

## Prerequisites

1. Google Cloud Account
2. Google Cloud SDK installed
3. Access to Google Cloud Console

## Setting Up Cloud SQL

### 1. Create a Cloud SQL Instance

```bash
gcloud sql instances create plantechx-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=your-region \
  --root-password=your-root-password \
  --availability-type=zonal \
  --storage-type=SSD \
  --storage-size=10GB
```

### 2. Create Database and User

```bash
# Connect to Cloud SQL instance
gcloud sql connect plantechx-db

# Create database
CREATE DATABASE plantechx;

# Create user
CREATE USER 'plantechx_user'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON plantechx.* TO 'plantechx_user'@'%';
FLUSH PRIVILEGES;
```

### 3. Configure Environment Variables

Update your `.env` file with:

```env
DB_USER=plantechx_user
DB_PASSWORD=your-password
DB_NAME=plantechx
DB_HOST=/cloudsql/your-project:your-region:plantechx-db
INSTANCE_UNIX_SOCKET=/cloudsql/your-project:your-region:plantechx-db
```

## Deployment Setup

### 1. Enable Required APIs

```bash
gcloud services enable \
  sqladmin.googleapis.com \
  cloudtrace.googleapis.com \
  logging.googleapis.com
```

### 2. Set Up Service Account

```bash
# Create service account
gcloud iam service-accounts create plantechx-sa \
  --display-name="PlantechX Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding your-project \
  --member="serviceAccount:plantechx-sa@your-project.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Download key file
gcloud iam service-accounts keys create ./key.json \
  --iam-account=plantechx-sa@your-project.iam.gserviceaccount.com
```

### 3. Deploy Application

```bash
# Set project
gcloud config set project your-project-id

# Deploy
npm run deploy
```

## Local Development

### 1. Install Cloud SQL Proxy

```bash
# Download Cloud SQL Proxy
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64

# Make executable
chmod +x cloud_sql_proxy

# Start proxy
./cloud_sql_proxy -instances=your-project:your-region:plantechx-db=tcp:3306 \
  -credential_file=./key.json &
```

### 2. Update Local Environment

For local development, update `.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
```

## Monitoring and Maintenance

### 1. View Logs

```bash
gcloud logging tail "resource.type=cloud_run_revision"
```

### 2. Monitor Database

```bash
# View instance details
gcloud sql instances describe plantechx-db

# List databases
gcloud sql databases list --instance=plantechx-db
```

### 3. Backup Database

```bash
gcloud sql backups create --instance=plantechx-db
```

## Security Best Practices

1. Always use SSL/TLS connections
2. Regularly rotate service account keys
3. Use least privilege principle for service accounts
4. Enable audit logging
5. Set up automated backups
6. Configure network security (authorized networks)

## Troubleshooting

1. Connection Issues:
   - Verify instance name and credentials
   - Check network connectivity
   - Ensure service account has proper permissions

2. Performance Issues:
   - Monitor CPU and memory usage
   - Check slow query logs
   - Optimize database indexes

3. Deployment Issues:
   - Verify app.yaml configuration
   - Check service account permissions
   - Review deployment logs