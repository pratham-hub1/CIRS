import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../src/common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../../src/common/decorators/public.decorator';
import { HealthController } from '../../src/modules/health/health.controller';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { UsersController } from '../../src/modules/users/users.controller';
import { FilesController } from '../../src/modules/files/files.controller';
import { ItemsController } from '../../src/modules/items/items.controller';
import { SearchController } from '../../src/modules/search/search.controller';
import { NotificationsController } from '../../src/modules/notifications/notifications.controller';
import { MatchingController } from '../../src/modules/matching/matching.controller';
import { ClaimsController } from '../../src/modules/claims/claims.controller';
import { VerificationController } from '../../src/modules/verification/verification.controller';
import { LifecycleController } from '../../src/modules/lifecycle/lifecycle.controller';
import { AdminController } from '../../src/modules/admin/admin.controller';

describe('INT-4: RBAC Completeness - Route-Role Declaration Structural Check', () => {
  const reflector = new Reflector();

  // All controllers registered in the application
  const controllers = [
    HealthController,
    AuthController,
    UsersController,
    FilesController,
    ItemsController,
    SearchController,
    NotificationsController,
    MatchingController,
    ClaimsController,
    VerificationController,
    LifecycleController,
    AdminController,
  ];

  it('every route in registered controllers must explicitly declare @Roles() or @Public()', () => {
    const violations: string[] = [];

    for (const controller of controllers) {
      const prototype = controller.prototype as any;
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (prop) => prop !== 'constructor' && typeof prototype[prop] === 'function',
      );

      for (const methodName of methodNames) {
        const handler = prototype[methodName];
        const isPublic = reflector.get<boolean>(IS_PUBLIC_KEY, handler);
        const roles = reflector.get<string[]>(ROLES_KEY, handler);

        // Also check controller-level annotations
        const controllerPublic = reflector.get<boolean>(IS_PUBLIC_KEY, controller);
        const controllerRoles = reflector.get<string[]>(ROLES_KEY, controller);

        const hasAccessDeclaration =
          Boolean(isPublic) ||
          Boolean(controllerPublic) ||
          Boolean(roles && roles.length > 0) ||
          Boolean(controllerRoles && controllerRoles.length > 0);

        if (!hasAccessDeclaration) {
          violations.push(
            `${controller.name}.${methodName} does not declare @Roles() or @Public()`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
