#define LED 12

int status = 0;

void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  digitalWrite(LED, status ? HIGH : LOW);
}

void loop() {
  if(Serial.available() > 0){
    String data = Serial.readStringUntil('\n');
    processData(data);
  }
}

void processData(String data){
  if(data == "turn_led"){
    status = !status;
    digitalWrite(LED, status ? HIGH : LOW);
  }
  else if(data == "get_info"){
    Serial.println(status ? "ON" : "OFF");
  }
}

