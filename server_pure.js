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
const d = new Date()
var db
var dbo // db object (collection)


// utilities.js

// routes.js
service
  .get('/fakultas-prodi', async (req, res) => {
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
        }
      )
  })
  .get('/fakultas', async (req, res) => {
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
      }
    )
  })
  .get('/fakultas/:namaFakultas/prodi', async (req, res) => {
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

      }
    )


  })
  .get('/prodi', async (req, res) => {
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

      }
    )
  })
  .get('/prodi/:kodeProdi', async (req, res) => {

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
      }
    )
  });

// server.js
http.createServer(service).listen(3000, '127.0.0.1', function () {
  MongoClient.connect(url, function (err, database) {
    if (err) throw err;
    db = database.db('kompetegram_publicdb');
    dbo = db.collection('fakultas_prodi')
    console.log('running at 127.0.0.1:3000');
  });
})