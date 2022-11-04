const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});

const talkerPath = path.resolve(__dirname, './talker.json');

async function readFile() {
  try {
    const data = await fs.readFile(talkerPath);
    return JSON.parse(data);
  } catch (error) {
    console.error(`file not found ${error}`);
  }
}

app.get('/talker/', async (_req, res) => {
  try {
    const talkers = await readFile();
    res.status(200).json(talkers);
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

app.get('/talker/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const talkers = await readFile();
    const talkersIndex = talkers.find((element) => element.id === Number(id));
    if (!talkersIndex) {
      return res.status(404).send({ message: 'Pessoa palestrante não encontrada' });
    }
    res.status(200).json({ ...talkersIndex });
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});
