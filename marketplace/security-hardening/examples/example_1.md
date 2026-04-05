# Example: Securing a New Express.js API

## Task
Apply security hardening to a Node.js/Express API before production launch.

## Before (Insecure)
```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
  if (user && user.password === password) {
    const token = jwt.sign({ id: user.id }, 'my-secret', { algorithm: 'HS256' });
    res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});
```

Problems: SQL injection, plaintext password comparison, HS256 with hardcoded secret, no rate limiting, no CORS, no security headers.

## After (Hardened)
```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const fs = require('fs');

const app = express();

// Security headers
app.use(helmet());

// CORS — specific origins only
app.use(cors({
  origin: ['https://myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

// Rate limit auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { type: 'rate-limit', title: 'Too Many Requests', status: 429 }
});

const PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH);

app.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 128 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  // Parameterized query — no SQL injection
  const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

  if (!user) {
    return res.status(401).json({ title: 'Invalid credentials' });
  }

  // bcrypt comparison — constant-time, handles hashed passwords
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ title: 'Invalid credentials' });
  }

  // RS256 with private key, short expiry
  const token = jwt.sign(
    { sub: user.id, aud: 'myapp-api', iss: 'myapp' },
    PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: '15m' }
  );

  // Set refresh token as httpOnly cookie
  res.cookie('refresh_token', generateRefreshToken(user.id), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ access_token: token });
});
```

## What Changed
1. **helmet()** adds security headers (CSP, HSTS, X-Frame-Options, etc.)
2. **CORS** restricted to specific origin with credentials
3. **Rate limiting** on auth endpoint (5 attempts per 15 min)
4. **Input validation** with express-validator
5. **Parameterized query** prevents SQL injection
6. **bcrypt.compare()** instead of plaintext comparison
7. **RS256** instead of HS256 with hardcoded secret
8. **15-minute token expiry** with refresh token in httpOnly cookie
9. **Request body size limit** (10kb) prevents payload attacks
