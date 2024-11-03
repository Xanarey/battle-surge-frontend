import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
    constructor() {
        this.client = null;
    }

    connect(headers = {}) {
        this.client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: headers,
            debug: function (str) {
                console.log(str);
            },
        });

        this.client.onConnect = (frame) => {
            console.log('WebSocket подключен');
            console.log('Информация о соединении:', frame);
        };

        this.client.onStompError = (frame) => {
            console.error('Ошибка STOMP:', frame);
        };

        this.client.activate();
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            console.log('WebSocket отключен');
        }
    }

    subscribe(destination, callback) {
        if (this.client && this.client.connected) {
            return this.client.subscribe(destination, callback);
        }
    }

    unsubscribe(subscription) {
        if (subscription) {
            subscription.unsubscribe();
        }
    }
}

export default new WebSocketService();
