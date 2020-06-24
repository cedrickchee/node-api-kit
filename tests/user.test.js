const request = require('supertest');
const app = require('../src/app');

test('Should signup a new user', async () => {
  await request(app).post('/users').send({
    name: 'Belinda Ling',
    email: 'belinda@foo.bar',
    password: 'hello!123',
  }).expect(201);
});
