import rnd from 'crypto-random-string';
import session from 'express-session';
import memorystore from 'memorystore';

const sessionLen = 5 * 60 * 1000;
const MemoryStore = memorystore(session);

export default session({
  name: 'qa',
  cookie: {
    maxAge: sessionLen,
    // TODO: To preprend configurable base path.
    path: '/qlik',
  },
  store: new MemoryStore({
    checkPeriod: sessionLen,
  }),
  secret: rnd({ length: 10 }),
  saveUninitialized: false,
  resave: false,
});
