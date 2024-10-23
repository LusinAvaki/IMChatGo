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
            showSmileys: false,
            feedbackVisible: false,
            feedbackText: '',
            rating: 0,
            stars: [1, 2, 3, 4, 5],
            leaveChatVisible: false,
            isCustomer: false,
            userId: '',
            chineseNames: [
                '李静', '王芳', '张丽', '刘娜', '陈媛',
                '杨梅', '黄娟', '赵婷', '周莉', '吴敏',
                '蔡琳', '谢娟', '任雪', '杜娟', '马丽'
            ],
        };
    },
    mounted() {
        this.loadIsCustomerFlag();
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
        getRandomChineseName() {
            const randomIndex = Math.floor(Math.random() * this.chineseNames.length);
            return this.chineseNames[randomIndex];
        },
        startChat() {
            if (this.email && this.username) {
                this.chatVisible = true;
                if (this.username == "customer") {
                    this.setIsCustomer(true)
                    this.username = this.getRandomChineseName();
                } else {
                    this.setIsCustomer(false)
                }
            } else {
                alert("Please enter your email and username.");
            }
        },
        sendMessage() {
            if (this.message.trim() !== '') {
                const messageData = {
                    userId: this.isCustomer ? 'customer' : "other",
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
                        userId: this.isCustomer ? 'customer' : "other",
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
                        userId: this.isCustomer ? 'customer' : "other",
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
        },
        openFeedbackModal() {
            if (this.feedbackText || this.rating) {
                alert("Feedback is already submitted.")
            } else {
                this.feedbackVisible = true;
                this.feedbackText = '';
                this.rating = 0;
            }

        },
        closeFeedbackModal() {
            this.feedbackVisible = false;
        },
        setRating(star) {
            this.rating = star;
        },
        sendFeedback() {
            if (this.feedbackText.trim() == '' && !this.rating) {
                alert("Please provide your feedback.");
            } else {
                const feedbackData = {
                    username: this.username,
                    feedback: this.feedbackText,
                    rating: this.rating,
                    timestamp: new Date().toLocaleString()
                };
                this.closeFeedbackModal();
            }

        },
        openLeaveChatModal() {
            this.leaveChatVisible = true;
        },
        closeLeaveChatModal() {
            this.leaveChatVisible = false;
        },
        leaveChat() {
            this.closeLeaveChatModal();
            this.chatVisible = false;
            location.reload();
        },
        loadIsCustomerFlag() {
            const flag = sessionStorage.getItem('isCustomer');
            if (flag !== null) {
                this.isCustomer = JSON.parse(flag); 
            }
        },
        setIsCustomer(flag) {
            this.isCustomer = flag;
            sessionStorage.setItem('isCustomer', JSON.stringify(flag)); 
        },
    }
});
