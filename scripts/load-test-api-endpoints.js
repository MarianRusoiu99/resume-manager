#!/usr/bin/env node

/**
 * Load Test: General API Endpoints
 * 
 * Tests various API endpoints to establish performance baselines.
 * Focuses on read-heavy operations that are critical for user experience.
 * 
 * Usage:
 *   npm run load-test:api
 * 
 * Prerequisites:
 *   1. Application running on http://localhost:3000
 *   2. Test user registered and authenticated
 *   3. Test data seeded (profile, resumes, templates)
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test scenarios for different endpoints
const ENDPOINT_TESTS = {
  // Public endpoint - no auth required
  templates: {
    name: 'GET /api/templates (Public)',
    url: `${TEST_URL}/api/templates`,
    method: 'GET',
    connections: 50,
    duration: 30,
    headers: {
      'Content-Type': 'application/json',
    },
  },
  
  // Template by ID - no auth required
  templateDetail: {
    name: 'GET /api/templates/[id] (Public)',
    url: `${TEST_URL}/api/templates/1`, // Assuming template ID 1 exists
    method: 'GET',
    connections: 50,
    duration: 30,
    headers: {
      'Content-Type': 'application/json',
    },
  },
};

const results = {
  timestamp: new Date().toISOString(),
  tests: {},
};

/**
 * Run load test for an endpoint
 */
function runEndpointTest(testKey) {
  const test = ENDPOINT_TESTS[testKey];
  
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Connections: ${test.connections}`);
    console.log(`   Duration: ${test.duration}s`);
    console.log(`${'='.repeat(60)}\n`);

    let requestCount = 0;

    const instance = autocannon({
      url: test.url,
      method: test.method,
      connections: test.connections,
      duration: test.duration,
      headers: test.headers,
      setupClient: (client) => {
        client.on('response', () => {
          requestCount++;
          if (requestCount % 100 === 0) {
            process.stdout.write(`\r   Requests sent: ${requestCount}`);
          }
        });
      },
    }, (err, result) => {
      if (err) {
        console.error(`\n❌ Error testing ${testKey}:`, err);
        reject(err);
        return;
      }

      console.log(`\n\n✅ Test complete: ${test.name}\n`);
      printResults(result);
      
      results.tests[testKey] = {
        name: test.name,
        ...result,
      };

      resolve(result);
    });

    process.on('SIGINT', () => {
      console.log('\n\n⚠️  Load test interrupted');
      instance.stop();
      reject(new Error('Interrupted'));
    });
  });
}

/**
 * Print test results
 */
function printResults(result) {
  console.log('📊 Results:');
  console.log(`   Total requests: ${result.requests.total}`);
  console.log(`   Requests/sec: ${result.requests.average.toFixed(2)}`);
  console.log(`   Throughput: ${(result.throughput.average / 1024).toFixed(2)} KB/s`);
  console.log(`\n⏱️  Latency:`);
  console.log(`   Mean: ${result.latency.mean.toFixed(2)}ms`);
  console.log(`   p50: ${result.latency.p50.toFixed(2)}ms`);
  console.log(`   p95: ${result.latency.p95.toFixed(2)}ms`);
  console.log(`   p99: ${result.latency.p99.toFixed(2)}ms`);
  console.log(`\n📈 Status Codes:`);
  Object.entries(result.statusCodeStats).forEach(([code, count]) => {
    const emoji = code.startsWith('2') ? '✅' : '❌';
    console.log(`   ${emoji} ${code}: ${count}`);
  });
  console.log(`\n❌ Errors: ${result.errors}`);
}

/**
 * Generate report
 */
function generateReport() {
  const reportDir = path.join(__dirname, '../load-test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `api-endpoints-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(`\n📄 Report saved: ${reportPath}`);
}

/**
 * Main runner
 */
async function main() {
  console.log('🔥 API Endpoints Load Test\n');
  console.log(`📍 Target: ${TEST_URL}\n`);

  try {
    const testsToRun = Object.keys(ENDPOINT_TESTS);

    for (const testKey of testsToRun) {
      await runEndpointTest(testKey);
      
      if (testsToRun.length > 1) {
        console.log('\n⏳ Waiting 5s...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    generateReport();
    console.log('\n✅ API load testing complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Load test failed:', error);
    process.exit(1);
  }
}

main();
