#!/usr/bin/env node

/**
 * Load Test: Resume Generation Endpoint
 * 
 * Tests the /api/resumes/generate endpoint under various load conditions.
 * This is the most critical endpoint as it involves:
 * - AI API calls (OpenAI)
 * - Database operations
 * - Complex workflow execution
 * 
 * Usage:
 *   npm run load-test:generate
 * 
 * Prerequisites:
 *   1. Application running on http://localhost:3000
 *   2. Test user registered with credentials in .env.test
 *   3. OpenAI API key configured for test user
 */

const autocannon = require('autocannon');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'loadtest@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'LoadTest123!';

// Test scenarios
const SCENARIOS = {
  // Scenario 1: Baseline - Single user
  baseline: {
    name: 'Baseline (1 concurrent user)',
    connections: 1,
    duration: 30, // 30 seconds
    pipelining: 1,
  },
  // Scenario 2: Light load - Small team
  light: {
    name: 'Light Load (10 concurrent users)',
    connections: 10,
    duration: 60,
    pipelining: 1,
  },
  // Scenario 3: Medium load - Growing startup
  medium: {
    name: 'Medium Load (50 concurrent users)',
    connections: 50,
    duration: 60,
    pipelining: 1,
  },
  // Scenario 4: Heavy load - Scale test
  heavy: {
    name: 'Heavy Load (100 concurrent users)',
    connections: 100,
    duration: 60,
    pipelining: 1,
  },
  // Scenario 5: Rate limit test
  rateLimit: {
    name: 'Rate Limit Test (burst)',
    connections: 20,
    duration: 20,
    pipelining: 1,
  },
};

// Sample job descriptions for testing
const JOB_DESCRIPTIONS = [
  {
    jobDescription: 'We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and PostgreSQL. Strong problem-solving skills and ability to work in a fast-paced environment.',
    companyName: 'Tech Corp',
    jobTitle: 'Senior Software Engineer',
  },
  {
    jobDescription: 'Full Stack Developer needed for startup. Experience with JavaScript, TypeScript, Next.js, and cloud platforms required.',
    companyName: 'Startup Inc',
    jobTitle: 'Full Stack Developer',
  },
  {
    jobDescription: 'Backend Engineer position. Must have experience with microservices, Docker, Kubernetes, and RESTful APIs.',
    companyName: 'Enterprise Solutions',
    jobTitle: 'Backend Engineer',
  },
];

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  scenarios: {},
};

/**
 * Get session cookie by logging in
 */
async function getSessionCookie() {
  console.log('🔐 Authenticating test user...');
  
  const response = await fetch(`${TEST_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('Failed to get session cookie');
  }

  console.log('✅ Authentication successful');
  return cookies.split(';')[0]; // Get first cookie
}

/**
 * Run a single load test scenario
 */
function runScenario(scenarioKey, sessionCookie) {
  const scenario = SCENARIOS[scenarioKey];
  
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Starting: ${scenario.name}`);
    console.log(`   Connections: ${scenario.connections}`);
    console.log(`   Duration: ${scenario.duration}s`);
    console.log(`${'='.repeat(60)}\n`);

    let requestCount = 0;

    const instance = autocannon({
      url: `${TEST_URL}/api/resumes/generate`,
      connections: scenario.connections,
      duration: scenario.duration,
      pipelining: scenario.pipelining,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
      },
      setupClient: (client) => {
        client.on('response', () => {
          requestCount++;
          if (requestCount % 10 === 0) {
            process.stdout.write(`\r   Requests sent: ${requestCount}`);
          }
        });
      },
      // Rotate through different job descriptions
      requests: [
        {
          method: 'POST',
          path: '/api/resumes/generate',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie,
          },
          body: JSON.stringify(JOB_DESCRIPTIONS[0]),
        },
        {
          method: 'POST',
          path: '/api/resumes/generate',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie,
          },
          body: JSON.stringify(JOB_DESCRIPTIONS[1]),
        },
        {
          method: 'POST',
          path: '/api/resumes/generate',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie,
          },
          body: JSON.stringify(JOB_DESCRIPTIONS[2]),
        },
      ],
    }, (err, result) => {
      if (err) {
        console.error(`\n❌ Error in scenario ${scenarioKey}:`, err);
        reject(err);
        return;
      }

      console.log(`\n\n✅ Scenario complete: ${scenario.name}\n`);
      printResults(result);
      
      // Store results
      results.scenarios[scenarioKey] = {
        name: scenario.name,
        ...result,
      };

      resolve(result);
    });

    // Handle early termination
    process.on('SIGINT', () => {
      console.log('\n\n⚠️  Load test interrupted by user');
      instance.stop();
      reject(new Error('Interrupted by user'));
    });
  });
}

/**
 * Print scenario results
 */
function printResults(result) {
  console.log('📊 Results Summary:');
  console.log(`   Total requests: ${result.requests.total}`);
  console.log(`   Requests/sec: ${result.requests.average.toFixed(2)}`);
  console.log(`   Throughput: ${(result.throughput.average / 1024).toFixed(2)} KB/s`);
  console.log(`\n⏱️  Latency:`);
  console.log(`   Mean: ${result.latency.mean.toFixed(2)}ms`);
  console.log(`   p50: ${result.latency.p50.toFixed(2)}ms`);
  console.log(`   p95: ${result.latency.p95.toFixed(2)}ms`);
  console.log(`   p99: ${result.latency.p99.toFixed(2)}ms`);
  console.log(`   Max: ${result.latency.max.toFixed(2)}ms`);
  console.log(`\n📈 Status Codes:`);
  Object.entries(result.statusCodeStats).forEach(([code, count]) => {
    const emoji = code.startsWith('2') ? '✅' : code === '429' ? '⚠️' : '❌';
    console.log(`   ${emoji} ${code}: ${count}`);
  });
  console.log(`\n❌ Errors: ${result.errors}`);
  console.log(`⏰ Timeouts: ${result.timeouts}`);
}

/**
 * Generate HTML report
 */
function generateReport() {
  const reportDir = path.join(__dirname, '../load-test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `resume-generation-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(`\n📄 Full report saved to: ${reportPath}`);

  // Generate summary report
  const summaryPath = path.join(reportDir, 'LATEST_SUMMARY.md');
  let summary = `# Load Test Report: Resume Generation\n\n`;
  summary += `**Date**: ${new Date(results.timestamp).toLocaleString()}\n`;
  summary += `**Endpoint**: POST /api/resumes/generate\n`;
  summary += `**Test URL**: ${TEST_URL}\n\n`;
  summary += `## Results Summary\n\n`;

  Object.entries(results.scenarios).forEach(([key, scenario]) => {
    summary += `### ${scenario.name}\n\n`;
    summary += `- **Total Requests**: ${scenario.requests.total}\n`;
    summary += `- **Requests/sec**: ${scenario.requests.average.toFixed(2)}\n`;
    summary += `- **Throughput**: ${(scenario.throughput.average / 1024).toFixed(2)} KB/s\n`;
    summary += `- **Latency (mean)**: ${scenario.latency.mean.toFixed(2)}ms\n`;
    summary += `- **Latency (p95)**: ${scenario.latency.p95.toFixed(2)}ms\n`;
    summary += `- **Latency (p99)**: ${scenario.latency.p99.toFixed(2)}ms\n`;
    summary += `- **Errors**: ${scenario.errors}\n`;
    summary += `- **Timeouts**: ${scenario.timeouts}\n`;
    summary += `\n**Status Codes**:\n`;
    Object.entries(scenario.statusCodeStats).forEach(([code, count]) => {
      summary += `- ${code}: ${count}\n`;
    });
    summary += `\n`;
  });

  summary += `## Analysis\n\n`;
  summary += `- **Rate Limiting**: Check for 429 status codes\n`;
  summary += `- **Performance Degradation**: Compare p95 latency across scenarios\n`;
  summary += `- **Error Rate**: Errors should be < 1% under normal load\n`;
  summary += `- **Throughput**: Should scale linearly with connections (up to limits)\n`;

  fs.writeFileSync(summaryPath, summary);
  console.log(`📄 Summary report saved to: ${summaryPath}`);
}

/**
 * Main test runner
 */
async function main() {
  console.log('🔥 Resume Generation Load Test\n');
  console.log(`📍 Target: ${TEST_URL}`);
  console.log(`👤 Test User: ${TEST_EMAIL}\n`);

  try {
    // Get session cookie
    const sessionCookie = await getSessionCookie();

    // Get scenario from command line or run all
    const scenarioArg = process.argv[2];
    const scenariosToRun = scenarioArg && SCENARIOS[scenarioArg]
      ? [scenarioArg]
      : Object.keys(SCENARIOS);

    console.log(`\n📋 Running ${scenariosToRun.length} scenario(s)...\n`);

    // Run scenarios sequentially
    for (const scenarioKey of scenariosToRun) {
      await runScenario(scenarioKey, sessionCookie);
      
      // Wait between scenarios to allow system to stabilize
      if (scenariosToRun.length > 1) {
        console.log('\n⏳ Waiting 10s before next scenario...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // Generate report
    generateReport();

    console.log('\n✅ Load testing complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Load test failed:', error);
    process.exit(1);
  }
}

// Run main function
main();
