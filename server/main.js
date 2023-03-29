var os = require("os");
var fs = require("fs");
var WebSocket = require("ws");
const { env } = require("process");


const mainPort = 6060;
configPath = "isd-poll-config.json"
outputPath = "isd-poll.log"


function getNewWebSocketServer(parameters)
{
    const server = new WebSocket.Server(parameters);

    server.on("connection", (socket, request) => {
        console.log(`New session on port ${parameters.port} from ${request.socket.remoteAddress}`);

        socket.onmessage = (event) => {
            console.log(`Message from ${request.socket.remoteAddress} on port ${parameters.port}: ${event.data}`);
            if (event.data === "getOptions") {
                let config = JSON.parse(fs.readFileSync(configPath)); // <== load configuration
                socket.send(JSON.stringify({
                    title: config.title,
                    options: config.options
                }));
            } else if (event.data.startsWith("User response")) {
                try {
                    fs.appendFileSync(outputPath, `${request.socket.remoteAddress}: ${event.data}\n`);
                    socket.send("success");
                } catch (exception) {
                    socket.send("failure");
                    throw exception;
                }
            } else {
                socket.send(`unrecognized response: ${event.data}`);
            }
        }; // socket.onMessage

        socket.onclose = () => {
            console.log(`Session on port ${parameters.port} terminated`);
        }; // socket.onclose
    }); // server.onConnection

    return server;
}


fs.writeFileSync(outputPath, ""); // <== Clear the output file
const server = getNewWebSocketServer({
    port: mainPort
});
