const { program } = require('commander');
const express = require('express');
const fs = require('fs');
const path = require('path');

program
  .requiredOption('-h, --host <type>', 'адреса сервера')
  .requiredOption('-p, --port <type>', 'порт сервера')
  .requiredOption('-c, --cache <type>', 'шлях до директорії кешу');

program.parse(process.argv);

const options = program.opts();

const HOST = options.host;
const PORT = parseInt(options.port, 10);
const CACHE_DIR = path.resolve(options.cache);

if (!fs.existsSync(CACHE_DIR))
{
  console.log(`Cache directory not found. Creating: ${CACHE_DIR}`);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
} 
else 
{
  console.log(`Using existing cache directory: ${CACHE_DIR}`);
}

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const multer = require('multer');

const upload = multer({ dest: CACHE_DIR });

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

let inventory = [];
let nextId = 1;

app.post('/register', upload.single('photo'), (req, res) => {
  const { inventory_name, description } = req.body;
  const photo = req.file; 

  if (!inventory_name) 
  {
    return res.status(400).send('Bad Request: inventory_name is required.');
  }

  const newItem = 
  {
    id: nextId++,
    name: inventory_name,
    description: description || '',
    photo: photo ? path.resolve(photo.path) : null 
  };

  inventory.push(newItem);
  console.log('New item registered:', newItem);
  res.status(201).json(newItem);
});

app.get('/inventory', (req, res) => {
  const inventoryWithLinks = inventory.map(item => ({
    ...item,
    photo_url: item.photo ? `/inventory/${item.id}/photo` : null
  }));
  res.status(200).json(inventoryWithLinks);
});

app.get('/inventory/:id', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const item = inventory.find(i => i.id === itemId);

  if (!item) {
    return res.status(404).send('Not Found');
  }

  const itemWithLink = {
    ...item,
    photo_url: item.photo ? `/inventory/${item.id}/photo` : null
  };
  res.status(200).json(itemWithLink);
});

app.put('/inventory/:id', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const item = inventory.find(i => i.id === itemId);

  if (!item) 
  {
    return res.status(404).send('Not Found');
  }
  if (req.body.name) 
  {
    item.name = req.body.name;
  }
  if (req.body.description) 
  {
    item.description = req.body.description;
  }

  res.status(200).json(item);
});

app.get('/inventory/:id/photo', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const item = inventory.find(i => i.id === itemId);

  if (!item || !item.photo || !fs.existsSync(item.photo)) 
  {
    return res.status(404).send('Not Found');
  }
  res.setHeader('Content-Type', 'image/jpeg');
  res.sendFile(item.photo); 
});

app.put('/inventory/:id/photo', upload.single('photo'), (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const item = inventory.find(i => i.id === itemId);

  if (!item) 
  {
    return res.status(404).send('Not Found');
  }

  if (req.file) 
  {
    if (item.photo && fs.existsSync(item.photo)) 
    {
      fs.unlinkSync(item.photo);
    }
    item.photo = path.resolve(req.file.path); 
    res.status(200).send('Photo updated successfully.');
  } 
  else 
  {
    res.status(400).send('Bad Request: No photo file provided.');
  }
});

app.delete('/inventory/:id', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const itemIndex = inventory.findIndex(i => i.id === itemId);

  if (itemIndex === -1) 
  {
    return res.status(404).send('Not Found');
  }

  const [deletedItem] = inventory.splice(itemIndex, 1);

  if (deletedItem.photo && fs.existsSync(deletedItem.photo)) 
  {
    fs.unlinkSync(deletedItem.photo);
  }
  
  res.status(200).send('Item deleted successfully.');
});

app.get('/search', (req, res) => {
  const { id, includePhoto } = req.query; // 'includePhoto' - з вашого HTML
  const itemId = parseInt(id, 10);
  const item = inventory.find(i => i.id === itemId);

  if (!item) 
  {
    return res.status(404).send('Not Found');
  }

  const result = { ...item }; 
  
  if (includePhoto === 'on' && result.photo) 
  {
    result.description += ` [Photo Link: /inventory/${result.id}/photo]`;
  }

  res.status(200).json(result);
});

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Access registration form at http://${HOST}:${PORT}/RegisterForm.html`);
  console.log(`Access search form at http://${HOST}:${PORT}/SearchForm.html`);
});