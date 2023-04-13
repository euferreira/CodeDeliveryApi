import { Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Producer } from 'kafkajs';
import { Server, Socket } from 'socket.io';
import { RoutesService } from '../routes.service';

@WebSocketGateway()
export class RoutesGateway
  implements
    OnModuleInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit
{
  private kafkaProducer: Producer;
  private logger: Logger = new Logger('RoutesGateway');
  private clients = [];

  @WebSocketServer() server: Server;

  constructor(
    private readonly routesService: RoutesService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  onModuleInit() {
    const io = require('socket.io')(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'], // Especifique os métodos permitidos
        //allowedHeaders: ['my-custom-header'], // Especifique os cabeçalhos permitidos
        //credentials: true, // Se você estiver usando autenticação com credenciais, defina como true
      },
    });

    this.server.on('connection', (socket: Socket) => {
      this.logger.debug('Client connected HERE HANDLE CONNECTION (^_^)');
      const { id } = socket;
      this.clients.push(id);
    });
  }

  async afterInit(server: any) {
    try {
      this.logger.debug('Connecting to Kafka >.<');
      this.kafkaProducer = await this.kafkaClient.connect();
      this.logger.debug('Connected to Kafka XD');
    } catch (error) {
      this.logger.error('Error on socket.io connection: ' + error);
    }
  }

  handleDisconnect(client: any) {
    this.logger.debug('Client disconnected HERE HANDLE DISCONNECT =(');    
    this.clients = [];
  }

  handleConnection(client: any, ...args: any[]) {
    this.logger.debug('Client connected HERE HANDLE CONNECTION =)');
  }

  @SubscribeMessage('new-direction')
  handleMessage(client: Socket, payload: { routeId: string }) {
    this.kafkaProducer.send({
      topic: 'route.new-direction',
      messages: [
        {
          key: 'route.new-direction',
          value: JSON.stringify({
            routeId: payload.routeId,
            clientId: client.id,
          }),
        },
      ],
    });
    console.log(payload.routeId);
  }

  async sendPosition(data: {
    routeId: string;
    clientId: string;
    position: [number, number];
    finished: boolean;
  }) {
    this.server.emit('new-position', data);
  }
}
