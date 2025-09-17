const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const storage = require('../models/storage');

const USERS_FILE = 'users.json';
const ACCOUNTS_FILE = 'accounts.json';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'name, email and password required' });
  const users = storage.read(USERS_FILE);
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'email exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, password: hash, createdAt: new Date().toISOString() };
  users.push(user);
  storage.write(USERS_FILE, users);
  // create account with zero balance
  const accounts = storage.read(ACCOUNTS_FILE);
  accounts.push({ id: uuidv4(), userId: user.id, balance: 0, currency: 'USD' });
  storage.write(ACCOUNTS_FILE, accounts);
  res.json({ message: 'user created', user: { id: user.id, name: user.name, email: user.email } });
});

// login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const users = storage.read(USERS_FILE);
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

module.exports = router;
