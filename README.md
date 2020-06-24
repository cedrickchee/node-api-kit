# Node.js API Starter Kit

A simple starter kit to jumpstart your API services development project.

**Demo**

Send HTTP requests using cURL or [Postman](https://www.postman.com/) to [this API endpoint](https://ced-nodejs-course-task-mgr.herokuapp.com/).

## Development

### Local Development

- Install MongoDB 4.2+ Community Edition on your OS. [Tutorials](https://docs.mongodb.com/manual/installation/).

## Production Deployment

We are using Heroku for web hosting. So, [install and setup Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) on your OS.

Next, for the database, we will host MongoDB in the Cloud with [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Atlas is a managed database-as-a-service on AWS or Google Cloud and born out of mLab. So, go and register an account and set it up by following the instructions there.

Then, run these commands in your terminal:

- Create a new Heroku app

```sh
$ heroku create ced-nodejs-course-task-mgr
 ›   Warning: heroku update available from 7.42.0 to 7.42.1.
Creating ⬢ ced-nodejs-course-task-mgr... done
https://ced-nodejs-course-task-mgr.herokuapp.com/ | https://git.heroku.com/ced-nodejs-course-task-mgr.git
```

- Set Heroku config vars (environment variables)

Replace the following placeholders with your own configuration values.

```sh
$ heroku config:set \
JWT_SECRET=<insert your JWT secret>
MONGODB_URL='mongodb+srv://<insert your username>:<insert your password>@cluster0.lzk74.mongodb.net/task-manager-api?retryWrites=true&w=majority' \
SENDGRID_API_KEY=<insert your Sendgrid API key>
-a ced-nodejs-course-task-mgr
```

Finally, deploy to Heroku.

```sh
$ git push heroku master
```
