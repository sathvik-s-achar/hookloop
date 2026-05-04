// test-traffic.js
// This simulates a user clicking "Checkout" over and over again.

const endpoints = ['/api/payments', '/api/users', '/api/payments/verify'];

setInterval(async () => {
    const target = endpoints[Math.floor(Math.random() * endpoints.length)];
    
    try {
        console.log(`Sending simulated request to ${target}...`);
        const response = await fetch(`http://localhost:4005${target}`);
        console.log(`Response: ${response.status}`);
    } catch (error) {
        console.log(`Request Failed (Chaos Engaged!): ${error.message}`);
    }
}, 1000);