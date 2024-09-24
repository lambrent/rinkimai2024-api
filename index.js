const express = require('express');
const cors = require('cors');

require('dotenv').config();

const controllers = require('./controllers/index.js');
const { update } = require('./utils/updateDatabases');

const port = 8080;

const app = express();
app.use(cors({ origin: '*' }));

try {
  update();
} catch (e) {
  console.error(e);
}

app.get('/', (req, res) => {
  res.send('Welcome, Rinkimai2023 API is alive!');
});

app.get('/:platform/pick', controllers.pick);
app.get('/:platform/debates', controllers.debates);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
