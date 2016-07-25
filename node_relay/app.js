#!/usr/bin/env node
var BigNumber = require('bignumber.js');
var Web3 = require("web3");
var web3;

var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('port', process.env.PORT || 8080);

if (typeof web3 !== "undefined") {
  web3 = new Web3(web3.currentProvider);
} else {
  //web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  web3 = new Web3(new Web3.providers.HttpProvider("http://52.87.228.28:8545"));
}
if (web3.isConnected()) 
  console.log("Web3 connection established");
else
  throw "No connection";

app.get('/api', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.sendStatus(200);
})

app.post('/api', function(req, res) {
  var data = req.body;
  console.log(data)

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Content-Type', 'application/json');

  if ("balance" in data) {    
    var jsonRes = getBalance(data["balance"]);
    res.write(JSON.stringify(jsonRes));
    res.end();
  } else if ("rawtx" in data) {
    var jsonRes = sendRawTransaction(data["rawtx"]);
    res.write(JSON.stringify(jsonRes));
    res.end();
  } else if ("txdata" in data) {
    var jsonRes = getTransactionData(data["txdata"]);
    res.write(JSON.stringify(jsonRes));
    res.end();
  } else if ("estimatedGas" in data) {
    var jsonRes = getEstimatedGas(data["estimatedGas"]);
    res.write(JSON.stringify(jsonRes));
    res.end();
  } else if ("ethCall" in data) {
    var jsonRes = getEthCall(data["ethCall"]);
    res.write(JSON.stringify(jsonRes));
    res.end();
  }
  
  console.error('Invalid Request: ' + data);
  res.status(400).send();
});

function getBalance(addr, gethRPC) {
  var data = getDefaultResponse();
  try {
    var addr = formatAddress(addr);
    var balancehex = web3.eth.getBalance(addr, "pending");
    var balance = bchexdec(balancehex);
    data["data"] = {
      "address": addr,
      "balance": balance,
      "balancehex": balancehex
    }
  } catch (e) {
    data["error"] = true;
    data["msg"] = e;
  }
  return data;
}
function sendRawTransaction(rawtx, gethRPC) {
  var data = getDefaultResponse();
  try {
    data["data"] = web3.eth.sendRawTransaction(rawtx);
  } catch (e) {
    data["error"] = true;
    data["msg"] = e;
  }
  return data;
}
function getTransactionData(addr, gethRPC) {
  var data = getDefaultResponse();
  try {
    var addr = formatAddress(addr);
    var balance = web3.eth.getBalance(addr, "pending");
    var nonce = web3.eth.getTransactionCount(addr, "pending");
    var gasprice = web3.eth.gasPrice;
    var balance = bchexdec(balance);
    data["data"] = {
      "address": addr,
      "balance": balance,
      "nonce": nonce,
      "gasprice": gasprice
    }
  } catch (e) {
    data["error"] = true;
    data["msg"] = e;
  }
  return data;  
}

function getEstimatedGas(txobj, gethRPC) {
  var data = getDefaultResponse();
  try {
    data["data"] = web3.eth.estimateGas(txobj);
  } catch (e) {
    data["error"] = true;
    data["msg"] = e;
  }
  return data;  
}
function getEthCall(txobj, gethRPC) {
  var data = getDefaultResponse();
  try {
    data["data"] = web3.eth.call(txobj, "pending");
  } catch (e) {
    data["error"] = true;
    data["msg"] = e;
  }
  return data;
}

function formatAddress(addr){
    if (addr.substring(0, 2) == "0x")
        return addr;
    else
        return "0x" + addr;
}
function getDefaultResponse(){
  data = {
    "error": false,
    "msg": "",
    "data": ""
  }
    return data;
}
function bchexdec(hex) {
  dec = new BigNumber(0);
  len = hex.length;
  for (var i = 1; i <= len; i++) {
    var bcmul = new BigNumber(parseInt(hex[i - 1], 16)).times(new BigNumber(16).pow(len - i));
    dec = dec.plus(bcmul);
  }
  return dec;
}


var server = http.createServer(app);

server.listen(app.get('port'), function() { 
    console.log((new Date()) + " Server is listening on port " + app.get('port'));
});
