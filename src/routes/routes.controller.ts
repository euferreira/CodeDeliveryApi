import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';
import { Producer } from '@nestjs/microservices/external/kafka.interface';

@Controller('routes')
export class RoutesController implements OnModuleInit {
  constructor(
    private readonly routesService: RoutesService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  private kafkaProducer: Producer;
  private logger: Logger = new Logger('RoutesController');

  async onModuleInit() {
    this.kafkaProducer = await this.kafkaClient.connect();
  }

  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  @Get()
  findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routesService.update(+id, updateRouteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routesService.remove(+id);
  }

  @Get(':id/start')
  startRoute(@Param('id') id: string) {
    this.kafkaProducer.send({
      topic: 'route.new-direction',
      messages: [{
        key: 'route.new-direction',
        value: JSON.stringify({
          routeId: id,
          clientId: '',
        }),
      }],
    });

    this.logger.debug('Route started (⁰⊖⁰)');

    return {
      status: 'ok',
    }
  }

  @MessagePattern('route.new-position')
  consumeNewPosition(
    @Payload()
    message: {
      value: {
        routeId: string;
        clientId: string;
        position: [number, number];
        finished: boolean;
      };
    },
  ) {
    this.logger.debug('New position received (⁰⊖⁰)');
    this.logger.debug(message.value);
  }
}
