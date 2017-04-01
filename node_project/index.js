var app = require("express")();
var express = require("express");

app.use(express.static(__dirname + "/public"));

var http = require("http").Server(app);
var io = require("socket.io")(http);

var SerialPort = require("serialport");
var arduino = new SerialPort("/dev/ttyACM0", {
  baudrate: 9600,
  parser: SerialPort.parsers.readline('\n')
});

var socket;

app.get("/", function(req, res){
  res.sendFile("index.html");
});

arduino.on("open", function(){
  console.log("Connected to arduino");
});

arduino.on("data", function(data){
  console.log("Arduino resposnse");
  socket.emit("info", {
    ledStatus: data
  });
});

io.on("connection", function(client){

  socket = client;

  console.log("User has been connected!");

  socket.on("get_info", function(msg){
    console.log("Received get_info");
    arduino.write("get_info\n");
  });

  socket.on("turn_led", function(msg){
    console.log("Received turn_led");
    arduino.write("turn_led\n");
    console.log("Sended get_info to arduino");
    arduino.write("get_info\n");
  });

  socket.on("disconnect", function() {
    console.log("User has been disconnected!");
  });
});

http.listen(8080, function(){
  console.log("http server started!")
});
