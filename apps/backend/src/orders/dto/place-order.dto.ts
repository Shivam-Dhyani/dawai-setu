import { IsArray, IsString, IsInt, IsPositive, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderLineItemDto {
  @IsString()
  medicineId: string;

  @IsInt()
  @IsPositive()
  neededQty: number;

  @IsString()
  pharmacyBatchId: string; // which pharmacy batch to draw from
}

export class PlaceOrderSubOrderDto {
  @IsString()
  pharmacyId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderLineItemDto)
  lineItems: OrderLineItemDto[];
}

export class PlaceOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => PlaceOrderSubOrderDto)
  subOrders: PlaceOrderSubOrderDto[];
}
