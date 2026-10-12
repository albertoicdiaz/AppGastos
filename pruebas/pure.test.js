// Pruebas de las funciones puras de index.html (bloque PURE-START/PURE-END).
// Uso: node pruebas/pure.test.js [ruta a index.html]
const fs=require('fs'),path=require('path'),assert=require('assert');
const file=process.argv[2]||path.join(__dirname,'..','index.html');
const html=fs.readFileSync(file,'utf8');
const code=html.split('/*PURE-START*/')[1].split('/*PURE-END*/')[0];
const F=new Function(code+';return {autoCat,parseAmount,normDate,normPhone,calcSplit,parseLines,CATS,RULES,findDupes,sueldoFor,monthStats,calcBoleta,parseReceipt,buildReceiptRequest,receiptFromApi,parseBankMail,bankKey};')();
let ok=0,fail=0;const t=(n,f)=>{try{f();ok++}catch(e){fail++;console.log('FALLA',n,e.message)}};
const eq=assert.deepStrictEqual;
t('montos',()=>{eq(F.parseAmount('12.500'),12500);eq(F.parseAmount('12.500,00'),12500);eq(F.parseAmount('12500.50'),12501);eq(F.parseAmount('$ 1.234.567'),1234567);eq(F.parseAmount('abc'),0);eq(F.parseAmount(''),0);});
t('fechas',()=>{eq(F.normDate('2026-10-09','x'),'2026-10-09');eq(F.normDate('9/10/2026','x'),'2026-10-09');eq(F.normDate('2026-1-5','x'),'2026-01-05');eq(F.normDate('ayer','x'),'x');});
t('telefonos',()=>{eq(F.normPhone('+56 9 1234 5678'),'56912345678');eq(F.normPhone('912345678'),'56912345678');eq(F.normPhone('12345678'),'56912345678');eq(F.normPhone(''),'');});
t('categorias',()=>{eq(F.autoCat('STARBUCKS'),'Comida');eq(F.autoCat('Uber Eats'),'Comida');eq(F.autoCat('Uber Trip'),'Transporte');eq(F.autoCat('Jumbo Costanera'),'Supermercado');eq(F.autoCat('Netflix'),'Suscripciones');eq(F.autoCat('Cruz Verde'),'Salud');eq(F.autoCat('xyz'),'Otros');eq(F.autoCat(),'Otros');});
t('cat validas',()=>F.RULES.forEach(([c])=>assert(c in F.CATS,c)));
t('division igual bug 18.700',()=>{const r=F.calcSplit({mode:'equal',total:85000,tip:10},[1,2,3,4,5].map(id=>({id})));eq(r.parts,[18700,18700,18700,18700,18700]);eq(r.grand,93500);});
t('division igual redondeo arriba',()=>{const r=F.calcSplit({mode:'equal',total:10000,tip:0},[{id:1},{id:2},{id:3}]);eq(r.parts,[3334,3334,3334]);});
t('division sin personas',()=>{eq(F.calcSplit({mode:'equal',total:1000,tip:10},[]).parts,[]);});
t('division consumo',()=>{const r=F.calcSplit({mode:'consumo',tip:10,amounts:{a:10000,b:5000}},[{id:'a'},{id:'b'}]);eq(r.parts,[11000,5500]);eq(r.grand,16500);});
t('importar lineas',()=>{const r=F.parseLines('2026-10-09;12500;Starbucks\n12.500|Jumbo\n\n09/10/2026\t3.990,00\tUber Eats Santiago\nbasura\n0;nada','2026-10-01');eq(r,[{date:'2026-10-09',amount:12500,merchant:'Starbucks'},{date:'2026-10-01',amount:12500,merchant:'Jumbo'},{date:'2026-10-09',amount:3990,merchant:'Uber Eats Santiago'}]);});

// Validación
t('repetidos',()=>{
  const L=[{id:'a',amount:5000,date:'2026-10-08',note:'Café'},{id:'b',amount:5000,date:'2026-10-09',rev:false,src:'wallet'},
           {id:'c',amount:7000,date:'2026-10-09',rev:false},{id:'d',amount:5000,date:'2026-10-20',rev:false},
           {id:'e',amount:7000,date:'2026-10-10',rev:false}];
  eq(F.findDupes(L),{b:'a',e:'c'});
});
t('repetidos cruzando mes',()=>{eq(F.findDupes([{id:'a',amount:1,date:'2026-09-30'},{id:'b',amount:1,date:'2026-10-01',rev:false}]),{b:'a'});});
// Sueldo
t('sueldo por mes',()=>{const s={'2026-08':1500000,'2026-10':1800000};eq(F.sueldoFor(s,'2026-09'),1500000);eq(F.sueldoFor(s,'2026-10'),1800000);eq(F.sueldoFor(s,'2026-07'),0);eq(F.sueldoFor({},'2026-10'),0);});
t('torta con sueldo',()=>{
  const L=[{amount:300000,cat:'Hogar',date:'2026-10-01'},{amount:100000,cat:'Comida',date:'2026-10-05'},{amount:50000,cat:'Comida',date:'2026-10-06'},{amount:9,cat:'Ocio',date:'2026-09-30'}];
  const r=F.monthStats(L,'2026-10',1000000);
  eq(r.total,450000);eq(r.libre,550000);eq(Math.round(r.pctSueldo),45);
  eq(r.slices.map(s=>[s.cat,s.amount,Math.round(s.pct)]),[['Hogar',300000,30],['Comida',150000,15],['Disponible',550000,55]]);
});
t('torta gasto mayor que sueldo',()=>{const r=F.monthStats([{amount:1200,cat:'Ocio',date:'2026-10-01'}],'2026-10',1000);eq(r.libre,-200);eq(r.slices.length,1);eq(r.slices[0].pct,100);eq(r.pctSueldo,120);});
t('torta sin sueldo',()=>{const r=F.monthStats([{amount:100,cat:'Ocio',date:'2026-10-01'},{amount:300,cat:'Hogar',date:'2026-10-02'}],'2026-10',0);eq(r.slices.map(s=>s.pct),[75,25]);});
// Boleta
const P=[{id:'me'},{id:'a'},{id:'b'}];
t('boleta reparte y propina 10%',()=>{
  const items=[{name:'Pisco sour',qty:2,unit:4500,who:['me','a']},{name:'Lomo',qty:1,unit:12900,who:['b']},{name:'Papas',qty:1,unit:6000,who:['me','a','b']}];
  const r=F.calcBoleta(items,P,10,'27.900');
  eq(r.subtotal,27900);eq(r.bases,[6500,6500,14900]);eq(r.parts,[7150,7150,16390]);eq(r.match,'sin');eq(r.unassigned,0);eq(r.grand,30690);
  eq(F.calcBoleta(items,P,10,'30.690').match,'con');
  const bad=F.calcBoleta(items,P,10,'28.900');eq(bad.match,null);eq(bad.diff,1000);
});
t('boleta sin asignar',()=>{const r=F.calcBoleta([{name:'Agua',qty:1,unit:2000,who:[]},{name:'X',qty:1,unit:1000,who:['zz']}],P,10,'');eq(r.unassigned,3000);eq(r.parts,[0,0,0]);eq(r.match,null);});
t('leer boleta',()=>{
  const txt=`RESTAURANT EL BUEN SABOR
RUT 76.123.456-7
BOLETA ELECTRONICA N° 12345
Mesa 4  Garzón: Pedro
2 PISCO SOUR 4.500 9.000
1 LOMO A LO POBRE 12.900
3 x 2.000 BEBIDA 6.000
PAPAS FRITAS 6.000
SUBTOTAL 33.900
PROPINA SUGERIDA 10% 3.390
TOTAL 33.900
TOTAL CON PROPINA 37.290
TARJETA DEBITO 37.290`;
  const r=F.parseReceipt(txt);
  eq(r.items,[{name:'PISCO SOUR',qty:2,unit:4500},{name:'LOMO A LO POBRE',qty:1,unit:12900},{name:'BEBIDA',qty:3,unit:2000},{name:'PAPAS FRITAS',qty:1,unit:6000}]);
  eq([r.subtotal,r.propina,r.total,r.totalTip],[33900,3390,33900,37290]);
});
t('leer boleta vacia',()=>{eq(F.parseReceipt('').items,[]);});
// Lectura automática
t('pedido a Claude',()=>{
  const b=F.buildReceiptRequest('AAAA','image/jpeg');
  eq(b.model,'claude-opus-5-5');eq(b.fallbacks,'default');eq(b.output_config.format.type,'json_schema');
  eq(b.messages[0].content[0],{type:'image',source:{type:'base64',media_type:'image/jpeg',data:'AAAA'}});
  assert(!('thinking' in b));
});
t('respuesta de Claude',()=>{
  const d={items:[{nombre:'Pisco sour',cantidad:2,precio_unitario:4500,total_linea:9000},{nombre:'Lomo',cantidad:1,precio_unitario:0,total_linea:12900},{nombre:'',cantidad:1,precio_unitario:1,total_linea:1}],subtotal:21900,propina:2190,total:21900,total_con_propina:24090};
  const r=F.receiptFromApi({stop_reason:'end_turn',content:[{type:'thinking',thinking:''},{type:'text',text:JSON.stringify(d)}]});
  eq(r.items,[{name:'Pisco sour',qty:2,unit:4500},{name:'Lomo',qty:1,unit:12900}]);eq([r.total,r.totalTip,r.propina],[21900,24090,2190]);
});
t('respuesta con error',()=>{
  assert.throws(()=>F.receiptFromApi({stop_reason:'refusal',content:[]}),/no pudo/);
  assert.throws(()=>F.receiptFromApi({type:'error',error:{message:'overloaded'}}),/overloaded/);
  assert.throws(()=>F.receiptFromApi({stop_reason:'max_tokens',content:[]}),/cortada/);
});
// Correos de Banco de Chile
const MAIL='Alberto Ignacio Calvo Diaz:\n\nTe informamos que se ha realizado una compra por $1.000 con Tarjeta de Crédito ****1284 en EXPRESS VALDIVIA CTO el 11/10/2026 19:08.\n\nRevisa Saldos y Movimientos en App Mi Banco';
t('correo banco ejemplo',()=>{
  eq(F.parseBankMail(MAIL),[{date:'2026-10-11',time:'19:08',amount:1000,card:'1284',tipo:'credito',merchant:'EXPRESS VALDIVIA CTO',key:'bch|2026-10-11 19:08|1000|1284'}]);
});
t('correo banco html y reenviado',()=>{
  const html='<p>Te informamos que se ha realizado una compra por <b>$45.990</b> con Tarjeta de Cr&eacute;dito ****1284 en<br>FALABELLA PLAZA EGANA el 2/9/2026 9:05.</p>';
  const r=F.parseBankMail(html);eq(r.length,1);eq([r[0].amount,r[0].merchant,r[0].date,r[0].time],[45990,'FALABELLA PLAZA EGANA','2026-09-02','09:05']);
  const fwd='---------- Forwarded message ---------\n> Te informamos que se ha realizado una compra\n> por $1.000 con Tarjeta de Crédito ****1284 en\n> EXPRESS VALDIVIA CTO el 11/10/2026 19:08.';
  eq(F.parseBankMail(fwd).map(x=>x.merchant),['EXPRESS VALDIVIA CTO']);
});
t('correo banco varios y repetidos',()=>{
  const r=F.parseBankMail(MAIL+'\n'+MAIL+'\nTe informamos que se ha realizado una compra por $12.500 con Tarjeta de Débito ****9876 en UBER TRIP el 12/10/2026 08:30.');
  eq(r.map(x=>[x.amount,x.tipo,x.merchant]),[[1000,'credito','EXPRESS VALDIVIA CTO'],[12500,'debito','UBER TRIP']]);
});
t('correo banco que no es compra',()=>{eq(F.parseBankMail('Te informamos que se ha realizado una transferencia por $5.000'),[]);eq(F.parseBankMail(''),[]);});
// Script de Gmail (integraciones/correo-bancochile.gs) con Gmail simulado
t('script de gmail',()=>{
  let gs=fs.readFileSync(path.join(__dirname,'..','integraciones','correo-bancochile.gs'),'utf8').replace("'CAMBIA-ESTA-CLAVE';","'secreta';");
  let query='';
  const msg={getId:()=>'m1',getDate:()=>new Date('2026-10-11T22:08:00Z'),getPlainBody:()=>MAIL,getBody:()=>''};
  const GmailApp={search:(q)=>{query=q;return [{getMessages:()=>[msg]}];}};
  const ContentService={MimeType:{JSON:'json'},createTextOutput:t=>({setMimeType:()=>({getContent:()=>t})})};
  const doGet=new Function('GmailApp','ContentService','Logger',gs+';return doGet;')(GmailApp,ContentService,{log(){}});
  eq(JSON.parse(doGet({parameter:{token:'x'}}).getContent()),{error:'clave incorrecta'});
  const d=JSON.parse(doGet({parameter:{token:'secreta',dias:'7'}}).getContent());
  eq(query,'from:enviodigital@bancochile.cl "compra por" newer_than:7d');
  eq(d.correos.flatMap(c=>F.parseBankMail(c.texto)).map(x=>x.amount),[1000]);
});
console.log(`${ok} pruebas OK, ${fail} fallas`);process.exit(fail?1:0);
