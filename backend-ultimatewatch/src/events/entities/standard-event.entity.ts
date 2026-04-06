import { EventType } from 'src/common/enums/event.type.enum';
import { Event } from './event.entity';
import { ChildEntity } from 'typeorm';

@ChildEntity(EventType.STANDARD)
export class StandardEvent extends Event {}
