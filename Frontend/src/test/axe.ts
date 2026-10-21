import * as axe from 'axe-core';

/**
 * Runs axe-core against a rendered container.
 *
 * `color-contrast` is disabled because jsdom has no layout/paint engine and
 * cannot compute real colours, and `region` is disabled because component-level
 * tests render fragments rather than full pages with landmarks. Both rules are
 * still exercised in the manual audit checklist.
 */
export async function runAxe(container: HTMLElement): Promise<axe.AxeResults> {
  return axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });
}
