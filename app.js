
let sb=null,products=[],sales=[],customers=[],suppliers=[],orders=[],returnsRows=[];let customerSort={key:null,dir:1};const $=id=>document.getElementById(id);const money=n=>Number(n||0).toLocaleString('ar-LY',{maximumFractionDigits:2})+' د.ل';
function toast(m){let x=document.createElement('div');x.className='toast';x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),2200)}
const VERONZA_SUPABASE_URL='https://xmllfoqisxpgzjgxmxng.supabase.co';
const VERONZA_SUPABASE_KEY='sb_publishable_Lg2q4OLoflhhJKVrfPbOew_MAbH-r82';
function cfg(){return {url:VERONZA_SUPABASE_URL,key:VERONZA_SUPABASE_KEY}}
function normalizeSupabaseUrl(raw){let url=String(raw||'').trim().replace(/\/$/,'');let m=url.match(/^https?:\/\/supabase\.com\/dashboard\/project\/([a-z0-9]+)(?:\/.*)?$/i);if(m)url='https://'+m[1]+'.supabase.co';return url}
function saveConfig(){location.reload()}
function showView(id){document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.v===id));document.querySelectorAll('.vp-bottom-nav button[data-v]').forEach(x=>x.classList.toggle('active',x.dataset.v===id));document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===id));window.scrollTo({top:0,behavior:'smooth'});if(id==='orders')renderOrders();if(id==='returns')renderReturns();if(id==='customers')renderCustomers()}
let realtimeChannel=null,loadTimer=null,loadingAll=false;
function scheduleLoadAll(){clearTimeout(loadTimer);loadTimer=setTimeout(()=>loadAll(),350)}
function startRealtime(){if(!sb||realtimeChannel)return;realtimeChannel=sb.channel('veronza-live').on('postgres_changes',{event:'*',schema:'public',table:'products'},scheduleLoadAll).on('postgres_changes',{event:'*',schema:'public',table:'sales'},scheduleLoadAll).on('postgres_changes',{event:'*',schema:'public',table:'customers'},scheduleLoadAll).on('postgres_changes',{event:'*',schema:'public',table:'suppliers'},scheduleLoadAll).on('postgres_changes',{event:'*',schema:'public',table:'orders'},scheduleLoadAll).on('postgres_changes',{event:'*',schema:'public',table:'returns'},scheduleLoadAll).subscribe(status=>{if(status==='SUBSCRIBED')toast('تم تفعيل التحديث المباشر');if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.warn('Realtime status:',status)})}
function stopRealtime(){if(realtimeChannel&&sb){sb.removeChannel(realtimeChannel)}realtimeChannel=null}
function makeSupabaseClient(c){return window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,experimental:{passkey:true}}})}
async function registerVeronzaPasskey(){try{if(!sb)throw Error('سجّل الدخول أولاً');if(!window.PublicKeyCredential||!navigator.credentials)throw Error('هذا الجهاز/المتصفح لا يدعم Passkey');let {data,error}=await sb.auth.registerPasskey({friendlyName:'Veronza Face ID'});if(error)throw error;toast('تم تفعيل Face ID لهذا الحساب');return {ok:true,data}}catch(e){console.error(e);toast('تعذر تفعيل Face ID: '+(e.message||'خطأ'));return {ok:false,error:e}}}
async function passkeyLogin(silent=false){try{if(!window.PublicKeyCredential||!navigator.credentials){if(!silent)$('loginMsg').textContent='هذا الجهاز/المتصفح لا يدعم Passkey';return false}let c=cfg();sb=makeSupabaseClient(c);let {data,error}=await sb.auth.signInWithPasskey();if(error)throw error;if(!data?.session)throw Error('لم يتم إنشاء جلسة الدخول');$('login').style.display='none';startRealtime();await loadAll();toast('تم الدخول بـ Face ID بنجاح');return true}catch(e){console.error(e);if(!silent)$('loginMsg').textContent='تعذر الدخول بـ Face ID: '+(e.message||'حاول مرة أخرى');return false}}
function ensurePasskeyButton(){if(document.getElementById('vzRegisterPasskey'))return;let box=document.createElement('div');box.style='position:fixed;right:14px;left:14px;bottom:calc(env(safe-area-inset-bottom) + 14px);z-index:9998;display:flex;justify-content:center;pointer-events:none';let b=document.createElement('button');b.id='vzRegisterPasskey';b.textContent='🔐 تفعيل الدخول بـ Face ID';b.style='pointer-events:auto;border:0;border-radius:14px;padding:12px 18px;background:#caa76a;color:#171513;font-weight:800;box-shadow:0 8px 25px rgba(0,0,0,.18)';b.onclick=async()=>{let r=await registerVeronzaPasskey();if(r&&r.ok)b.remove()};box.appendChild(b);document.body.appendChild(box)}
async function boot(){let c=cfg();if(!c){$('setup').style.display='flex';return}try{sb=makeSupabaseClient(c);sb.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){stopRealtime();location.reload()}else if(event==='SIGNED_IN'&&session){$('login').style.display='none';startRealtime();scheduleLoadAll()}});let {data:{session},error:sessionError}=await sb.auth.getSession();if(sessionError)throw sessionError;if(!session){$('login').style.display='flex';return}ensurePasskeyButton();document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>showView(b.dataset.v));let u=document.querySelector('.user');u.innerHTML='مرحباً بك <b>'+((session.user.email||'').split('@')[0])+' ⌄</b>';u.onclick=()=>sb.auth.signOut();await loadAll();startRealtime();ensurePasskeyButton()}catch(e){console.error(e);$('setup').style.display='flex';toast('تعذر الاتصال بـ Supabase: '+(e.message||'خطأ غير معروف'))}}
async function login(){try{let c=cfg();if(!c)throw Error('إعداد Supabase غير موجود');sb=makeSupabaseClient(c);let {error}=await sb.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});$('loginMsg').textContent=error?error.message:'تم الدخول';if(!error)location.reload()}catch(e){$('loginMsg').textContent=e.message||'تعذر تسجيل الدخول'}}
async function signup(){try{let c=cfg();if(!c)throw Error('إعداد Supabase غير موجود');sb=makeSupabaseClient(c);let {error}=await sb.auth.signUp({email:$('loginEmail').value.trim(),password:$('loginPassword').value});$('loginMsg').textContent=error?error.message:'تم إنشاء الحساب. تحقق من البريد إذا طلب منك ذلك.'}catch(e){$('loginMsg').textContent=e.message||'تعذر إنشاء الحساب'}}
async function loadAll(){if(!sb||loadingAll)return;loadingAll=true;try{let results=await Promise.allSettled([sb.from('products').select('*').order('created_at',{ascending:false}),sb.from('sales').select('*').order('created_at',{ascending:false}).limit(100),sb.from('customers').select('*').order('created_at',{ascending:false}),sb.from('suppliers').select('*').order('created_at',{ascending:false}),sb.from('orders').select('*').order('created_at',{ascending:false}).limit(100),sb.from('returns').select('*').order('created_at',{ascending:false}).limit(100)]);let names=['المنتجات','المبيعات','العملاء','الموردون','الطلبات','المرتجعات'],sets=[v=>products=v,v=>sales=v,v=>customers=v,v=>suppliers=v,v=>orders=v,v=>returnsRows=v];let errors=[];results.forEach((r,i)=>{if(r.status==='fulfilled'&&!r.value.error){sets[i](r.value.data||[])}else{let err=r.status==='rejected'?r.reason:r.value.error;errors.push(names[i]+': '+(err?.message||'خطأ في القراءة'))}});renderAll();if(errors.length)toast('تعذر تحديث '+errors.join('، '))}catch(e){console.error(e);toast('تعذر تحديث البيانات: '+(e.message||'خطأ غير معروف'))}finally{loadingAll=false}}
async function addProduct(){let p={barcode:String(Date.now()).slice(-8),name:$('pName').value.trim(),model:$('pModel').value.trim(),size:$('pSize').value.trim(),color:$('pColor').value.trim(),buy:+$('pBuy').value||0,sell:+$('pSell').value||0,qty:+$('pQty').value||0,min:+$('pMin').value||2};if(!p.name)return toast('اكتب اسم المنتج');let {error}=await sb.from('products').insert(p);if(error)return toast(error.message);['pName','pModel','pSize','pColor','pBuy','pSell','pQty'].forEach(id=>$(id).value='');toast('تمت إضافة المنتج — الباركود '+p.barcode);await loadAll()}
async function delProduct(id){if(!confirm('حذف المنتج؟'))return;let {error}=await sb.from('products').delete().eq('id',id);if(error)toast(error.message);else await loadAll()}
function printBarcode(id){let p=products.find(x=>x.id===id);if(!p)return;let w=window.open('','_blank');if(!w)return toast('اسمح بفتح النوافذ المنبثقة للطباعة');w.document.write('<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>Veronza - '+p.barcode+'</title><style>body{font-family:Arial;text-align:center;padding:20px}.brand{font-size:22px;font-weight:bold}.code{font-size:28px;letter-spacing:4px;margin:12px}.meta{font-size:14px}</style></head><body><div class="brand">Veronza</div><div>'+String(p.name).replace(/[<>]/g,'')+'</div><div class="code">'+p.barcode+'</div><div class="meta">'+(p.size||'')+' '+(p.color||'')+'</div></body></html>');w.document.close()}
function renderProducts(){let q=($('productSearch')?.value||'').toLowerCase();let a=products.filter(p=>Object.values(p).join(' ').toLowerCase().includes(q));$('productRows').innerHTML=a.length?a.map(p=>`<tr><td><b>${p.barcode}</b></td><td>${p.name}</td><td>${p.model||''}</td><td>${p.size||''}</td><td>${p.color||''}</td><td class="${p.qty<=p.min?'low':''}">${p.qty}</td><td>${money(p.buy)}</td><td>${money(p.sell)}</td><td><button onclick="printBarcode(${p.id})">طباعة</button> <button class="danger" onclick="delProduct(${p.id})">حذف</button></td></tr>`).join(''):`<tr><td colspan="9" class="empty">لا توجد منتجات</td></tr>`}
async function sell(){let bc=$('saleBarcode').value.trim(),q=+$('saleQty').value||1;if(!bc)return toast('أدخل أو امسح الباركود');let {data,error}=await sb.rpc('record_sale',{p_barcode:bc,p_qty:q,p_customer:$('saleCustomer').value.trim()||null});if(error)return toast(error.message);$('saleBarcode').value='';$('saleQty').value=1;$('saleCustomer').value='';toast('تم تسجيل البيع '+money(data.total));await loadAll()}
async function addCustomer(){let name=$('cName').value.trim();if(!name)return toast('اكتب اسم العميل');let {error}=await sb.from('customers').insert({name,phone:$('cPhone').value.trim(),address:$('cAddress').value.trim(),notes:$('cNotes').value.trim()});if(error)toast(error.message);else{['cName','cPhone','cAddress','cNotes'].forEach(id=>$(id).value='');toast('تمت إضافة العميل');await loadAll()}}
async function addSupplier(){let name=$('sName').value.trim();if(!name)return toast('اكتب اسم المورد');let {error}=await sb.from('suppliers').insert({name,phone:$('sPhone').value.trim()});if(error)toast(error.message);else{['sName','sPhone'].forEach(id=>$(id).value='');toast('تمت إضافة المورد');await loadAll()}}
let orderBusy=false;
function getOrderDisplayList(){
  return [...orders].sort((a,b)=>{
    const da=new Date(a.created_at||0).getTime(), db=new Date(b.created_at||0).getTime();
    if(da!==db) return da-db;
    return Number(a.id||0)-Number(b.id||0);
  });
}
function nextOrderDisplayNo(){return getOrderDisplayList().length+1}
async function addOrder(){
  if(orderBusy)return;
  let customer=$('oCustomer').value.trim(),phone=$('oPhone').value.trim(),address=$('oAddress').value.trim(),total=+$('oTotal').value||0;
  if(!customer)return toast('اكتب اسم العميل أولاً');
  if(!phone)return toast('اكتب رقم الهاتف أولاً');
  orderBusy=true;
  let btn=document.querySelector('button[onclick="addOrder()"]');
  if(btn)btn.disabled=true;
  try{
    // The database may contain old/non-sequential order_no values or a trigger may rewrite them.
    // We therefore use the record count for the new display sequence and render a clean sequence below.
    let nextNo=nextOrderDisplayNo();
    $('oNo').value=String(nextNo);
    let row={order_no:String(nextNo),customer,phone,address,total,status:$('oStatus').value||'جديد',delivery_status:$('oDelivery').value||'قيد التجهيز',notes:$('oNotes').value.trim()};
    let {error}=await sb.from('orders').insert(row);
    if(error)throw error;
    ['oNo','oCustomer','oPhone','oAddress','oTotal','oNotes'].forEach(id=>$(id).value='');
    $('oStatus').value='جديد';$('oDelivery').value='قيد التجهيز';
    toast('تمت إضافة الطلب رقم '+nextNo);
    await loadAll();
  }catch(e){toast(e.message||'تعذر إضافة الطلب')}
  finally{orderBusy=false;if(btn)btn.disabled=false}
}
async function updateOrder(id,field,value){let patch={};patch[field]=value;let {error}=await sb.from('orders').update(patch).eq('id',id);if(error)toast(error.message);else await loadAll()}
async function deleteOrder(id){if(!confirm('حذف الطلب؟'))return;let {error}=await sb.from('orders').delete().eq('id',id);if(error)toast(error.message);else await loadAll()}
async function addReturn(){let bc=$('rBarcode').value.trim(),q=+$('rQty').value||1;if(!bc)return toast('أدخل أو امسح الباركود');if(q<=0)return toast('الكمية غير صحيحة');let {data,error}=await sb.rpc('record_return',{p_barcode:bc,p_qty:q,p_customer:$('rCustomer').value.trim()||null,p_reason:$('rReason').value.trim()||null});if(error)return toast(error.message);['rBarcode','rCustomer','rReason'].forEach(id=>$(id).value='');$('rQty').value=1;toast('تم تسجيل المرتجع وإرجاع الكمية');await loadAll()}
function renderOrders(){
  let q=($('orderSearch')?.value||'').toLowerCase();
  let a=getOrderDisplayList();
  a=a.filter(o=>Object.values(o).join(' ').toLowerCase().includes(q));
  $('orderRows').innerHTML=a.length?a.map((o,i)=>{
    const displayNo=getOrderDisplayList().findIndex(x=>String(x.id)===String(o.id))+1;
    return `<tr><td><b>${displayNo}</b></td><td>${o.customer||'-'}</td><td>${o.phone||'-'}</td><td>${money(o.total)}</td><td><select onchange="updateOrder(${o.id},'status',this.value)"><option ${o.status==='جديد'?'selected':''}>جديد</option><option ${o.status==='قيد المعالجة'?'selected':''}>قيد المعالجة</option><option ${o.status==='مكتمل'?'selected':''}>مكتمل</option><option ${o.status==='ملغي'?'selected':''}>ملغي</option></select></td><td><select onchange="updateOrder(${o.id},'delivery_status',this.value)"><option ${o.delivery_status==='قيد التجهيز'?'selected':''}>قيد التجهيز</option><option ${o.delivery_status==='خرج للتوصيل'?'selected':''}>خرج للتوصيل</option><option ${o.delivery_status==='تم التسليم'?'selected':''}>تم التسليم</option><option ${o.delivery_status==='تعذر التسليم'?'selected':''}>تعذر التسليم</option></select></td><td>${new Date(o.created_at).toLocaleString('ar-LY')}</td><td><button class="danger" onclick="deleteOrder(${o.id})">حذف</button></td></tr>`}).join(''):`<tr><td colspan="8" class="empty">لا توجد طلبات</td></tr>`
}
function renderReturns(){$('returnRows').innerHTML=returnsRows.length?returnsRows.map(r=>`<tr><td>${new Date(r.created_at).toLocaleString('ar-LY')}</td><td>${r.barcode}</td><td>${r.product||''}</td><td>${r.qty}</td><td>${money(r.amount)}</td><td>${r.reason||'-'}</td></tr>`).join(''):`<tr><td colspan="6" class="empty">لا توجد مرتجعات</td></tr>`}
function renderCustomers(){let q=($('customerSearch')?.value||'').toLowerCase();let a=customers.filter(c=>(c.name+' '+(c.phone||'')).toLowerCase().includes(q));if(customerSort.key)a.sort((x,y)=>{let a=x[customerSort.key]??'',b=y[customerSort.key]??'';if(customerSort.key==='last_purchase_at'){a=a?new Date(a).getTime():0;b=b?new Date(b).getTime():0}return a>b?customerSort.dir:a<b?-customerSort.dir:0});$('customerRows').innerHTML=a.length?a.map(c=>`<tr><td><b>${c.name}</b></td><td>${c.phone||'-'}</td><td>${c.orders||0}</td><td>${money(c.total_purchases)}</td><td>${c.last_purchase_at?new Date(c.last_purchase_at).toLocaleDateString('ar-LY'):'-'}</td></tr>`).join(''):`<tr><td colspan="5" class="empty">لا يوجد عملاء</td></tr>`}
function sortCustomers(k){if(customerSort.key===k)customerSort.dir*=-1;else{customerSort.key=k;customerSort.dir=1}renderCustomers()}function clearCustomerFilter(){$('customerSearch').value='';customerSort={key:null,dir:1};renderCustomers()}
function renderAll(){
 let today=new Date(),todays=sales.filter(s=>new Date(s.created_at).toDateString()===today.toDateString());
 $('statProducts').textContent=products.length;
 $('statStock').textContent=money(products.reduce((s,p)=>s+(+p.buy||0)*(+p.qty||0),0));
 $('statSales').textContent=money(todays.reduce((s,x)=>s+(+x.total||0),0));
 let lows=products.filter(p=>p.qty<=p.min);
 $('statLow').textContent=lows.length;
 if($('lowList'))$('lowList').innerHTML=lows.length?lows.map(p=>`<div class="badge low">${p.name} — المتبقي ${p.qty}</div>`).join(' '):'لا توجد أصناف منخفضة.';
 if($('lowCount'))$('lowCount').textContent=lows.length;
 renderProducts();
 $('salesRows').innerHTML=sales.slice(0,30).map(s=>`<tr><td>${new Date(s.created_at).toLocaleString('ar-LY')}</td><td>${s.product}</td><td>${s.qty}</td><td>${money(s.total)}</td><td>${s.customer||'-'}</td></tr>`).join('')||`<tr><td colspan="5" class="empty">لا توجد مبيعات</td></tr>`;
 renderCustomers();renderOrders();renderReturns();
 $('supplierRows').innerHTML=suppliers.map(s=>`<tr><td>${s.name}</td><td>${s.phone||'-'}</td></tr>`).join('')||`<tr><td colspan="2" class="empty">لا يوجد موردون</td></tr>`;
 let repSales=sales.reduce((s,x)=>s+(+x.total||0),0),repProfit=sales.reduce((s,x)=>s+(+x.profit||0),0),repQty=sales.reduce((s,x)=>s+(+x.qty||0),0);
 $('repSales').textContent=money(repSales);$('repProfit').textContent=money(repProfit);$('repQty').textContent=repQty;
 let rs={};sales.forEach(s=>rs[s.product]=(rs[s.product]||0)+(+s.total||0));
 $('reportList').innerHTML=Object.entries(rs).map(([n,v])=>`<p><b>${n}</b> — ${money(v)}</p>`).join('')||'لا توجد بيانات';
 let now=new Date(),monthStart=new Date(now.getFullYear(),now.getMonth(),1);
 let monthTotal=sales.filter(x=>new Date(x.created_at)>=monthStart).reduce((a,x)=>a+(+x.total||0),0);
 if($('monthSales'))$('monthSales').textContent=money(monthTotal);
 if($('monthTrend'))$('monthTrend').textContent='مبيعات هذا الشهر';
 let recent=sales.slice(0,5);
 if($('recentRows'))$('recentRows').innerHTML=recent.length?recent.map(x=>`<tr><td>${new Date(x.created_at).toLocaleDateString('ar-LY')}</td><td><span class="status">بيع</span></td><td>${x.product||'-'}</td><td>${money(x.total)}</td></tr>`).join(''):`<tr><td colspan="4" class="empty-small">لا توجد عمليات</td></tr>`;
}
function exportData(){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({products,sales,customers,suppliers,orders,returns:returnsRows},null,2)],{type:'application/json'}));a.download='veronza-data.json';a.click()}
let activeStream=null,scanVideo=null,scanFrame=null;
async function openScanner(targetId){if(!navigator.mediaDevices?.getUserMedia)return toast('الكاميرا غير متاحة في هذا المتصفح');if(!('BarcodeDetector' in window))return toast('الآيفون لا يدعم قارئ الباركود المدمج هنا. اكتب الباركود يدويًا أو استخدم جهاز قارئ.');try{let d=new BarcodeDetector({formats:['code_128','code_39','ean_13','ean_8','upc_a','upc_e','itf']});activeStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});scanVideo=document.createElement('video');scanVideo.autoplay=true;scanVideo.playsInline=true;scanVideo.muted=true;Object.assign(scanVideo.style,{position:'fixed',inset:'8%',width:'84%',height:'58%',objectFit:'cover',zIndex:1001,background:'#000',borderRadius:'20px'});document.body.appendChild(scanVideo);let close=document.createElement('button');close.textContent='إغلاق';Object.assign(close.style,{position:'fixed',top:'10%',right:'10%',zIndex:1002,padding:'12px 18px',borderRadius:'14px',border:'0',background:'#fff'});close.onclick=closeScanner;document.body.appendChild(close);scanVideo.srcObject=activeStream;await scanVideo.play();let loop=async()=>{if(!scanVideo)return;try{let codes=await d.detect(scanVideo);if(codes[0]?.rawValue){$(targetId).value=codes[0].rawValue;toast('تم التقاط الباركود');closeScanner();return}}catch(e){}scanFrame=requestAnimationFrame(loop)};loop()}catch(e){closeScanner();toast('تعذر تشغيل الكاميرا. اسمح بالوصول للكاميرا')}}
function closeScanner(){if(scanFrame)cancelAnimationFrame(scanFrame);scanFrame=null;if(activeStream){activeStream.getTracks().forEach(t=>t.stop());activeStream=null}if(scanVideo){scanVideo.remove();scanVideo=null}document.querySelectorAll('body>button').forEach(b=>{if(b.textContent==='إغلاق')b.remove()})}
function startScan(){openScanner('saleBarcode')}
function startReturnScan(){openScanner('rBarcode')}
function importData(event){let f=event.target.files?.[0];if(!f)return;let r=new FileReader();r.onload=async()=>{try{let d=JSON.parse(r.result);if(!Array.isArray(d.products))throw Error('ملف غير صالح');for(const p of d.products){let row={barcode:String(p.barcode||Date.now()),name:String(p.name||'منتج'),model:p.model||null,size:p.size||null,color:p.color||null,buy:Number(p.buy)||0,sell:Number(p.sell)||0,qty:Number(p.qty)||0,min:Number(p.min)||2};let {error}=await sb.from('products').upsert(row,{onConflict:'user_id,barcode'});if(error)throw error}toast('تم استيراد المنتجات');await loadAll()}catch(e){toast('فشل الاستيراد: '+(e.message||'ملف غير صالح'))}finally{event.target.value=''}};r.readAsText(f)}
boot();