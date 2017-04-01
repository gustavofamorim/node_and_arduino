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

arduino.on("open", function(){
  console.log("Connected to arduino");
});

app.get("/", function(req, res){
  res.sendFile("index.html");
});

io.on("connection", function(client){

  console.log("User has been connected!");

  client.on("get_info", function(msg){
    console.log("Received get_info");
    arduino.write("get_info\n");
  });

  client.on("turn_led", function(msg){
    console.log("Received turn_led");
    arduino.write("turn_led\n");
    console.log("Sended get_info to arduino");
    arduino.write("get_info\n");
  });

  client.on("disconnect", function() {
    console.log("User has been disconnected!");
  });
});

arduino.on("data", function(data){
  console.log("Arduino resposnse");
  io.sockets.emit("info", {
    ledStatus: data
  });
});

http.listen(8080, function(){
  console.log("http server started!")
});
