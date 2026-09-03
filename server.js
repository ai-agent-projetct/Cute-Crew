require('dotenv').config();          // load DB credentials from .env
const app = require('./backend/src/app');
const config = require('./backend/src/config');
const schema = require('./backend/src/utils/schema');

schema.init()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Cute Crew running at http://localhost:${config.port}`);
      console.log(`Admin panel:            http://localhost:${config.port}/admin.html  (admin / admin123)`);
    });
  })
  .catch((err) => {
    console.error('❌ Could not connect to the database:', err.message);
    process.exit(1);
  });
