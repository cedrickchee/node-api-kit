const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Task = require('../src/models/task');
const {
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase,
} = require('./fixtures/db');

beforeEach(setupDatabase);

afterAll(async () => {
  await mongoose.connection.close();
});

test('Should create task for authenticated user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Task 1 from test',
    })
    .expect(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.description).toBe('Task 1 from test');
  expect(task.completed).toBe(false);
});

test('Should fetch user tasks', async () => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  // Assertion to check the number of tasks for a user
  expect(response.body.length).toBe(2); // can also use toEqual

  // Assertion to check if the completed property is set to false by default
  expect(response.body[0].completed).toBe(false);

  // Assertion to check if the task is updated in the database
  expect(response.body[0].description).toBe(taskOne.description);
});

test('Should not allow user to delete other users task', async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});
