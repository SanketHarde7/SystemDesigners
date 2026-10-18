// 8 Progressive System Design Missions with Flexible Budgets for Multiple Valid Solutions
export const MISSIONS = [
  {
    id: 1,
    title: 'Mission 1: The CPU Saturation Crisis',
    concept: 'Vertical Scaling (Scale-Up) & Right-Sizing',
    objective: 'Resolve the 1,200 RPS (1,620 RPS peak) compute bottleneck by upgrading tiers or scaling instances.',
    targetRps: 1200,
    budget: 1250,
    maxPower: 150,
    trafficProfile: { read: 0.75, write: 0.25, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE'],
    unlockedAtStart: ['SERVER', 'DATABASE'],
    newWeaponReward: 'LOAD_BALANCER',
    problemBrief: {
      scenario: 'Your company just launched an internal B2B SaaS portal. Currently, the entire backend runs on a single burstable EC2 instance (`t3.medium`, 2 vCPU) connected to a single RDS PostgreSQL instance.',
      bottleneck: 'Baseline traffic has reached 1,200 requests/sec (and spikes to 1,620 RPS during Wave 2). Because a single `t3.medium` instance maxes out at 1,000 RPS, CPU utilization is stuck at 120%+.',
      goal: 'Scale up your EC2 Compute instance (to Tier 2 or Tier 3), scale out replicas, or deploy an additional EC2 instance so total compute capacity exceeds 1,620 RPS.'
    },
    initialNodes: [
      { id: 'srv-1', type: 'SERVER', tier: 1, count: 1, stateful: false, x: 240, y: 180 },
      { id: 'db-1', type: 'DATABASE', tier: 1, count: 1, stateful: true, x: 520, y: 180 }
    ],
    initialConnections: [
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Click the EC2 Compute Cluster card on the canvas (notice its red 120% utilization bar).',
      'Upgrade EC2 to Tier 2 (`c6i.xlarge`) or Tier 3 (`c7g.4xlarge`), OR scale out replicas / add another EC2 node.',
      'Click "Run Benchmark" to verify your architecture handles the 1,620 RPS peak.'
    ],
    learnings: {
      issueTitle: 'CPU Saturation & Vertical vs Horizontal Scaling',
      whatWasTheIssue: 'Your single `t3.medium` (2 vCPU) server only had capacity for 1,000 RPS, but incoming traffic was 1,200 RPS (and 1,620 RPS at peak). In queueing theory (M/M/1), once CPU utilization crosses 85–90%, response latency grows exponentially.',
      whenDoesItHappen: 'Early-stage startups, MVP launches, or internal tools where traffic outgrows the initial cheap cloud instance.',
      howToIdentify: [
        'CloudWatch / Prometheus `CPUUtilization` consistently above 85%.',
        'P95 and P99 response times spiking from 20ms to 800ms+ while database I/O remains normal.',
        'Linux `load average` exceeding the number of vCPU cores.'
      ],
      realWorldFix: 'Vertical Scaling (upgrading to `c6i.xlarge` or `c7g.4xlarge`) is the fastest zero-code fix, while Horizontal Scaling adds multiple instances for higher capacity and redundancy.'
    }
  },
  {
    id: 2,
    title: 'Mission 2: Breaking the Single-Server Ceiling',
    concept: 'Horizontal Scaling (Scale-Out) & Load Balancing',
    objective: 'Scale your compute and database layers to survive 3,800 RPS (5,130 RPS peak).',
    targetRps: 3800,
    budget: 2100,
    maxPower: 220,
    trafficProfile: { read: 0.75, write: 0.25, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE', 'LOAD_BALANCER'],
    unlockedAtStart: ['SERVER', 'DATABASE', 'LOAD_BALANCER'],
    newWeaponReward: 'CACHE',
    problemBrief: {
      scenario: 'A marketing campaign drove traffic up to 3,800 RPS (5,130 RPS during Wave 2 peak). Both your single Tier-2 server (2,500 RPS) and Tier-1 SQL database (1,600 Read RPS) are overloaded.',
      bottleneck: 'Neither your compute layer nor your Tier-1 database can sustain 5,130 RPS at peak.',
      goal: 'Upgrade your Relational Database to Tier 2 (or scale DB replicas), and either upgrade EC2 to Tier 3 (6,000 RPS) OR deploy a Load Balancer with 2x–3x EC2 instances.'
    },
    initialNodes: [
      { id: 'srv-1', type: 'SERVER', tier: 2, count: 1, stateful: false, x: 350, y: 180 },
      { id: 'db-1', type: 'DATABASE', tier: 1, count: 1, stateful: true, x: 600, y: 180 }
    ],
    initialConnections: [
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Option A (Horizontal): Deploy a Load Balancer, scale EC2 to 2x–3x replicas, and upgrade the Database to Tier 2.',
      'Option B (Vertical): Upgrade the EC2 Cluster directly to Tier 3 (`c7g.4xlarge` - 6,000 RPS) and upgrade the Database to Tier 2.',
      'Click "Run Benchmark" to test against the 5,130 RPS peak.'
    ],
    learnings: {
      issueTitle: 'Horizontal Scaling (Scale-Out) & Stateless Compute',
      whatWasTheIssue: 'When traffic crosses several thousand RPS, both compute and storage IOPS must scale together. Deploying a Layer-7 Load Balancer boosts multi-server routing efficiency and eliminates sticky-session bottlenecks.',
      whenDoesItHappen: 'Whenever traffic outgrows a single machine or when a business requires zero-downtime rolling updates.',
      howToIdentify: [
        'Uneven CPU usage across servers caused by Stateful Sticky Sessions.',
        'Database read/write queues building up alongside high API server CPU.'
      ],
      realWorldFix: 'Deploy an AWS ALB or NGINX Reverse Proxy in front of stateless EC2 instances, and provision Read Replicas (Tier 2+) on RDS.'
    }
  },
  {
    id: 3,
    title: 'Mission 3: The Database Read Meltdown',
    concept: 'In-Memory Caching (Redis Cache-Aside)',
    objective: 'Handle 8,000 RPS (10,800 RPS peak) read-heavy traffic using Redis Caching or high-tier database scaling.',
    targetRps: 8000,
    budget: 3100,
    maxPower: 300,
    trafficProfile: { read: 0.85, write: 0.15, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE'],
    unlockedAtStart: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE'],
    newWeaponReward: 'CDN',
    problemBrief: {
      scenario: 'Your e-commerce product catalog is getting 8,000 RPS (10,800 RPS peak), and 85% of requests are repetitive `SELECT` queries for the top 500 products.',
      bottleneck: 'Your Tier-2 PostgreSQL database (5,000 Read RPS capacity) is overwhelmed by 9,180 Read RPS during peak traffic.',
      goal: 'Deploy an In-Memory Redis Cache to offload 65%–85% of read traffic (which also speeds up your compute servers), OR upgrade/scale your database and compute tiers.'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 1, stateful: false, x: 180, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 2, count: 4, stateful: false, x: 400, y: 180 },
      { id: 'db-1', type: 'DATABASE', tier: 2, count: 1, stateful: true, x: 640, y: 230 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Recommended: Click "In-Memory Key-Value Store" (Redis Cache) in the bottom dock to deploy it (auto-wires to EC2).',
      'Alternative: Upgrade the Relational Database to Tier 3 (`Aurora Multi-AZ` - 14,000 Read RPS) or scale DB replicas.',
      'Ensure Compute capacity can handle the 10,800 RPS peak and click "Run Benchmark".'
    ],
    learnings: {
      issueTitle: 'Database Read Bottlenecks & Cache-Aside Architecture',
      whatWasTheIssue: 'Relational databases store data on disk/EBS volumes and maintain ACID locks. Serving 8,000+ repetitive read queries per second directly from PostgreSQL exhausts IOPS and connection pools.',
      whenDoesItHappen: 'Read-heavy workloads (80:20 or 90:10 Read-to-Write ratio) such as product catalogs, user profiles, leaderboards, and news feeds.',
      howToIdentify: [
        'RDS `ReadIOPS` and `DatabaseConnections` hitting 100% while write traffic is low.',
        'Slow query logs showing identical `SELECT` queries executing thousands of times per second.'
      ],
      realWorldFix: 'Implement the Cache-Aside Pattern with Redis ElastiCache: application servers check Redis first (~0.5ms RAM lookup). On a Cache Miss, the app queries PostgreSQL and populates Redis with a TTL.'
    }
  },
  {
    id: 4,
    title: 'Mission 4: Surviving the Chaos Monkey Outage',
    concept: 'High Availability (HA), Redundancy & Zero-SPOF',
    objective: 'Build a fault-tolerant architecture that survives a live Wave 3 Chaos Monkey fault at 9,500 RPS.',
    targetRps: 9500,
    budget: 4000,
    maxPower: 360,
    trafficProfile: { read: 0.80, write: 0.20, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'CDN'],
    unlockedAtStart: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'CDN'],
    newWeaponReward: 'MESSAGE_QUEUE',
    problemBrief: {
      scenario: 'Your SLA contract promises 99.99% uptime. During Wave 3 of the benchmark, Chaos Monkey will inject a live hardware fault into one of your nodes.',
      bottleneck: 'Nodes with only 1x Tier-1 instance suffer heavy degradation when hit by Chaos Monkey, and peak load hits 12,825 RPS in Wave 2.',
      goal: 'Ensure your architecture has enough headroom and Multi-AZ redundancy (via 2x+ replicas, higher tiers, or Edge CDN offload) to survive Wave 2 (12,825 RPS) and Wave 3 Chaos failover.'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 1, stateful: false, x: 180, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 2, stateful: false, x: 400, y: 180 },
      { id: 'cache-1', type: 'CACHE', tier: 2, count: 1, stateful: true, x: 640, y: 100 },
      { id: 'db-1', type: 'DATABASE', tier: 2, count: 1, stateful: true, x: 640, y: 250 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'cache-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Scale out the Load Balancer (`2x`) or upgrade it, and upgrade the Database to Tier 3 (or scale DB replicas to `2x`).',
      'You can also deploy a Global Edge CDN or scale EC2 replicas to give extra headroom during the 12,825 RPS peak.',
      'Click "Run Benchmark" to verify your system survives Wave 3 Chaos Monkey.'
    ],
    learnings: {
      issueTitle: 'Single Points of Failure (SPOF) & Multi-AZ High Availability',
      whatWasTheIssue: 'Single-instance Tier-1 components without standby replicas degrade heavily during hardware or Availability Zone incidents.',
      whenDoesItHappen: 'Hardware disk failures, AWS Availability Zone power/network incidents, or bad configuration deployments.',
      howToIdentify: [
        'Architecture review showing critical layers with `N = 1` instance and no automated standby.',
        'Chaos Engineering drills (Netflix Chaos Monkey / AWS Fault Injection Simulator) causing HTTP 502/504 errors.'
      ],
      realWorldFix: 'Follow the N+1 Redundancy Rule across multiple Availability Zones (Multi-AZ): deploy Active-Active Load Balancers, stateless auto-scaling server groups, and Multi-AZ standby databases.'
    }
  },
  {
    id: 5,
    title: 'Mission 5: The Black Friday Write Stampede',
    concept: 'Asynchronous Decoupling & Load Leveling (Kafka / SQS)',
    objective: 'Survive a 14,500 RPS flash sale (55% write-heavy) using Event Queues or scaled database writes.',
    targetRps: 14500,
    budget: 5600,
    maxPower: 500,
    trafficProfile: { read: 0.45, write: 0.55, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'LAMBDA', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE'],
    unlockedAtStart: ['SERVER', 'LAMBDA', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE'],
    newWeaponReward: 'FIREWALL',
    problemBrief: {
      scenario: 'During a midnight flash sale, 14,500 users/sec click "Buy Now" simultaneously (55% write transactions = ~8,000 writes/sec, peaking at 10,800 writes/sec).',
      bottleneck: 'A single Tier-3 Aurora SQL Master can only commit 3,800 synchronous writes/sec before row-level locks bottleneck the database.',
      goal: 'Deploy an Event Streaming Queue (Kafka/SQS) to buffer and flatten the write spike, OR horizontally scale database instances to absorb the write load.'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 2, stateful: false, x: 160, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 4, stateful: false, x: 370, y: 180 },
      { id: 'cache-1', type: 'CACHE', tier: 2, count: 1, stateful: true, x: 600, y: 90 },
      { id: 'db-1', type: 'DATABASE', tier: 3, count: 1, stateful: true, x: 600, y: 260 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'cache-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Recommended: Deploy "Distributed Message Broker" (Kafka/SQS) from the bottom dock and upgrade it to Tier 2.',
      'Alternative: Scale out Database instances (`3x` Tier 3) or add Serverless Lambda functions to handle the surge.',
      'Click "Run Benchmark" to test the 19,575 RPS flash peak.'
    ],
    learnings: {
      issueTitle: 'Write Lock Contention & Asynchronous Queue Load Leveling',
      whatWasTheIssue: 'Synchronous database writes force the API server to block and wait while the database acquires row locks and flushes WAL logs to disk. Under flash spikes, connection pools max out.',
      whenDoesItHappen: 'Ticketing sales (BookMyShow/Ticketmaster), Black Friday checkouts, payment processing, and notification pipelines.',
      howToIdentify: [
        'Database `WriteLatency` and `RowLockWaitTime` spiking during traffic bursts.',
        'API servers throwing `TimeoutError: connection pool exhausted`.'
      ],
      realWorldFix: 'Decouple writes using Apache Kafka or AWS SQS (Queue-Based Load Leveling). The API immediately publishes an `OrderPlaced` event to Kafka and returns `202 Accepted`, while workers drain the queue safely.'
    }
  },
  {
    id: 6,
    title: 'Mission 6: The Layer-7 Botnet Siege',
    concept: 'Edge WAF, Token Bucket Rate Limiting & API Gateway',
    objective: 'Handle an 18,500 RPS attack (40% malicious DDoS bots) via Edge WAF filtering or massive compute scale.',
    targetRps: 18500,
    budget: 5600,
    maxPower: 500,
    trafficProfile: { read: 0.45, write: 0.15, static: 0.0, bot: 0.40 },
    allowedWeapons: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL'],
    unlockedAtStart: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL'],
    newWeaponReward: 'SHARD_DB',
    problemBrief: {
      scenario: 'A credential-stuffing botnet is hammering your API with 18,500 RPS, of which 40% (~7,400 RPS, peaking at 10,000 RPS) is hostile bot traffic.',
      bottleneck: 'Letting malicious bot traffic hit your EC2 servers saturates your 3x Tier-3 compute cluster during the 24,975 RPS peak.',
      goal: 'Deploy a "WAF & Rate Limiter" at the edge to drop 75%–99% of bot traffic cheaply, OR scale out your Compute/Lambda layer to brute-force absorb the traffic.'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 2, stateful: false, x: 240, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 3, stateful: false, x: 450, y: 180 },
      { id: 'cache-1', type: 'CACHE', tier: 2, count: 1, stateful: true, x: 670, y: 100 },
      { id: 'db-1', type: 'DATABASE', tier: 3, count: 1, stateful: true, x: 670, y: 250 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'cache-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Optimal: Deploy "Web Application Firewall" (WAF) from the bottom dock and upgrade to Tier 2 (92% bot drop).',
      'Brute-Force Alternative: Scale out EC2 Compute replicas (`4x–5x`) or add Serverless Lambda + API Gateway.',
      'Click "Run Benchmark" to verify your defense.'
    ],
    learnings: {
      issueTitle: 'Layer-7 DDoS Mitigation & Token Bucket Rate Limiting',
      whatWasTheIssue: 'Without perimeter rate limiting, abusive scrapers and DDoS bots consume expensive application CPU threads and database connections.',
      whenDoesItHappen: 'Public login endpoints (credential stuffing), sneaker/ticket drops, public AI APIs, and price-scraping attacks.',
      howToIdentify: [
        'Sudden 5x spike in traffic from specific ASNs/IP ranges with zero increase in business conversions.',
        'High rate of HTTP 401/403/404 responses.'
      ],
      realWorldFix: 'Deploy an Edge WAF (Cloudflare / AWS WAF) combined with a Redis Token Bucket or Sliding Window rate limiter at the API Gateway layer to return `HTTP 429 Too Many Requests` at the edge.'
    }
  },
  {
    id: 7,
    title: 'Mission 7: Breaking the Single-Master Write Wall',
    concept: 'Horizontal Database Sharding & Consistent Hashing',
    objective: 'Sustain 25,000 RPS (40% heavy writes = 13,500 peak writes/sec) using Sharded NoSQL, Queues, or Multi-Master DBs.',
    targetRps: 25000,
    budget: 6800,
    maxPower: 600,
    trafficProfile: { read: 0.60, write: 0.40, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL', 'SHARD_DB', 'SEARCH_ENGINE'],
    unlockedAtStart: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL', 'SHARD_DB', 'SEARCH_ENGINE'],
    newWeaponReward: 'OBJECT_STORAGE',
    problemBrief: {
      scenario: 'Your global messaging and telemetry platform hits 25,000 RPS with 40% sustained writes (10,000 writes/sec baseline, 13,500 writes/sec peak).',
      bottleneck: 'A single primary RDS SQL database maxes out at 3,800 writes/sec (`dbLoad` exceeds 350%).',
      goal: 'Deploy a "Sharded NoSQL Cluster" (DynamoDB / Cassandra) upgraded to Tier 2, OR combine a Kafka Message Queue with scaled Database instances.'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 3, count: 2, stateful: false, x: 170, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 5, stateful: false, x: 390, y: 180 },
      { id: 'cache-1', type: 'CACHE', tier: 3, count: 1, stateful: true, x: 630, y: 100 },
      { id: 'db-1', type: 'DATABASE', tier: 3, count: 1, stateful: true, x: 630, y: 260 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'cache-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Option A: Deploy "Partitioned Wide-Column / Key-Value DB" (Sharded NoSQL) and upgrade it to Tier 2 (or keep SQL + add Sharded NoSQL).',
      'Option B: Deploy an Event Streaming Queue (Kafka) + scale out your SQL Database replicas.',
      'Click "Run Benchmark" to test 33,750 RPS peak throughput.'
    ],
    learnings: {
      issueTitle: 'Horizontal Database Sharding & Consistent Hashing',
      whatWasTheIssue: 'Vertical scaling and Read Replicas cannot scale write throughput beyond the physical disk I/O limit of a single Master node. At 10,000+ writes/sec, data must be partitioned across shards.',
      whenDoesItHappen: 'High-velocity write workloads: Discord/WhatsApp chat messages, Uber GPS location pings, and IoT telemetry.',
      howToIdentify: [
        'Primary database CPU and Write IOPS pinned at 100% even on the largest cloud instance.',
        'Consumer lag growing because a single database sink cannot keep up.'
      ],
      realWorldFix: 'Partition data horizontally using Consistent Hashing on a high-cardinality Partition Key (e.g., `user_id`) in DynamoDB, Cassandra, or Vitess.'
    }
  },
  {
    id: 8,
    title: 'Mission 8: The Planet-Scale SuperApp Capstone',
    concept: 'End-to-End Multi-Tier Cloud Architecture',
    objective: 'Architect a fault-tolerant enterprise system handling 36,000 RPS (48,600 RPS peak) across all traffic types.',
    targetRps: 36000,
    budget: 8800,
    maxPower: 750,
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
      scenario: 'Final Principal Architect Evaluation: Your global SuperApp is experiencing 36,000 RPS (48,600 RPS peak) comprising 45% dynamic reads, 25% transactional writes, 18% static media downloads, and 12% hostile bot attacks.',
      bottleneck: 'Every layer is tested simultaneously—edge bandwidth, bot scrubbing, load balancing, compute concurrency, read caching, write buffering, and sharded persistence.',
      goal: 'Scale compute (or add Lambda / API Gateway / S3 Object Storage) so your multi-tier architecture handles the 48,600 RPS peak within budget.'
    },
    initialNodes: [
      { id: 'cdn-1', type: 'CDN', tier: 2, count: 1, stateful: false, x: 160, y: 95 },
      { id: 'fw-1', type: 'FIREWALL', tier: 2, count: 1, stateful: false, x: 160, y: 255 },
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 3, count: 2, stateful: false, x: 350, y: 175 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 5, stateful: false, x: 540, y: 175 },
      { id: 'cache-1', type: 'CACHE', tier: 3, count: 1, stateful: true, x: 740, y: 80 },
      { id: 'queue-1', type: 'MESSAGE_QUEUE', tier: 2, count: 1, stateful: true, x: 740, y: 270 },
      { id: 'shard-1', type: 'SHARD_DB', tier: 2, count: 1, stateful: true, x: 930, y: 175 }
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
      'Inspect the topology: CDN offloads static/read traffic, WAF filters bots, Redis caches reads, and Kafka buffers writes.',
      'Scale EC2 Compute (`6x`), OR deploy Serverless Lambda / S3 Object Storage / API Gateway to absorb the 48,600 RPS peak.',
      'Click "Run Benchmark" to earn your Principal Architect certification.'
    ],
    learnings: {
      issueTitle: 'Defense-in-Depth: Planet-Scale Distributed Systems',
      whatWasTheIssue: 'At 35,000+ RPS, no single silver bullet works. Traffic must be filtered, cached, and buffered at each tier so only a fraction of requests hit core storage.',
      whenDoesItHappen: 'Tier-1 global platforms (Netflix, Uber, Amazon, Swiggy/Zomato during peak hours).',
      howToIdentify: [
        'End-to-end distributed tracing (OpenTelemetry / Jaeger) showing bottlenecks shifting across tiers.',
        'Cascading failures when one downstream dependency slows down without circuit breakers or queues.'
      ],
      realWorldFix: 'Defense-in-Depth Architecture: Edge CDN + S3 absorbs static bytes, WAF drops bad bots, Multi-AZ ALBs route to Stateless Compute, Redis absorbs reads, and Kafka buffers writes into Sharded NoSQL storage.'
    }
  }
];