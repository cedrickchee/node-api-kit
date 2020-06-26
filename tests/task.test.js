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

test('Should fetch user task by ID', async () => {
  // Assertion to fetch the user task
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.description).toBe(taskOne.description);
});

test('Should not able to fetch task by ID if unauthenticated', async () => {
  await request(app).get(`/tasks/${taskOne._id}`).send().expect(401);
});

test('Should not fetch other users task by ID', async () => {
  await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
});

test('Should fetch only completed task', async () => {
  const response = await request(app)
    .get(`/tasks?completed=true`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toBe(1);
});

test('Should fetch only incomplete task', async () => {
  const response = await request(app)
    .get(`/tasks?completed=false`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toBe(1);
});

describe('Test sorting', () => {
  test('Should sort task by description', async () => {
    const response = await request(app)
      .get(`/tasks?sortBy=description:desc`)
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send()
      .expect(200);

    expect(response.body[0].description).toBe(taskTwo.description);
  });

  test('Should sort task by createdAt', async () => {
    const response = await request(app)
      .get('/tasks?sortBy=createdAt:desc')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send()
      .expect(200);

    expect(response.body[0].description).toBe(taskTwo.description);
  });

  test('Shoud sort task by updateAt', async () => {
    // Updating the first task
    await Task.findByIdAndUpdate(taskOne._id, {
      description: 'Test Task 1 Again',
    });

    // Assertion to test sorting by updateAt in descending
    const response = await request(app)
      .get('/tasks?sortBy=updatedAt:desc')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send()
      .expect(200);

    expect(response.body[0].description).toBe('Test Task 1 Again');
  });
});

test('Shoud fetch pages of tasks', async () => {
  const response = await request(app)
    .get('/tasks?limit=1')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toBe(1);
});
