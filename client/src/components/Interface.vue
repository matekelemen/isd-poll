<script>
    const mainPort = 6060;


    export function getNewPort(mainSocket)
    {
        return mainPort;
    }


    export function makeSocket(port)
    {
        console.log("Construct new WebSocket on port ", port);
        return new WebSocket(`ws://134.169.66.93:${port}`);
    }


    export function promiseSocket(port)
    {
        return new Promise(function(resolve, reject) {
            var socket = makeSocket(port);
            socket.onopen = () => {
                resolve(socket);
            };
            socket.onerror = (exception) => {
                reject(exception);
            };
        });
    }


    export default {
        data() {
            return {
                title: "",
                options: [],
                selection: [],
                sendButton: {
                    disabled: true
                },
                feedback: {
                    visible: true,
                    background: "#fff",
                    color: "#aaa",
                    text: "",
                    textInstructions: "Pick all options you fancy, then click send.",
                    textComplete: "Your choices were sent successfully. Thanks!"
                },
                successCheckmark: {
                    visibility: "hidden",
                    counter: 0
                }
            } // return object
        }, // data()

        props: {
            port: {
                default: mainPort,
                type: Number
            }
        }, // props

        methods: {
            onCheckboxChange(event) { // <== enable/disable the send button
                this.successCheckmark.visibility = "hidden";
                this.feedback.text = this.feedback.textInstructions;
                if (0 < this.selection.length) {
                    this.sendButton.disabled = false;
                } else {
                    this.sendButton.disabled = true;
                }
            }, // onCheckboxChange

            onSendClick(event) { // <== Send the current selection
                promiseSocket(this.port).then((socket) => {
                    socket.onmessage = (event) => {
                        if (event.data === "success") {
                            console.log("Successfully sent user response");
                            this.successCheckmark.visibility = "visible";
                            this.successCheckmark.counter++;
                            this.feedback.text = this.feedback.textComplete;
                            socket.close();
                        } else if (event.data === "failure") {
                            console.log("Failed to send user response");
                        } else {
                            console.log(`Unexpected response from server: ${event.data}`);
                        }
                    };
                    socket.send(`User response: ${this.selection}`);
                }).catch((exception) => {
                    console.log(`Failed to open new socket on port ${this.port} with exception ${exception}`);
                });
            } // onSendClick
        }, // methods

        mounted() {
            // Open a new socket if none was passed
            promiseSocket(this.port).then((socket) => {
                socket.onmessage = (event) => {
                    // The server sends a response to "getOptions", that should be an object
                    // with the following layout:
                    // {
                    //   title: "",
                    //   options: ["", "", ...]
                    // }
                    // These options will be then used to construct an array of checkboxes
                    // the user can pick.
                    let response = JSON.parse(event.data);
                    this.title = response.title;
                    for (const [i_option, option] of response.options.entries()) {
                        this.options.push({
                            id: i_option,
                            name: option
                        });
                    } // for option of options

                    // Close the initial socket; it won't be used for subsequent communication
                    socket.close();
                    this.onCheckboxChange();
                }; // socket.onmessage
                socket.send("getOptions");
            }).catch((exception) => {
                console.log(`Failed to open new socket on port ${this.port} with exception ${exception}`);
            }); // promiseSocket
        } // mounted()
    }; // export default
</script>



<template>
    <div style="border: 3px solid #ccc">
        <label style="margin: 10px 10px 10px; font-size: 24pt;">{{ title }}</label>
        <span v-for="option in options" :key="option.id">
            <input
                type="checkbox"
                class="labeledCheckbox"
                v-model="selection"
                :value="option.id"
                :id="option.id"
                @change="onCheckboxChange"
                style="display: none;"
            />
            <label class="selectableLabel" :for="option.id">{{ option.name }}</label>
        </span>
        <span style="display: flex;">
            <button @click="onSendClick" :disabled="sendButton.disabled" :cursor="sendButton.cursor">Send</button>
            <label :style="{ display: feedback.display, color: feedback.color }">{{ feedback.text }}</label>
            <div class="success-checkmark" :key="successCheckmark.counter" :style="{ display: successCheckmark.display, visibility: successCheckmark.visibility }">
                <div class="check-icon">
                    <span class="icon-line line-tip"></span>
                    <span class="icon-line line-long"></span>
                    <div class="icon-circle"></div>
                    <div class="icon-fix"></div>
                </div>
            </div>
        </span>
    </div>
</template>



<style>
    label {
        padding: 10px;
        margin: 10px 10px 10px;
        display:block;
    }

    .selectableLabel {
        border: 1px solid #ccc;
        padding: 10px;
        margin: 10px 10px 10px;
        display:block;
        overflow:scroll;
    }

    .selectableLabel:hover {
        background:#bbb;
    }

    .labeledCheckbox:checked + .selectableLabel {
        background: #ccc;
    }

    .labeledCheckbox:checked + .selectableLabel:hover {
        background: #aaa;
    }

    button {
        border: 1px solid #ccc;
        padding: 10px;
        margin: 10px 10px 10px;
        font-size: 18pt;
        cursor: pointer;
        display: block;
    }

    button:disabled {
        cursor: not-allowed
    }

    .success-checkmark {
    width: 80px;
    height: 115px;
    margin: 0 auto;
    }
    .success-checkmark .check-icon {
    width: 80px;
    height: 80px;
    position: relative;
    border-radius: 50%;
    box-sizing: content-box;
    border: 4px solid #4bb543;
    }
    .success-checkmark .check-icon::before {
    top: 3px;
    left: -2px;
    width: 30px;
    transform-origin: 100% 50%;
    border-radius: 100px 0 0 100px;
    }
    .success-checkmark .check-icon::after {
    top: 0;
    left: 30px;
    width: 60px;
    transform-origin: 0 50%;
    border-radius: 0 100px 100px 0;
    animation: rotate-circle 4.25s ease-in;
    }
    .success-checkmark .check-icon::before,

    .success-checkmark .check-icon .icon-line {
    height: 5px;
    background-color: #4bb543;
    display: block;
    border-radius: 2px;
    position: absolute;
    z-index: 10;
    }
    .success-checkmark .check-icon .icon-line.line-tip {
    top: 46px;
    left: 14px;
    width: 25px;
    transform: rotate(45deg);
    animation: icon-line-tip 0.75s;
    }
    .success-checkmark .check-icon .icon-line.line-long {
    top: 38px;
    right: 8px;
    width: 47px;
    transform: rotate(-45deg);
    animation: icon-line-long 0.75s;
    }
    .success-checkmark .check-icon .icon-circle {
    top: -4px;
    left: -4px;
    z-index: 10;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    position: absolute;
    box-sizing: content-box;
    border: 4px solid rgba(255, 255, 255, 0.5);
    }

    @keyframes rotate-circle {
    0% {
        transform: rotate(-45deg);
    }
    5% {
        transform: rotate(-45deg);
    }
    12% {
        transform: rotate(-405deg);
    }
    100% {
        transform: rotate(-405deg);
    }
    }
    @keyframes icon-line-tip {
    0% {
        width: 0;
        left: 1px;
        top: 19px;
    }
    54% {
        width: 0;
        left: 1px;
        top: 19px;
    }
    70% {
        width: 50px;
        left: -8px;
        top: 37px;
    }
    84% {
        width: 17px;
        left: 21px;
        top: 48px;
    }
    100% {
        width: 25px;
        left: 14px;
        top: 45px;
    }
    }
    @keyframes icon-line-long {
    0% {
        width: 0;
        right: 46px;
        top: 54px;
    }
    65% {
        width: 0;
        right: 46px;
        top: 54px;
    }
    84% {
        width: 55px;
        right: 0px;
        top: 35px;
    }
    100% {
        width: 47px;
        right: 8px;
        top: 38px;
    }
    }

</style>
