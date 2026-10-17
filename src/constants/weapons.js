// 12 Real-World Cloud Architecture Components with Industry Hardware Tiers
export const WEAPON_REGISTRY = {
  SERVER: {
    id: 'SERVER',
    name: 'EC2 Compute Cluster',
    realName: 'Virtual Machines (AWS EC2 / Compute Engine)',
    category: 'COMPUTE',
    stateType: 'STATELESS', // Can be toggled to STATEFUL in Inspector to see session issues
    icon: 'Cpu',
    color: '#6366f1',
    cost: 140,
    power: 20,
    role: 'Executes core application business logic, REST/GraphQL APIs, and authentication.',
    eli5: {
      title: 'Dedicated Kitchen Chefs (Always On)',
      analogy: 'Think of EC2 instances like full-time chefs standing in your restaurant kitchen 24/7. Whether 10 customers walk in or 1,000, you pay their hourly salary. If you keep customer order notes in Chef #1’s personal pocket (Stateful), Chef #2 cannot help that customer if Chef #1 goes on break!',
      whyNeedIt: 'Runs your backend code (Node.js, Go, Java, Python). Must be kept Stateless (storing sessions in Redis) so any instance can serve any user.'
    },
    interview: {
      pattern: 'Stateless Horizontal Auto-Scaling Group (ASG)',
      interviewTip: 'Always emphasize Stateless Compute! Store user sessions and JWT refresh state in Redis ElastiCache—never in local server memory or local disk.',
      pros: 'Predictable performance, no cold starts, full OS-level control.',
      cons: 'Pays for idle capacity if traffic drops; slower to scale (1-3 mins boot time) compared to Serverless.'
    },
    tiers: [
      {
        tier: 1,
        name: 't3.medium (Burstable)',
        specs: '2 vCPU • 4 GB RAM • 5 Gbps Net',
        rps: 1000,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: 'c6i.xlarge (Compute Optimized)',
        specs: '4 vCPU • 8 GB RAM • 12.5 Gbps Net',
        rps: 2500,
        costMult: 1.8,
        powerMult: 1.6
      },
      {
        tier: 3,
        name: 'c7g.4xlarge (Graviton3 Metal)',
        specs: '16 vCPU • 32 GB RAM • 25 Gbps ENA',
        rps: 6000,
        costMult: 3.2,
        powerMult: 2.4
      }
    ]
  },

  LAMBDA: {
    id: 'LAMBDA',
    name: 'Serverless Functions',
    realName: 'Event-Driven FaaS (AWS Lambda / Cloud Run)',
    category: 'COMPUTE',
    stateType: 'STATELESS',
    icon: 'Zap',
    color: '#8b5cf6',
    cost: 180,
    power: 15,
    role: 'Spins up ephemeral micro-containers on demand per request and scales to zero when idle.',
    eli5: {
      title: 'On-Demand Gig Delivery Drivers',
      analogy: 'Instead of hiring full-time chefs 24/7, you call gig workers only when an order arrives. If 5,000 orders arrive at 8 PM, 5,000 workers appear instantly. However, waking up a sleeping worker takes a split second (Cold Start)!',
      whyNeedIt: 'Ideal for unpredictable, spiky traffic or event-driven microservices where you do not want to manage servers.'
    },
    interview: {
      pattern: 'Ephemeral Stateless Function-as-a-Service (FaaS)',
      interviewTip: 'Mention Cold Start latency (150ms–800ms) and Database Connection Exhaustion! Thousands of concurrent Lambdas opening TCP connections to PostgreSQL will crash it without RDS Proxy.',
      pros: 'Instant auto-scaling, zero idle server maintenance, pay-per-invocation.',
      cons: 'Cold start tail latency (P99), strict 15-minute execution timeout, purely stateless.'
    },
    tiers: [
      {
        tier: 1,
        name: '512 MB Standard Container',
        specs: '0.3 vCPU • 1,000 Concurrency Cap • Cold Start ~180ms',
        rps: 1800,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: '2048 MB Ephemeral Runtime',
        specs: '1.2 vCPU • 5,000 Concurrency Cap • Cold Start ~60ms',
        rps: 4500,
        costMult: 1.9,
        powerMult: 1.5
      },
      {
        tier: 3,
        name: '10 GB Provisioned Concurrency',
        specs: '6 vCPU • 25,000 Concurrency • 0ms Cold Start',
        rps: 11000,
        costMult: 3.4,
        powerMult: 2.2
      }
    ]
  },

  API_GATEWAY: {
    id: 'API_GATEWAY',
    name: 'Managed API Gateway',
    realName: 'API Gateway (Kong / Envoy / AWS API GW)',
    category: 'GATEWAY',
    stateType: 'STATELESS',
    icon: 'GitMerge',
    color: '#ec4899',
    cost: 190,
    power: 15,
    role: 'Central entry point for JWT authentication, SSL termination, request routing, and protocol translation.',
    eli5: {
      title: 'The Hotel Concierge Desk',
      analogy: 'Before guests can enter the hotel elevators, the concierge verifies their room keycard (JWT Auth), checks their reservation tier, and directs them to the right floor (Microservice routing).',
      whyNeedIt: 'Offloads authentication, rate limiting, and SSL handshakes so your backend compute servers only focus on core logic.'
    },
    interview: {
      pattern: 'BFF (Backend-for-Frontend) & Edge Auth Offload',
      interviewTip: 'In microservice architectures, never make the client call 10 different services directly. Place an API Gateway in front to validate OAuth/JWT tokens and aggregate responses.',
      pros: 'Centralized security, request throttling, and unified API observability.',
      cons: 'Adds an extra network hop (2–5ms latency) and can become a bottleneck if under-provisioned.'
    },
    tiers: [
      {
        tier: 1,
        name: 'REST Edge Gateway',
        specs: '2 vCPU • TLS 1.3 Termination • Basic JWT Auth',
        rps: 6000,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: 'Envoy High-Throughput Proxy',
        specs: '8 vCPU • gRPC Transcoding • OAuth2 + Rate Quota',
        rps: 18000,
        costMult: 1.9,
        powerMult: 1.5
      },
      {
        tier: 3,
        name: 'Kong Enterprise Mesh Cluster',
        specs: '32 vCPU • Multi-AZ Active-Active • GraphQL Federation',
        rps: 50000,
        costMult: 3.3,
        powerMult: 2.2
      }
    ]
  },

  LOAD_BALANCER: {
    id: 'LOAD_BALANCER',
    name: 'Application Load Balancer',
    realName: 'L7/L4 Load Balancer (AWS ALB / NGINX / HAProxy)',
    category: 'ROUTING',
    stateType: 'STATELESS',
    icon: 'Shuffle',
    color: '#10b981',
    cost: 180,
    power: 15,
    role: 'Distributes incoming requests across multiple healthy compute instances and runs health checks.',
    eli5: {
      title: 'The Airport Immigration Line Dispatcher',
      analogy: 'When 500 passengers exit a plane, an official stands at the front directing each person to the shortest open booth. If Booth #3 closes, the official immediately stops sending people there.',
      whyNeedIt: 'Required whenever you have 2 or more compute servers. Without it, all traffic hits a single server IP while other servers sit idle.'
    },
    interview: {
      pattern: 'Layer-7 Reverse Proxy (Round-Robin / Least Outstanding Requests)',
      interviewTip: 'Always deploy Load Balancers in Active-Passive or Active-Active Multi-AZ pairs! A single Load Balancer is a Single Point of Failure (SPOF).',
      pros: 'Prevents single-server overload, enables zero-downtime deployments via health checks.',
      cons: 'Sticky sessions (if enabled for stateful servers) can cause uneven load distribution.'
    },
    tiers: [
      {
        tier: 1,
        name: 'NGINX L7 Round-Robin',
        specs: '2 vCPU • 10k Active Connections • 10s Health Check',
        rps: 8000,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: 'AWS ALB Least-Connections',
        specs: '8 vCPU • 100k Active Connections • 2s Health Check',
        rps: 22000,
        costMult: 1.8,
        powerMult: 1.5
      },
      {
        tier: 3,
        name: 'Global Anycast NLB + ALB Mesh',
        specs: '32 vCPU • 1M+ Concurrent TCP • Hardware TLS Offload',
        rps: 65000,
        costMult: 3.4,
        powerMult: 2.2
      }
    ]
  },

  DATABASE: {
    id: 'DATABASE',
    name: 'Relational SQL Database',
    realName: 'Managed RDBMS (Amazon RDS PostgreSQL / Aurora)',
    category: 'STORAGE',
    stateType: 'STATEFUL',
    icon: 'Database',
    color: '#3b82f6',
    cost: 300,
    power: 35,
    role: 'Persists structured data with strict ACID transactions, foreign keys, and row-level locking.',
    eli5: {
      title: 'The High-Security Bank Ledger',
      analogy: 'Every time money moves from Account A to Account B, the chief accountant locks both pages, verifies the balance, and writes the entry in permanent ink. It is 100% accurate, but slow if 10,000 people try to write at once!',
      whyNeedIt: 'Essential for user accounts, orders, payments, and inventory where data corruption or lost writes are unacceptable.'
    },
    interview: {
      pattern: 'Primary Master + Asynchronous Read Replicas + Multi-AZ Standby',
      interviewTip: 'Read Replicas scale READS, not WRITES! Also mention Replication Lag (10ms–200ms) which can cause "read-your-own-writes" inconsistency unless handled.',
      pros: 'Strong ACID consistency, complex SQL JOINs, mature ecosystem.',
      cons: 'Single Primary node limits write throughput; vertical scaling has a hard hardware ceiling.'
    },
    tiers: [
      {
        tier: 1,
        name: 'db.m6i.large (Single-AZ Master)',
        specs: '2 vCPU • 8 GB RAM • 3,000 gp3 IOPS • No Failover',
        writeRps: 700,
        readRps: 1600,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: 'db.r6g.xlarge + 2 Read Replicas',
        specs: '4 vCPU • 32 GB RAM • 12,000 io2 IOPS • Async Read Pool',
        writeRps: 1500,
        readRps: 5000,
        costMult: 2.2,
        powerMult: 1.8
      },
      {
        tier: 3,
        name: 'db.r6g.4xlarge Aurora Multi-AZ Cluster',
        specs: '16 vCPU • 128 GB RAM • 64,000 NVMe IOPS • Auto-Failover <30s',
        writeRps: 3800,
        readRps: 14000,
        costMult: 4.2,
        powerMult: 2.8
      }
    ]
  },

  CACHE: {
    id: 'CACHE',
    name: 'In-Memory Redis Cache',
    realName: 'In-Memory Key-Value Store (Redis ElastiCache)',
    category: 'CACHE',
    stateType: 'STATEFUL',
    icon: 'Cpu',
    color: '#f59e0b',
    cost: 240,
    power: 20,
    role: 'Serves hot read queries and user sessions directly from sub-millisecond RAM.',
    eli5: {
      title: 'The Sticky Note on Your Desk',
      analogy: 'Instead of walking down to the basement archive vault (SQL Database) every time someone asks for today’s top 10 products, you pin a sticky note on your monitor and read it in 0.5 milliseconds.',
      whyNeedIt: 'RAM is ~1,000x faster than SSD disk reads. Offloads 60%–95% of repetitive read traffic away from your primary database.'
    },
    interview: {
      pattern: 'Cache-Aside with TTL + LRU Eviction & Redis Sentinel',
      interviewTip: 'Discuss Cache Stampede (Thundering Herd): when a popular cache key expires and 5,000 requests miss the cache simultaneously, use distributed mutex locks or jittered TTLs!',
      pros: 'Sub-millisecond P99 read latency, protects relational databases from read spikes.',
      cons: 'Cache invalidation complexity; stale reads if DB updates fail to invalidate cache.'
    },
    tiers: [
      {
        tier: 1,
        name: 'cache.t4g.medium (Standalone)',
        specs: '2 vCPU • 3.2 GB RAM • LRU Eviction • 65% Hit Ratio',
        hitRate: 0.65,
        rps: 12000,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: 'cache.r6g.xlarge (Redis Sentinel HA)',
        specs: '4 vCPU • 26 GB RAM • Multi-AZ Replica • 85% Hit Ratio',
        hitRate: 0.85,
        rps: 35000,
        costMult: 2.0,
        powerMult: 1.6
      },
      {
        tier: 3,
        name: 'cache.r6g.4xlarge (Sharded Redis Cluster)',
        specs: '16 vCPU • 105 GB RAM • 16 Hash Slots • 95% Hit Ratio',
        hitRate: 0.95,
        rps: 90000,
        costMult: 3.5,
        powerMult: 2.4
      }
    ]
  },

  CDN: {
    id: 'CDN',
    name: 'Global Edge CDN',
    realName: 'Content Delivery Network (Cloudflare / AWS CloudFront)',
    category: 'EDGE',
    stateType: 'STATELESS',
    icon: 'Globe',
    color: '#06b6d4',
    cost: 260,
    power: 20,
    role: 'Caches static assets (images, JS/CSS bundles, HLS video segments) at 300+ global edge PoPs.',
    eli5: {
      title: 'Neighborhood Vending Machines',
      analogy: 'Instead of shipping every bottle of soda from a single factory in Atlanta to customers in Mumbai and Tokyo, you stock local vending machines in every city so customers get it in 10ms.',
      whyNeedIt: 'Eliminates cross-continent network latency and absorbs up to 98% of static bandwidth before it ever reaches your cloud VPC.'
    },
    interview: {
      pattern: 'BGP Anycast Edge Caching & Origin Shield',
      interviewTip: 'Use Versioned Asset URLs (e.g., `app.8f9a2.js`) so you can cache files at the edge for 1 year (`Cache-Control: max-age=31536000, immutable`).',
      pros: 'Drastically cuts origin egress bandwidth costs and reduces global TTFB latency.',
      cons: 'Cannot cache user-specific dynamic mutations (e.g., live checkout cart mutations).'
    },
    tiers: [
      {
        tier: 1,
        name: 'Regional Edge PoPs (50 Locations)',
        specs: '10 Gbps Edge Capacity • 75% Static Offload',
        staticOffload: 0.75,
        rps: 20000,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: 'Global Anycast Network (220+ PoPs)',
        specs: '50 Gbps Edge + Origin Shield • 90% Static Offload',
        staticOffload: 0.90,
        rps: 50000,
        costMult: 2.0,
        powerMult: 1.6
      },
      {
        tier: 3,
        name: 'Hyper-Edge Compute Workers (310+ PoPs)',
        specs: '100+ Tbps Anycast • Edge SSR • 98% Static Offload',
        staticOffload: 0.98,
        rps: 120000,
        costMult: 3.6,
        powerMult: 2.4
      }
    ]
  },

  MESSAGE_QUEUE: {
    id: 'MESSAGE_QUEUE',
    name: 'Event Streaming Queue',
    realName: 'Distributed Message Broker (Apache Kafka / AWS SQS)',
    category: 'QUEUE',
    stateType: 'STATEFUL',
    icon: 'Layers',
    color: '#a855f7',
    cost: 320,
    power: 30,
    role: 'Buffers bursty write traffic asynchronously so downstream databases process writes at a safe pace.',
    eli5: {
      title: 'The Deli Ticket Dispenser (Shock Absorber)',
      analogy: 'When 5,000 Flash Sale buyers click "Place Order" in the same second, instead of crashing the database, the queue hands each buyer an "Order Received" ticket and lets worker servers process them smoothly.',
      whyNeedIt: 'Decouples fast producers (API servers) from slow consumers (Databases, Payment Gateways), preventing cascading write failures.'
    },
    interview: {
      pattern: 'Asynchronous Pub/Sub Log & Load Leveling + Dead Letter Queue (DLQ)',
      interviewTip: 'Always mention Idempotency Keys! Because queues guarantee "at-least-once" delivery, a consumer might receive the same payment event twice.',
      pros: 'Smooths extreme traffic spikes, prevents dropped writes, decouples microservices.',
      cons: 'Introduces eventual consistency; requires Dead Letter Queues (DLQ) for poison-pill messages.'
    },
    tiers: [
      {
        tier: 1,
        name: 'AWS SQS Standard Queue',
        specs: 'Single Partition Group • 4,000 msg/s • 4-Day Retention',
        bufferCapacity: 6000,
        rps: 5000,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: 'Kafka 3-Broker MSK Cluster (kafka.m5.large)',
        specs: '12 Partitions • NVMe Log • 18,000 msg/s • Replication Factor 3',
        bufferCapacity: 30000,
        rps: 18000,
        costMult: 2.1,
        powerMult: 1.7
      },
      {
        tier: 3,
        name: 'Kafka 9-Broker Fleet (kafka.m5.4xlarge)',
        specs: '64 Partitions • Zero-Copy I/O • 60,000 msg/s • Tiered Storage',
        bufferCapacity: 100000,
        rps: 60000,
        costMult: 3.7,
        powerMult: 2.6
      }
    ]
  },

  FIREWALL: {
    id: 'FIREWALL',
    name: 'WAF & Rate Limiter',
    realName: 'Web Application Firewall (Cloudflare WAF / AWS Shield)',
    category: 'EDGE',
    stateType: 'STATELESS',
    icon: 'ShieldAlert',
    color: '#ef4444',
    cost: 210,
    power: 15,
    role: 'Drops DDoS floods, SQL injection attacks, and abusive bot scrapers at the network perimeter.',
    eli5: {
      title: 'The VIP Nightclub Bouncer',
      analogy: 'If a malicious bot tries to refresh the login page 2,000 times per second to guess passwords, the bouncer blocks their IP at the street curb so real customers inside aren’t affected.',
      whyNeedIt: 'Without rate limiting, a botnet attack will exhaust your compute CPU, max out database connections, and inflate your cloud bill.'
    },
    interview: {
      pattern: 'Token Bucket / Sliding Window Rate Limiting at Edge',
      interviewTip: 'Explain the HTTP 429 (Too Many Requests) response code with `Retry-After` headers, and how Token Bucket algorithms allow short legitimate bursts.',
      pros: 'Drops up to 99% of malicious L7 bot traffic before it consumes compute resources.',
      cons: 'Shared NAT IPs (like universities or corporate offices) can trigger false-positive blocks.'
    },
    tiers: [
      {
        tier: 1,
        name: 'IP Token Bucket Limiter',
        specs: 'Fixed IP Threshold • OWASP Core Rules • 75% Bot Drop',
        botFilterRate: 0.75,
        rps: 15000,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: 'Managed L7 WAF + ASN Reputation',
        specs: 'Sliding Window + Turnstile Challenge • 92% Bot Drop',
        botFilterRate: 0.92,
        rps: 40000,
        costMult: 1.9,
        powerMult: 1.5
      },
      {
        tier: 3,
        name: 'AI Behavioral Threat Shield (AWS Shield Adv)',
        specs: 'TLS Fingerprinting (JA3) + Inline DDoS Scrubbing • 99% Bot Drop',
        botFilterRate: 0.99,
        rps: 100000,
        costMult: 3.4,
        powerMult: 2.3
      }
    ]
  },

  SHARD_DB: {
    id: 'SHARD_DB',
    name: 'Sharded NoSQL Cluster',
    realName: 'Partitioned Wide-Column / Key-Value DB (DynamoDB / Cassandra)',
    category: 'STORAGE',
    stateType: 'STATEFUL',
    icon: 'Boxes',
    color: '#14b8a6',
    cost: 480,
    power: 45,
    role: 'Horizontally partitions massive write/read workloads across multiple storage nodes via Consistent Hashing.',
    eli5: {
      title: 'Splitting Encyclopedia Volumes A–Z Across 10 Desks',
      analogy: 'When one giant ledger book gets too crowded for 50 clerks to write in simultaneously, you split it into 10 separate books by Customer ID hash. Now 10 clerks can write in parallel with zero waiting!',
      whyNeedIt: 'Breaks through the single-master write bottleneck of traditional SQL databases for high-scale feeds, IoT, and chat messages.'
    },
    interview: {
      pattern: 'Consistent Hashing Ring & Partition Keys (Quorum R+W > N)',
      interviewTip: 'Watch out for Hot Partitions (Celebrity Problem)! If Justin Bieber posts a tweet and you shard solely by `user_id`, one shard melts down. Append a random shard suffix (e.g., `user_id#1..10`).',
      pros: 'Near-infinite linear write scalability, multi-master availability, no single point of failure.',
      cons: 'No native cross-shard ACID joins; eventual consistency unless Quorum reads/writes are used.'
    },
    tiers: [
      {
        tier: 1,
        name: '4-Shard Consistent Hash Ring',
        specs: '4 Storage Nodes • 6,500 Write WCU • 16,000 Read RCU',
        writeRps: 6500,
        readRps: 16000,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: '16-Shard DynamoDB On-Demand Cluster',
        specs: '16 Partitions • Auto-Split • 18,000 Write WCU • 45,000 Read RCU',
        writeRps: 18000,
        readRps: 45000,
        costMult: 2.1,
        powerMult: 1.8
      },
      {
        tier: 3,
        name: '64-Shard Global Active-Active Table + DAX',
        specs: 'Multi-Region Paxos • 50,000 Write WCU • 120,000 Read RCU',
        writeRps: 50000,
        readRps: 120000,
        costMult: 3.8,
        powerMult: 2.8
      }
    ]
  },

  SEARCH_ENGINE: {
    id: 'SEARCH_ENGINE',
    name: 'Search Index Cluster',
    realName: 'Inverted Index Search (Elasticsearch / OpenSearch)',
    category: 'CACHE',
    stateType: 'STATEFUL',
    icon: 'Search',
    color: '#eab308',
    cost: 300,
    power: 30,
    role: 'Accelerates full-text search, autocomplete, and multi-attribute filtering using inverted indexes.',
    eli5: {
      title: 'The Alphabetical Index at the Back of a Textbook',
      analogy: 'Instead of reading every page of a 1,000-page book (`SELECT * WHERE description LIKE "%shoes%"`), you check the back index which immediately lists the exact page numbers.',
      whyNeedIt: 'Offloads heavy text-search and filter queries that would otherwise cause 100% CPU full-table scans on your SQL database.'
    },
    interview: {
      pattern: 'Inverted Index Shards synced via CDC (Debezium + Kafka)',
      interviewTip: 'Never use Elasticsearch as your primary source of truth! Keep PostgreSQL/DynamoDB as primary storage and stream updates to Elasticsearch asynchronously.',
      pros: 'Millisecond fuzzy text search, geo-queries, and BM25 relevance ranking.',
      cons: 'High RAM/JVM heap usage; 1-second index refresh interval means eventual consistency.'
    },
    tiers: [
      {
        tier: 1,
        name: 't3.medium.search (Single Index Node)',
        specs: '2 vCPU • 4 GB JVM Heap • 50% Read Offload',
        hitRate: 0.50,
        rps: 8000,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: 'm6g.large.search (3-Node Cluster)',
        specs: '6 vCPU • 24 GB RAM • 5 Primary Shards • 75% Read Offload',
        hitRate: 0.75,
        rps: 22000,
        costMult: 2.0,
        powerMult: 1.6
      },
      {
        tier: 3,
        name: 'r6gd.2xlarge.search (Dedicated Master + NVMe)',
        specs: '24 vCPU • 192 GB RAM • UltraWarm Tier • 90% Read Offload',
        hitRate: 0.90,
        rps: 60000,
        costMult: 3.5,
        powerMult: 2.4
      }
    ]
  },

  OBJECT_STORAGE: {
    id: 'OBJECT_STORAGE',
    name: 'Cloud Object Storage',
    realName: 'Blob Storage (Amazon S3 / Google Cloud Storage)',
    category: 'STORAGE',
    stateType: 'STATEFUL',
    icon: 'HardDrive',
    color: '#2dd4bf',
    cost: 160,
    power: 10,
    role: 'Stores unstructured blobs (photos, videos, PDFs, parquet logs) with 99.999999999% durability.',
    eli5: {
      title: 'The Infinite Self-Storage Warehouse',
      analogy: 'You never store bulky furniture inside your bank safe (SQL Database). Instead, you store heavy files in a massive, cheap warehouse (S3) and only save the short receipt link (URL string) inside the SQL database.',
      whyNeedIt: 'Keeps binary files out of your database and compute servers using Pre-Signed URLs.'
    },
    interview: {
      pattern: 'Pre-Signed Direct Upload/Download + CDN Origin',
      interviewTip: 'When users upload 50MB videos, do NOT stream the binary payload through your EC2/Node.js servers! Generate an S3 Pre-Signed URL so the browser uploads directly to S3.',
      pros: '11 nines of durability, virtually infinite scale, 10x cheaper than block/database storage.',
      cons: 'High first-byte latency (50–100ms) if not paired with a CDN; objects are immutable.'
    },
    tiers: [
      {
        tier: 1,
        name: 'S3 Standard Bucket',
        specs: '3,500 PUT/s • 5,500 GET/s per Prefix • 65% Static Offload',
        staticOffload: 0.65,
        rps: 12000,
        costMult: 1.0,
        powerMult: 1.0
      },
      {
        tier: 2,
        name: 'S3 Multi-Prefix + Pre-Signed Upload',
        specs: '10 Prefixes • 35,000 PUT/s • 55,000 GET/s • 85% Offload',
        staticOffload: 0.85,
        rps: 45000,
        costMult: 1.8,
        powerMult: 1.4
      },
      {
        tier: 3,
        name: 'S3 Express One Zone + Transfer Accel',
        specs: 'Single-Digit ms Latency • 200,000 RPS • 96% Offload',
        staticOffload: 0.96,
        rps: 110000,
        costMult: 3.1,
        powerMult: 2.0
      }
    ]
  }
};