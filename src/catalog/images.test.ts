import {describe,it,expect} from 'vitest';
import {responsiveAsset} from './images';
describe('responsive images preserve source identity and publication boundaries',()=>{
 it('uses measured dimensions and smaller variants for local catalogue assets',()=>{const image=responsiveAsset('/catalog/CH-17-1.png');expect(image?.width).toBe(1254);expect(image?.height).toBe(1254);expect(image?.srcSet).toContain('CH-17-1-240.webp 240w');});
 it('does not invent variants for unknown catalogue products',()=>{expect(responsiveAsset('/catalog/new-product.png')).toBeUndefined();});
 it('does not request unpublished variants from Supabase',()=>{expect(responsiveAsset('https://example.test/storage/v1/object/public/catalog-images/CH-17-1.png','test-v1')).toBeUndefined();});
 it('uses the original bucket directory once publication has completed',()=>{const image=responsiveAsset('https://example.test/storage/v1/object/public/catalog-images/CH-17-1.png','responsive-v1');expect(image?.src).toBe('https://example.test/storage/v1/object/public/catalog-images/CH-17-1-1254.webp');});
});
