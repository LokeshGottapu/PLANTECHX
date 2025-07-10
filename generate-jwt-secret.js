const crypto = require('crypto');

// Generate a random string of 64 bytes (512 bits) and convert to hex
const secret = crypto.randomBytes(64).toString('hex');
console.log('Generated JWT Secret Key:');
console.log(secret); 