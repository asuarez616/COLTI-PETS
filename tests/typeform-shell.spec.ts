import {test,expect} from './fixture-catalog';

test('the question frame stays anchored and transitions smoothly on mobile, iPad and web',async({page})=>{
 for(const width of [393,768,1024,1440]){
  const height=width===768?1024:width===1024?768:900;
  await page.setViewportSize({width,height});
  await page.goto('/');
  await page.evaluate(async()=>{
   const {blankDraft}=await import('/src/domain/model.ts');
   const draft=blankDraft();
   draft.customer={name:'Lola Example',phone:'+1 555 123 4567'};
   draft.step='customer-name';
   sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));
  });
  await page.reload();
  await expect(page.locator('.flow[data-flow-step="customer-name"]')).toBeVisible();
  const before=await page.evaluate(()=>{
   const content=document.querySelector('.flow-content')!;
   const heading=document.querySelector('.flow-title h1')!.getBoundingClientRect();
   const input=document.querySelector('.flow-content .big-input')!.getBoundingClientRect();
   const actions=document.querySelector('.flow-actions')!.getBoundingClientRect();
   return {contentTop:content.offsetTop,questionGap:input.top-heading.bottom,actionsBottom:actions.bottom,scrollWidth:document.documentElement.scrollWidth};
  });
  await page.locator('.flow-content .big-input').fill('Lola Example');
  await page.locator('.flow-actions .primary').click();
  await expect(page.locator('.flow[data-flow-step="customer-phone"]')).toBeVisible();
  const after=await page.evaluate(()=>{
   const content=document.querySelector('.flow-content')!;
   const actions=document.querySelector('.flow-actions')!.getBoundingClientRect();
   return {contentTop:content.offsetTop,actionsBottom:actions.bottom,animation:getComputedStyle(content).animationName,scrollWidth:document.documentElement.scrollWidth};
  });
  expect(Math.abs(after.contentTop-before.contentTop),`content start shifted at ${width}x${height}: ${before.contentTop} -> ${after.contentTop}`).toBeLessThanOrEqual(3);
  expect(before.questionGap,`prompt and response separated at ${width}x${height}`).toBeGreaterThanOrEqual(20);
  expect(before.questionGap,`prompt and response separated at ${width}x${height}`).toBeLessThanOrEqual(48);
  expect(Math.abs(after.actionsBottom-before.actionsBottom),`actions shifted at ${width}x${height}: ${before.actionsBottom} -> ${after.actionsBottom}`).toBeLessThanOrEqual(3);
  expect(after.animation).toBe('configurator-step-enter');
  expect(after.scrollWidth).toBeLessThanOrEqual(width+1);
 }
});

test('choice steps keep their prompt and answer together at the visual center',async({page})=>{
 for(const [width,height] of [[393,844],[834,1112],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const step of ['size','width','lettering']){
   await page.goto('/');
   await page.evaluate(async step=>{
    const {blankDraft}=await import('/src/domain/model.ts');
    const draft=blankDraft();draft.step=step as typeof draft.step;
    draft.current.size_code='ML';draft.current.width_cm=2.5;draft.current.tag_type='hanging';draft.current.tagShape='bone';
    sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));
   },step);
   await page.reload();
   const flow=page.locator(`.flow[data-flow-step="${step}"]`);
   await expect(flow).toBeVisible();
   if(step==='size')await expect(flow.locator('.size-grid')).toBeVisible();
   if(step==='width')await expect(flow.locator('.flow-content .options')).toBeVisible();
   if(step==='lettering')await expect(flow.locator('.lettering-quick')).toBeVisible();
   const alignment=await flow.evaluate(node=>{
    const question=node.querySelector('.flow-question')!.getBoundingClientRect();
    const title=node.querySelector('.flow-title')!.getBoundingClientRect();
    const answer=node.querySelector('.flow-content')!.getBoundingClientRect();
    return {questionCenter:(question.top+question.bottom)/2,groupCenter:(title.top+answer.bottom)/2,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   expect(Math.abs(alignment.groupCenter-alignment.questionCenter),`${step} prompt/answer group should be centered at ${width}×${height}`).toBeLessThanOrEqual(5);
   expect(alignment.overflow,`${step} must not create horizontal overflow at ${width}×${height}`).toBe(false);
  }
 }
});

test('the desktop hero keeps one full-height frame through every configurator step',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 const heights:number[]=[];
 for(const step of ['customer-name','size','width','design','fastening','tag-type','tag-shape','pet-name','tag-phone','tag-details','lettering','personalization','review','order-summary']){
  await page.goto('/');
  await page.evaluate(async step=>{
   const {blankDraft}=await import('/src/domain/model.ts');
   const draft=blankDraft();draft.step=step as typeof draft.step;
   draft.current.size_code='ML';draft.current.width_cm=2.5;draft.current.tag_type='hanging';
   sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));
  },step);
  await page.reload();
  await expect(page.locator(`.flow[data-flow-step="${step}"]`)).toBeVisible();
  const frame=await page.locator('main.configurator-layout').evaluate(main=>{
   const hero=main.querySelector('.story')!,carousel=hero.querySelector('.editorial-carousel')!;
   const m=main.getBoundingClientRect(),h=hero.getBoundingClientRect(),c=carousel.getBoundingClientRect();
  return {mainTop:m.top,mainBottom:m.bottom,mainLeft:m.left,mainRight:m.right,heroTop:h.top,heroBottom:h.bottom,carouselTop:c.top,carouselBottom:c.bottom};
  });
  expect(Math.abs(frame.mainLeft),`${step} shell should start at the viewport edge`).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.mainRight-1440),`${step} shell should use the viewport width`).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.heroTop-frame.mainTop),`${step} hero starts below the shared frame`).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.heroBottom-frame.mainBottom),`${step} hero ends before the shared frame`).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.carouselTop-frame.mainTop),`${step} photo starts below the shared frame`).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.carouselBottom-frame.mainBottom),`${step} photo ends before the shared frame`).toBeLessThanOrEqual(1);
  heights.push(frame.heroBottom-frame.heroTop);
 }
 expect(Math.max(...heights)-Math.min(...heights)).toBeLessThanOrEqual(1);
});

test('the desktop hero frame remains full-height at short and tall viewport heights',async({page})=>{
 for(const viewport of [{width:1280,height:720},{width:1920,height:1080}]){
  await page.setViewportSize(viewport);
  await page.goto('/');
  await page.evaluate(async()=>{
   const {blankDraft}=await import('/src/domain/model.ts');
   const draft=blankDraft();draft.step='size';sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));
  });
  await page.reload();
  const frame=await page.locator('main.configurator-layout').evaluate(main=>{
   const hero=main.querySelector('.story')!,carousel=hero.querySelector('.editorial-carousel')!;
   const m=main.getBoundingClientRect(),h=hero.getBoundingClientRect(),c=carousel.getBoundingClientRect();
   return {viewportWidth:innerWidth,mainLeft:m.left,mainRight:m.right,mainTop:m.top,mainBottom:m.bottom,heroTop:h.top,heroBottom:h.bottom,carouselTop:c.top,carouselBottom:c.bottom};
  });
  expect(Math.abs(frame.mainLeft),`${viewport.width}x${viewport.height} shell left edge`).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.mainRight-frame.viewportWidth),`${viewport.width}x${viewport.height} shell width`).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.heroTop-frame.mainTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.heroBottom-frame.mainBottom)).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.carouselTop-frame.mainTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.carouselBottom-frame.mainBottom)).toBeLessThanOrEqual(1);
 }
});

test('every step separates its progress bar from the header consistently',async({page})=>{
 for(const viewport of [{width:390,height:844},{width:1024,height:1366},{width:1440,height:900}]){
  await page.setViewportSize(viewport);
  for(const step of ['size','design','review','order-summary']){
   await page.goto('/');
   await page.evaluate(async step=>{
    const {blankDraft}=await import('/src/domain/model.ts');
    const draft=blankDraft();draft.step=step as typeof draft.step;
    draft.current.size_code='ML';draft.current.width_cm=2.5;draft.current.tag_type='hanging';
    sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));
   },step);
   await page.reload();
   await expect(page.locator(`.flow[data-flow-step="${step}"]`)).toBeVisible();
   const gap=await page.locator('.flow-progress').evaluate(progress=>progress.getBoundingClientRect().top-document.querySelector('.site-header')!.getBoundingClientRect().bottom);
   expect(gap,`${step} progress/header gap at ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(15);
   expect(gap,`${step} progress/header gap at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(25);
  }
 }
});
