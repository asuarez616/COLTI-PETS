import assert from 'node:assert/strict';
import {normalizeSvg} from './normalize-svg.mjs';
const env={...process.env,PYTHON_BIN:'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'};
const body=svg=>({target:'closure',data:Buffer.from(svg).toString('base64')});
for(const svg of ['<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" fill="red"/></svg>','<svg viewBox="0 0 10000 10000"><rect x="4000" y="4000" width="100" height="50" stroke="blue" fill="none"/></svg>','<svg stroke="blue" fill="none" viewBox="0 0 100 100"><circle cx="50" cy="50" r="20"/></svg>','<svg width="30" height="70"><path d="M5 5L20 60" stroke="black" stroke-width="2" fill="none"/></svg>']){const result=await normalizeSvg(process.cwd(),env,body(svg));assert.ok(Buffer.from(result.data,'base64').length>100);}
for(const svg of ['<svg viewBox="0 0 100 100" opacity="0"><circle r="20"/></svg>','<svg><script>alert(1)</script></svg>','<svg onload="alert(1)"><circle r="3"/></svg>','<svg><image href="https://example.com/x"/></svg>','<!DOCTYPE svg><svg/>','<svg><path fill="url(https://example.com/x)" d="M0 0L2 2"/></svg>'])await assert.rejects(()=>normalizeSvg(process.cwd(),env,body(svg)));
console.log('PASS: SVG geometry normalization and malicious content rejection');

const corel=`<?xml version="1.0"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 100 100" style="shape-rendering:geometricPrecision;fill-rule:evenodd"><defs><style><![CDATA[.fil0 {fill:#718FC8}]]></style></defs><g><metadata/><path class="fil0" d="M10 10L90 10L90 90Z"/></g></svg>`;
assert.ok((await normalizeSvg(process.cwd(),env,body(corel))).normalizedIcon);
console.log('PASS: supplied CorelDRAW SVG import');

const raster={target:'catalog',data:Buffer.from([137,80,78,71,13,10,26,10,255,128]).toString('base64')};assert.equal((await normalizeSvg(process.cwd(),env,raster)).data,raster.data);
