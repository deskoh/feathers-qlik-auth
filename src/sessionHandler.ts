import rnd from 'crypto-random-string';
import session from 'express-session';
import memorystore from 'memorystore';
import ms from 'ms';

const sessionLen = ms(process.env.SESSION_EXPIRY || '5m');
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
