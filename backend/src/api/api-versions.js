const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

// 🟢 V1: The Healthy Production API
app.get('/api/v1/user-profile', (req, res) => {
    res.json({
  "system": {
    "env": "production",
    "region": "ap-south-1",
    "cluster_node": "node-v4-final",
    "load_balancer": {
      "id": "lb-99201",
      "active": true,
      "traffic_weight": 100
    }
  },
  "auth_config": {
    "method": "OAUTH2",
    "expiry_seconds": 3600,
    "scopes": ["user.read", "user.write", "admin.access", "billing.view"],
    "mfa_required": true
  },
  "user_payload": {
    "account_info": {
      "uid": "uuid-882-991",
      "display_name": "Sathvik_Developer",
      "email_verified": true,
      "created_at": "2024-01-15T10:00:00Z"
    },
    "preferences": {
      "interface": {
        "theme": "dark",
        "font_size": 14,
        "compact_mode": false
      },
      "notifications": {
        "email": true,
        "push": true,
        "sms": false,
        "frequency": "INSTANT"
      }
    },
    "activity_logs": [
      { "id": 1, "action": "LOGIN", "status": "SUCCESS", "ip": "192.168.1.1" },
      { "id": 2, "action": "UPDATE_PROFILE", "status": "SUCCESS", "ip": "192.168.1.1" },
      { "id": 3, "action": "EXPORT_DATA", "status": "PENDING", "ip": "192.168.1.5" }
    ]
  },
  "analytics_data": {
    "session_id": "sess-992-001",
    "metrics": {
      "cpu_usage": 12.5,
      "memory_mb": 512,
      "latency_ms": 45
    },
    "history": [
      { "day": "Monday", "visits": 1200 },
      { "day": "Tuesday", "visits": 1450 },
      { "day": "Wednesday", "visits": 1100 },
      { "day": "Thursday", "visits": 1600 },
      { "day": "Friday", "visits": 2100 },
      { "day": "Saturday", "visits": 900 },
      { "day": "Sunday", "visits": 850 }
    ]
  },
  "footer_links": [
    { "label": "Terms", "url": "/terms" },
    { "label": "Privacy", "url": "/privacy" },
    { "label": "Support", "url": "/help" }
  ]
});
});

// 🔴 V2: The Buggy Update (userId is now a string, darkMode is missing)
app.get('/api/v2/user-profile', (req, res) => {
    res.json({
  "system": {
    "env": "production",
    "region": "ap-south-1",
    "cluster_node": "node-v5-beta",
    "load_balancer": {
      "id": "lb-99201",
      "active": "true",
      "traffic_weight": 85
    }
  },
  "auth_config": {
    "method": "OAUTH2",
    "expiry_seconds": "3600",
    "scopes": ["user.read", "user.write", "admin.access", "billing.view", "internal.debug"],
    "mfa_enabled": true
  },
  "user_payload": {
    "account_info": {
      "uid": "uuid-882-991",
      "display_name": "Sathvik_Developer",
      "email_verified": "YES",
      "created_at": "2024-01-16T11:00:00Z"
    },
    "preferences": {
      "interface": {
        "theme": "dark",
        "font_size": "14",
        "compact_mode": false
      },
      "notifications": {
        "email": true,
        "push": false,
        "sms": false
      }
    },
    "activity_logs": [
      { "id": 1, "action": "LOGIN", "status": "SUCCESS", "ip": "192.168.1.1" },
      { "id": 2, "action": "UPDATE_PROFILE", "status": "FAILURE", "ip": "192.168.1.1" },
      { "id": 3, "action": "EXPORT_DATA", "status": "PENDING", "ip": "192.168.1.5" },
      { "id": 4, "action": "LOGOUT", "status": "SUCCESS", "ip": "192.168.1.1" }
    ]
  },
  "analytics_data": {
    "session_id": "sess-992-001",
    "metrics": {
      "cpu_usage": 15.2,
      "memory_mb": 512,
      "latency_ms": 62
    },
    "history": [
      { "day": "Monday", "visits": 1200 },
      { "day": "Tuesday", "visits": 1450 },
      { "day": "Wednesday", "visits": 1100 },
      { "day": "Thursday", "visits": 1600 },
      { "day": "Friday", "visits": 2100 },
      { "day": "Saturday", "visits": 900 },
      { "day": "Sunday", "visits": 850 }
    ]
  },
  "footer_links": [
    { "label": "Terms", "url": "/terms" },
    { "label": "Privacy", "url": "/privacy" }
  ]
});
});

app.listen(5010, () => console.log('📡 API Version Simulator running on port 5010'));