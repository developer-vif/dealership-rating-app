# Deployment Guide

## Local Development with Podman

### Prerequisites
- Podman and Podman Compose installed
- Google OAuth2 credentials
- Google Maps API key

### Setup Steps

1. **Clone and setup environment variables:**
```bash
cd dealership-rating-app
cp .env.example .env
# Edit .env file with your credentials
```

2. **Start services with Podman Compose:**
```bash
podman-compose up -d
```

3. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

### Environment Variables (.env file)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Database (for local development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dealership_ratings

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## AWS Production Deployment

### Cost Optimization Strategy
Our AWS deployment is designed for minimal cost while maintaining reliability:

- **ECS Fargate Spot Instances**: Up to 70% cost savings
- **Single AZ RDS**: Reduced database costs
- **t3.micro RDS instance**: Smallest production-ready instance
- **Application Load Balancer**: Only when traffic demands it
- **CloudFront**: CDN for static assets

### Estimated Monthly Costs (us-east-1)
- ECS Fargate Spot (0.5 vCPU, 1GB): ~$6/month
- RDS t3.micro (20GB storage): ~$15/month
- Application Load Balancer: ~$18/month
- Data transfer and misc: ~$5/month
**Total: ~$44/month**

### Deployment Steps

1. **Setup AWS CLI and configure credentials**
2. **Create ECR repository for container images:**
```bash
aws ecr create-repository --repository-name dealership-backend
aws ecr create-repository --repository-name dealership-frontend
```

3. **Deploy infrastructure using CloudFormation:**
```bash
aws cloudformation deploy \
  --template-file deployment/aws/cloudformation.yml \
  --stack-name dealership-app \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides EnvironmentName=dealership-app
```

4. **Build and push Docker images:**
```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t dealership-backend .
docker tag dealership-backend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/dealership-backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/dealership-backend:latest

# Build and push frontend
cd ../frontend
docker build -t dealership-frontend .
docker tag dealership-frontend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/dealership-frontend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/dealership-frontend:latest
```

5. **Create and register ECS task definition:**
```bash
# Update the task definition with your account ID and region
# Then register it
aws ecs register-task-definition --cli-input-json file://deployment/aws/ecs-task-definition.json
```

6. **Store secrets in AWS Secrets Manager:**
```bash
aws secretsmanager create-secret --name "dealership-app/google-client-id" --secret-string "your_google_client_id"
aws secretsmanager create-secret --name "dealership-app/google-client-secret" --secret-string "your_google_client_secret"
aws secretsmanager create-secret --name "dealership-app/google-maps-api-key" --secret-string "your_google_maps_api_key"
aws secretsmanager create-secret --name "dealership-app/jwt-secret" --secret-string "your_jwt_secret"
```

### Scaling and Monitoring

**Auto Scaling (Optional for cost optimization):**
```bash
# Create auto scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/dealership-app-cluster/dealership-app-service \
  --min-capacity 1 \
  --max-capacity 3

# Create scaling policy based on CPU utilization
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/dealership-app-cluster/dealership-app-service \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

## Database Migrations

### Local Development
```bash
# Run migrations
podman exec -it dealership_api npm run migrate:up

# Rollback migrations
podman exec -it dealership_api npm run migrate:down
```

### Production
```bash
# Connect to ECS task and run migrations
aws ecs execute-command \
  --cluster dealership-app-cluster \
  --task TASK_ID \
  --container dealership-backend \
  --interactive \
  --command "/bin/bash"

# Inside the container
npm run migrate:up
```

## Health Checks and Monitoring

### Health Check Endpoints
- Backend: `GET /health`
- Database: Connection pool status
- External APIs: Google Maps/OAuth status

### Logging
- Application logs: CloudWatch Logs
- Access logs: ALB access logs
- Database logs: RDS logs

### Alerting (Optional)
Set up CloudWatch alarms for:
- High CPU utilization (>80%)
- High memory utilization (>80%)
- Database connection failures
- Application error rates

## Security Considerations

### Network Security
- Private subnets for ECS tasks and RDS
- Security groups restrict access between services
- No direct internet access to backend services

### Secrets Management
- All sensitive data stored in AWS Secrets Manager
- Environment variables for non-sensitive configuration
- IAM roles with minimal required permissions

### SSL/TLS
- ALB terminates SSL (add certificate for HTTPS)
- Internal communication over private network

## Backup and Disaster Recovery

### Database Backups
- Automated daily backups (7-day retention)
- Manual snapshots before major deployments
- Cross-region backup replication (optional)

### Application Deployment Rollback
```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster dealership-app-cluster \
  --service dealership-app-service \
  --task-definition dealership-app-task:PREVIOUS_REVISION
```

## Cost Monitoring

### AWS Cost Explorer
- Track monthly spending by service
- Set up billing alerts for budget overruns
- Monitor Fargate Spot vs On-Demand usage

### Optimization Tips
1. Use Fargate Spot instances when possible
2. Right-size your ECS tasks based on metrics
3. Consider Aurora Serverless for variable workloads
4. Implement CloudFront for static content caching
5. Use S3 Intelligent Tiering for static assets