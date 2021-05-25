#include <SPI.h>
#include <WiFiNINA.h>

#include "arduino_secrets.h" 
///////please enter your sensitive data in the Secret tab/arduino_secrets.h
char ssid1[] = SECRET_SSID1;        // your network SSID (name)
char pass1[] = SECRET_PASS1;    // your network password (use for WPA, or use as key for WEP)
char ssid2[] = SECRET_SSID2;        // your network SSID (name)
char pass2[] = SECRET_PASS2;    // your network password (use for WPA, or use as key for WEP)
int keyIndex = 0;                 // your network key Index number (needed only for WEP)

const int moneyGunPin = 9;
const int discoPin = 10;


int status = WL_IDLE_STATUS;
WiFiServer server(80);

void setup() {
  Serial.begin(9600);      // initialize serial communication
  digitalWrite(moneyGunPin, LOW);
  digitalWrite(discoPin, LOW);
  pinMode(moneyGunPin, OUTPUT);
  pinMode(discoPin, OUTPUT);

  // check for the WiFi module:
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    // don't continue
    while (true);
  }

  String fv = WiFi.firmwareVersion();
  if (fv < WIFI_FIRMWARE_LATEST_VERSION) {
    Serial.println("Please upgrade the firmware");
  }
  int i = 0;
  while (status != WL_CONNECTED) {
    if (i == 0) {
      Serial.print("Attempting to connect to Network named: ");
      Serial.println(ssid1);                   // print the network name (SSID);
      // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
      status = WiFi.begin(ssid1, pass1);
      // wait 10 seconds for connection:
      i = 1;
    } else {
      Serial.print("Attempting to connect to Network named: ");
      Serial.println(ssid2);                   // print the network name (SSID);
      // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
      status = WiFi.begin(ssid2, pass2);
      // wait 10 seconds for connection:
      i = 0;
    }
      delay(10000);
  }
  server.begin();                           // start the web server on port 80
  printWifiStatus();                        // you're connected now, so print out the status
}


void loop() {
  WiFiClient client = server.available();   // listen for incoming clients

  if (client) {                             // if you get a client,
    Serial.println("new client");           // print a message out the serial port
    String currentLine = "";                // make a String to hold incoming data from the client
    while (client.connected()) {            // loop while the client's connected
      if (client.available()) {             // if there's bytes to read from the client,
        char c = client.read();             // read a byte, then
        Serial.write(c);                    // print it out the serial monitor
        if (c == '\n') {                    // if the byte is a newline character

          // if the current line is blank, you got two newline characters in a row.
          // that's the end of the client HTTP request, so send a response:
          if (currentLine.length() == 0) {
            // HTTP headers always start with a response code (e.g. HTTP/1.1 200 OK)
            // and a content-type so the client knows what's coming, then a blank line:
            client.println("HTTP/1.1 200 OK");
            client.println("Content-type:text/html");
            client.println();

            // the content of the HTTP response follows the header:
            client.print("Click <a href=\"/M\">here</a> to Make It Rain!<br>");
            client.print("Click <a href=\"/D\">here</a> to Disco Party<br>");

            // The HTTP response ends with another blank line:
            client.println();
            // break out of the while loop:
            break;
          } else {    // if you got a newline, then clear currentLine:
            currentLine = "";
          }
        } else if (c != '\r') {  // if you got anything else but a carriage return character,
          currentLine += c;      // add it to the end of the currentLine
        }

        // Check to see if the client request was "GET /H" or "GET /L":
        if (currentLine.endsWith("GET /M")) {
          digitalWrite(moneyGunPin, HIGH);
          delay(300);
          digitalWrite(moneyGunPin, LOW);
          Serial.println("Made It Rain!");
          currentLine = "";
        }
        if (currentLine.endsWith("GET /D")) {
          digitalWrite(discoPin, HIGH);
          delay(5000);
          digitalWrite(discoPin, LOW);
          Serial.println("Disco Party!");
          currentLine = "";
        }
      }
    }
    // close the connection:
    client.stop();
    Serial.println("client disonnected");
  }
}

void printWifiStatus() {
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your board's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
  // print where to go in a browser:
  Serial.print("To see this page in action, open a browser to http://");
  Serial.println(ip);
}
