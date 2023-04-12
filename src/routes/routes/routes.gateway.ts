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
import { Server } from 'socket.io';
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
    io.on('connect', (socket: any) => {
      this.logger.debug('Client connected');
      socket.on('disconnect', () => {
        this.logger.debug('Client disconnected');
      });
    });
    if (io) {
      this.logger.debug('Socket.io connected');
    }
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
    this.logger.debug('Client disconnected =(');
  }

  handleConnection(client: any, ...args: any[]) {
    this.logger.debug('Client connected HERE HANDLE CONNECTION =)');
    
  }

  @SubscribeMessage('new-direction')
  handleMessage(client: any, payload: any) {
    /*this.kafkaProducer.send({
      topic: 'route.new-direction',
      messages: [{
        key: 'route.new-direction',
        value: JSON.stringify({
          routeId: id,
          clientId: '',
        }),
      }],
    });*/
    console.log(payload);
  }
}
