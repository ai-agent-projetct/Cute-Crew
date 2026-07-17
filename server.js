const app = require('./backend/src/app');
const config = require('./backend/src/config');

app.listen(config.port, () => {
  console.log(`Cute Crew running at http://localhost:${config.port}`);
  console.log(`Admin panel:            http://localhost:${config.port}/admin.html  (admin / admin123)`);
});
