import { SetMetadata } from '@nestjs/common';
import type { Action, Module } from '../constants/permissions';

export const PERMISSION_KEY = 'required_permission';

export interface RequiredPermission {
  module: Module;
  action: Action;
}

export const RequirePermission = (
  module: Module,
  action: Action,
): MethodDecorator & ClassDecorator => SetMetadata(PERMISSION_KEY, { module, action });
