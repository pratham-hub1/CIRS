import { Reflector, ModulesContainer } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { ROLES_KEY } from '../../src/common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../../src/common/decorators/public.decorator';

describe('INT-4: RBAC Completeness - Route-Role Declaration Structural Check', () => {
  const reflector = new Reflector();
  let controllers: any[] = [];

  beforeAll(async () => {
    // REV-6: Dynamically enumerate all controllers from the Nest route/module registry
    // Overrides PrismaService so no live DB connection is needed during structural scanning
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const modulesContainer = moduleRef.get(ModulesContainer);
    for (const module of modulesContainer.values()) {
      for (const wrapper of module.controllers.values()) {
        if (wrapper.metatype && !controllers.includes(wrapper.metatype)) {
          controllers.push(wrapper.metatype);
        }
      }
    }
  });

  it('REV-6: dynamically discovers all controllers from Nest application registry', () => {
    expect(controllers.length).toBeGreaterThan(0);
    const controllerNames = controllers.map((c) => c.name);
    expect(controllerNames).toContain('AuthController');
    expect(controllerNames).toContain('ItemsController');
    expect(controllerNames).toContain('AdminController');
  });

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
