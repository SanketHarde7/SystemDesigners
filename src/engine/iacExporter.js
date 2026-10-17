/**
 * Converts the player's visual architecture graph into real-world
 * Docker Compose YAML and AWS Terraform HCL configurations.
 */

export function generateDockerCompose(nodes) {
  let yaml = `version: '3.9'\nservices:\n`;

  nodes.forEach((node) => {
    const name = node.id.replace(/[^a-zA-Z0-9_-]/g, '_');

    switch (node.type) {
      case 'LOAD_BALANCER':
        yaml += `  ${name}:\n    image: nginx:alpine\n    ports:\n      - "80:80"\n    deploy:\n      replicas: ${node.count || 1}\n\n`;
        break;
      case 'SERVER':
        yaml += `  ${name}:\n    image: node:20-alpine\n    environment:\n      - NODE_ENV=production\n      - TIER_LEVEL=${node.tier || 1}\n    deploy:\n      replicas: ${node.count || 1}\n\n`;
        break;
      case 'CACHE':
        yaml += `  ${name}:\n    image: redis:7-alpine\n    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru\n    ports:\n      - "6379:6379"\n\n`;
        break;
      case 'MESSAGE_QUEUE':
        yaml += `  ${name}:\n    image: bitnami/kafka:latest\n    ports:\n      - "9092:9092"\n\n`;
        break;
      case 'DATABASE':
        yaml += `  ${name}:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_DB: citadel_prod\n      POSTGRES_PASSWORD: supersecret\n    volumes:\n      - pgdata_${name}:/var/lib/postgresql/data\n\n`;
        break;
      case 'SHARD_DB':
        yaml += `  ${name}:\n    image: cassandra:4.1\n    ports:\n      - "9042:9042"\n\n`;
        break;
      default:
        yaml += `  ${name}:\n    image: alpine:latest\n\n`;
    }
  });

  yaml += `volumes:\n`;
  nodes
    .filter((n) => n.type === 'DATABASE')
    .forEach((n) => {
      const name = n.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      yaml += `  pgdata_${name}:\n`;
    });

  return yaml;
}

export function generateTerraform(nodes) {
  let tf = `terraform {\n  required_providers {\n    aws = {\n      source  = "hashicorp/aws"\n      version = "~> 5.0"\n    }\n  }\n}\n\nprovider "aws" {\n  region = "ap-south-1"\n}\n\n`;

  nodes.forEach((node) => {
    const resName = node.id.replace(/-/g, '_');

    if (node.type === 'LOAD_BALANCER') {
      tf += `resource "aws_lb" "${resName}" {\n  name               = "${node.id}-alb"\n  internal           = false\n  load_balancer_type = "application"\n}\n\n`;
    } else if (node.type === 'SERVER') {
      const instanceType = node.tier === 3 ? 'c6i.2xlarge' : node.tier === 2 ? 't3.large' : 't3.micro';
      tf += `resource "aws_instance" "${resName}" {\n  count         = ${node.count || 1}\n  ami           = "ami-0c55b159cbfafe1f0"\n  instance_type = "${instanceType}"\n  tags = {\n    Name = "${node.id}"\n  }\n}\n\n`;
    } else if (node.type === 'CACHE') {
      tf += `resource "aws_elasticache_cluster" "${resName}" {\n  cluster_id           = "${node.id}"\n  engine               = "redis"\n  node_type            = "cache.t3.medium"\n  num_cache_nodes      = ${node.tier || 1}\n}\n\n`;
    } else if (node.type === 'DATABASE') {
      tf += `resource "aws_db_instance" "${resName}" {\n  allocated_storage = 100\n  engine            = "postgres"\n  instance_class    = "db.m6i.large"\n  multi_az          = ${node.tier === 3 ? 'true' : 'false'}\n}\n\n`;
    } else if (node.type === 'SHARD_DB') {
      tf += `resource "aws_dynamodb_table" "${resName}" {\n  name         = "${node.id}-global-table"\n  billing_mode = "PAY_PER_REQUEST"\n  hash_key     = "PartitionKey"\n}\n\n`;
    } else if (node.type === 'CDN') {
      tf += `resource "aws_cloudfront_distribution" "${resName}" {\n  enabled = true\n  comment = "Orbital Edge CDN"\n}\n\n`;
    }
  });

  return tf;
}