import {test as base} from '@playwright/test';
/** Historical UX tests use their explicit two-design fixtures.
 * Real Drive filtering, saving and EN/ES flows are covered separately by
 * drive-catalog.spec.ts and phase-21.spec.ts, without this interception.
 */
export const test=base.extend({page:async({page},use)=>{
 await page.route('**/src/catalog/drive.ts*',route=>route.fulfill({contentType:'application/javascript',body:'export const driveDesigns=[];'}));
 await use(page);
}});
export {expect} from '@playwright/test';
export type {Page,Locator} from '@playwright/test';
