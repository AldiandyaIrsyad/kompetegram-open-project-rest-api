const http = require('http');
const { connect } = require('http2');
const service = require('restana')()
const { MongoClient, Db } = require("mongodb");
require('dotenv').config()

// config.js
var url = "mongodb+srv://" +
  process.env.DB_USER + ":" +
  process.env.DB_PASS + "@" +
  process.env.DB_SERVER;

// var CACHE = {
//   '/fakultas-prodi': {
//     'time': '....',
//     'respon': '...'
//   }
// }

var CACHE = {

};

// Cheating >:D
//    if cache were enableb, save the output when 
//    a request were run and use that output for 5 mins
const USE_CACHE = false

//    if cheat were enabled, load /fakultas-prodi when
//    server starting
const USE_CHEAT = false


const d = new Date()
var db
var dbo // db object (collection)


// utilities.js
function use_cache(url) {
  return USE_CACHE && url in CACHE && d.getTime() - CACHE[url]['time'] < 300000
}

function update_cache(url, output) {
  if (!USE_CACHE) return
  var new_cache = {
    'time': d.getTime(),
    'respon': output
  }
  CACHE[url] = new_cache
}

// routes.js
service
  .get('/fakultas-prodi', async (req, res) => {
    if (use_cache(req.url)) {
      res.send(CACHE[req.url]['respon'])
      return
    }

    dbo.aggregate([{
      $group: {
        _id: "$fakultas",
        "listProdi": {
          $push: {
            "kodeProdi": "$kode",
            "namaProdi": "$prodi"
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        "namaFakultas": "$_id",
        "listProdi": "$listProdi"
      }
    }]).toArray()
      .then(
        (data) => {
          output = {
            "data": {
              "universitas": "Universitas Pendidikan Indonesia",
              "listFakultas": data
            }
          }
          res.send(output, 200, { 'x-cache-timeout': '5 minutes' })
          update_cache(req.url, output)
        }
      )
  })
  .get('/fakultas', async (req, res) => {
    if (use_cache(req.url)) {
      res.send(CACHE[req.url]['respon'])
      return
    }
    dbo.aggregate([{
      $group: {
        _id: "$fakultas",
      }
    },
    {
      $project: {
        _id: 0,
        "namaFakultas": "$_id",
      }
    }
    ]).toArray().then(
      (data) => {
        output = {
          "data": data
        }
        res.send(output)
        update_cache(req.url, output)
      }
    )
  })
  .get('/fakultas/:namaFakultas/prodi', async (req, res) => {
    if (use_cache(req.url)) {
      res.send(CACHE[req.url]['respon'])
      return
    }
    dbo.aggregate([
      {
        $match: { "fakultas": req.params.namaFakultas }
      },
      {
        $group: {
          _id: "$fakultas",
          "listProdi": {
            $push: {
              "kodeProdi": "$kode",
              "namaProdi": "$prodi"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          "namaFakultas": "$_id",
          "listProdi": "$listProdi"
        }
      }
    ]).toArray().then(
      (data) => {
        if (data.length == 0) {
          res.send({
            "errors": [
              {
                "status": "404",
                "title": "Tidak ditemukan",
                "detail": "Prodi dari fakultas bersangkutan tidak ditemukan"
              }
            ]
          }, 404)
        } else {
          output = {
            "data": data[0]
          }
          res.send(output, 200)
        }
        update_cache(req.url, output)

      }
    )


  })
  .get('/prodi', async (req, res) => {
    if (use_cache(req.url)) {
      res.send(CACHE[req.url]['respon'])
      return
    }
    dbo.aggregate([
      {
        $group: {
          _id: "$kode",
          "name": { "$first": "$prodi" },
          "fakultas": { "$first": "$fakultas" }
        }
      },
      {
        $project: {
          _id: 0,
          "kode": "$_id",
          "prodi": "$name",
          'fakultas': "$fakultas"
        }
      }
    ]).toArray().then(
      (data) => {
        output = {
          "data": data
        }
        res.send(output)
        update_cache(req.url, output)

      }
    )
  })
  .get('/prodi/:kodeProdi', async (req, res) => {
    if (use_cache(req.url)) {
      res.send(CACHE[req.url]['respon'])
      return
    }

    dbo.aggregate([
      {
        $match: { "kode": req.params.kodeProdi }
      },
      {
        $project: {
          _id: 0,
          "kode": "$kode",
          "prodi": "$prodi",
          "fakultas": "$fakultas"
        }
      }
    ]).toArray().then(
      (data) => {
        if (data.length == 0) {
          res.send({
            "errors": [
              {
                "status": "404",
                "title": "Tidak ditemukan",
                "detail": "Kode prodi tidak ditemukan"
              }
            ]
          }, 404)
        } else {
          output = {
            "data": data[0]
          }
          res.send(output, 200)
        }
        update_cache(req.url, output)
      }
    )
  });

// cheat.js
function cheat() {
  dbo.aggregate([{
    $group: {
      _id: "$fakultas",
      "listProdi": {
        $push: {
          "kodeProdi": "$kode",
          "namaProdi": "$prodi"
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      "namaFakultas": "$_id",
      "listProdi": "$listProdi"
    }
  }
  ]).toArray().then(
    (data) => {
      output = {
        "data": {
          "universitas": "Universitas Pendidikan Indonesia",
          "listFakultas": data
        }
      }
      update_cache('/fakultas-prodi', output)
    }
  )
}

// server.js
http.createServer(service).listen(3000, '127.0.0.1', function () {
  MongoClient.connect(url, function (err, database) {
    if (err) throw err;
    db = database.db('kompetegram_publicdb');
    dbo = db.collection('fakultas_prodi')
    if (USE_CHEAT) cheat()
    console.log('running at 127.0.0.1:3000');
  });
})