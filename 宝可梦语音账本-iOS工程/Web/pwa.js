(function(){
 'use strict';
 if(window.LedgerNative||!/^https?:$/.test(location.protocol))return;
 const manifest=document.createElement('link');manifest.rel='manifest';manifest.href='manifest.webmanifest';document.head.appendChild(manifest);
 if('serviceWorker'in navigator&&window.isSecureContext){navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});}
 const note=document.querySelector('.about-note');
 if(note){note.appendChild(document.createElement('br'));note.appendChild(document.createTextNode('iPhone：在 Safari 分享菜单中选择“添加到主屏幕”。'));}
})();
