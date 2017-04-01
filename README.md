# Node And Arduino

Este repositório contém uma aplicação node simples que se comunica com Arduino via porta serial.

# Como ela funciona?

Por meio de comunicação serial, a aplicação node se comunica com um arduino e executa comandos provenientes de uma página web para ligar e desligar um LED conectado ao pino 12 do arduino.

# Quero entender melhor...

Caso queria entender melhor como ela funciona, abaixo está o passo a passo de como ela foi ela foi construída.

> OBS: Esta aplicação foi construída com fins completamente didáticos e não comerciais.

## A aplicação node

A aplicação node foi construída em um único arquivo, o `index.js`, que se encontra no diretório `node_project`, incluído na raiz deste repositório.

O primeiro passo é configurar o node para prover uma página web utilizando o express e, além disso, utilizar a biblioteca socket.io, para permitir que os clientes definam e saibam, em tempo real, o estado do led.

```javascript
var app = require("express")();
var express = require("express");

app.use(express.static(__dirname + "/public"));

var http = require("http").Server(app);
var io = require("socket.io")(http);
```

A partir disso, instanciamos um objeto SerialPort e o configuramos para utilizar a porta mapeada em `/dev/ttyACM0` com bound rate de 9600b/s e um parser básico para definir o caracter finalizador de linha como sendo \n.

> A porta e o bound rate utilizados variam de acordo com as configurações e estado do seu sistema.

```javascript
var SerialPort = require("serialport");
var arduino = new SerialPort("/dev/ttyACM0", {
  baudrate: 9600,
  parser: SerialPort.parsers.readline('\n')
});
```

Para efeitos de interatividade, definimos um evento "open" para quando finalmente nos conectarmos ao arduino.

```javascript
arduino.on("open", function(){
  console.log("Connected to arduino");
});
```

Para acessarmos nossa página web pelo navegador, definimos uma rota `GET` no repositório `/` em nosso servidor.

```javascript
app.get("/", function(req, res){
  res.sendFile("index.html");
});
```

Neste momento temos um servidor web configurado para responder com um arquivo `index.html`, armazenado no diretório `public`, todas as vezes que receber uma requisição `GET` de alguma aplicação cliente. Além disso, a aplicação já é capaz de se comunicar com um arduino conectado a porta `/dev/ttyACM0` com bound rate de 9600b/s.

Agora é necessário configurar o socket.io para que possamos receber e enviar informações entre nosso servidor e a aplicação cliente conectada a ele. Tal processo é realizado com a definição de um evento `connection`, que é disparado todas as vezes que um cliente se conecta utilizando a biblioteca do socket.io.


```javascript
io.on("connection", function(client){

  console.log("User has been connected!");
```

O objeto que representa o socket aberto com o cliente é recebido como argumento para a função anônima passada como argumento. A partir daí, definimos os eventos `get_info`, `turn_led` e `disconnect`, que serão disparados quando o cliente fizer um pedido de informação a cerca do estado do LED, quando o cliente deseja alterar o estado do LED e quando se desconectar do servidor, respectivamente.

O evento `get_info` aciona a escrita na porta serial a mensagem `get_info` para que o arduino responda com a informação do atual estado do LED. Já o evento `turn_led` aciona a escrita na porta serial das mensagens `turn_led`, que indica ao arduino que troque o estado atual do LED, e `get_info`.

```javascript
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
```

A mensagem `get_info` terá um retorno, via porta serial, do nosso arduino. A partir daí, definimos um evento `data` em nossa porta serial que, por sua vez, será acionado toda vez que nossa placa reponder algo para nosso servidor. A partir daí, obtemos essa mensagem e a enviamos como `info` a todos os nossos clientes conectados utilizando o método `io.sockets.emit`.

> No caso deste exemplo, não é realizada uma análise da mensagem provida pela nossa placa devido a ausência de necessidade para isso. Em caso de múltiplos tipos de mensagens, podemos adicionar prefixos para indicar tipos de mensagens e a manipulamos em nosso servidor ou em nossos clientes de acordo com as nossas necessidades.

```javascript
arduino.on("data", function(data){
  console.log("Arduino resposnse");
  io.sockets.emit("info", {
    ledStatus: data
  });
});
```

Precisamos agora definir a porta onde nosso servidor web irá "escutar" as requisições dos clientes. Neste caso definimos a porta 8080 e emitimos uma mensagem quando isto ocorrer.

```javascript
http.listen(8080, function(){
  console.log("http server started!")
});
```

Para finalizar, é necessária a escrita de uma página html dentro do diretório `public`. A página desenvolvida não possui muitos segredos e encontra-se em `node_project/public`.

## A aplicação arduino

Pelas configurações do servidor, nossa aplicação arduino deverá ser capaz de receber e "entender" duas mensagens: `get_info` e `turn_led`. Para a primeira mensagem, nossa placa deve responder com o estado atual do LED. A segunda mensagem deve ser entendida como um comando para trocar o estado do nosso LED.

Primeiramente definimos uma política de pré-processamento para representar o pino onde nosso LED se encontra, neste caso o pino 12.

```C
#define LED 12
```

Após isso, definimos uma variável para armazenar o estado do nosso LED e realizamos as definições básicas da nossa placa dentro da função `setup`, onde definimos o bound rate para 9600b/s, definimos o pino do LED como sendo de saída e, neste caso, desligamos nosso LED.

```C
int status = 0;

void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  digitalWrite(LED, status ? HIGH : LOW);
}
```

Em nosso loop principal, verificamos a existência de alguma mensagem. Em caso positivo, recebemos ela e a repassamos para o método `void processData(String)`.

```C
void loop() {
  if(Serial.available() > 0){
    String data = Serial.readStringUntil('\n');
    processData(data);
  }
}
```

No método `void processData(String)`, verificamos se a mensagem é algum dos comandos aceitos, ou seja, `turn_led` e `get_info`. Caso seja a primeira, trocamos o estado da nossa variável `status` e atualizamos o nosso LED. No caso da segunda possibilidade, ou seja `get_info`, escrevemos em nossa porta serial o estado atual do LED, neste caso "ON", para ligado, e "OFF", para desligado.

```C
void processData(String data){
  if(data == "turn_led"){
    status = !status;
    digitalWrite(LED, status ? HIGH : LOW);
  }
  else if(data == "get_info"){
    Serial.println(status ? "ON" : "OFF");
  }
}
```
