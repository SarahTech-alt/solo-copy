const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

const fileUpload = require('express-fileupload');
app.use(fileUpload());

const sessionMiddleware = require('./modules/session-middleware');
const passport = require('./strategies/user.strategy');

// Route includes
const userRouter = require('./routes/user.router');
const profileRouter = require('./routes/profile.router');
const mushroomRouter = require('./routes/mushroom.router');
const mushroomPictureRouter = require('./routes/mushroom.picture.router');

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Passport Session Configuration //
app.use(sessionMiddleware);

// start up passport sessions
app.use(passport.initialize());
app.use(passport.session());

/* Routes */
app.use('/api/user', userRouter);
app.use('/api/profile', profileRouter);
app.use('/api/mushroom', mushroomRouter);
app.use('/api/log/photo', mushroomPictureRouter);

// Serve static files
app.use(express.static('build'));

// App Set //
const PORT = process.env.PORT || 5000;

/** Listen * */
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
