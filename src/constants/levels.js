// 8 Progressive System Design Missions with Full Problem Briefs & Post-Mortem Documentation
export const MISSIONS = [
  {
    id: 1,
    title: 'Mission 1: The CPU Saturation Crisis',
    concept: 'Vertical Scaling (Scale-Up) & Right-Sizing',
    objective: 'Upgrade compute and database hardware tiers to handle 1,200 RPS (1,620 RPS peak) with <50ms latency.',
    targetRps: 1200,
    budget: 900,
    maxPower: 110,
    trafficProfile: { read: 0.75, write: 0.25, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE'],
    unlockedAtStart: ['SERVER', 'DATABASE'],
    newWeaponReward: 'LOAD_BALANCER',
    problemBrief: {
      scenario: 'Your company just launched an internal B2B SaaS portal. Currently, the entire backend runs on a single burstable EC2 instance (`t3.medium`, 2 vCPU) connected to a single RDS PostgreSQL instance.',
      bottleneck: 'Baseline traffic has reached 1,200 requests/sec (and spikes to 1,620 RPS during Wave 2). Because a single `t3.medium` instance maxes out at 1,000 RPS, CPU utilization is stuck at 120%+, causing request queues to build up and latency to exceed 400ms.',
      goal: 'Scale up your EC2 Compute instance to a higher vCPU tier (`c6i.xlarge`) so it can process 2,500 RPS comfortably without adding architectural complexity.'
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
      'In the right-hand Component Inspector, click "Upgrade to Tier 2" (`c6i.xlarge` - 4 vCPU, 2,500 RPS capacity).',
      ' verify the wire between EC2 Compute and Relational Database is connected, then click "Run Benchmark".'
    ],
    learnings: {
      issueTitle: 'CPU Saturation & Vertical Scaling (Scale-Up)',
      whatWasTheIssue: 'Your single `t3.medium` (2 vCPU) server only had capacity for 1,000 RPS, but incoming traffic was 1,200 RPS (and 1,620 RPS at peak). In queueing theory (M/M/1), once CPU utilization crosses 85–90%, response latency grows exponentially instead of linearly.',
      whenDoesItHappen: 'Early-stage startups, MVP launches, or internal tools where traffic outgrows the initial cheap cloud instance, or when CPU-intensive tasks (JSON serialization, bcrypt hashing) saturate vCPU threads.',
      howToIdentify: [
        'CloudWatch / Prometheus `CPUUtilization` consistently above 85%.',
        'P95 and P99 response times spiking from 20ms to 800ms+ while database I/O remains normal.',
        'Linux `load average` exceeding the number of vCPU cores.'
      ],
      realWorldFix: 'Vertical Scaling (upgrading from `t3.medium` to `c6i.xlarge` or `c7g.4xlarge`) is the fastest zero-code fix because it requires no architectural changes. However, it has two fatal flaws at scale: (1) Hardware has a hard ceiling, and (2) Rebooting a single server causes downtime (Single Point of Failure).'
    }
  },

  {
    id: 2,
    title: 'Mission 2: Breaking the Single-Server Ceiling',
    concept: 'Horizontal Scaling (Scale-Out) & Load Balancing',
    objective: 'Deploy an Application Load Balancer, wire it to a stateless EC2 cluster, and survive 3,800 RPS.',
    targetRps: 3800,
    budget: 1650,
    maxPower: 170,
    trafficProfile: { read: 0.75, write: 0.25, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE', 'LOAD_BALANCER'],
    unlockedAtStart: ['SERVER', 'DATABASE', 'LOAD_BALANCER'],
    newWeaponReward: 'CACHE',
    problemBrief: {
      scenario: 'A marketing campaign drove traffic up to 3,800 RPS (5,130 RPS during Wave 2 peak). Relying on a single machine is now too risky and expensive.',
      bottleneck: 'Even if you add 2 or 3 EC2 instances (Scale Out), clients on the internet only know a single entry endpoint. Without a Load Balancer wired in front of your EC2 cluster, traffic cannot be distributed across replicas.',
      goal: 'Deploy an Application Load Balancer from the bottom dock, wire it to your EC2 Compute Cluster, scale out EC2 replicas (or upgrade tiers), and upgrade RDS to Tier 2 so write/read locks do not bottleneck.'
    },
    initialNodes: [
      { id: 'srv-1', type: 'SERVER', tier: 2, count: 1, stateful: false, x: 350, y: 180 },
      { id: 'db-1', type: 'DATABASE', tier: 1, count: 1, stateful: true, x: 600, y: 180 }
    ],
    initialConnections: [
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Deploy an "Application Load Balancer" from the bottom Components dock onto the left side of the canvas.',
      'Connect the wire: Drag from the Load Balancer’s RIGHT port dot to the EC2 Cluster’s LEFT port dot (or click "Auto-Connect").',
      'Select the EC2 Cluster: increase Replica Count to 2x (or 3x) so total capacity exceeds 5,000 RPS.',
      'Select the Relational Database and upgrade it to Tier 2 (`db.r6g.xlarge` + Read Replicas) to handle the 5,130 RPS peak.'
    ],
    learnings: {
      issueTitle: 'Horizontal Scaling (Scale-Out) & Stateless Compute',
      whatWasTheIssue: 'A single server cannot scale infinitely. When you run multiple server instances, you need a Layer-7 Reverse Proxy (Load Balancer) to distribute incoming TCP/HTTP requests evenly and route around unhealthy nodes.',
      whenDoesItHappen: 'Whenever traffic crosses a few thousand RPS or when a business requires zero-downtime deployments (rolling updates).',
      howToIdentify: [
        'Uneven CPU usage across servers (Server 1 at 100% CPU while Server 2 is at 5%)—often caused by Stateful Sticky Sessions.',
        'Users getting logged out randomly when their request lands on a different server instance (Solved by keeping servers Stateless!).'
      ],
      realWorldFix: 'Deploy an AWS ALB or NGINX Reverse Proxy using Least-Outstanding-Requests routing, and ensure all EC2 instances are 100% Stateless by externalizing session state.'
    }
  },

  {
    id: 3,
    title: 'Mission 3: The Database Read Meltdown',
    concept: 'In-Memory Caching (Redis Cache-Aside)',
    objective: 'Offload 85% of 8,000 RPS read-heavy traffic using Redis ElastiCache so PostgreSQL does not crash.',
    targetRps: 8000,
    budget: 2400,
    maxPower: 230,
    trafficProfile: { read: 0.85, write: 0.15, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE'],
    unlockedAtStart: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE'],
    newWeaponReward: 'CDN',
    problemBrief: {
      scenario: 'Your e-commerce product catalog is getting 8,000 RPS (10,800 RPS peak), and 85% of requests are repetitive `SELECT` queries for the same top 500 products.',
      bottleneck: 'Your PostgreSQL database is doing expensive disk I/O for identical queries thousands of times per second. Scaling up the SQL database to Tier 3 costs too much budget.',
      goal: 'Deploy an In-Memory Redis Cache from the bottom dock, wire EC2 Compute -> Redis Cache, and upgrade Redis to Tier 2 (85% Hit Ratio) so only 15% of read misses hit PostgreSQL.'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 1, stateful: false, x: 180, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 2, count: 3, stateful: false, x: 400, y: 180 },
      { id: 'db-1', type: 'DATABASE', tier: 2, count: 1, stateful: true, x: 640, y: 230 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Click "In-Memory Redis Cache" in the bottom dock to deploy it onto the canvas.',
      'Drag a wire from the EC2 Compute Cluster’s RIGHT dot to the Redis Cache’s LEFT dot (or click "Auto-Connect").',
      'Click the Redis Cache node and upgrade it to Tier 2 (`cache.r6g.xlarge` - 85% Hit Ratio) so database utilization drops below 60%.'
    ],
    learnings: {
      issueTitle: 'Database Read Bottlenecks & Cache-Aside Architecture',
      whatWasTheIssue: 'Relational databases store data on disk/EBS volumes and maintain ACID locks. Serving 8,000+ repetitive read queries per second directly from PostgreSQL exhausts IOPS and connection pools.',
      whenDoesItHappen: 'Read-heavy workloads (80:20 or 90:10 Read-to-Write ratio) such as product catalogs, user profiles, leaderboards, and news feeds.',
      howToIdentify: [
        'RDS `ReadIOPS` and `DatabaseConnections` hitting 100% while write traffic is low.',
        'Slow query logs showing identical `SELECT` queries executing thousands of times per second.'
      ],
      realWorldFix: 'Implement the Cache-Aside Pattern with Redis ElastiCache: application servers check Redis first (~0.5ms RAM lookup). On a Cache Miss, the app queries PostgreSQL and populates Redis with a TTL (Time-To-Live).'
    }
  },

  {
    id: 4,
    title: 'Mission 4: Surviving the Chaos Monkey Outage',
    concept: 'High Availability (HA), Redundancy & Zero-SPOF',
    objective: 'Eliminate all Single Points of Failure (SPOF) to survive a live node outage during Wave 3 at 9,500 RPS.',
    targetRps: 9500,
    budget: 3300,
    maxPower: 290,
    trafficProfile: { read: 0.80, write: 0.20, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'CDN'],
    unlockedAtStart: ['SERVER', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'CDN'],
    newWeaponReward: 'MESSAGE_QUEUE',
    problemBrief: {
      scenario: 'Your SLA contract promises 99.99% uptime ("Four Nines"). During Wave 3 of the benchmark, Chaos Monkey will randomly terminate hardware in an Availability Zone.',
      bottleneck: 'Right now, your Load Balancer has `1x` replica and your RDS Database is on Tier 2 (No Multi-AZ auto-failover). If either fails, your entire system suffers a 100% outage.',
      goal: 'Ensure Load Balancer has `2x` replicas, EC2 has at least `3x` replicas (or high tier), and RDS PostgreSQL is upgraded to Tier 3 (`Multi-AZ Cluster` with automatic failover).'
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
      'Click the Application Load Balancer and click "Scale Out" so Replica Count is `2 instances` (Active-Active HA).',
      'Click the Relational SQL Database and upgrade to Tier 3 (`Aurora Multi-AZ Cluster`) to eliminate database SPOF.',
      'Ensure your EC2 Cluster has enough N+1 headroom (e.g. 2x Tier 3 or 3x Tier 3) to handle 11,400 RPS during Wave 3.'
    ],
    learnings: {
      issueTitle: 'Single Points of Failure (SPOF) & Multi-AZ High Availability',
      whatWasTheIssue: 'Even if a system has 10 backend servers, a single Load Balancer or a single-AZ Master Database acts as a Single Point of Failure. If that one node dies, availability drops to 0%.',
      whenDoesItHappen: 'Hardware disk failures, AWS Availability Zone power/network incidents, or bad configuration deployments.',
      howToIdentify: [
        'Architecture review showing any layer with `N = 1` instance without an automated standby.',
        'Chaos Engineering drills (Netflix Chaos Monkey / AWS Fault Injection Simulator) causing HTTP 502/504 errors.'
      ],
      realWorldFix: 'Follow the N+1 Redundancy Rule across multiple Availability Zones (Multi-AZ): deploy Active-Active Load Balancers, stateless auto-scaling server groups across 3 AZs, and Multi-AZ synchronous standby databases.'
    }
  },

  {
    id: 5,
    title: 'Mission 5: The Black Friday Write Stampede',
    concept: 'Asynchronous Decoupling & Load Leveling (Kafka / SQS)',
    objective: 'Buffer a 14,500 RPS flash sale (55% writes) using an Event Streaming Queue so PostgreSQL survives.',
    targetRps: 14500,
    budget: 4100,
    maxPower: 360,
    trafficProfile: { read: 0.45, write: 0.55, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'LAMBDA', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE'],
    unlockedAtStart: ['SERVER', 'LAMBDA', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE'],
    newWeaponReward: 'FIREWALL',
    problemBrief: {
      scenario: 'During a midnight flash sale, 14,500 users/sec click "Buy Now" simultaneously (55% write transactions = ~8,000 writes/sec, peaking at 10,800 writes/sec).',
      bottleneck: 'Even a Tier-3 Aurora SQL Master can only commit 3,800 synchronous writes/sec before row-level locks freeze the database.',
      goal: 'Deploy an Event Streaming Queue (Kafka/SQS) from the bottom dock and wire `EC2 -> Event Queue -> Relational Database` to buffer and smooth out the write burst.'
    },
    initialNodes: [
      { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 2, stateful: false, x: 160, y: 180 },
      { id: 'srv-1', type: 'SERVER', tier: 3, count: 3, stateful: false, x: 370, y: 180 },
      { id: 'cache-1', type: 'CACHE', tier: 2, count: 1, stateful: true, x: 600, y: 90 },
      { id: 'db-1', type: 'DATABASE', tier: 3, count: 1, stateful: true, x: 600, y: 260 }
    ],
    initialConnections: [
      { from: 'lb-1', to: 'srv-1' },
      { from: 'srv-1', to: 'cache-1' },
      { from: 'srv-1', to: 'db-1' }
    ],
    guidance: [
      'Deploy "Event Streaming Queue" (Kafka/SQS) from the bottom dock and place it between EC2 and the Database.',
      'Click "Auto-Connect" (or manually wire `EC2 -> Queue` and `Queue -> Database`) so writes flow through the queue.',
      'Upgrade the Event Streaming Queue to Tier 2 (`Kafka 3-Broker MSK Cluster`) so it can absorb 18,000 msg/sec.'
    ],
    learnings: {
      issueTitle: 'Write Lock Contention & Asynchronous Queue Load Leveling',
      whatWasTheIssue: 'Synchronous database writes force the API server to block and wait while the database acquires row locks and flushes WAL logs to disk. Under flash spikes, connection pools max out and cascade-fail.',
      whenDoesItHappen: 'Ticketing sales (BookMyShow/Ticketmaster), Black Friday checkouts, payment processing, and notification pipelines.',
      howToIdentify: [
        'Database `WriteLatency` and `RowLockWaitTime` spiking during traffic bursts.',
        'API servers throwing `TimeoutError: Knex/Prisma connection pool exhausted`.'
      ],
      realWorldFix: 'Decouple writes using Apache Kafka or AWS SQS (Queue-Based Load Leveling). The API immediately publishes an `OrderPlaced` event to Kafka and returns `202 Accepted` to the user, while background workers drain the queue at the database’s optimal write speed.'
    }
  },

  {
    id: 6,
    title: 'Mission 6: The Layer-7 Botnet Siege',
    concept: 'Edge WAF, Token Bucket Rate Limiting & API Gateway',
    objective: 'Mitigate an 18,500 RPS attack (40% malicious DDoS bots) at the edge before it drains compute capacity.',
    targetRps: 18500,
    budget: 4700,
    maxPower: 410,
    trafficProfile: { read: 0.45, write: 0.15, static: 0.0, bot: 0.40 },
    allowedWeapons: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL'],
    unlockedAtStart: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL'],
    newWeaponReward: 'SHARD_DB',
    problemBrief: {
      scenario: 'A credential-stuffing botnet is hammering your API with 18,500 RPS, of which 40% (~7,400 RPS, peaking at 10,000 RPS) is hostile bot traffic.',
      bottleneck: 'Letting malicious bot traffic hit your EC2 servers wastes CPU cores and forces you to over-spend on compute.',
      goal: 'Deploy a "WAF & Rate Limiter" at the front of your architecture (`WAF -> Load Balancer -> EC2`), and upgrade the WAF to Tier 2 or Tier 3 so 92%–99% of bot traffic is dropped at the edge.'
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
      'Deploy "WAF & Rate Limiter" from the bottom dock and place it on the far left (before the Load Balancer).',
      'Wire `WAF -> Load Balancer` (or click "Auto-Connect").',
      'Upgrade the WAF to Tier 2 (`Managed L7 WAF` - 92% bot drop) or Tier 3 (`AI Behavioral Shield` - 99% bot drop).'
    ],
    learnings: {
      issueTitle: 'Layer-7 DDoS Mitigation & Token Bucket Rate Limiting',
      whatWasTheIssue: 'Without perimeter rate limiting, abusive scrapers and DDoS bots consume expensive application CPU threads and database connections, causing denial of service for real users.',
      whenDoesItHappen: 'Public login endpoints (credential stuffing), sneaker/ticket drops, public AI APIs, and price-scraping attacks.',
      howToIdentify: [
        'Sudden 5x spike in traffic from specific ASNs/IP ranges with zero increase in business conversions.',
        'High rate of HTTP 401/403/404 responses or cache-busting random query strings.'
      ],
      realWorldFix: 'Deploy an Edge WAF (Cloudflare / AWS WAF) combined with a Redis Token Bucket or Sliding Window rate limiter at the API Gateway layer to return `HTTP 429 Too Many Requests` at the network edge.'
    }
  },

  {
    id: 7,
    title: 'Mission 7: Breaking the Single-Master Write Wall',
    concept: 'Horizontal Database Sharding & Consistent Hashing',
    objective: 'Replace single-master SQL with a Sharded NoSQL Cluster to handle 25,000 RPS (40% heavy writes).',
    targetRps: 25000,
    budget: 5600,
    maxPower: 490,
    trafficProfile: { read: 0.60, write: 0.40, static: 0.0, bot: 0.0 },
    allowedWeapons: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL', 'SHARD_DB', 'SEARCH_ENGINE'],
    unlockedAtStart: ['SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'FIREWALL', 'SHARD_DB', 'SEARCH_ENGINE'],
    newWeaponReward: 'OBJECT_STORAGE',
    problemBrief: {
      scenario: 'Your global messaging and telemetry platform hits 25,000 RPS with 40% sustained writes (10,000 writes/sec baseline, 13,500 writes/sec peak).',
      bottleneck: 'Even with a Kafka queue, your single primary RDS SQL database maxes out at 3,800 writes/sec. The queue will eventually overflow if the database cannot drain writes fast enough.',
      goal: 'Remove the single Relational SQL Database (or supplement it) with a "Sharded NoSQL Cluster" (DynamoDB / Cassandra) upgraded to Tier 2 (16-Shard Cluster, 18,000 Write WCU).'
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
      'Click the existing "Relational Database" node and click "Remove Component" in the bottom-right inspector.',
      'Deploy "Sharded NoSQL Cluster" from the bottom dock and upgrade it to Tier 2 (`16-Shard DynamoDB Cluster`).',
      'Connect `EC2 Cluster -> Sharded NoSQL Cluster` (or click "Auto-Connect") and run the benchmark.'
    ],
    learnings: {
      issueTitle: 'Horizontal Database Sharding & Consistent Hashing',
      whatWasTheIssue: 'Vertical scaling and Read Replicas cannot scale write throughput beyond the physical disk I/O limit of a single Master node. At 10,000+ writes/sec, you must partition data across multiple independent nodes (Shards).',
      whenDoesItHappen: 'High-velocity write workloads: Discord/WhatsApp chat messages, Uber GPS location pings, IoT telemetry, and social media activity feeds.',
      howToIdentify: [
        'Primary database CPU and Write IOPS pinned at 100% even on the largest cloud instance (`db.r6g.16xlarge`).',
        'Kafka consumer lag continuously growing because the database sink cannot keep up.'
      ],
      realWorldFix: 'Partition data horizontally using Consistent Hashing on a high-cardinality Partition Key (e.g., `user_id` or `channel_id`) in DynamoDB, Cassandra, or Vitess-sharded MySQL.'
    }
  },

  {
    id: 8,
    title: 'Mission 8: The Planet-Scale SuperApp Capstone',
    concept: 'End-to-End Multi-Tier Cloud Architecture',
    objective: 'Architect a complete fault-tolerant enterprise system handling 36,000 RPS across Read, Write, Static Media, and Bot traffic.',
    targetRps: 36000,
    budget: 7200,
    maxPower: 620,
    trafficProfile: { read: 0.45, write: 0.25, static: 0.18, bot: 0.12 },
    allowedWeapons: Object.keys({
      SERVER: 1, LAMBDA: 1, API_GATEWAY: 1, DATABASE: 1, LOAD_BALANCER: 1,
      CACHE: 1, CDN: 1, MESSAGE_QUEUE: 1, FIREWALL: 1, SHARD_DB: 1, SEARCH_ENGINE: 1, OBJECT_STORAGE: 1
    }),
    unlockedAtStart: [
      'SERVER', 'LAMBDA', 'API_GATEWAY', 'DATABASE', 'LOAD_BALANCER',
      'CACHE', 'CDN', 'MESSAGE_QUEUE', 'FIREWALL', 'SHARD_DB', 'SEARCH_ENGINE', 'OBJECT_STORAGE'
    ],
    newWeaponReward: null,
    problemBrief: {
      scenario: 'Final Principal Architect Evaluation: Your global SuperApp is experiencing 36,000 RPS (48,600 RPS peak) comprising 45% dynamic reads, 25% transactional writes, 18% static media downloads, and 12% hostile bot attacks.',
      bottleneck: 'Every single layer is tested simultaneously—edge bandwidth, bot scrubbing, load balancing, compute concurrency, read caching, write buffering, and sharded persistence.',
      goal: 'Combine Edge CDN + WAF + Multi-AZ Load Balancers + Compute Cluster + Redis Cache + Kafka Queue + Sharded NoSQL DB within the $7,200 budget and 620 MW power envelope.'
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
      'Inspect the pre-deployed topology: verify that CDN offloads static traffic and WAF filters bot traffic.',
      'Check the EC2 Compute Cluster: scale to `6x` replicas (or add Serverless Lambda functions) so Wave 2 peak (48,600 RPS) does not overload compute.',
      'Ensure all nodes are wired properly and click "Run Benchmark" to earn your Principal Architect certification.'
    ],
    learnings: {
      issueTitle: 'Defense-in-Depth: Planet-Scale Distributed Systems',
      whatWasTheIssue: 'At 35,000+ RPS, no single silver bullet works. You must filter and offload traffic at every successive tier so only a tiny fraction of clean, uncached requests ever touch your core storage engine.',
      whenDoesItHappen: 'Tier-1 global platforms (Netflix, Uber, Amazon, Swiggy/Zomato during peak hours).',
      howToIdentify: [
        'End-to-end distributed tracing (OpenTelemetry / Jaeger) showing bottlenecks shifting from Edge -> Compute -> Cache -> DB.',
        'Cascading failures when one downstream dependency slows down without circuit breakers or queues.'
      ],
      realWorldFix: 'Defense-in-Depth Architecture: (1) Edge CDN + S3 absorbs 90%+ static bytes, (2) WAF drops 95%+ bad bots, (3) Multi-AZ ALBs route to Stateless Compute, (4) Redis absorbs 90%+ reads, and (5) Kafka buffers writes into Sharded NoSQL storage.'
    }
  }
];