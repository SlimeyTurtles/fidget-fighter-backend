const WebSocket = require("ws");

const PORT = 3000;
const server = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
});

let waitingPlayer = null; // Store a waiting player for matchmaking

server.on("connection", (socket) => {
    console.log("A player connected.");

    // Matchmaking logic
    if (waitingPlayer) {
        console.log("Match found!");
        const opponent = waitingPlayer;
        waitingPlayer = null;

        // Notify both players that the game has started
        socket.send(JSON.stringify({ event: "start-game", message: "Match found!" }));
        opponent.send(JSON.stringify({ event: "start-game", message: "Match found!" }));

        // Relay spin updates (RPM) between players
        socket.on("message", (data) => {
            console.log("Received spin update from Player 1:", data);
            opponent.send(data); // Forward message to the opponent
        });

        opponent.on("message", (data) => {
            console.log("Received spin update from Player 2:", data);
            socket.send(data); // Forward message to the opponent
        });

        socket.on("close", () => console.log("Player 1 disconnected."));
        opponent.on("close", () => console.log("Player 2 disconnected."));
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

console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
