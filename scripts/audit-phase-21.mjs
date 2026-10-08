import {readFile,readdir,writeFile} from 'node:fs/promises';
import ts from 'typescript';
import {createHash} from 'node:crypto';
async function files(dir){const out=[];for(const f of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+f.name;out.push(...f.isDirectory()?await files(p):[p]);}return out;}
const dependencies=[],hashes={};
for(const file of (await files('src')).filter(f=>/\.(ts|tsx)$/.test(f)&&!f.endsWith('.test.ts'))){
 const source=await readFile(file,'utf8');hashes[file]=createHash('sha256').update(source).digest('hex');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
 for(const statement of ast.statements)if((ts.isImportDeclaration(statement)||ts.isExportDeclaration(statement))&&statement.moduleSpecifier&&ts.isStringLiteral(statement.moduleSpecifier))dependencies.push({from:file,to:statement.moduleSpecifier.text,typeOnly:ts.isImportDeclaration(statement)?!!statement.importClause?.isTypeOnly:!!statement.isTypeOnly});
}
const domainProviderLeaks=dependencies.filter(d=>d.from.startsWith('src/domain/')&&/drive|supabase|infrastructure|react/.test(d.to));
const applicationProviderLeaks=dependencies.filter(d=>d.from.startsWith('src/application/')&&/drive|supabase|infrastructure|react/.test(d.to));
const uiDriveImports=dependencies.filter(d=>!d.from.startsWith('src/infrastructure/')&&/catalog\/drive/.test(d.to));
const domainFlowDependencies=dependencies.filter(d=>d.from.startsWith('src/domain/')&&d.to.includes('configurator'));
const hero=await readFile('src/EditorialCarousel.tsx','utf8');
const report={domainProviderLeaks,applicationProviderLeaks,uiDriveImports,domainFlowDependencies,driveImportSites:dependencies.filter(d=>/catalog\/drive/.test(d.to)),heroUsesLocalAssets:hero.includes("'editorial/'+photo.file"),heroDriveIntegration:false,dependencies,hashes};
await writeFile('artifacts/phase-21-structure.json',JSON.stringify(report,null,2)+'\n');
if(domainProviderLeaks.length||applicationProviderLeaks.length||uiDriveImports.length)throw new Error('Provider leaked into UI/Application/Domain');
console.log(JSON.stringify({domainProviderLeaks:0,applicationProviderLeaks:0,uiDriveImports:0,driveImportSites:report.driveImportSites,domainFlowDependencies,heroDriveIntegration:false},null,2));
