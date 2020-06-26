const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

afterAll(async () => {
  await mongoose.connection.close();
});

test('Should signup a new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Belinda Ling',
      email: 'belinda@foo.bar',
      password: 'hello!123',
    })
    .expect(201);

  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'Belinda Ling',
      email: 'belinda@foo.bar',
    },
    token: user.tokens[0].token,
  });
  expect(user.password).not.toBe('hello!123');
});

test('Should login existing user', async () => {
  const response = await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  // Validate new token is saved
  // 1. Fetch the user from the database
  // 2. Assert that token in response matches user's second token
  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login nonexisting user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: 'this-is-not-my-password',
    })
    .expect(400);
});

test('Should get profile for authenticated user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
  await request(app).get('/users/me').send().expect(401);
});

test('Should delete account for authenticated user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  // Validate user is removed
  // 1. Fetch the user from the database
  // 2. Assert null response
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
  await request(app).delete('/users/me').send().expect(401);
});

test('Should upload profile picture', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: 'Jane Li',
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.name).toEqual('Jane Li');
});

test('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: 'Bali',
    })
    .expect(400);
});

describe('Test bad signup', () => {
  test('Should not signup user with invalid name', async () => {
    await request(app)
      .post('/users')
      .send({
        name: '',
        email: 'john@foo.bar',
        password: 'my0sompass',
      })
      .expect(400);
  });

  test('Should not signup user with invalid email', async () => {
    await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@foo',
        password: 'my0sompass',
      })
      .expect(400);
  });

  test('Should not signup user with invalid password', async () => {
    await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        emial: 'john@foo.bar',
        password: 'ps12',
      })
      .expect(400);
  });
});

test('Should not update user if unauthenticated', async () => {
  await request(app)
    .patch('/users/me')
    .send({
      name: 'Some User',
    })
    .expect(401);
});

describe('Test bad user update', () => {
  test('Should not update user with invalid email', async () => {
    const response = await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send({
        email: 'john@foo',
      })
      .expect(400);

    const user = await User.findById(userOneId);
    expect(user.email).not.toBe('john@foo');
  });

  test('Should not update user with invalid password', async () => {
    const response = await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send({
        password: 'ps12',
      })
      .expect(400);

    const user = await User.findById(userOneId);
    const samePass = await bcrypt.compare('ps12', user.password);
    expect(samePass).toBe(false);
  });
});
