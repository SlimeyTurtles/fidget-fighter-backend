// const WebSocket = require("ws");

// const PORT = 3000;
// const server = new WebSocket.Server({ port: PORT }, () => {
//     console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
// });

// let waitingPlayer = null;

// server.on("connection", (socket) => {
//     console.log("A player connected.");

//     // Handle disconnections before match starts
//     socket.on("close", () => {
//         console.log("A player disconnected before match started.");
//         if (waitingPlayer === socket) {
//             waitingPlayer = null;
//         }
//     });

//     if (waitingPlayer) {
//         console.log("Match found!");
//         const player1 = waitingPlayer;
//         const player2 = socket;
//         waitingPlayer = null;

//         startGame(player1, player2);
//     } else {
//         waitingPlayer = socket;
//         socket.send(JSON.stringify({ event: "waiting", message: "Waiting for an opponent..." }));
//     }
// });

// function startGame(player1, player2) {
//     console.log("Starting the game...");
//     player1.send(JSON.stringify({ event: "start-game" }));
//     player2.send(JSON.stringify({ event: "start-game" }));

//     let player1Integral = 0,
//         player2Integral = 0;

//     const startTime = Date.now();

//     // Function to handle disconnection during the game
//     const handleDisconnect = (player, playerName) => {
//         console.log(`${playerName} disconnected during the game.`);
//         clearTimeout(gameTimer);
//         if (player1.readyState === WebSocket.OPEN) {
//             player1.send(JSON.stringify({ event: "game-over", result: `${playerName === "Player 1" ? "Player 2 Wins!" : "Player 1 Wins!"}` }));
//         }
//         if (player2.readyState === WebSocket.OPEN) {
//             player2.send(JSON.stringify({ event: "game-over", result: `${playerName === "Player 1" ? "Player 2 Wins!" : "Player 1 Wins!"}` }));
//         }
//     };

//     // Relay RPM updates and calculate integrals
//     player1.on("message", (data) => {
//         try {
//             const rpm = JSON.parse(data).rpm;
//             const time = (Date.now() - startTime) / 1000;
//             player1Integral += rpm * time * 0.016;

//             // Send RPM data to Player 2
//             if (player2.readyState === WebSocket.OPEN) {
//                 player2.send(JSON.stringify({ event: "spin-update", rpm }));
//             }
//         } catch (e) {
//             console.log("Invalid data from Player 1:", data);
//         }
//     });

//     player2.on("message", (data) => {
//         try {
//             const rpm = JSON.parse(data).rpm;
//             const time = (Date.now() - startTime) / 1000;
//             player2Integral += rpm * time * 0.016;

//             // Send RPM data to Player 1
//             if (player1.readyState === WebSocket.OPEN) {
//                 player1.send(JSON.stringify({ event: "spin-update", rpm }));
//             }
//         } catch (e) {
//             console.log("Invalid data from Player 2:", data);
//         }
//     });

//     player1.on("close", () => handleDisconnect(player1, "Player 1"));
//     player2.on("close", () => handleDisconnect(player2, "Player 2"));

//     // Game timer
//     const gameTimer = setTimeout(() => {
//         console.log("Game over. Calculating results...");
//         console.log(`Player 1 Integral: ${player1Integral.toFixed(2)}, Player 2 Integral: ${player2Integral.toFixed(2)}`);

//         let winner;
//         if (player1Integral > player2Integral) {
//             winner = "Player 1 Wins!";
//         } else if (player2Integral > player1Integral) {
//             winner = "Player 2 Wins!";
//         } else {
//             winner = "It's a Tie!";
//         }

//         console.log(`Winner: ${winner}`);

//         const resultMessage = {
//             event: "game-over",
//             result: winner,
//             player1Integral: (player1Integral / 10).toFixed(2),
//             player2Integral: (player2Integral / 10).toFixed(2)
//         };

//         if (player1.readyState === WebSocket.OPEN) {
//             player1.send(JSON.stringify(resultMessage));
//         }
//         if (player2.readyState === WebSocket.OPEN) {
//             player2.send(JSON.stringify(resultMessage));
//         }
//     }, 10000);
// }


const WebSocket = require("ws");

const PORT = 3000;
const server = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
});

let waitingPlayer = null; // Stores a single waiting player
const rooms = new Map(); // A map to manage game rooms

server.on("connection", (socket) => {
    console.log("A player connected.");

    // Handle disconnections before match starts
    socket.on("close", () => {
        console.log("A player disconnected before match started.");
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
    });

    if (waitingPlayer) {
        console.log("Match found! Creating a room...");
        const player1 = waitingPlayer;
        const player2 = socket;
        waitingPlayer = null;

        const roomID = `room-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        rooms.set(roomID, { player1, player2, player1Integral: 0, player2Integral: 0, startTime: Date.now() });
        
        startGame(player1, player2, roomID);
    } else {
        waitingPlayer = socket;
        socket.send(JSON.stringify({ event: "waiting", message: "Waiting for an opponent..." }));
    }
});

// Start the game for a pair of players
function startGame(player1, player2, roomID) {
    console.log(`Starting the game in ${roomID}...`);
    player1.send(JSON.stringify({ event: "start-game" }));
    player2.send(JSON.stringify({ event: "start-game" }));

    const room = rooms.get(roomID);

    // Relay RPM updates and calculate integrals
    handlePlayerMessages(player1, player2, room, "Player 1");
    handlePlayerMessages(player2, player1, room, "Player 2");

    // Game timer
    const gameTimer = setTimeout(() => {
        console.log(`Game over in ${roomID}. Calculating results...`);
        const { player1Integral, player2Integral } = room;

        let winner;
        if (player1Integral > player2Integral) {
            winner = "Player 1 Wins!";
        } else if (player2Integral > player1Integral) {
            winner = "Player 2 Wins!";
        } else {
            winner = "It's a Tie!";
        }

        console.log(`Winner: ${winner} in ${roomID}`);

        const resultMessage = {
            event: "game-over",
            result: winner,
            player1RPM: (player1Integral / 10).toFixed(2),
            player2RPM: (player2Integral / 10).toFixed(2)
        };

        sendResult(player1, resultMessage);
        sendResult(player2, resultMessage);

        rooms.delete(roomID); // Cleanup room
    }, 10000);

    room.gameTimer = gameTimer;
}

// Handle incoming messages for each player and broadcast
function handlePlayerMessages(player, opponent, room, playerName) {
    player.on("message", (data) => {
        try {
            console.log(`${playerName} sent: ${data}`); // Print the JSON
            const parsedData = JSON.parse(data);

            // Calculate integral for the player
            if (parsedData.event === "spin-update" && parsedData.rpm !== undefined) {
                const time = (Date.now() - room.startTime) / 1000;
                if (playerName === "Player 1") {
                    room.player1Integral += parsedData.rpm * time * 0.016;
                } else {
                    room.player2Integral += parsedData.rpm * time * 0.016;
                }

                // Broadcast the RPM update to the opponent
                if (opponent.readyState === WebSocket.OPEN) {
                    opponent.send(JSON.stringify({ event: "spin-update", rpm: parsedData.rpm }));
                }
            }
        } catch (e) {
            console.log(`Invalid message from ${playerName}:`, data);
        }
    });

    player.on("close", () => handleDisconnect(player, opponent, playerName, room));
}

// Handle player disconnections
function handleDisconnect(player, opponent, playerName, room) {
    console.log(`${playerName} disconnected during the game.`);
    clearTimeout(room.gameTimer);

    const winner = playerName === "Player 1" ? "Player 2 Wins!" : "Player 1 Wins!";
    const resultMessage = {
        event: "game-over",
        result: winner,
        player1RPM: (room.player1Integral / 10).toFixed(2),
        player2RPM: (room.player2Integral / 10).toFixed(2)
    };

    sendResult(opponent, resultMessage);
    rooms.delete(room);
}

// Utility function to send results
function sendResult(player, message) {
    if (player.readyState === WebSocket.OPEN) {
        player.send(JSON.stringify(message));
    }
}
