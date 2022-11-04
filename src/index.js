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

app.get('/talker', async (_req, res) => {
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
  const regexEmail = /^\S+@\S+\.\S+$/;
  if (!email) {
    return res.status(400).send({ message: 'O campo "email" é obrigatório' });
  } 
  if (!password) {
    return res.status(400).send({ message: 'O campo "password" é obrigatório' });
  }
  if (password.length < 6) {
    return res.status(400).send({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }
  if (!regexEmail.test(email)) {
    return res.status(400).send({ message: 'O "email" deve ter o formato "email@email.com"' });
  }
  return next();
}

app.post('/login', validateLogin, (req, res) => {
  try {
    const { email, password } = req.body;
    const test = {
      email,
      password,
    };

    if (test) {
      return res.status(200).json({ token: makeid(16) });
    }
  } catch (error) {
    return res.status(404).send({ message: error.message });
  }
});

function validateTalkerNameAge(req, res, next) {
  const { name, age } = req.body;

  if (!name) {
    return res.status(400).send({ message: 'O campo "name" é obrigatório' });
  } 
  if (name.length < 3) {
    return res.status(400).send({ message: 'O "name" deve ter pelo menos 3 caracteres' });
  } 
  if (!age) {
    return res.status(400).send({ message: 'O campo "age" é obrigatório' });
  } 
  if (age < 18) {
    return res.status(400).send({ message: 'A pessoa palestrante deve ser maior de idade' });
  }
  return next();
}

function validateTalkerTalk(req, res, next) {
  const { talk } = req.body;
  const regexDate = /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/;
  if (!talk) {
    return res.status(400).send({ message: 'O campo "talk" é obrigatório' });
  }
  if (!talk.watchedAt) {
    return res.status(400).send({ message: 'O campo "watchedAt" é obrigatório' });
  }

  if (!regexDate.test(talk.watchedAt)) {
    return res.status(400).send({ message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' });
  }
  if (talk.rate == null) {
    return res.status(400).send({ message: 'O campo "rate" é obrigatório' });
  }
  return next();
}

function validateTalkerRate(req, res, next) {
  const { talk } = req.body;

  if (!(talk.rate >= 1 && talk.rate <= 5 && talk.rate % 1 === 0)) {
    return res.status(400).send({ message: 'O campo "rate" deve ser um inteiro de 1 à 5' });
  }

  return next();
}

function isValidToken(req, res, next) {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).send({ message: 'Token não encontrado' });
  }
  if (authorization.length !== 16 || authorization instanceof String) {
    return res.status(401).send({ message: 'Token inválido' });
  }
  return next();
}

app.post('/talker', isValidToken, validateTalkerNameAge, 
  validateTalkerTalk, validateTalkerRate, async (req, res) => {
  try {
    const talkers = await readFile();
    const newTalker = {
      id: talkers[talkers.length - 1].id + 1,
      ...req.body,
    };
    const allTalkers = JSON.stringify([...talkers, newTalker]);
    await fs.writeFile(talkerPath, allTalkers);
    res.status(201).json(newTalker);
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

app.put('/talker/:id', isValidToken, 
  validateTalkerNameAge, validateTalkerTalk, validateTalkerRate, async (req, res) => {
    try {
      const { id } = req.params;
      const talkers = await readFile();
      const indexTalkers = talkers.findIndex((element) => element.id === Number(id));
      talkers[indexTalkers] = { id: Number(id), ...req.body };
      const updateTalker = JSON.stringify(talkers, null, 2);
      await fs.writeFile(talkerPath, updateTalker);
      res.status(200).json(talkers[indexTalkers]);
    } catch (error) {
      res.status(404).send({ message: error.message });
    }
});

app.delete('/talker/:id', isValidToken, async (req, res) => {
  try {
    const { id } = req.params;
    const talkers = await readFile();
    const filteredTalkers = talkers.filter((element) => element.id !== Number(id));
    const updateTalkers = JSON.stringify(filteredTalkers, null, 2);
    await fs.writeFile(talkerPath, updateTalkers);
    res.status(204).end();
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});
