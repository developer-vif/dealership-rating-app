# Project Backlog

This file maintains the project backlog for the dealership rating application. Items are organized by priority and category.

## High Priority

### Infrastructure & Database
- **Migration from PostgreSQL to DynamoDB (Local, then AWS)**
  - **Scope**: Migrate current PostgreSQL database to DynamoDB for better scalability and AWS integration
  - **Phase 1**: Set up local DynamoDB development environment
    - Install and configure DynamoDB Local
    - Update docker-compose.yml to include DynamoDB Local container
    - Create data access layer abstraction to support both PostgreSQL and DynamoDB
  - **Phase 2**: Design DynamoDB schema
    - Map existing PostgreSQL tables (users, dealerships, reviews, review_votes) to DynamoDB tables
    - Design partition keys and sort keys for optimal query patterns
    - Plan GSI (Global Secondary Index) requirements for existing query patterns
    - Document data modeling decisions and trade-offs
  - **Phase 3**: Implement DynamoDB data access layer
    - Create DynamoDB service layer using AWS SDK
    - Implement CRUD operations for all entities
    - Add query optimization for pagination and filtering
    - Maintain API compatibility with existing endpoints
  - **Phase 4**: Data migration strategy
    - Create migration scripts to transfer existing data
    - Implement dual-write pattern for safe migration
    - Plan rollback strategy
  - **Phase 5**: AWS deployment
    - Set up DynamoDB tables in AWS
    - Configure IAM roles and permissions
    - Update CloudFormation templates
    - Performance testing and optimization
  - **Considerations**:
    - Maintain existing API contracts during migration
    - Ensure data consistency during transition
    - Plan for potential query pattern changes
    - Cost analysis for DynamoDB vs RDS PostgreSQL
    - Backup and disaster recovery strategy
  - **Dependencies**: None
  - **Estimated Effort**: 3-4 weeks
  - **Priority**: High (Infrastructure improvement for scalability)

## Medium Priority

## Low Priority

## Icebox

---

*Last updated: 2025-07-12*