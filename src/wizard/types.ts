/**
 * Wizard step surface used by standalone onboard flows (e.g. web model auth).
 * Kept separate from `session.ts`'s gateway-driven step shape to avoid coupling.
 */
export type WizardStep = {
  title: string;
  description: string;
  run: () => Promise<void>;
};
