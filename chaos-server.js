const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// 🛡️ V5 ENTERPRISE SECURITY LAYER
app.use(helmet()); 
app.use(cors());
app.use(express.json());

// 🛡️ Global Rate Limiter (Protects against DDoS / runaway traffic)
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, 
    message: { error: 'Chaos Proxy: Strict Rate Limit Exceeded' }
});
app.use(limiter);

// 📊 V4 OBSERVABILITY METRICS
let metrics = { passed: 0, dropped: 0, delayed: 0, mutatedReq: 0, mutatedRes: 0, overloaded: 0 };
let engineState = { masterEngaged: false, targetBaseUrl: 'http://localhost:5000' };

// 💾 V5 DATABASE PERSISTENCE LAYER
const DB_FILE = './chaos_database.json';
let chaosRules = [];

if (fs.existsSync(DB_FILE)) {
    try {
        chaosRules = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        console.log(`💾 Loaded ${chaosRules.length} rules from database.`);
    } catch (e) { console.error('Failed to load DB', e); }
}

function persistRules(rules) {
    fs.writeFileSync(DB_FILE, JSON.stringify(rules, null, 2));
}

// 🚦 V4 CONCURRENCY PROTECTION
const MAX_CONCURRENT_REQUESTS = 100;
let activeRequests = 0;

// 🔌 UI WEB-SOCKET CONNECTION
io.on('connection', (socket) => {
    console.log('⚡ UI Connected to V5 Enterprise Chaos Engine');
    
    socket.emit('metrics_sync', metrics);

    socket.on('update_engine', (newState) => { 
        engineState = { ...engineState, ...newState }; 
    });

    socket.on('update_rules', (newRules) => { 
        // 🛡️ V5 Sandbox Validation (Prevents bad Regex from crashing server)
        const safeRules = newRules.filter(rule => {
            try {
                new RegExp(rule.route);
                return true;
            } catch (e) {
                console.error(`🚨 Blocked invalid regex rule: ${rule.route}`);
                return false; 
            }
        });
        chaosRules = safeRules; 
        persistRules(chaosRules); // Save to File System
        console.log(`📋 Validated and Saved ${chaosRules.length} Chaos Rules`);
    });

    socket.on('reset_metrics', () => {
        metrics = { passed: 0, dropped: 0, delayed: 0, mutatedReq: 0, mutatedRes: 0, overloaded: 0 };
        io.emit('metrics_sync', metrics);
    });
});

// 🌪️ THE CHAOS ROUTER (Intercepts all traffic)
app.use(async (req, res) => {
    // Concurrency Circuit Breaker
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
        metrics.overloaded++;
        io.emit('metrics_sync', metrics);
        return res.status(429).json({ error: 'Chaos Proxy Overloaded (Circuit Breaker Tripped)' });
    }

    activeRequests++;
    const startTime = Date.now();
    res.on('finish', () => { activeRequests--; });

    if (!engineState.masterEngaged) {
        metrics.passed++;
        io.emit('metrics_sync', metrics);
        return forwardRequest(req, res, startTime, null, 'PASSED', '#34D399');
    }

    // 🧩 V4 RULE STACKING & COMPOSABILITY
    const sortedRules = [...chaosRules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    const matchingRules = sortedRules.filter(rule => 
        rule.active && 
        new RegExp(rule.route).test(req.url) &&
        (rule.method === 'ALL' || rule.method === req.method)
    );

    if (matchingRules.length === 0) {
        metrics.passed++;
        io.emit('metrics_sync', metrics);
        return forwardRequest(req, res, startTime, null, 'PASSED', '#34D399');
    }

    // Compose the chaos from multiple rules
    let combinedDropChance = 0;
    let totalLatency = 0;
    let willMutateReq = false;
    let willMutateRes = false;
    let primaryRuleName = matchingRules[0].route;

    matchingRules.forEach(rule => {
        combinedDropChance = Math.max(combinedDropChance, rule.errorRate || 0);
        totalLatency += (rule.latency || 0);
        if (rule.mutateReq) willMutateReq = true;
        if (rule.mutateRes) willMutateRes = true;
    });

    // Request Payload Mutation
    if (willMutateReq && req.body && Object.keys(req.body).length > 0) {
        req.body = intelligentDeepCorrupt(req.body);
        metrics.mutatedReq++;
        sendLogToUI(req, startTime, primaryRuleName, 'REQ MUTATED', 'WARNING', '#F59E0B');
    }

    // Apply Drops/Timeouts
    const roll = Math.random() * 100;
    if (roll < combinedDropChance) {
        metrics.dropped++;
        io.emit('metrics_sync', metrics);
        if (Math.random() > 0.5) {
            sendLogToUI(req, startTime, primaryRuleName, 'DROPPED', '502 BAD GATEWAY', '#F87171');
            return res.status(502).json({ error: 'Chaos Proxy: Stacked rule drop' });
        } else {
            sendLogToUI(req, startTime, primaryRuleName, 'TIMEOUT', 'NO RESPONSE', '#F87171');
            return; 
        }
    }

    // Apply Latency
    if (totalLatency > 0) {
        metrics.delayed++;
        io.emit('metrics_sync', metrics);
        const jitter = Math.floor(Math.random() * 200) - 100;
        const finalDelay = Math.max(0, totalLatency + jitter);
        
        setTimeout(() => {
            forwardRequest(req, res, startTime, primaryRuleName, 'DELAYED', '#FBBF24', willMutateRes);
        }, finalDelay);
        return;
    }

    metrics.passed++;
    io.emit('metrics_sync', metrics);
    forwardRequest(req, res, startTime, primaryRuleName, 'PASSED', '#34D399', willMutateRes);
});

// 🧬 V4 DEEP RECURSIVE MUTATION ALGORITHM
function intelligentDeepCorrupt(data, depth = 0) {
    if (depth > 4) return data; 
    
    if (Array.isArray(data)) {
        if (data.length === 0) return data;
        let mutatedArray = [...data];
        const idx = Math.floor(Math.random() * mutatedArray.length);
        if (Math.random() > 0.5) mutatedArray.splice(idx, 1);
        else mutatedArray[idx] = intelligentDeepCorrupt(mutatedArray[idx], depth + 1);
        return mutatedArray;
    }
    
    if (typeof data === 'object' && data !== null) {
        let mutated = { ...data };
        const keys = Object.keys(mutated);
        if (keys.length === 0) return mutated;
        
        const key = keys[Math.floor(Math.random() * keys.length)];
        const mutationType = Math.floor(Math.random() * 4);
        
        if (mutationType === 0) delete mutated[key]; 
        else if (mutationType === 1) mutated[key] = null; 
        else if (mutationType === 2) mutated[key] = typeof mutated[key] === 'number' ? String(mutated[key]) : 9999; 
        else mutated[key] = intelligentDeepCorrupt(mutated[key], depth + 1); 
        
        return mutated;
    }
    return data;
}

// 📡 TELEMETRY
function sendLogToUI(req, startTime, ruleName, type, status, color) {
    io.emit('chaos_log', {
        id: Math.random().toString(36).substr(2, 6).toUpperCase(),
        timestamp: new Date().toISOString().split('T')[1].slice(0, -1),
        method: req.method,
        route: req.url,
        ruleTriggered: ruleName || 'None',
        latency: Date.now() - startTime,
        type: type,
        status: status,
        color: color
    });
}

// 🌐 LIVE FORWARDING
async function forwardRequest(req, res, startTime, ruleName, type, color, willMutateRes = false) {
    try {
        const backendURL = `${engineState.targetBaseUrl}${req.url}`;
        const forwardHeaders = { ...req.headers };
        delete forwardHeaders.host; 

        const response = await axios({
            method: req.method,
            url: backendURL,
            headers: forwardHeaders,
            data: Object.keys(req.body || {}).length ? req.body : undefined,
            validateStatus: () => true 
        });

        let finalData = response.data;
        let statusString = `${response.status} OK`;

        // Response Mutation
        if (willMutateRes && typeof finalData === 'object' && finalData !== null) {
            finalData = intelligentDeepCorrupt(finalData);
            metrics.mutatedRes++;
            io.emit('metrics_sync', metrics);
            type = 'RES MUTATED';
            color = '#A855F7'; 
            statusString = `${response.status} CORRUPTED`;
        }

        sendLogToUI(req, startTime, ruleName, type, statusString, color);
        res.status(response.status).json(finalData);

    } catch (error) {
        metrics.dropped++;
        io.emit('metrics_sync', metrics);
        const status = error.response ? error.response.status : 503;
        sendLogToUI(req, startTime, ruleName, 'ERROR', `${status} TARGET DOWN`, '#F87171');
        res.status(status).json(error.response ? error.response.data : { error: 'Target URL unreachable' });
    }
}

server.listen(4005, () => console.log('🌪️ V5 Enterprise Chaos Engine running on port 4005'));