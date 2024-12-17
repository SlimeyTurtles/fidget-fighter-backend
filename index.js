// const WebSocket = require("ws");

// const PORT = 3000;
// const server = new WebSocket.Server({ port: PORT }, () => {
//     console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
// });

// let waitingPlayer = null; // Store a waiting player for matchmaking

// server.on("connection", (socket) => {
//     console.log("A player connected.");

//     // Matchmaking logic
//     if (waitingPlayer) {
//         console.log("Match found!");
//         const opponent = waitingPlayer;
//         waitingPlayer = null;

//         // Notify both players that the game has started
//         sendJSON(socket, { event: "start-game", message: "Match found!" });
//         sendJSON(opponent, { event: "start-game", message: "Match found!" });

//         // Relay spin updates (RPM) between players
//         socket.on("message", (data) => {
//             console.log("Received spin update from Player 1:", data);
//             sendJSON(opponent, JSON.parse(data)); // Forward as stringified JSON
//         });

//         opponent.on("message", (data) => {
//             console.log("Received spin update from Player 2:", data);
//             sendJSON(socket, JSON.parse(data)); // Forward as stringified JSON
//         });

//         socket.on("close", () => console.log("Player 1 disconnected."));
//         opponent.on("close", () => console.log("Player 2 disconnected."));
//     } else {
//         waitingPlayer = socket;
//         console.log("Waiting for another player...");
//         sendJSON(socket, { event: "waiting", message: "Waiting for an opponent..." });
//     }

//     socket.on("close", () => {
//         console.log("A player disconnected.");
//         if (waitingPlayer === socket) {
//             waitingPlayer = null; // Reset waiting player if disconnected
//         }
//     });
// });

// // Helper function to send stringified JSON
// function sendJSON(socket, data) {
//     try {
//         const message = JSON.stringify(data);
//         socket.send(message); // Send as string
//     } catch (e) {
//         console.error("Failed to send JSON:", e);
//     }
// }

// console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);

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
        sendJSON(socket, { event: "start-game", message: "Match found!" });
        sendJSON(opponent, { event: "start-game", message: "Match found!" });

        // Relay spin updates (RPM) between players
        socket.on("message", (data) => {
            const parsedData = parseJSON(data); // Parse incoming data
            if (parsedData) {
                console.log("Received spin update from Player 1:", parsedData);
                sendJSON(opponent, parsedData); // Forward to opponent
            }
        });

        opponent.on("message", (data) => {
            const parsedData = parseJSON(data); // Parse incoming data
            if (parsedData) {
                console.log("Received spin update from Player 2:", parsedData);
                sendJSON(socket, parsedData); // Forward to opponent
            }
        });

        socket.on("close", () => console.log("Player 1 disconnected."));
        opponent.on("close", () => console.log("Player 2 disconnected."));
    } else {
        waitingPlayer = socket;
        console.log("Waiting for another player...");
        sendJSON(socket, { event: "waiting", message: "Waiting for an opponent..." });
    }

    socket.on("close", () => {
        console.log("A player disconnected.");
        if (waitingPlayer === socket) {
            waitingPlayer = null; // Reset waiting player if disconnected
        }
    });
});

// Helper function to send stringified JSON
function sendJSON(socket, data) {
    try {
        const message = JSON.stringify(data);
        socket.send(message);
    } catch (e) {
        console.error("Failed to send JSON:", e);
    }
}

// Helper function to parse incoming JSON data
function parseJSON(data) {
    try {
        const text = data.toString(); // Convert buffer/data to string
        const json = JSON.parse(text); // Parse string to JSON
        return json;
    } catch (e) {
        console.error("Failed to parse incoming data as JSON:", e);
        return null; // Return null on failure
    }
}

console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
