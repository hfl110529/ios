const assert=require('node:assert/strict');
const L=require('../Web/engine.js');
const now=new Date(2026,10,4,10,15);
const cases=[
 ['昨天午饭花了28元',2800,'expense','餐饮','2026-11-03T10:15'],
 ['昨天下午三点买咖啡花了二十八元',2800,'expense','餐饮','2026-11-03T15:00'],
 ['今天收到工资6000元',600000,'income','工资','2026-11-04T10:15'],
 ['11月2号晚上八点半打车35块8毛',3580,'expense','交通','2026-11-02T20:30'],
 ['2026年10月31日18:45买书59.90元',5990,'expense','学习','2026-10-31T18:45'],
 ['前天上午九点一刻买药一百零五元六角七分',10567,'expense','医疗','2026-11-02T09:15'],
 ['今天下午三点三刻电影票四十二块五',4250,'expense','娱乐','2026-11-04T15:45'],
 ['上周一收到红包两百元',20000,'income','红包','2026-10-26T10:15'],
 ['午饭28.50',2850,'expense','餐饮','2026-11-04T10:15'],
 ['退款了28元',2800,'income','其他','2026-11-04T10:15'],
 ['房租1.5万元',1500000,'expense','居家','2026-11-04T10:15'],
 ['公交五毛钱',50,'expense','交通','2026-11-04T10:15'],
 ['午饭十元五十分',1050,'expense','餐饮','2026-11-04T10:15'],
 ['咖啡二十八点五元',2850,'expense','餐饮','2026-11-04T10:15'],
];
let failures=[];for(const [input,amount,type,category,time] of cases){try{const got=L.parseSpeech(input,now);assert.deepEqual([got.amount,got.type,got.category,got.time],[amount,type,category,time],input);}catch(e){failures.push(e.message);}}
if(failures.length)throw new Error(failures.join('\n'));
assert.equal(L.toCents('0.01'),1);assert.equal(L.toCents('12.30'),1230);assert.equal(L.toCents('99999999.99'),9999999999);
['0','-1','1.234','1e3','NaN',''].forEach(n=>assert.equal(L.toCents(n),null));
assert(!L.validDate('2026-02-30T10:00'));assert(L.validDate('2028-02-29T23:59'));assert(!L.validDate('2101-01-01T00:00'));
assert(L.parseSpeech('2月30日买咖啡28元',now).warnings.some(s=>s.includes('日期')));
assert(L.parseSpeech('买咖啡20元又买书30元',now).warnings.some(s=>s.includes('多个')));
assert.equal(L.parseSpeech('今天去散步',now).amount,null);
const record={id:'1',amount:2850,type:'expense',category:'餐饮',note:'午饭',time:'2026-11-03T12:30',source:'voice'};
assert.equal(L.validate(record),'');assert(L.validate({...record,amount:1.5}));assert(L.validate({...record,time:'2026-02-30T12:30'}));
const records=[record,{...record,id:'2',type:'income',category:'工资',amount:600000,time:'2026-11-01T09:00'},{...record,id:'3',amount:3500,time:'2026-10-31T18:00'}];
const selected=L.filter(records,L.monthRange('2026-11'),'all','');assert.equal(selected.length,2);assert.equal(L.summary(selected).balance,597150);
assert.equal(L.filter(records,{start:'2026-11-03',end:'2026-11-03'},'expense','午饭').length,1);
assert.equal(L.filter(records,L.monthRange('2026-11'),'income','').length,1);
const csv=L.csv([{...record,note:'=HYPERLINK("bad")\n测试,逗号'}]);assert(csv.startsWith('\uFEFF'));assert(csv.includes("'=HYPERLINK"));assert(csv.includes('""bad""'));assert(csv.includes('28.50'));
assert(L.validateStore({version:1,records}));assert(!L.validateStore({version:1,records:[record,record]}));assert(!L.validateStore({version:1,records:[{...record,amount:-1}]}));
console.log('PASS: 14 Chinese voice examples, exact currency, dates, filters, summaries, duplicate validation and Excel-safe UTF-8 CSV.');
