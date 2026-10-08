import {it,expect} from 'vitest';
import {blankDraft,blankItem} from './model';
import {confirmationPayload,getCollarConfiguration,getOrderConfiguration,toItem} from './configuration';
import {selectNameDecoration} from './personalization';
it('round trips a collar through the domain and excludes UI state from confirmation',()=>{
 const d=blankDraft();d.current=selectNameDecoration({...blankItem('+1 555 123 4567'),pet_name:'Lola'},'heart');d.items=[d.current];d.step='personalization';
 expect(toItem(getCollarConfiguration(d.current))).toEqual(d.current);
 const payload=confirmationPayload(d);expect(payload.p_items[0].personalization_type).toBe('decoration');expect(payload.p_items[0].decorationIcon).toBe('heart');expect(payload).not.toHaveProperty('step');expect(payload.p_items[0]).not.toHaveProperty('accordionOpen');
});
it('represents multiple collars as independent domain entities',()=>{const d=blankDraft();d.items=[{...blankItem(),pet_name:'Lola'},{...blankItem(),pet_name:'Max'}];expect(getOrderConfiguration(d).collars.map(c=>c.tag.petName)).toEqual(['Lola','Max']);});
