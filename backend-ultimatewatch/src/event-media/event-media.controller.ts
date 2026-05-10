import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { EventMediaService } from './event-media.service';
import { UpdateSortOrderDto } from './dto/update-sort-order-dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('event-media')
export class EventMediaController {
  constructor(private readonly eventMediaService: EventMediaService) {}

  @Patch('sort-order')
  @UseGuards(AuthGuard)
  async updateSortOrder(
    @GetUser('userId') userId: number,
    @Body() updateSortOrderDto: UpdateSortOrderDto,
  ): Promise<{ message: string }> {
    await this.eventMediaService.updateSortOrder(userId, updateSortOrderDto);

    return { message: 'Order changed correctly!' };
  }
}
