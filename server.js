var express = require('express'),
    fs      = require('fs'),
    cp      = require('child_process'),
    cors    = require('cors'),
    app     = express();

function sort(object) {
  var result = {};

  for(var i = 0; i < Object.keys(object).length; i++) {
    if(object[i] == undefined) {
      result[i] = object[i+1];
      object[i+1] = undefined;
    } else {
      result[i] = object[i];
    }
  }

  return result;
}

////////////////////////////////

app.use(cors());
app.options('*', cors());

console.log("== Started ==");

app.get('/', (req, res) => {
  console.log('');
  console.log("> Got '/'");
  res.send('Hello, World!');
});

app.get('/auth/in/:name/:pass', (req, res) => {
  console.log('');
  console.log("> Got '/auth/in/" + req.params.name + "/" + req.params.pass + "'");

  var data = JSON.parse(fs.readFileSync('./data/accounts.json', 'utf8'));

  for(var i = 0 ; i < Object.keys(data).length ; i++) {
    if(data[i] == undefined) continue;

    console.log('-> Check: ' + req.params.name + ' == ' + data[i].name);

    if(req.params.name == data[i].name) {
      console.log('--> True, check password: ' + req.params.pass + ' == ' + data[i].pass);

      if(req.params.pass == data[i].pass) {
        var acctype = (data[i].type == 0) ? 'u' : 'a';
        var token = Buffer.from("SC_TOKEN").toString('base64') + ':' + acctype;

        console.log('---> True, created token: ' + token);
        console.log('---> Returning token in json');
        res.end(JSON.stringify({code:1, tok: token}));
      } else {
        console.log('---> Password check failed, returning error');
        res.end(JSON.stringify({code:0, error:"Incorrect password"}));
      }
    }
  }

  res.end(JSON.stringify({code:0, error:"Unknown user"}));

  console.log('----------- END -----------');
});

app.get('/auth/edit/:nick/:type/:data/:token', (req, res) => {
  console.log('');
  var nick = req.params.nick,
      type = req.params.type,
      data = req.params.data,
      toke = req.params.token;
  console.log("> Got '/auth/edit/" + nick + '/' + type + '/' + data + '/' + toke + "'");

  var acc = JSON.parse(fs.readFileSync('./data/accounts.json', 'utf8'));

  if(toke[toke.length - 1] != 'a') {
    res.end(JSON.stringify({code:0, error:"Forbidden"}));
    console.log('-> Requested from user. Access denied');
    console.log('----------- END -----------');
    return;
  }

  switch (type) {
    case 'nick':
      console.log('-> Searching nick ' + nick);

      var ch = false;

      for(var i = 0 ; i < Object.keys(acc).length ; i++) {
        if(nick == acc[i].name) {
          console.log('--> Founded username ' + nick + ', changing');

          acc[i].name = data;
          console.log('--> Account changed, writing changes');

          fs.writeFileSync('./data/accounts.json', JSON.stringify(acc));
          console.log('---> Finished');

          ch = true;
          res.end(JSON.stringify({code:1}));
        }
      }

      if(!ch) {
        console.log('--> Nick not found');
        res.end(JSON.stringify({code:0, error:"Nick not found"}));
      }
      break;

    case 'password':
      console.log('-> Searching nick ' + nick);

      for(var i = 0 ; i < Object.keys(acc).length ; i++) {
        if(nick == acc[i].name) {
          console.log('--> Founded username ' + nick + ', changing password');

          acc[i].pass = data;
          console.log('--> Account changed, writing changes');

          fs.writeFileSync('./data/accounts.json', JSON.stringify(acc));
          console.log('---> Finished');

          res.end(JSON.stringify({code:1}));
        }
      }

      if(!ch) {
        console.log('--> Nick not found');
        res.end(JSON.stringify({code:0, error:"Nick not found"}));
      }
      break;

    default:
      console.log('-> Unknown edit type');
      break;
  }

  console.log('----------- END -----------');
});

app.get('/auth/add/:nick/:pass/:type/:token', (req, res) => {
  console.log('');
  var nick = req.params.nick,
      pass = req.params.pass,
      type = req.params.type,
      toke = req.params.token;

  console.log("> Got '/auth/add/" + nick + '/' + pass + '/' + type + '/' + toke + "'");

  if(toke[toke.length - 1] != 'a') {
    res.end(JSON.stringify({code:0, error:"Forbidden"}));
    console.log('-> Requested from a user. Access denied');
    console.log('----------- END -----------');
  }

  var acc = JSON.parse(fs.readFileSync('./data/accounts.json', 'utf8'));

  for(var i = 0 ; i < Object.keys(acc).length ; i++) {
    if(nick == acc[i].name) {
      res.end(JSON.stringify({code:0, error:"Already exists"}));
      console.log('-> Account already exists');
      console.log('----------- END -----------');
      return;
    }
  }

  acc[Object.keys(acc).length] = {
    name: nick,
    pass: pass,
    type: type
  }

  console.log('--> Account created, writing changes');

  fs.writeFileSync('./data/accounts.json', JSON.stringify(acc));
  console.log('---> Changes writed');

  res.end(JSON.stringify({code:1}));
  console.log('----------- END -----------');
});

app.get('/auth/remove/:nick/:token', (req, res) => {
  console.log('');
  var nick = req.params.nick,
      toke = req.params.token;

  console.log("> Got '/auth/remove/" + nick + "'");

  var acc = JSON.parse(fs.readFileSync('./data/accounts.json', 'utf8'));

  if(toke[toke.length - 1] != 'a') {
    res.end(JSON.stringify({code:0, error:"Forbidden"}));
    console.log('-> Requested from a user. Access denied');
    console.log('----------- END -----------');
  }

  console.log('-> Searching nickname ' + nick);

  for(var i = 0 ; i < Object.keys(acc).length ; i++) {
    if(nick == acc[i].name) {
      console.log('--> Founded, removing');
      delete acc[i];

      console.log('---> Removed, writing changes');

      var r = sort(acc);
      fs.writeFileSync('./data/accounts.json', JSON.stringify(r));

      res.end(JSON.stringify({code:1}));
      console.log('----------- END -----------');
      return;
    }
  }

  console.log('--> Not found');
  res.end(JSON.stringify({code:0, error:"Not found"}));
  console.log('----------- END -----------');
});

app.get('/product/list', (req, res) => {
  console.log('');
  console.log("> Got '/product/list'");

  var pr = JSON.parse(fs.readFileSync('./data/product.json', 'utf8'));
  var list = {};

  for(var i = 0 ; i < Object.keys(pr).length ; i++) {
    list[i] = {
      name: pr[i].name,
      desc: pr[i].desc
    }
    console.log('-> Added \'' + pr[i].name + '\' to list');
  }

  console.log('--> Finished, sending');
  res.end(JSON.stringify(list));
  console.log('----------- END -----------');
});

app.get('/product/add/:name/:desc', (req, res) => {
  console.log('');

  var name = req.params.name,
      desc = req.params.desc;

  console.log("> Got '/product/add/" + name + '/' + desc + "'");
  var pr = JSON.parse(fs.readFileSync('./data/product.json', 'utf8'));

  pr[Object.keys(pr).length] = {
    name: name,
    desc: desc
  }
  console.log('-> Product added, writing changes');

  fs.writeFileSync('./data/product.json', JSON.stringify(pr));
  console.log('--> Finished');

  res.end(JSON.stringify({code:1}));
  console.log('----------- END -----------');
});

app.get('/product/get/:id', (req, res) => {
  console.log('');

  var id = req.params.id;
  var pr = JSON.parse(fs.readFileSync('./data/product.json', 'utf8'));

  console.log("> Got '/product/get/" + id + "'");

  if(Object.keys(pr).length - 1 < id) {
    console.log('-> Unknown product id');
    res.end(JSON.stringify({code:0, error:"Unknown id"}));
    console.log('----------- END -----------');
    return;
  }

  console.log('--> Sending product info');

  res.end(JSON.stringify({code:1, name:pr[id].name, desc:pr[id].desc}));
  console.log('----------- END -----------');
});

app.get('/product/remove/:id', (req, res) => {
  console.log('');

  var id = req.params.id;
  var pr = JSON.parse(fs.readFileSync('./data/product.json', 'utf8'));

  console.log("> Got '/product/remove/" + id + "'");

  if(Object.keys(pr).length - 1 < id) {
    console.log('-> Unknown product id');
    res.end(JSON.stringify({code:0, error:"Unknown id"}));
    console.log('----------- END -----------');
    return;
  }

  console.log('-> Removing');
  delete pr[id];

  console.log('--> Removed, writing changes');

  var r = sort(pr);
  fs.writeFileSync('./data/product.json', JSON.stringify(r));

  console.log('---> Finished');

  res.end(JSON.stringify({code:1}));
  console.log('----------- END -----------');
});

app.get('/product/edit/:id/:type/:data', (req, res) => {
  console.log('');

  var id   = req.params.id,
      type = req.params.type,
      data = req.params.data;

  console.log("> Got '/product/edit/" + id + '/' + type + '/' + data + "'");

  var pr = JSON.parse(fs.readFileSync('./data/product.json', 'utf8'));

  if(Object.keys(pr).length - 1 < id) {
    console.log('-> Unknown product id');
    res.end(JSON.stringify({code:0, error:"Unknown product id"}));
    console.log('----------- END -----------');
    return;
  }

  switch (type) {
    case 'name':
      console.log('-> Changing name ' + pr[id].name + ' to ' + data);
      pr[id].name = data;

      console.log('--> Changed. Writing changes');
      fs.writeFileSync('./data/product.json', JSON.stringify(pr));

      console.log('---> Finished');
      res.end(JSON.stringify({code:1}));
      break;

    case 'desc':
      console.log('-> Changing description');
      pr[id].desc = data;

      console.log('--> Changed. Writing changes');
      fs.writeFileSync('./data/product.json', JSON.stringify(pr));

      console.log('---> Finished');
      res.end(JSON.stringify({code:1}));
      break;

    default:
      console.log('-> Requested unknown type of changes');
      res.end(JSON.stringify({code:0, error:"Unknown query"}));
  }

  console.log('----------- END -----------');
});

////////////////////////////////////////
app.get('/control/:cmd', (req, res) => {
  console.log('');
  console.log("> Got '/control/" + req.params.cmd + "'");

  switch (req.params.cmd) {
    case 'stop':
      console.log('-> Requested stop command');
      res.end(JSON.stringify({code:1}))
      server.close();
      console.log('----------- END -----------');
      break;

    default:
      console.log('-> Requested unknown command');
      res.end(JSON.stringify({code:0, error:"Unknown command"}));
      console.log('----------- END -----------');
  }
});

var server = app.listen(7710);
