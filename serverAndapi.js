const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router('databases/data/dbaas.json')
const middlewares = jsonServer.defaults()
const crypto = require('crypto');
const path = require('path');
const { exec } = require("child_process");
const process = require('process');

function addEnv(cmd, region, type) {
  var str = "export TYPE="+type;
  if (getKubeConfig(region) == null) str = str + ";export KUBECONFIG=";
  else str = str + ";export KUBECONFIG="+getKubeConfig(region);
  str = str + ";export SC="+getStorageClass(region);
  str = str + ";export VSC="+getSnapClass(region);
  return str+"; cd databases; "+cmd;
}

function deleteDatabase(body) {
  cmd = addEnv("/bin/sh delete.sh " + body.namespace + " " + body.name + " " + body.password, body.region, body.type);
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

function createDatabase(body) {
  cmd = addEnv("/bin/sh create.sh " + body.namespace + " " + body.name + " " + body.password + " " + body.service, body.region, body.type);
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

function checkDatabase(body) {
  cmd = addEnv("/bin/sh check.sh "+ body.namespace + " " + body.name, body.region, body.type);
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        //return;
    }
    var arr = stdout.split('\n');
    console.log(arr);
    if (body.id) {
      var db = router.db.get("databases").getById(body.id).value();
      if (db) {
        if (arr[0].trim() == "1/1") db.status = "Running";
        else db.status = "Created";
        if (arr.length>2) {
          db.urlDb = arr[1].trim() + ":" + arr[2].trim();
        }
        if (arr.length>3) {
          db.urlAdmin = arr[3].trim();
        }
        db.snapshots = [];
        for (var i=4; i<arr.length; i++) {
          if (arr[i].startsWith('snapshot ')) {
            var arr1 = arr[i].split(' ');
            var arr2 = arr1[1].split('-');
            var freq = "manual";
            var id = arr2[2];
            if (arr2.length > 3) {
              id = arr2[3];
              freq = arr2[2];
            }
            var ready = arr1[2];
            var size = arr1[3];
            sn = {"id":id, "ready":ready, "freq":freq}
            if (sn.ready == "true") sn.size = size;
            db.snapshots.push(sn);
          }
        }
        router.db.get("databases").set(body.id, db);
        router.db.write();
      }
    }
    //console.log(`stdout: ${stdout}`);
  });
}

function getSnapshot(db, id) {
  if (! db['snapshots']) return null;
  for (var i in db.snapshots) {
    if (db.snapshots[i].id == id) return db.snapshots[i];
  }
  return null;
}

function addSnapshot(body) {
  var id = (new Date).getTime();
  cmd = addEnv("/bin/sh snapshot.sh "+ body.namespace + " " + body.name + " " + id, body.region, body.type);
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
    }
    if (body.id) {
      var database = router.db.get("databases").getById(body.id).value();
      if (! database.snapshots) database.snapshots = [];
      database.snapshots.push({"id":id});
      router.db.get("databases").set(body.id, database);
      router.db.write();
    }
  });
}

function deleteSnapshot(body, id) {
  cmd = addEnv("/bin/sh deletesnapshot.sh "+ body.namespace + " " + body.name + " " + id, body.region, body.type);
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
    }
    if (body.id) {
      var db = router.db.get("databases").getById(body.id).value();
      var snapshots = db.snapshots;
      db.snapshots = [];
      for (var i in snapshots) {
        if (snapshots[i].id != id) db.snapshots.push(snapshots[i]);
      }
      router.db.get("databases").set(body.id, db);
      router.db.write();
    }
  });
}

function recoverSnapshot(body, id) {
  cmd = addEnv("/bin/sh recoversnapshot.sh "+ body.namespace + " " + body.name + " " + id, body.region, body.type);
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
    }
    if (body.id) {
      var db = router.db.get("databases").getById(body.id).value();
      db.recovered = id;
      router.db.get("databases").set(body.id, db);
      router.db.write();
    }
  });
}


function salt(password, login) {
  return "%_-]" + password + ",J|" + login;
}

function generateSession(login) {
  var rand = Math.random();
  var password = (rand * 100).toString();
  return crypto.createHash('md5').update(salt(password, login)).digest("hex");
}

server.use((req, res, next) => {
  if (staticPath(req)) {
    var dir = __dirname;
    if (req.path == '/') res.sendFile(path.join(dir + '/dist/dbaas/index.html'));
    else res.sendFile(path.join(dir + '/dist/dbaas'+req.path));
  }
  else {
	  next();
  }
});

server.use(middlewares);

server.use(jsonServer.bodyParser);

server.use('/login', (req, res) => {
  if (req.method ==='POST') {
    if (req.body.login) {
      var user = router.db.get("users").getById(req.body.login).value();
      console.log(user.password,crypto.createHash('md5').update(salt(req.body.password, req.body.login)).digest("hex"));
      if (user && (user.password == crypto.createHash('md5').update(salt(req.body.password, req.body.login)).digest("hex"))) {
        var sessionId = generateSession(req.body.login);
        var expirationTime = (new Date((new Date()).getTime() + 10*60000)).getTime();
        var sessions = router.db.get("sessions").value();
        sessions.push({"id":sessionId, "userId":req.body.login, "expiration":expirationTime});
        router.db.add("sessions", sessions).value();
        router.db.write();
        res.jsonp({"session":sessionId});
      }
      else {
        res.statusCode = 401;
        res.jsonp({"reason":"login error 1"});
      }
    }
    else {
      res.statusCode = 401;
      res.jsonp({"reason":"login error 2"});
    }
  }
  else {
    res.statusCode = 400;
    res.jsonp({"reason":"bad request"});
  }
})

router.render = (req, res) => {
  if (userPath(req) && (res.statusCode < 300)) {
    var sessionId = req.headers['apisession'];
    var session = router.db.get("sessions").getById(sessionId).value();
    session.expiration = (new Date((new Date()).getTime() + 10*60000)).getTime();
    router.db.get("sessions").set(sessionId, session);
    router.db.write();
  }
  var body = res.locals.data;
  var newBody = body;
  if (req.path == '/databases') {
    newBody = [];
    var sessionId = req.headers['apisession'];
    var session = router.db.get("sessions").getById(sessionId).value();
    for (var i in body) {
      if (body[i].userId == session.userId) newBody.push(body[i]);
      checkDatabase(body[i]);
    }
  }
  if ('password' in body) {
    newBody = {};
    for (var key in body) {
      if (key != "password") newBody[key] = body[key];
    }
  } 
  res.jsonp(newBody);
}

function adminPath(req) {
  if (req.path.startsWith('/sessions')) return true;
  if ((req.path === '/users') && (req.method === 'GET')) return true;
  return false;
}

function adminPathAllowed(req, user) {
  if (! user) return false;
  if (user.admin === true) return true;
  return false;
}

function userPath(req) {
  if (req.path.startsWith('/users/')) return true;
  if (req.path.startsWith('/databases')) return true;
  return false;
}

function staticPath(req) {
	if (req.path.startsWith('/users')) return false;
	if (req.path.startsWith('/regions')) return false;
	if (req.path.startsWith('/databases')) return false;
	if (req.path.startsWith('/sessions')) return false;
  if (req.path.startsWith('/login')) return false;
	return true;
}

function userPathAllowed(req, user) {
  if (! user) return false;
  if (req.path.startsWith('/users/')) {
    var arr = req.path.split("/", 3);
    if (arr[2] == user.id) return true;
  }
  if (req.path.startsWith('/databases')) {
    if (req.method == 'GET') return true;
    if (req.method == 'DELETE') return true;
    if (req.body.userId === user.id) return true;
    if ((req.path == '/databases') && (req.method == 'POST')) return true;
    if (req.path.match(/^\/databases\/[0-9]+$/)) return true;
    if (req.path.match(/^\/databases\/[0-9]+\/snapshot$/)) return true;
    if (req.path.match(/^\/databases\/[0-9]+\/snapshot\/[0-9]+$/)) return true;
  }
  return false;
}

function publicPath(req) {
  if ((req.path === '/users') && (req.method === 'POST')) return true;
  return false;
}

function getStorageClass(region) {
  // ex ocs-storagecluster-ceph-rbd, thin
  return process.env['REGIONS_' + region + '_SC'];
}

function getSnapClass(region) {
  // ex ocs-storagecluster-rbdplugin-snapclass, vmware-snapclass
  return process.env['REGIONS_' + region + '_VSC'];
}

function getKubeConfig(region) {
  return process.env['REGIONS_' + region + '_KUBECONFIG'];
}

server.use((req, res, next) => {
  if (req.path == '/regions') {
    var regions = {};
    for (var key in process.env) {
      if (key.startsWith('REGIONS_') && (! key.endsWith('_KUBECONFIG')) && (! key.endsWith('_SC')) && (! key.endsWith('_VSC'))) {
        var region = key.substring(8);
        regions[region] = {"title":process.env[key]};
      }
    }
    console.log("regions",regions);
    res.status(200).jsonp(regions);  
  }
  else if (req.path.startsWith('/sessions') || req.path.startsWith('/users') || req.path.startsWith('/databases')) {
    var sessionId = req.headers['apisession'];
    if (publicPath(req) || sessionId) {
      var session = null;
      if (sessionId) session = router.db.get("sessions").getById(sessionId).value();
      if (session && (session.expiration < (new Date).getTime())) {
        console.log(session);
        console.log(new Date().getTime());
        res.status(403).jsonp({"reason":"session expired"});           
      }
      else {
        var user = null;
        if (session) user = router.db.get("users").getById(session.userId).value();
        if (publicPath(req) || user) {
          console.log(adminPath(req));
          console.log(userPath(req));
          console.log(publicPath(req));
          if (adminPath(req) && ! adminPathAllowed(req, user)) {
            res.status(403).jsonp({"reason":"access denied 1"});           
          }
          else if (userPath(req) && ! userPathAllowed(req, user)) {
            res.status(403).jsonp({"reason":"access denied 2"});           
          }
          else {
            var done = false;
            if (req.method === 'GET') {
              if (req.path.match(/^\/databases\/[0-9]+$/)) {
                var id = req.path.split('/')[2];
                var db = router.db.get("databases").getById(id).value();
                if (db) {
                  var sessionId = req.headers['apisession'];
                  var session = router.db.get("sessions").getById(sessionId).value();
                  if (db.userId != session.userId) {
                    res.status(403).jsonp({"reason":"access denied 3"});
                    done = true;
                  }
                  else {
                    checkDatabase(db);
                  }
                }
              }
            }
            else if (req.method === 'DELETE') {
              if (req.path.match(/^\/databases\/[0-9]+\/snapshot\/[0-9]+$/)) {
                var id = req.path.split('/')[2];
                var sid = req.path.split('/')[4];
                var db = router.db.get("databases").getById(id).value();
                var sessionId = req.headers['apisession'];
                var session = router.db.get("sessions").getById(sessionId).value();
                if (db.userId != session.userId) {
                  res.status(403).jsonp({"reason":"access denied 5"});
                  done = true;
                }
                else {
                  deleteSnapshot(db, sid);
                  res.status(201).jsonp({});
                  done = true;
                }
              }
              else if (req.path.match(/^\/databases\/[0-9]+$/)) {
                var id = req.path.split('/')[2];
                var db = router.db.get("databases").getById(id).value();
                var sessionId = req.headers['apisession'];
                var session = router.db.get("sessions").getById(sessionId).value();
                if (db.userId != session.userId) {
                  res.status(403).jsonp({"reason":"access denied 4"});
                  done = true;
                }
                else deleteDatabase(db);
              }
            }
            else if (req.method === 'POST') {
              if (req.path == '/databases') {
                req.body.id = (new Date).getTime();
                password = req.body.password;
                req.body.snapshots = [];
                createDatabase(req.body);
                delete req.body.password;
                req.body.status = "Creating";
                req.body.userId = user.id;
              }
              else if (req.path.match(/^\/databases\/[0-9]+\/snapshot$/)) {
                var id = req.path.split('/')[2];
                var db = router.db.get("databases").getById(id).value();
                var sessionId = req.headers['apisession'];
                var session = router.db.get("sessions").getById(sessionId).value();
                if (db.userId != session.userId) res.status(403).jsonp({"reason":"access denied 5"});
                else {
                  addSnapshot(db);
                  res.status(201).jsonp({});  
                }
                done = true;
              }
              else if (req.path.match(/^\/databases\/[0-9]+\/snapshot\/[0-9]+$/)) {
                var id = req.path.split('/')[2];
                var sid = req.path.split('/')[4];
                var db = router.db.get("databases").getById(id).value();
                var sessionId = req.headers['apisession'];
                var session = router.db.get("sessions").getById(sessionId).value();
                if (db.userId != session.userId) res.status(403).jsonp({"reason":"access denied 5"});
                else {
                  recoverSnapshot(db, sid);
                  res.status(201).jsonp({});  
                }
                done = true;
              }
              else if (req.body.password) req.body.password = crypto.createHash('md5').update(salt(req.body.password, req.body.id)).digest("hex"); 
            }
            if (! done) next();
          }
        }
        else {
          res.status(403).jsonp({"reason":"user unknown"});  
        }
      }
    }
    else {
      res.status(403).jsonp({"reason":"not logged in"});  
    }
  }
  else {
    res.status(404).jsonp({"reason":"unknown api"});
  }
})

// Use default router
server.use(router)
server.listen(8080, () => {})

