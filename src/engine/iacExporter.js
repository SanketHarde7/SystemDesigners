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
      case 'API_GATEWAY':
        yaml += `  ${name}:\n    image: kong:3.6-alpine\n    ports:\n      - "8000:8000"\n      - "8443:8443"\n    deploy:\n      replicas: ${node.count || 1}\n\n`;
        break;
      case 'SERVER':
        yaml += `  ${name}:\n    image: node:20-alpine\n    environment:\n      - NODE_ENV=production\n      - TIER_LEVEL=${node.tier || 1}\n      - STATEFUL=${Boolean(node.stateful)}\n    deploy:\n      replicas: ${node.count || 1}\n\n`;
        break;
      case 'LAMBDA':
        yaml += `  ${name}:\n    image: public.ecr.aws/lambda/nodejs:20\n    environment:\n      - TIER_LEVEL=${node.tier || 1}\n    deploy:\n      replicas: ${node.count || 1}\n\n`;
        break;
      case 'CACHE':
        yaml += `  ${name}:\n    image: redis:7-alpine\n    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru\n    ports:\n      - "6379:6379"\n\n`;
        break;
      case 'SEARCH_ENGINE':
        yaml += `  ${name}:\n    image: opensearchproject/opensearch:2.12.0\n    environment:\n      - discovery.type=single-node\n    ports:\n      - "9200:9200"\n\n`;
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
      case 'OBJECT_STORAGE':
        yaml += `  ${name}:\n    image: minio/minio:latest\n    command: server /data\n    ports:\n      - "9000:9000"\n\n`;
        break;
      case 'FIREWALL':
        yaml += `  ${name}:\n    image: owasp/modsecurity-crs:nginx-alpine\n    ports:\n      - "443:443"\n\n`;
        break;
      case 'CDN':
        yaml += `  ${name}:\n    image: varnish:7.4-alpine\n    ports:\n      - "8080:80"\n\n`;
        break;
      default:
        yaml += `  ${name}:\n    image: alpine:latest\n\n`;
    }
  });

  const dbNodes = nodes.filter((n) => n.type === 'DATABASE');
  if (dbNodes.length > 0) {
    yaml += `volumes:\n`;
    dbNodes.forEach((n) => {
      const name = n.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      yaml += `  pgdata_${name}:\n`;
    });
  }

  return yaml;
}

export function generateTerraform(nodes) {
  let tf = `terraform {\n  required_providers {\n    aws = {\n      source  = "hashicorp/aws"\n      version = "~> 5.0"\n    }\n  }\n}\n\nprovider "aws" {\n  region = "ap-south-1"\n}\n\n`;

  nodes.forEach((node) => {
    const resName = node.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (node.type === 'LOAD_BALANCER') {
      tf += `resource "aws_lb" "${resName}" {\n  name               = "${node.id}-alb"\n  internal           = false\n  load_balancer_type = "application"\n}\n\n`;
    } else if (node.type === 'API_GATEWAY') {
      tf += `resource "aws_apigatewayv2_api" "${resName}" {\n  name          = "${node.id}-http-gw"\n  protocol_type = "HTTP"\n}\n\n`;
    } else if (node.type === 'SERVER') {
      const instanceType = node.tier === 3 ? 'c7g.4xlarge' : node.tier === 2 ? 'c6i.xlarge' : 't3.medium';
      tf += `resource "aws_instance" "${resName}" {\n  count         = ${node.count || 1}\n  ami           = "ami-0c55b159cbfafe1f0"\n  instance_type = "${instanceType}"\n  tags = {\n    Name = "${node.id}"\n  }\n}\n\n`;
    } else if (node.type === 'LAMBDA') {
      tf += `resource "aws_lambda_function" "${resName}" {\n  function_name = "${node.id}-fn"\n  runtime       = "nodejs20.x"\n  handler       = "index.handler"\n  memory_size   = ${node.tier === 3 ? 10240 : node.tier === 2 ? 2048 : 512}\n}\n\n`;
    } else if (node.type === 'CACHE') {
      tf += `resource "aws_elasticache_cluster" "${resName}" {\n  cluster_id      = "${node.id}"\n  engine          = "redis"\n  node_type       = "cache.r6g.large"\n  num_cache_nodes = ${node.tier || 1}\n}\n\n`;
    } else if (node.type === 'SEARCH_ENGINE') {
      tf += `resource "aws_opensearch_domain" "${resName}" {\n  domain_name    = "${node.id}-search"\n  engine_version = "OpenSearch_2.11"\n}\n\n`;
    } else if (node.type === 'MESSAGE_QUEUE') {
      tf += `resource "aws_msk_cluster" "${resName}" {\n  cluster_name           = "${node.id}-kafka"\n  kafka_version          = "3.5.1"\n  number_of_broker_nodes = ${(node.tier || 1) * 3}\n}\n\n`;
    } else if (node.type === 'DATABASE') {
      tf += `resource "aws_db_instance" "${resName}" {\n  allocated_storage = 100\n  engine            = "postgres"\n  instance_class    = "db.r6g.xlarge"\n  multi_az          = ${node.tier === 3 ? 'true' : 'false'}\n}\n\n`;
    } else if (node.type === 'SHARD_DB') {
      tf += `resource "aws_dynamodb_table" "${resName}" {\n  name         = "${node.id}-global-table"\n  billing_mode = "PAY_PER_REQUEST"\n  hash_key     = "PartitionKey"\n}\n\n`;
    } else if (node.type === 'CDN') {
      tf += `resource "aws_cloudfront_distribution" "${resName}" {\n  enabled = true\n  comment = "Orbital Edge CDN"\n}\n\n`;
    } else if (node.type === 'FIREWALL') {
      tf += `resource "aws_wafv2_web_acl" "${resName}" {\n  name  = "${node.id}-waf"\n  scope = "CLOUDFRONT"\n}\n\n`;
    } else if (node.type === 'OBJECT_STORAGE') {
      tf += `resource "aws_s3_bucket" "${resName}" {\n  bucket = "${node.id}-media-assets"\n}\n\n`;
    }
  });

  return tf;
}