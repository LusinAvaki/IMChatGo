new Vue({
    el: '#app',
    data() {
        return {
            ws: null,
            message: '',
            messages: [],
            chatVisible: false,
            email: '',
            username: '',
            showSmileys: false
        };
    },
    mounted() {
        this.connect();
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        connect() {
            this.ws = new WebSocket('ws://localhost:8080/ws');
            this.ws.onmessage = (event) => {
                // To add audio when there is a notification of a message
                
                // const audio = document.getElementById('message-sound');
                // audio.play();
                const data = JSON.parse(event.data);
                this.messages.push(data);
                
                this.$nextTick(() => {
                    const messagesDiv = this.$refs.messages;
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                });
            };
        },
        startChat() {
            if (this.email && this.username) {
                this.chatVisible = true;
            } else {
                alert("Please enter your email and username.");
            }
        },
        sendMessage() {
            if (this.message.trim() !== '') {
                const messageData = { 
                    username: this.username, 
                    content: this.message, 
                    type: 'text',
                    timestamp: new Date().toLocaleString()
                };
                this.ws.send(JSON.stringify(messageData));
                this.message = '';
            }
        },
        sendImage(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = { 
                        username: this.username, 
                        content: e.target.result, 
                        type: 'image',
                        timestamp: new Date().toLocaleString()
                    };
                    this.ws.send(JSON.stringify(imageData));
                };
                reader.readAsDataURL(file);
            }
            event.target.value = ''; 
        },
        sendFile(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileData = { 
                        username: this.username, 
                        content: e.target.result, 
                        type: 'file', 
                        filename: file.name,
                        timestamp: new Date().toLocaleString() 
                    };
                    this.ws.send(JSON.stringify(fileData));
                };
                reader.readAsDataURL(file); 
            }
            event.target.value = '';
        },
        toggleSmileys() {
            this.showSmileys = !this.showSmileys;
        },
        addSmiley(smiley) {
            this.message += smiley; 
            this.showSmileys = false; 
            this.$nextTick(() => {
                this.$refs.messageInput.focus();
            });
        },
        handleClickOutside(event) {
            const smileyPicker = this.$el.querySelector('.smiley-picker');
            const smileyIcon = this.$el.querySelector('.smile-icon');
            if (this.showSmileys && !smileyPicker.contains(event.target) && !smileyIcon.contains(event.target)) {
                this.showSmileys = false; 
            }
        }
    }
});
