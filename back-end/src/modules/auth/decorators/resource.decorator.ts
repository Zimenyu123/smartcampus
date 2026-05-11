import { applyDecorators, SetMetadata } from '@nestjs/common'

import { ObjectLiteral, ObjectType, Repository } from 'typeorm'

const RESOURCE_KEY = '__resource_key__'

export type Condition<E extends ObjectLiteral = any> = (Repository: Repository<E>, items: number[], user: any) => Promise<boolean>

export interface ResourceObject { entity: ObjectType<any>, condition: Condition }
export function Resource<E extends ObjectLiteral = any>(entity: ObjectType<E>, condition?: Condition<E>) {
  return applyDecorators(SetMetadata(RESOURCE_KEY, { entity, condition }))
}
