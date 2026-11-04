const path=require('node:path');
const os=require('node:os');
module.exports=function(name){
  try{return require(name);}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
  const bundled=path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules');
  return require(require.resolve(name,{paths:[bundled]}));
};
