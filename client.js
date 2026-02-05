// client.js - This simulates the "User's App" running on Port 3000
const fastify = require('fastify')({ logger: false });

// This is the endpoint where we expect the webhook to arrive
fastify.post('/events', async (request, reply) => {
  console.log("---------------------------------");
  console.log("🚀 CLIENT APP RECEIVED DATA!");
  console.log("Data:", request.body);
  console.log("---------------------------------");
  return { status: 'success' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 }); // Running on a different port!
    console.log('Dummy Client App running on http://localhost:3000');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
start();