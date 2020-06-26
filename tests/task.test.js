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

test('Should not create task with invalid completed field', async () => {
  await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      completed: taskOne.completed,
    })
    .expect(400);
});

test('Should not update task with invalid completed field', async () => {
  await request(app)
    .patch('/tasks/' + taskOne._id)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      completed: 'not yet',
    })
    .expect(400);

  const task = await Task.findById(taskOne._id);
  expect(task.completed).not.toBe('not yet');
});

test('Should be able to delete task for authenticated user', async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const task = await Task.findById(taskOne._id);
  expect(task).toBeNull();
});

test('Should not able to delete task if unauthenticated', async () => {
  await request(app).delete(`/tasks/${taskOne._id}`).send().expect(401);
});

test('Should not update other users task', async () => {
  await request(app)
    .patch('/tasks/' + taskTwo._id)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send({
      description: 'Change Test Task 2',
    })
    .expect(404);

  const task = await Task.findById(taskThree._id);
  expect(task.description).not.toBe('Change Test Task 3');
});
