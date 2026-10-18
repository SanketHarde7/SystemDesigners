// 8 Progressive System Design Missions with Incident Logs, Consistency Rules & Viva Checkpoints
export const MISSIONS = [
  {
    id: 1,
    title: 'Mission 1: The CPU Saturation Crisis',
    concept: 'Vertical Scaling (Scale-Up) & Right-Sizing',
    objective: 'Diagnose and resolve the 1,200 RPS (1,620 RPS peak) compute bottleneck.',
    incidentSymptom: 'CLOUDWATCH ALERT: EC2 `t3.medium` CPU pinned at 120%+. Request queue depth spiking while RDS PostgreSQL I/O sits idle at 56%.',
    targetRps: 1200,
    budget: 1250,
    maxPower: 150,
    requiresStrongConsistency: false,
    trafficProfile: { read: 0.75, write: 0.25, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE'],
    unlockedAtStart: ['SERVER', 'DATABASE'],
    newWeaponReward: 'LOAD_BALANCER',
    problemBrief: {
      scenario: 'Your company just launched an internal B2B SaaS portal. Currently, the entire backend runs on a single burstable EC2 instance (`t3.medium`, 2 vCPU) connected to a single RDS PostgreSQL instance[cite: 3].',
      bottleneck: 'Baseline traffic has reached 1,200 requests/sec (and spikes to 1,620 RPS during Wave 2). Because a single `t3.medium` instance maxes out at 1,000 RPS, CPU utilization is stuck at 120%+[cite: 3].',
      goal: 'Scale up your EC2 Compute instance (to Tier 2 or Tier 3), scale out replicas, or deploy an additional EC2 instance and wire it to the Database.'
    },
    initialNodes: [
      { id: 'srv-1', type: 'SERVER', tier: 1, count: 1, stateful: false, x: 260, y: 180 },
      { id: 'db-1', type: 'DATABASE', tier: 1, count: 1, stateful: true, consistencyMode: 'STRONG', x: 560, y: 180 }
    ],
    initialConnections: [
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Inspect the EC2 Compute Cluster card on the canvas (notice its red 120% Load bar)[cite: 3, 4].',
      'Upgrade EC2 to Tier 2 (`c6i.xlarge` - 2,500 RPS) or Tier 3 (`c7g.4xlarge`), OR scale out replicas[cite: 3].',
      'Ensure every deployed component is wired properly before launching the Siege Test[cite: 3].'
    ],
    quiz: {
      question: 'Why did response latency jump exponentially (from 20ms to 400ms+) as soon as EC2 CPU crossed 95%-100% utilization?',
      options: [
        'Because the SQL database hard drive ran out of storage space.',
        'According to M/M/1 Queueing Theory (Little\'s Law), as utilization approaches 100%, incoming requests wait in an exponentially growing CPU run-queue.',
        'Because vertical scaling adds extra network hops between servers.'
      ],
      correctIndex: 1,
      explanation: 'In queueing theory, wait time is proportional to 1 / (1 - Utilization). At 95%+ CPU, there is zero headroom to absorb micro-bursts, causing tail latency (P99) to skyrocket[cite: 3].'
    },
    learnings: {
      issueTitle: 'CPU Saturation & Vertical vs Horizontal Scaling',
      whatWasTheIssue: 'Your single `t3.medium` (2 vCPU) server only had capacity for 1,000 RPS, but incoming traffic was 1,200 RPS (and 1,620 RPS at peak)[cite: 3].',
      whenDoesItHappen: 'Early-stage startups, MVP launches, or internal tools where traffic outgrows the initial cheap cloud instance[cite: 3].',
      howToIdentify: [
        'CloudWatch / Prometheus `CPUUtilization` consistently above 85%[cite: 3].',
        'P95 and P99 response times spiking from 20ms to 800ms+ while database I/O remains normal[cite: 3].',
        'Linux `load average` exceeding the number of vCPU cores[cite: 3].'
      ],
      realWorldFix: 'Vertical Scaling (upgrading to `c6i.xlarge` or `c7g.4xlarge`) is the fastest zero-code fix, while Horizontal Scaling adds multiple instances for higher capacity and redundancy[cite: 3].'
    }
  },
  {
    id: 2,
    title: 'Mission 2: Breaking the Single-Server Ceiling',
    concept: 'Horizontal Scaling (Scale-Out) & Load Balancing',
    objective: 'Scale your compute and database layers to survive 3,800 RPS (5,130 RPS peak)[cite: 3].',
    incidentSymptom: 'INCIDENT REPORT: Marketing surge hit 3,800 RPS. Both Compute (152% load) and Tier-1 SQL Read IOPS (178% load) are saturating.',
    targetRps: 3800,
    budget: 2100,
    maxPower: 220,
    requiresStrongConsistency: false,
    trafficProfile: { read: 0.75, write: 0.25, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE', 'LOAD_BALANCER'],
    unlockedAtStart: ['SERVER', 'DATABASE', 'LOAD_BALANCER'],
    newWeaponReward: 'CACHE',
    problemBrief: {
      scenario: 'A marketing campaign drove traffic up to 3,800 RPS (5,130 RPS during Wave 2 peak)[cite: 3]. Both your single Tier-2 server (2,500 RPS) and Tier-1 SQL database (1,600 Read RPS) are overloaded.',
      bottleneck: 'Neither your compute layer nor your Tier-1 database can sustain 5,130 RPS at peak.',
      goal: 'Upgrade your Relational Database to Tier 2 (or scale DB replicas), and either deploy a Load Balancer wired to 2x–3x Stateless EC2 instances OR upgrade EC2 to Tier 3.'
    },
    initialNodes: [
      { id: 'srv-1', type: 'SERVER', tier: 2, count: 1, stateful: false, x: 350, y: 180 },
      { id: 'db-1', type: 'DATABASE', tier: 1, count: 1, stateful: true, consistencyMode: 'STRONG', x: 600, y: 180 }
    ],
    initialConnections: [
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Check both cards: EC2 is at 152% load and Relational Database is at 178% load.',
      'Deploy an Application Load Balancer, wire `LB -> EC2 -> Database`, and scale EC2 replicas (or upgrade EC2 to Tier 3).',
      'Upgrade the Relational Database to Tier 2 (`db.r6g.xlarge` + Read Replicas) so storage I/O does not bottleneck[cite: 3].'
    ],
    quiz: {
      question: 'When scaling out across 3 EC2 instances behind a Load Balancer, why should application servers be kept STATELESS?',
      options: [
        'Stateless servers consume zero electricity in AWS data centers.',
        'So any server instance can handle any user request without losing session data or causing sticky-session load imbalance.',
        'Because Load Balancers can only route traffic to Tier-1 servers.'
      ],
      correctIndex: 1,
      explanation: 'If session state is stored in local server RAM (Stateful), users get logged out when routed to another server, or Sticky Sessions overload a single server while others sit idle[cite: 3].'
    },
    learnings: {
      issueTitle: 'Horizontal Scaling (Scale-Out) & Stateless Compute',
      whatWasTheIssue: 'When traffic crosses several thousand RPS, both compute and storage IOPS must scale together. Deploying a Layer-7 Load Balancer boosts multi-server routing efficiency[cite: 3].',
      whenDoesItHappen: 'Whenever traffic outgrows a single machine or when a business requires zero-downtime rolling updates[cite: 3].',
      howToIdentify: [
        'Uneven CPU usage across servers caused by Stateful Sticky Sessions[cite: 3].',
        'Database read/write queues building up alongside high API server CPU.'
      ],
      realWorldFix: 'Deploy an AWS ALB or NGINX Reverse Proxy using Least-Connections routing in front of stateless EC2 instances, and provision Read Replicas (Tier 2+) on RDS[cite: 3].'
    }
  },
  {
    id: 3,
    title: 'Mission 3: The Database Read Meltdown',
    concept: 'In-Memory Caching (Redis Cache-Aside)',
    objective: 'Handle 8,000 RPS (10,800 RPS peak) read-heavy traffic without crashing PostgreSQL[cite: 3].',
    incidentSymptom: 'DB ALARM: 85% of incoming 8,000 RPS are identical SELECT queries for top products. PostgreSQL Read IOPS at 136%!',
    targetRps: 8000,
    budget: 3100,
    maxPower: 300,
    requiresStrongConsistency: false,
    trafficProfile: { read: 0.85, write: 0.15, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE'],
    unlockedAtStart: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE'],
    newWeaponReward: 'CDN',
    problemBrief: {
      scenario: 'Your e-commerce product catalog is getting 8,000 RPS (10,800 RPS peak), and 85% of requests are repetitive `SELECT` queries for the top 500 products[cite: 3].',
      bottleneck: 'Your Tier-2 PostgreSQL database (5,000 Read RPS capacity) is overwhelmed by 9,180 Read RPS during peak traffic.',
      goal: 'Deploy an In-Memory Redis Cache, wire `EC2 -> Redis Cache`, and configure its tier/eviction policy to offload repetitive reads (or scale your Database & Compute layers).'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 1, stateful: false, routingAlgo: 'LEAST_CONN', x: 190, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 2, count: 4, stateful: false, x: 420, y: 180 },
      { id: 'db-1', type: 'DATABASE', tier: 2, count: 1, stateful: true, consistencyMode: 'STRONG', x: 670, y: 230 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Deploy "In-Memory Redis Cache" from the Arsenal Dock and manually drag a wire from `EC2 Right Dot -> Redis Left Dot`[cite: 3].',
      'Upgrade Redis Cache to Tier 2 (85% Hit Ratio) and keep Eviction Policy on `LRU` or `LFU` (avoid `NO_EVICTION`)[cite: 3].',
      'Notice how the `db iops` wire badge drops dramatically once Redis is wired!'
    ],
    quiz: {
      question: 'In a Cache-Aside architecture with Redis, what happens if you set the Eviction Policy to "NO_EVICTION" on a high-traffic product catalog?',
      options: [
        'Redis automatically upgrades its own RAM for free.',
        'Once RAM fills up, new cache writes fail with Out-Of-Memory (OOM) errors and stale keys cannot be replaced, causing cache hit rates to collapse.',
        'PostgreSQL automatically converts into a NoSQL database.'
      ],
      correctIndex: 1,
      explanation: 'With `allkeys-lru` or `allkeys-lfu`, Redis automatically evicts cold keys to make room for hot catalog items. `noeviction` causes OOM errors once memory is full[cite: 3].'
    },
    learnings: {
      issueTitle: 'Database Read Bottlenecks & Cache-Aside Architecture',
      whatWasTheIssue: 'Relational databases store data on disk/EBS volumes and maintain ACID locks. Serving 8,000+ repetitive read queries per second directly from PostgreSQL exhausts IOPS[cite: 3].',
      whenDoesItHappen: 'Read-heavy workloads (80:20 or 90:10 Read-to-Write ratio) such as product catalogs, user profiles, leaderboards, and news feeds[cite: 3].',
      howToIdentify: [
        'RDS `ReadIOPS` and `DatabaseConnections` hitting 100% while write traffic is low[cite: 3].',
        'Slow query logs showing identical `SELECT` queries executing thousands of times per second[cite: 3].'
      ],
      realWorldFix: 'Implement the Cache-Aside Pattern with Redis ElastiCache using `allkeys-lru` eviction: application servers check Redis first (~0.5ms RAM lookup) and only query SQL on a cache miss[cite: 3].'
    }
  },
  {
    id: 4,
    title: 'Mission 4: Surviving the Chaos Monkey Outage',
    concept: 'High Availability (HA), Redundancy & Zero-SPOF',
    objective: 'Eliminate Single Points of Failure (SPOF) to survive a live Wave 3 Chaos Monkey fault at 9,500 RPS[cite: 3].',
    incidentSymptom: 'SLA AUDIT WARNING: Load Balancer has 1x instance (SPOF) and Database is Single-AZ (Tier 2). Wave 3 Chaos Monkey will terminate hardware!',
    targetRps: 9500,
    budget: 4000,
    maxPower: 360,
    requiresStrongConsistency: false,
    trafficProfile: { read: 0.80, write: 0.20, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'CDN'],
    unlockedAtStart: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'CDN'],
    newWeaponReward: 'MESSAGE_QUEUE',
    problemBrief: {
      scenario: 'Your SLA contract promises 99.99% uptime. During Wave 3 of the benchmark, Chaos Monkey will inject a live hardware fault into one of your nodes[cite: 3].',
      bottleneck: 'Single-instance nodes without Multi-AZ failover or `2x+` replicas suffer heavy capacity loss when hit by Chaos Monkey, and peak load reaches 12,825 RPS in Wave 2[cite: 3].',
      goal: 'Ensure Load Balancer has `2x+` replicas, Database is upgraded to Tier 3 (`Multi-AZ Cluster`) or `2x` replicas, and Compute has enough headroom for 12,825 RPS[cite: 3].'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 1, stateful: false, routingAlgo: 'LEAST_CONN', x: 180, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 2, stateful: false, x: 420, y: 180 },
      { id: 'cache-1', type: 'CACHE', tier: 2, count: 1, stateful: true, evictionPolicy: 'LRU', cacheStrategy: 'CACHE_ASIDE', x: 670, y: 100 },
      { id: 'db-1', type: 'DATABASE', tier: 2, count: 1, stateful: true, consistencyMode: 'STRONG', x: 670, y: 250 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'cache-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Scale out the Application Load Balancer to `2x` instances (Active-Active Multi-AZ)[cite: 3].',
      'Upgrade the Relational Database to Tier 3 (`Aurora Multi-AZ Cluster`) or `2x` replicas so it survives failover[cite: 3].',
      'Ensure Compute or Edge CDN has enough capacity to handle the 12,825 RPS Wave 2 peak[cite: 3].'
    ],
    quiz: {
      question: 'What is the difference between a Read Replica (Tier 2) and a Multi-AZ Standby Database (Tier 3) during a primary database hardware crash?',
      options: [
        'Read Replicas are used only for CSS and image files.',
        'Multi-AZ maintains a synchronous standby in a separate Availability Zone that automatically promotes to Primary in seconds with zero data loss.',
        'There is no difference; both lose 100% of data on reboot.'
      ],
      correctIndex: 1,
      explanation: 'Asynchronous Read Replicas scale read throughput, whereas Multi-AZ Standby clusters provide High Availability (HA) and automatic failover when the Primary node dies[cite: 3].'
    },
    learnings: {
      issueTitle: 'Single Points of Failure (SPOF) & Multi-AZ High Availability',
      whatWasTheIssue: 'Even if a system has multiple backend servers, a single Load Balancer or a single-AZ Master Database acts as a Single Point of Failure[cite: 3].',
      whenDoesItHappen: 'Hardware disk failures, AWS Availability Zone power/network incidents, or bad configuration deployments[cite: 3].',
      howToIdentify: [
        'Architecture review showing critical layers with `N = 1` instance and no automated standby[cite: 3].',
        'Chaos Engineering drills causing HTTP 502/504 errors[cite: 3].'
      ],
      realWorldFix: 'Follow the N+1 Redundancy Rule across multiple Availability Zones (Multi-AZ): deploy Active-Active Load Balancers, stateless auto-scaling server groups, and Multi-AZ standby databases[cite: 3].'
    }
  },
  {
    id: 5,
    title: 'Mission 5: The Black Friday Write Stampede',
    concept: 'Asynchronous Decoupling & Load Leveling (Kafka / SQS)',
    objective: 'Survive a 14,500 RPS checkout flash sale (55% ACID writes) without dropping orders or corrupting inventory[cite: 3].',
    incidentSymptom: 'CHECKOUT ALERT: 7,975 synchronous writes/sec (10,766 peak) overwhelming SQL row locks (210% DB Write Load). Strict ACID consistency required!',
    targetRps: 14500,
    budget: 5600,
    maxPower: 500,
    requiresStrongConsistency: true,
    trafficProfile: { read: 0.45, write: 0.55, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'LAMBDA', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE'],
    unlockedAtStart: ['SERVER', 'LAMBDA', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE'],
    newWeaponReward: 'FIREWALL',
    problemBrief: {
      scenario: 'During a midnight Black Friday flash sale, 14,500 users/sec click "Buy Now" simultaneously (55% write transactions = ~8,000 writes/sec, peaking at 10,766 writes/sec)[cite: 3].',
      bottleneck: 'A single Tier-3 Aurora SQL Master can only commit 3,800 synchronous writes/sec[cite: 3]. Because this is a financial checkout flow, switching Database to Eventual Consistency will cause double-charged orders!',
      goal: 'Deploy an Event Streaming Queue (Kafka/SQS), wire `EC2 -> Queue -> Database` (and upgrade Queue to Tier 2), OR scale out ACID Database replicas while keeping Strong Consistency enabled.'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 2, stateful: false, routingAlgo: 'LEAST_CONN', x: 160, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 4, stateful: false, x: 380, y: 180 },
      { id: 'cache-1', type: 'CACHE', tier: 2, count: 1, stateful: true, evictionPolicy: 'LRU', cacheStrategy: 'CACHE_ASIDE', x: 640, y: 85 },
      { id: 'db-1', type: 'DATABASE', tier: 3, count: 1, stateful: true, consistencyMode: 'STRONG', x: 640, y: 260 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'cache-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Deploy "Event Streaming Queue" (Kafka/SQS) and wire `EC2 -> Queue` and `Queue -> Database` (or click Auto-Wire)[cite: 3].',
      'Upgrade the Queue to Tier 2 (`Kafka 3-Broker MSK Cluster` - 18,000 msg/s) and keep Delivery Guarantee on `AT_LEAST_ONCE`[cite: 3].',
      'IMPORTANT: Keep Database Consistency Mode on `STRONG ACID` so financial checkout orders are never double-spent!'
    ],
    quiz: {
      question: 'When using Apache Kafka or AWS SQS with "At-Least-Once" delivery for payment orders, why must the consumer worker use an Idempotency Key?',
      options: [
        'Because queues can occasionally deliver the same message twice during a network retry, and an Idempotency Key prevents charging the customer twice.',
        'Idempotency Keys compress JSON payloads by 90%.',
        'Because Kafka deletes all database tables every 5 minutes.'
      ],
      correctIndex: 0,
      explanation: 'Distributed queues guarantee At-Least-Once delivery. Checking a unique `idempotency_key` (e.g., `order_uuid`) in the database ensures duplicate deliveries are safely ignored[cite: 3].'
    },
    learnings: {
      issueTitle: 'Write Lock Contention & Asynchronous Queue Load Leveling',
      whatWasTheIssue: 'Synchronous database writes force the API server to block and wait while the database acquires row locks and flushes WAL logs to disk[cite: 3].',
      whenDoesItHappen: 'Ticketing sales (BookMyShow/Ticketmaster), Black Friday checkouts, payment processing, and notification pipelines[cite: 3].',
      howToIdentify: [
        'Database `WriteLatency` and `RowLockWaitTime` spiking during traffic bursts[cite: 3].',
        'API servers throwing `TimeoutError: connection pool exhausted`[cite: 3].'
      ],
      realWorldFix: 'Decouple writes using Apache Kafka or AWS SQS (Queue-Based Load Leveling) with Idempotent consumers and Strong ACID storage[cite: 3].'
    }
  },
  {
    id: 6,
    title: 'Mission 6: The Layer-7 Botnet Siege',
    concept: 'Edge WAF, Token Bucket Rate Limiting & API Gateway',
    objective: 'Mitigate an 18,500 RPS attack (40% malicious DDoS bots) before it exhausts compute[cite: 3].',
    incidentSymptom: 'SECURITY ALERT: Credential-stuffing botnet flooding ingress with 7,400 bot RPS (10,000 peak). Compute CPU overloaded at 140%!',
    targetRps: 18500,
    budget: 5600,
    maxPower: 500,
    requiresStrongConsistency: false,
    trafficProfile: { read: 0.45, write: 0.15, static: 0.0, bot: 0.40 },
    allowedWeapons: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL'],
    unlockedAtStart: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL'],
    newWeaponReward: 'SHARD_DB',
    problemBrief: {
      scenario: 'A credential-stuffing botnet is hammering your API with 18,500 RPS, of which 40% (~7,400 RPS, peaking at 10,000 RPS) is hostile bot traffic[cite: 3].',
      bottleneck: 'Letting malicious bot traffic hit your EC2 servers saturates your 3x Tier-3 compute cluster during the 24,975 RPS peak[cite: 3].',
      goal: 'Deploy a "WAF & Rate Limiter" at the perimeter (`WAF -> Load Balancer -> EC2`) and upgrade it to drop 92%–99% of bots[cite: 3], OR scale out Compute/Lambda.'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 2, stateful: false, routingAlgo: 'LEAST_CONN', x: 250, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 3, stateful: false, x: 470, y: 180 },
      { id: 'cache-1', type: 'CACHE', tier: 2, count: 1, stateful: true, evictionPolicy: 'LRU', cacheStrategy: 'CACHE_ASIDE', x: 700, y: 100 },
      { id: 'db-1', type: 'DATABASE', tier: 3, count: 1, stateful: true, consistencyMode: 'STRONG', x: 700, y: 250 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'cache-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Deploy "WAF & Rate Limiter" from the Arsenal Dock and place it on the far left before the Load Balancer[cite: 3].',
      'Wire `WAF Right Dot -> Load Balancer Left Dot` (or click Auto-Wire) and upgrade WAF to Tier 2 or Tier 3[cite: 3].',
      'Watch the incoming RPS counter drop as malicious red bot traffic is scrubbed at the edge!'
    ],
    quiz: {
      question: 'How does the Token Bucket rate-limiting algorithm differ from a simple Fixed-Window counter at the WAF/API Gateway edge?',
      options: [
        'Token Bucket allows short legitimate user bursts (up to bucket capacity) while enforcing a steady average refill rate, preventing boundary-spike exploits.',
        'Token Bucket blocks 100% of all GET requests.',
        'Token Bucket stores passwords in plain text.'
      ],
      correctIndex: 0,
      explanation: 'Fixed-window counters suffer from 2x boundary bursts at the edge of every minute. Token Bucket smoothly handles short legitimate bursts while throttling sustained bot floods with HTTP 429[cite: 3].'
    },
    learnings: {
      issueTitle: 'Layer-7 DDoS Mitigation & Token Bucket Rate Limiting',
      whatWasTheIssue: 'Without perimeter rate limiting, abusive scrapers and DDoS bots consume expensive application CPU threads and database connections[cite: 3].',
      whenDoesItHappen: 'Public login endpoints (credential stuffing), sneaker/ticket drops, public AI APIs, and price-scraping attacks[cite: 3].',
      howToIdentify: [
        'Sudden 5x spike in traffic from specific ASNs/IP ranges with zero increase in business conversions[cite: 3].',
        'High rate of HTTP 401/403/404 responses[cite: 3].'
      ],
      realWorldFix: 'Deploy an Edge WAF (Cloudflare / AWS WAF) combined with a Token Bucket rate limiter to return `HTTP 429 Too Many Requests` at the network perimeter[cite: 3].'
    }
  },
  {
    id: 7,
    title: 'Mission 7: Breaking the Single-Master Write Wall',
    concept: 'Horizontal Database Sharding & Consistent Hashing',
    objective: 'Sustain 25,000 RPS telemetry & chat traffic (13,500 peak writes/sec) using Sharding or Write Queues[cite: 3].',
    incidentSymptom: 'STORAGE BOTTLENECK: 10,000 sustained writes/sec (13,500 peak) has pinned single-master SQL at 263% Write Load!',
    targetRps: 25000,
    budget: 6800,
    maxPower: 600,
    requiresStrongConsistency: false,
    trafficProfile: { read: 0.60, write: 0.40, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL', 'SHARD_DB', 'SEARCH_ENGINE'],
    unlockedAtStart: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL', 'SHARD_DB', 'SEARCH_ENGINE'],
    newWeaponReward: 'OBJECT_STORAGE',
    problemBrief: {
      scenario: 'Your global messaging and telemetry platform hits 25,000 RPS with 40% sustained writes (10,000 writes/sec baseline, 13,500 writes/sec peak)[cite: 3].',
      bottleneck: 'A single primary RDS SQL database maxes out at 3,800 writes/sec (`dbLoad` is 263%)[cite: 3].',
      goal: 'Replace or supplement SQL with a "Sharded NoSQL Cluster" (DynamoDB / Cassandra) upgraded to Tier 2 (and try Eventual Consistency for extra write speed!), OR combine a Kafka Queue with scaled DB nodes[cite: 3].'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 3, count: 2, stateful: false, routingAlgo: 'LEAST_CONN', x: 170, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 5, stateful: false, x: 400, y: 180 },
      { id: 'cache-1', type: 'CACHE', tier: 3, count: 1, stateful: true, evictionPolicy: 'LRU', cacheStrategy: 'CACHE_ASIDE', x: 650, y: 95 },
      { id: 'db-1', type: 'DATABASE', tier: 3, count: 1, stateful: true, consistencyMode: 'STRONG', x: 650, y: 260 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'cache-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Deploy "Sharded NoSQL Cluster" (DynamoDB/Cassandra), wire `EC2 -> Sharded NoSQL`, and upgrade it to Tier 2 (or remove the overloaded SQL node)[cite: 3].',
      'Pro Tip: In the Inspector for Sharded NoSQL, switching Consistency Mode to `EVENTUAL (BASE)` boosts write throughput by +35% for telemetry workloads!',
      'Ensure Compute capacity (5x–6x Tier 3 or Lambda) is ready for the 33,750 RPS peak.'
    ],
    quiz: {
      question: 'In a Sharded NoSQL database (like DynamoDB or Cassandra), what causes a "Hot Partition" (Celebrity Problem) and how do engineers fix it?',
      options: [
        'When a single partition key (e.g., a celebrity `user_id`) receives millions of writes while other shards sit idle; fixed by salting/appending a random suffix (`user_id#1..10`) to distribute writes.',
        'When the data center air conditioning fails; fixed by downgrading to Tier 1.',
        'When SQL JOIN queries are run inside a Load Balancer.'
      ],
      correctIndex: 0,
      explanation: 'Consistent hashing routes all data for the same Partition Key to a single shard node. Write-salting appends a shard suffix (`#0..9`) to spread extreme key spikes across multiple shards[cite: 3].'
    },
    learnings: {
      issueTitle: 'Horizontal Database Sharding & Consistent Hashing',
      whatWasTheIssue: 'Vertical scaling and Read Replicas cannot scale write throughput beyond the physical disk I/O limit of a single Master node[cite: 3].',
      whenDoesItHappen: 'High-velocity write workloads: Discord/WhatsApp chat messages, Uber GPS location pings, and IoT telemetry[cite: 3].',
      howToIdentify: [
        'Primary database CPU and Write IOPS pinned at 100% even on the largest cloud instance[cite: 3].',
        'Consumer lag growing because a single database sink cannot keep up[cite: 3].'
      ],
      realWorldFix: 'Partition data horizontally using Consistent Hashing on a high-cardinality Partition Key in DynamoDB, Cassandra, or Vitess[cite: 3].'
    }
  },
  {
    id: 8,
    title: 'Mission 8: The Planet-Scale SuperApp Capstone',
    concept: 'End-to-End Multi-Tier Cloud Architecture',
    objective: 'Architect a fault-tolerant system handling 36,000 RPS (48,600 RPS peak) across Read, Write, Static, and Bot traffic[cite: 3].',
    incidentSymptom: 'CAPSTONE CHALLENGE: 36,000 RPS (48,600 Peak) with 18% Static Media & 12% Hostile Bots. Wave 3 Chaos Monkey active!',
    targetRps: 36000,
    budget: 8800,
    maxPower: 750,
    requiresStrongConsistency: false,
    trafficProfile: { read: 0.45, write: 0.25, static: 0.18, bot: 0.12 },
    allowedWeapons: [
      'SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER',
      'CACHE', 'CDN', 'MESSAGE_QUEUE', 'FIREWALL', 'SHARD_DB', 'SEARCH_ENGINE', 'OBJECT_STORAGE'
    ],
    unlockedAtStart: [
      'SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER',
      'CACHE', 'CDN', 'MESSAGE_QUEUE', 'FIREWALL', 'SHARD_DB', 'SEARCH_ENGINE', 'OBJECT_STORAGE'
    ],
    newWeaponReward: null,
    problemBrief: {
      scenario: 'Final Principal Architect Evaluation: Your global SuperApp is experiencing 36,000 RPS (48,600 RPS peak) comprising 45% dynamic reads, 25% transactional writes, 18% static media downloads, and 12% hostile bot attacks[cite: 3].',
      bottleneck: 'Every layer is tested simultaneously—edge bandwidth, bot scrubbing, load balancing, compute concurrency, read caching, write buffering, and sharded persistence[cite: 3].',
      goal: 'Scale compute (`6x` EC2 or add Serverless Lambda / S3 Object Storage) and fine-tune component configurations so all layers survive the 48,600 RPS peak and Wave 3 Chaos failover.'
    },
    initialNodes: [
      { id: 'cdn-1', type: 'CDN', tier: 2, count: 1, stateful: false, x: 160, y: 95 },
      { id: 'fw-1', type: 'FIREWALL', tier: 2, count: 1, stateful: false, x: 160, y: 255 },
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 3, count: 2, stateful: false, routingAlgo: 'LEAST_CONN', x: 360, y: 175 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 5, stateful: false, x: 560, y: 175 },
      { id: 'cache-1', type: 'CACHE', tier: 3, count: 1, stateful: true, evictionPolicy: 'LRU', cacheStrategy: 'CACHE_ASIDE', x: 770, y: 80 },
      { id: 'queue-1', type: 'MESSAGE_QUEUE', tier: 2, count: 1, stateful: true, deliveryGuarantee: 'AT_LEAST_ONCE', x: 770, y: 270 },
      { id: 'shard-1', type: 'SHARD_DB', tier: 2, count: 1, stateful: true, consistencyMode: 'STRONG', x: 960, y: 175 }
    ],
    initialConnections: [
      { from: 'cdn-1', to: 'lb-1' },
      { from: 'fw-1', to: 'lb-1' },
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'cache-1' },
      { from: 'srv-1', to: 'queue-1' },
      { from: 'queue-1', to: 'shard-1' }
    ],
    guidance: [
      'Notice EC2 Compute is at 89% baseline load—which will hit 120% during Wave 2 Peak (48,600 RPS).',
      'Scale EC2 Compute to `6x` replicas (or deploy Serverless Lambda / S3 Object Storage and wire it in)[cite: 3].',
      'Run the Siege Test and pass the final Architect Viva to earn your Principal Architect rank[cite: 3]!'
    ],
    quiz: {
      question: 'In a Defense-in-Depth Planet-Scale architecture, why do we place CDN and WAF at the network perimeter BEFORE Load Balancers and Compute?',
      options: [
        'Because CDN and WAF are written in HTML.',
        'To absorb static media bandwidth and drop malicious L7 bot floods at 300+ global edge PoPs, preventing origin VPC compute and database exhaustion.',
        'Because Load Balancers cannot accept traffic from the internet.'
      ],
      correctIndex: 1,
      explanation: 'Filtering bots (WAF) and serving static/cached assets (CDN/S3) at the edge reduces origin compute and database load by 40%–80%, saving massive cloud cost and latency[cite: 3].'
    },
    learnings: {
      issueTitle: 'Defense-in-Depth: Planet-Scale Distributed Systems',
      whatWasTheIssue: 'At 35,000+ RPS, no single silver bullet works. Traffic must be filtered, cached, and buffered at each tier so only a fraction of requests hit core storage[cite: 3].',
      whenDoesItHappen: 'Tier-1 global platforms (Netflix, Uber, Amazon, Swiggy/Zomato during peak hours)[cite: 3].',
      howToIdentify: [
        'End-to-end distributed tracing (OpenTelemetry / Jaeger) showing bottlenecks shifting across tiers[cite: 3].',
        'Cascading failures when one downstream dependency slows down without circuit breakers or queues[cite: 3].'
      ],
      realWorldFix: 'Defense-in-Depth Architecture: Edge CDN + S3 absorbs static bytes, WAF drops bad bots, Multi-AZ ALBs route to Stateless Compute, Redis absorbs reads, and Kafka buffers writes into Sharded NoSQL storage[cite: 3].'
    }
  }
];