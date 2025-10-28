# Load Testing Documentation

This directory contains load testing scripts for the AI Resume Optimizer platform using **autocannon**, a fast HTTP/1.1 benchmarking tool written in Node.js.

## Overview

Load testing validates the platform's performance under concurrent user load and helps identify:
- Performance bottlenecks
- Scalability limits
- Resource constraints (CPU, memory, database connections)
- Rate limiting effectiveness
- API response times under load

## Prerequisites

### 1. Install Dependencies

```bash
npm install
```

This installs `autocannon` as a dev dependency.

### 2. Start the Application

```bash
npm run dev
# or
npm run build && npm start
```

The application should be running on `http://localhost:3000`.

### 3. Create Test User

Create a test user for load testing:

```bash
# Register via API or UI
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Load Test User",
    "email": "loadtest@example.com",
    "password": "LoadTest123!"
  }'
```

### 4. Configure OpenAI API Key

The test user needs an active OpenAI API key for resume generation tests:

1. Login as the test user
2. Navigate to Settings → API Keys
3. Add your OpenAI API key

### 5. Set Environment Variables (Optional)

Create a `.env.test` file:

```bash
TEST_URL=http://localhost:3000
TEST_EMAIL=loadtest@example.com
TEST_PASSWORD=LoadTest123!
```

## Available Tests

### 1. Resume Generation Load Test

**Script**: `scripts/load-test-resume-generation.js`

Tests the most critical endpoint: `POST /api/resumes/generate`

This endpoint involves:
- AI API calls to OpenAI (GPT-4)
- LangGraph workflow execution (5 agents)
- Database writes
- Complex business logic

**Scenarios**:

1. **Baseline** (1 concurrent user, 30s)
   - Establishes performance baseline
   - Single user experience

2. **Light Load** (10 concurrent users, 60s)
   - Small team usage
   - ~10 simultaneous generations

3. **Medium Load** (50 concurrent users, 60s)
   - Growing startup
   - Tests database connection pooling

4. **Heavy Load** (100 concurrent users, 60s)
   - Scale test
   - Identifies breaking points

5. **Rate Limit Test** (20 concurrent users, burst, 20s)
   - Validates rate limiting (5 req/min per endpoint)
   - Tests 429 response handling

**Run All Scenarios**:
```bash
npm run load-test:generate
```

**Run Specific Scenario**:
```bash
node scripts/load-test-resume-generation.js baseline
node scripts/load-test-resume-generation.js light
node scripts/load-test-resume-generation.js medium
node scripts/load-test-resume-generation.js heavy
node scripts/load-test-resume-generation.js rateLimit
```

### 2. API Endpoints Load Test

**Script**: `scripts/load-test-api-endpoints.js`

Tests public read-heavy endpoints:

- `GET /api/templates` - List all templates (public)
- `GET /api/templates/[id]` - Get template details (public)

These tests validate:
- Response caching effectiveness
- Database query performance
- High-throughput read operations

**Run**:
```bash
npm run load-test:api
```

## Interpreting Results

### Key Metrics

**Requests/sec (Throughput)**:
- Higher is better
- Should scale with connections (up to limits)
- Typical: 10-100 req/s for AI endpoints, 1000+ for cached reads

**Latency**:
- **Mean**: Average response time
- **p50 (Median)**: 50% of requests faster than this
- **p95**: 95% of requests faster than this (key UX metric)
- **p99**: 99% of requests faster than this
- **Max**: Slowest request

**Target Latencies**:
- Resume Generation (AI): p95 < 15s, p99 < 30s
- API Reads (cached): p95 < 100ms, p99 < 500ms
- API Reads (uncached): p95 < 500ms, p99 < 1s

**Status Codes**:
- **200**: Successful requests ✅
- **429**: Rate limited (expected in rate limit test) ⚠️
- **401**: Unauthorized (check session cookie) ❌
- **500**: Server errors (should be < 1%) ❌

**Errors & Timeouts**:
- Should be close to 0 under normal load
- High errors indicate system instability
- Timeouts suggest resource exhaustion

### Example Output

```
📊 Results Summary:
   Total requests: 150
   Requests/sec: 5.00
   Throughput: 45.32 KB/s

⏱️  Latency:
   Mean: 8245.32ms
   p50: 7832.50ms
   p95: 12405.12ms
   p99: 14832.45ms
   Max: 18234.67ms

📈 Status Codes:
   ✅ 200: 145
   ⚠️ 429: 5

❌ Errors: 0
⏰ Timeouts: 0
```

**Analysis**:
- System handling ~5 resume generations per second
- Mean latency ~8s (acceptable for AI workflow)
- p95 < 15s (good UX)
- 5 rate-limited requests (rate limiting working)
- 0 errors (stable system)

## Performance Targets

Based on system architecture:

### Resume Generation (AI Workflow)

| Metric | Target | Explanation |
|--------|--------|-------------|
| **Throughput** | 3-10 req/s | Limited by OpenAI API rate limits |
| **p95 Latency** | < 15s | AI processing time (5 agents) |
| **p99 Latency** | < 30s | Includes retries and slow responses |
| **Error Rate** | < 1% | Transient failures acceptable with retries |
| **Concurrent Users** | 10-50 | Based on Prisma connection pool (10 connections) |

### API Reads (Cached)

| Metric | Target | Explanation |
|--------|--------|-------------|
| **Throughput** | 500-1000 req/s | In-memory cache performance |
| **p95 Latency** | < 100ms | Fast cache hits |
| **p99 Latency** | < 500ms | Occasional cache misses |
| **Error Rate** | < 0.1% | Highly stable |
| **Concurrent Users** | 100-500 | Read-heavy workload |

### API Reads (Uncached)

| Metric | Target | Explanation |
|--------|--------|-------------|
| **Throughput** | 50-100 req/s | Database query performance |
| **p95 Latency** | < 500ms | With indexed queries |
| **p99 Latency** | < 1s | Complex queries |
| **Error Rate** | < 0.5% | Database connection limits |
| **Concurrent Users** | 50-100 | Connection pool constraints |

## Common Issues & Solutions

### Issue: High Latency

**Symptoms**: p95 > 20s for resume generation

**Possible Causes**:
- OpenAI API slowness (external)
- Database connection pool exhaustion
- Memory pressure
- No caching

**Solutions**:
1. Monitor OpenAI API status
2. Increase Prisma connection pool size
3. Add more server resources
4. Implement request queuing

### Issue: High Error Rate

**Symptoms**: Errors > 5%

**Possible Causes**:
- OpenAI API failures
- Database connection failures
- Memory leaks
- Unhandled exceptions

**Solutions**:
1. Check application logs
2. Verify OpenAI API key and quota
3. Monitor database connection pool
4. Add more error handling

### Issue: Rate Limiting

**Symptoms**: Many 429 responses

**Expected**: In rate limit test scenario

**If Unexpected**:
1. Review rate limits (currently 5 req/min per endpoint)
2. Implement request queuing
3. Add user-facing rate limit info
4. Consider increasing limits for production

### Issue: Connection Timeouts

**Symptoms**: High timeout count

**Possible Causes**:
- Server overload
- Slow OpenAI API responses
- Database locks
- Network issues

**Solutions**:
1. Increase timeout values
2. Scale server resources
3. Optimize database queries
4. Add circuit breakers

## Reports

Load test results are saved to `load-test-reports/` directory:

- **JSON Reports**: Full test results with all metrics
- **LATEST_SUMMARY.md**: Human-readable summary of latest run

**Example Report Structure**:
```
load-test-reports/
├── resume-generation-1234567890.json
├── api-endpoints-1234567891.json
└── LATEST_SUMMARY.md
```

## Continuous Integration

Add load tests to CI pipeline:

```yaml
# .github/workflows/load-test.yml
name: Load Tests
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm install
      - name: Start application
        run: npm run build && npm start &
      - name: Run load tests
        run: npm run load-test:generate baseline
      - name: Upload reports
        uses: actions/upload-artifact@v2
        with:
          name: load-test-reports
          path: load-test-reports/
```

## Best Practices

1. **Run on Production-Like Environment**:
   - Same CPU, memory, and database specs
   - Use production database size
   - Enable all middleware and security

2. **Warm Up System**:
   - Run a short warm-up test first
   - Ensures caches are populated
   - JIT compilation complete

3. **Monitor System Resources**:
   - CPU usage (`htop`, `top`)
   - Memory usage
   - Database connections (`npx prisma studio`)
   - Network bandwidth

4. **Test Incrementally**:
   - Start with baseline
   - Gradually increase load
   - Find breaking point

5. **Document Findings**:
   - Save reports for comparison
   - Track performance over time
   - Note any degradation

## Scaling Recommendations

Based on load test results:

### Current Architecture (10-50 concurrent users)
- Single Next.js instance
- Prisma connection pool (10 connections)
- PostgreSQL database
- In-memory caching

### Scale to 50-100 users
- Increase Prisma connection pool to 20
- Add Redis for distributed caching
- Upgrade database (more CPU/RAM)
- Monitor OpenAI API rate limits

### Scale to 100-500 users
- Multiple Next.js instances (load balanced)
- Redis cluster for caching
- PostgreSQL read replicas
- Queue system for AI requests (Bull, BullMQ)
- CDN for static assets

### Scale to 500+ users
- Kubernetes/containerized deployment
- Horizontal pod autoscaling
- Database sharding/partitioning
- Separate AI processing cluster
- API gateway with rate limiting
- Monitoring and observability (Datadog, New Relic)

## Additional Resources

- [autocannon Documentation](https://github.com/mcollina/autocannon)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

## Troubleshooting

**Q: Tests fail with "Connection refused"**
A: Ensure application is running on http://localhost:3000

**Q: All requests return 401**
A: Session cookie expired or invalid. Check authentication.

**Q: Very slow resume generation**
A: OpenAI API may be slow. Check status at status.openai.com

**Q: Database connection errors**
A: Connection pool exhausted. Reduce concurrent connections or increase pool size.

**Q: Out of memory errors**
A: System under-resourced. Add more RAM or reduce load.

## Support

For issues or questions:
1. Check application logs
2. Review load test reports
3. Consult this documentation
4. Open GitHub issue with test results
