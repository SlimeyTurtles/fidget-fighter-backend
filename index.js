// const WebSocket = require("ws");

// const PORT = 3000;
// const server = new WebSocket.Server({ port: PORT }, () => {
//     console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
// });

// server.on("connection", (socket) => {
//     console.log("A client connected");

//     socket.send("Welcome to the WebSocket server!");

//     socket.on("message", (message) => {
//         console.log(`Received: ${message}`);
//         socket.send(`Echo: ${message}`);
//     });

//     socket.on("close", () => {
//         console.log("Client disconnected");
//     });
// });

// NEW

const WebSocket = require("ws");

const PORT = 3000;
const server = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
});

let waitingPlayer = null;

server.on("connection", (socket) => {
    console.log("A player connected.");

    // Matchmaking logic
    if (waitingPlayer) {
        console.log("Match found!");
        const opponent = waitingPlayer;
        waitingPlayer = null;

        // Notify both players the game has started
        socket.send(JSON.stringify({ event: "start-game", message: "Match found!" }));
        opponent.send(JSON.stringify({ event: "start-game", message: "Match found!" }));

        // Relay spin updates between players
        socket.on("message", (data) => {
            console.log("Spin update from player 1:", data);
            opponent.send(data); // Relay to opponent
        });
        opponent.on("message", (data) => {
            console.log("Spin update from player 2:", data);
            socket.send(data); // Relay to opponent
        });
    } else {
        waitingPlayer = socket;
        console.log("Waiting for another player...");
        socket.send(JSON.stringify({ event: "waiting", message: "Waiting for an opponent..." }));
    }

    socket.on("close", () => {
        console.log("A player disconnected.");
        if (waitingPlayer === socket) {
            waitingPlayer = null; // Reset waiting player if disconnected
        }
    });
});
