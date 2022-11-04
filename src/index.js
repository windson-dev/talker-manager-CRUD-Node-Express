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

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let index = 0; index < length; index += 1) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).send({ message: 'O campo "email" é obrigatório' });
  } 
  if (!password) {
    return res.status(400).send({ message: 'O campo "password" é obrigatório' });
  }
  if (password.length < 6) {
    return res.status(400).send({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }
  if (email !== 'email@email.com') {
    return res.status(400).send({ message: 'O "email" deve ter o formato "email@email.com"' });
  }
  return next();
}

app.post('/login/', validateLogin, (req, res) => {
    const { email, password } = req.body;
    const test = {
      email,
      password,
    };

    if (test) {
      return res.status(200).json({ token: makeid(16) });
    }
});
