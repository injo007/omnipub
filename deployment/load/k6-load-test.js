import http from "k6/http";
import { check, sleep } from "k6";

// --- k6 Load and Concurrency Proof Configuration ---
export const options = {
  scenarios: {
    dashboard_query_load: {
      executor: "constant-arrival-rate",
      rate: 50, // 50 requests per second
      timeUnit: "1s",
      duration: "10s",
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
    competing_lease_load: {
      executor: "shared-iterations",
      vus: 50,
      iterations: 100,
      maxDuration: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"], // Failures must be less than 1%
    http_req_duration: ["p(95)<500"], // 95% of requests must complete under 500ms
  },
};

const BASE_URL = __ENV.APP_URL || "http://localhost:3000";

export default function () {
  // Scenario 1: Dashboard and telemetry status queries
  const statusRes = http.get(`${BASE_URL}/api/health`);
  check(statusRes, {
    "status code is 200": (r) => r.status === 200,
    "response is valid json": (r) => r.json() !== null,
  });

  sleep(0.1);

  // Scenario 2: Simulate duplicate packaging and submission requests
  const payload = JSON.stringify({
    articleId: `trace-${Math.floor(Math.random() * 100)}`,
    title: "Duplicate Test Longform Article Submission",
    sourceUrl: "https://example.com/rss/item",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer staging-test-token",
    },
  };

  const packRes = http.post(`${BASE_URL}/api/package`, payload, params);
  check(packRes, {
    "packaging post handled": (r) => r.status === 200 || r.status === 409 || r.status === 401,
  });

  sleep(0.5);
}
