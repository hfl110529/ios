(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Ledger = factory();
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';
  const expenseCategories = ['餐饮','交通','购物','娱乐','居家','医疗','学习','其他'];
  const incomeCategories = ['工资','兼职','理财','红包','报销','其他'];
  const defaults = { budget: 250000, theme: 'pikachu', preferOffline: false };
  const pad = n => String(n).padStart(2,'0');
  function localDate(d) { return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function localTime(d) { return localDate(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes()); }
  function money(cents) { return (cents/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function toCents(value) {
    const s=String(value).trim();
    if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(s)) return null;
    const parts=s.split('.'), result=Number(parts[0])*100+Number(((parts[1]||'')+'00').slice(0,2));
    return Number.isSafeInteger(result) && result>0 && result<=9999999999 ? result : null;
  }
  function validDate(value) {
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
    const d=new Date(value);
    return Number.isFinite(d.getTime()) && localTime(d)===value && d.getFullYear()>=1970 && d.getFullYear()<=2100;
  }
  function validate(record) {
    if(!Number.isSafeInteger(record.amount)||record.amount<=0||record.amount>9999999999) return '请输入正确金额，最多两位小数';
    if(!['expense','income'].includes(record.type)) return '请选择收入或支出';
    if(!(record.type==='expense'?expenseCategories:incomeCategories).includes(record.category)) return '请选择正确分类';
    if(!validDate(record.time)) return '请选择 1970—2100 年之间的有效日期和时间';
    if(typeof record.note!=='string'||record.note.length>120) return '备注最多 120 个字';
    return '';
  }
  function cnNumber(input) {
    let s=String(input).replace(/两/g,'二').replace(/〇/g,'零');
    if(/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
    const scaled=s.match(/^(\d+(?:\.\d+)?)([百千万亿])$/);
    if(scaled) return Number(scaled[1])*{'百':100,'千':1000,'万':10000,'亿':100000000}[scaled[2]];
    const digits={'零':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
    if(s.includes('点')) { const [a,b]=s.split('点'); if(!b||!/^[零一二三四五六七八九]+$/.test(b)) return NaN; return cnNumber(a)+Number('0.'+Array.from(b).map(c=>digits[c]).join('')); }
    if(/^[零一二三四五六七八九]+$/.test(s)) return Number(Array.from(s).map(c=>digits[c]).join(''));
    if(!/^[零一二三四五六七八九十百千万亿]+$/.test(s)) return NaN;
    let total=0, section=0, digit=0;
    for(const c of s) {
      if(c in digits) digit=digits[c];
      else if(c==='万'||c==='亿') { section+=digit; digit=0; if(c==='万') {total+=section*10000;section=0;} else {total=(total+section)*100000000;section=0;} }
      else { const u={'十':10,'百':100,'千':1000}[c];section+=(digit||1)*u;digit=0; }
    }
    return total+section+digit;
  }
  const num='(?:\\d+(?:\\.\\d{1,2})?[百千万亿]?|[零〇一二两三四五六七八九十百千万亿点]+)';
  function speechAmount(text) {
    const regex=new RegExp('('+num+')(?:块钱|块|元|圆)','g');
    const values=[];let match;
    while((match=regex.exec(text))) {
      let amount=cnNumber(match[1]);
      const tail=text.slice(regex.lastIndex), sub=tail.match(new RegExp('^('+num+')(?:毛|角)(?:('+num+')分)?')), fen=tail.match(new RegExp('^('+num+')分(?!钟)')), short=tail.match(/^([零〇一二两三四五六七八九\d])(?:钱)?(?=$|[，。,！!]|买|吃|喝|的|左右|用于)/);
      if(sub) amount+=cnNumber(sub[1])/10+(sub[2]?cnNumber(sub[2])/100:0);
      else if(fen) amount+=cnNumber(fen[1])/100;
      else if(short) amount+=cnNumber(short[1])/10;
      const cents=Math.round(amount*100);
      if(Number.isSafeInteger(cents)&&cents>0&&cents<=9999999999) values.push(cents);
    }
    if(!values.length) {
      const currency=text.match(/(?:人民币|¥|￥)\s*(\d{1,8}(?:\.\d{1,2})?)/);
      if(currency) {const cents=toCents(currency[1]);if(cents) values.push(cents);}
    }
    if(!values.length) {
      const jiao=text.match(new RegExp('('+num+')(?:毛|角)(?:('+num+')分)?'));
      if(jiao) {const cents=Math.round(cnNumber(jiao[1])*10+(jiao[2]?cnNumber(jiao[2]):0));if(cents>0&&Number.isSafeInteger(cents))values.push(cents);}
    }
    if(!values.length) {
      let stripped=text.replace(/\d{4}[年\/.\-]\d{1,2}[月\/.\-]\d{1,2}[日号]?/g,'').replace(new RegExp('(?:'+num+')月(?:'+num+')[日号]?','g'),'').replace(new RegExp('(?:'+num+')[点时](?:(?:'+num+')分?|半|一刻|三刻)?','g'),'').replace(/\d{1,2}[:：]\d{1,2}/g,'');
      const matches=Array.from(stripped.matchAll(new RegExp(num,'g')));
      if(matches.length) {
        const amount=cnNumber(matches[matches.length-1][0]), cents=Math.round(amount*100);
        if(Number.isSafeInteger(cents)&&cents>0&&cents<=9999999999) values.push(cents);
      }
    }
    return { amount:values.length?values[0]:null, multiple:values.length>1 };
  }
  function parseSpeech(raw, now) {
    now=now?new Date(now):new Date();
    const text=String(raw||'').trim(), compact=text.replace(/\s/g,'');
    let when=new Date(now); const warnings=[];
    const type=/(收入|到账|收款|收到|工资|奖金|报销|赚了|红包|转入|退款|返现|退回)/.test(compact)?'income':'expense';
    const amounts=speechAmount(compact);
    if(!amounts.amount) warnings.push('没有听清金额，请补充');
    if(amounts.multiple) warnings.push('听到了多个金额，请核对本次要保存的金额');
    let explicitDate=false;
    const full=compact.match(/(\d{4})[年\/.\-](\d{1,2})[月\/.\-](\d{1,2})[日号]?/);
    const md=compact.match(new RegExp('('+num+')月('+num+')[日号]?'));
    if(full||md) {
      const year=full?Number(full[1]):now.getFullYear(), month=full?Number(full[2]):cnNumber(md[1]), day=full?Number(full[3]):cnNumber(md[2]);
      const candidate=new Date(year,month-1,day,now.getHours(),now.getMinutes());
      if(candidate.getFullYear()===year && candidate.getMonth()===month-1 && candidate.getDate()===day && year>=1970&&year<=2100) {when=candidate;explicitDate=true;} else warnings.push('日期无效，请手动选择');
    } else {
      const relative=compact.match(/大前天|前天|昨天|今天|明天/);
      if(relative) {when.setDate(when.getDate()+{'大前天':-3,'前天':-2,'昨天':-1,'今天':0,'明天':1}[relative[0]]);explicitDate=true;}
      else {
        const week=compact.match(/(上|本|这)?(?:周|星期)([一二三四五六日天])/);
        if(week) {const offset={'一':0,'二':1,'三':2,'四':3,'五':4,'六':5,'日':6,'天':6}[week[2]];when.setDate(when.getDate()-(when.getDay()+6)%7+offset-(week[1]==='上'?7:0));explicitDate=true;}
      }
    }
    const period=compact.match(/凌晨|早上|上午|中午|下午|傍晚|晚上/);
    const clockNumber='[零〇一二两三四五六七八九十\\d]+';
    let clock=compact.match(new RegExp('('+clockNumber+')[点时](?:(半|一刻|三刻)|('+clockNumber+')分?)?'));
    if(clock&&/^(?:元|块|圆)/.test(compact.slice(clock.index+clock[0].length))) clock=null;
    const colon=compact.match(/(\d{1,2})[:：](\d{1,2})/);
    if(!clock&&colon) clock=[colon[0],colon[1],null,colon[2]];
    if(clock) {
      let hour=cnNumber(clock[1]), minute=clock[2]?{'半':30,'一刻':15,'三刻':45}[clock[2]]:clock[3]?cnNumber(clock[3]):0;
      if(period&&['下午','傍晚','晚上'].includes(period[0])&&hour<12) hour+=12;
      if(period&&period[0]==='中午'&&hour<11) hour+=12;
      if(period&&period[0]==='凌晨'&&hour===12) hour=0;
      if(hour>=0&&hour<=23&&minute>=0&&minute<=59) when.setHours(hour,minute,0,0);else warnings.push('时间无效，请手动选择');
    } else if(period) {
      when.setHours({'凌晨':1,'早上':8,'上午':10,'中午':12,'下午':15,'傍晚':18,'晚上':19}[period[0]],0,0,0);
      warnings.push('未说明具体钟点，时间可在下方调整');
    } else if(explicitDate) when.setSeconds(0,0);
    let category='其他';
    const mapping=type==='expense'?[
      ['交通',/公交|地铁|打车|出租|滴滴|车费|加油|停车|高铁|机票/],['医疗',/医院|看病|买药|挂号|药费|体检/],['学习',/买书|书费|学费|课程|培训|文具/],['居家',/房租|水费|电费|燃气|物业|话费|网费/],['餐饮',/吃饭|早餐|午饭|晚饭|午餐|晚餐|外卖|咖啡|奶茶|火锅|面包|水果|零食|餐费/],['娱乐',/电影|游戏|门票|旅游|唱歌|会员/],['购物',/购物|衣服|鞋|淘宝|京东|超市|日用|买/]
    ]:[['报销',/报销/],['工资',/工资|薪水|奖金/],['兼职',/兼职|外快|稿费/],['理财',/利息|理财|分红/],['红包',/红包|礼金/]];
    for(const [name,re] of mapping) if(re.test(compact)) {category=name;break;}
    return {amount:amounts.amount,type,category,time:localTime(when),note:text.slice(0,120),source:'voice',warnings};
  }
  function monthRange(month) {
    if(!/^\d{4}-\d{2}$/.test(month)) return null;
    const [year,m]=month.split('-').map(Number);
    if(year<1970||year>2100||m<1||m>12) return null;
    return {start:month+'-01',end:month+'-'+pad(new Date(year,m,0).getDate()),label:year+' 年 '+m+' 月'};
  }
  function filter(records, range, type, search) {
    const term=String(search||'').trim().toLowerCase();
    return records.filter(r=>(!range||(r.time.slice(0,10)>=range.start&&r.time.slice(0,10)<=range.end))&&(!type||type==='all'||r.type===type)&&(!term||(r.note+' '+r.category+' '+(r.amount/100).toFixed(2)).toLowerCase().includes(term))).sort((a,b)=>b.time.localeCompare(a.time)||b.id.localeCompare(a.id));
  }
  function summary(records) {
    let expense=0,income=0;const categories={};
    records.forEach(r=>{if(r.type==='expense'){expense+=r.amount;categories[r.category]=(categories[r.category]||0)+r.amount;}else income+=r.amount;});
    return {expense,income,balance:income-expense,count:records.length,categories:Object.entries(categories).sort((a,b)=>b[1]-a[1])};
  }
  function csvCell(value) {
    let text=String(value);
    if(/^[\s]*[=+\-@\t\r]/.test(text)) text="'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  }
  function csv(records) {
    const rows=[['日期时间','类型','分类','金额（元）','备注','录入方式']];
    records.slice().sort((a,b)=>a.time.localeCompare(b.time)).forEach(r=>rows.push([r.time.replace('T',' '),r.type==='expense'?'支出':'收入',r.category,(r.amount/100).toFixed(2),r.note,r.source==='voice'?'语音':'手动']));
    return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
  }
  function validateStore(data) {
    if(!data||data.version!==1||!Array.isArray(data.records)||data.records.length>50000) return false;
    const ids=new Set();
    return data.records.every(r=>typeof r.id==='string'&&r.id.length<100&&!ids.has(r.id)&&(ids.add(r.id),true)&&!validate(r)&&['manual','voice'].includes(r.source));
  }
  return {expenseCategories,incomeCategories,defaults,localDate,localTime,money,toCents,validDate,validate,cnNumber,parseSpeech,monthRange,filter,summary,csv,validateStore};
});
