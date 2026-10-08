import {it,expect} from 'vitest';
import {orderDate} from './orderDate';
it('shows a full English date without time in Orders',()=>{expect(orderDate('2026-10-06T16:05:00')).toBe('October 6, 2026');});
