import {describe,it,expect} from 'vitest';
import {blankDraft} from '../domain/model';
import {fixtureDesigns,fixtureFonts} from '../data/fixtures';
import {parseDraft} from '../domain/validation';
import {selectTagShape,getAvailableWidths,getAvailableDesigns,getAvailableTagSizes} from '../domain/rules';
import {canContinue,getNextStep,getPreviousStep,getProgress,getVisibleSteps,stepsConfig,type StepContext} from './steps';
const context=():StepContext=>({draft:blankDraft(),designs:fixtureDesigns,fonts:fixtureFonts,catalogReady:true});
describe('semantic flow and durable draft migration',()=>{
 it.each([1,2])('migrates every old step in version %s without changing data',version=>{for(let step=0;step<=16;step++){const d=blankDraft(),result=parseDraft({...d,version,step});expect(result.version).toBe(3);expect(stepsConfig.some(s=>s.id===result.step)).toBe(true);expect(result.current).toEqual(d.current);if(step===12||step===13)expect(result.step).toBe('personalization');}});
 it('Hanging and Anti-fall have inverse forward/back navigation and matching progress',()=>{for(const tag of ['hanging','anti_fall'] as const){const c=context();c.draft.current.tag_type=tag;const visible=getVisibleSteps(c);for(let index=0;index<visible.length;index++){c.draft.step=visible[index].id;expect(getNextStep(c)).toBe(visible[index+1]?.id||visible[index].id);expect(getPreviousStep(c)).toBe(visible[index-1]?.id||visible[index].id);const p=getProgress(c);expect(p.percent).toBe(p.current/p.total*100);}c.draft.step='tag-type';const typeProgress=getProgress(c);expect(typeProgress.total).toBe(10);if(tag==='hanging'){c.draft.step='tag-shape';expect(getProgress(c)).toEqual(typeProgress);}}});
 it('editing customer information returns to the order; a new order goes to size',()=>{const c=context();c.draft.step='customer-phone';expect(getNextStep(c)).toBe('size');c.draft.items=[c.draft.current];expect(getNextStep(c)).toBe('order-summary');});
 it('requires both shape and dimensions; auto-selects single sizes and clears stale sizes',()=>{const c=context();c.draft.step='tag-shape';expect(canContinue(c)).toBe(false);c.draft.current=selectTagShape(c.draft.current,'circle');expect(canContinue(c)).toBe(true);c.draft.current=selectTagShape(c.draft.current,'bone');expect(c.draft.current.tagSize).toBeUndefined();expect(canContinue(c)).toBe(false);});
 it('validation and catalogue readiness use the same step source',()=>{const c=context();c.draft.step='customer-name';expect(canContinue(c)).toBe(false);c.draft.customer.name='Ana';expect(canContinue(c)).toBe(true);c.draft.step='lettering';expect(canContinue(c)).toBe(true);c.catalogReady=false;expect(canContinue(c)).toBe(false);});
 it('domain inventory is centralized',()=>{expect(getAvailableWidths('M')).toEqual([2.5]);expect(getAvailableTagSizes('circle')).toHaveLength(1);expect(getAvailableTagSizes('crown')).toHaveLength(0);expect(getAvailableDesigns(fixtureDesigns,'M',2.5,'woven').every(d=>d.type==='woven')).toBe(true);});
});
