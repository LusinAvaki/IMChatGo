package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true 
    },
}

type Client struct {
    Conn *websocket.Conn
    Send chan []byte
}

var broadcast = make(chan []byte)

var clients = make(map[*Client]bool)

func handleConnection(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("Error during connection upgrade:", err)
        return
    }
    defer conn.Close()

    client := &Client{Conn: conn, Send: make(chan []byte)}
    clients[client] = true

    go client.writeMsg() 
    client.readMsg()     
}

func (c *Client) readMsg() {
    defer func() {
        delete(clients, c)
        c.Conn.Close()
    }()

    for {
        _, msg, err := c.Conn.ReadMessage()
        if err != nil {
            log.Println("Error reading message:", err)
            break
        }

        log.Printf("Received: %s", msg)
        broadcast <- msg 
    }
}

func (c *Client) writeMsg() {
    for msg := range c.Send {
        if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
            log.Println("Error writing message:", err)
            break
        }
    }
}

func handleBroadcast() {
    for {
        msg := <-broadcast
        for client := range clients {
            client.Send <- msg 
        }
    }
}

func serveFiles(w http.ResponseWriter, r *http.Request) {
    filePath := r.URL.Path[len("/files/"):]

    http.ServeFile(w, r, filePath)
}


func main() {
    go handleBroadcast() 

    http.HandleFunc("/ws", handleConnection)

	http.HandleFunc("/files/", serveFiles)
    log.Println("Server started on :8080")
    if err := http.ListenAndServe(":8080", nil); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}
